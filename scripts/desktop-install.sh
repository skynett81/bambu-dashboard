#!/bin/bash
# 3DPrintForge Desktop Installer
# Installs the Electron desktop app using the most appropriate package format for your distro.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_DIR/dist-electron"

# Detect distro
if [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO=$ID
  DISTRO_LIKE=$ID_LIKE
else
  DISTRO="unknown"
  DISTRO_LIKE=""
fi

echo "Detected: $DISTRO (family: $DISTRO_LIKE)"

# Auto-build if artifacts are missing
if [ ! -d "$DIST_DIR" ] || [ -z "$(ls -A "$DIST_DIR" 2>/dev/null | grep -v '^\.')" ]; then
  echo "Build artifacts not found. Running build first..."
  cd "$PROJECT_DIR"
  npm run electron:build:linux || {
    echo "Build failed. You may need to install rpm-tools/flatpak-builder first."
    exit 1
  }
fi

case "$DISTRO" in
  arch|cachyos|manjaro|endeavouros)
    echo "Installing pacman package..."
    PKG=$(ls "$DIST_DIR"/*.pkg.tar.zst 2>/dev/null | head -1)
    if [ -z "$PKG" ]; then
      echo "No pacman package found. Running makepkg..."
      cd "$PROJECT_DIR/packaging/arch"
      cp "$DIST_DIR"/3dprintforge-*.tar.gz . 2>/dev/null
      makepkg -f --skipchecksums
      PKG=$(ls *.pkg.tar.zst | head -1)
    fi
    echo "  sudo pacman -U $PKG"
    sudo pacman -U "$PKG"
    ;;
  ubuntu|debian|mint|pop|elementary|zorin)
    echo "Installing .deb package..."
    DEB=$(ls "$DIST_DIR"/*.deb 2>/dev/null | head -1)
    [ -z "$DEB" ] && { echo "No .deb found"; exit 1; }
    sudo dpkg -i "$DEB" || sudo apt-get install -f -y
    ;;
  fedora|rhel|centos|rocky|alma|opensuse*)
    echo "Installing .rpm package..."
    RPM=$(ls "$DIST_DIR"/*.rpm 2>/dev/null | head -1)
    [ -z "$RPM" ] && { echo "No .rpm found"; exit 1; }
    sudo rpm -Uvh "$RPM" || sudo dnf install -y "$RPM"
    ;;
  *)
    echo "Unknown distro. Falling back to AppImage install..."
    APPIMAGE=$(ls "$DIST_DIR"/*.AppImage 2>/dev/null | head -1)
    [ -z "$APPIMAGE" ] && { echo "No AppImage found"; exit 1; }
    mkdir -p "$HOME/.local/bin" "$HOME/.local/share/applications" "$HOME/.local/share/icons/hicolor/256x256/apps"
    cp "$APPIMAGE" "$HOME/.local/bin/3dprintforge"
    chmod +x "$HOME/.local/bin/3dprintforge"
    cp "$PROJECT_DIR/electron/assets/icon.png" "$HOME/.local/share/icons/hicolor/256x256/apps/3dprintforge.png"
    cat > "$HOME/.local/share/applications/3dprintforge.desktop" << DESKTOP
[Desktop Entry]
Version=1.0
Type=Application
Name=3DPrintForge
GenericName=3D Printer Dashboard
Exec=$HOME/.local/bin/3dprintforge --no-sandbox %U
Icon=3dprintforge
Terminal=false
StartupNotify=true
StartupWMClass=3dprintforge
Categories=Graphics;Utility;
MimeType=x-scheme-handler/3dprintforge;
DESKTOP
    update-desktop-database "$HOME/.local/share/applications/" 2>/dev/null || true
    echo "Installed to $HOME/.local/bin/3dprintforge"
    ;;
esac

echo ""
echo "  ✅ 3DPrintForge desktop app installed"
echo "  Launch from your application menu or run: 3dprintforge"
