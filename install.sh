#!/bin/bash
set -e

# 3DPrintForge - Install Script
# Supports two modes:
#   ./install.sh       → 7-step web setup wizard (recommended)
#   ./install.sh --cli → Classic terminal-based installer
#
# The web wizard includes: EULA, system check, network scan,
# multi-brand printer setup, admin account, server settings.

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  3DPrintForge - Installer${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# ────────────────────────────────────────
# Shared: Ensure Node.js 22+
# ────────────────────────────────────────
ensure_node() {
  echo -e "${BOLD}Checking Node.js...${NC}"
  if command -v node &>/dev/null; then
    NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
    echo -e "  Found Node.js $(node -v)"
    if [ "$NODE_VER" -lt 22 ]; then
      echo -e "  ${RED}Node.js 22+ required (found v${NODE_VER})${NC}"
      echo -e "  Install via: ${YELLOW}curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs${NC}"
      exit 1
    fi
  else
    echo -e "  ${RED}Node.js not found${NC}"
    read -p "  Install Node.js 22 via NodeSource? [Y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
      echo "  Please install Node.js 22+ manually and re-run this script."
      exit 1
    fi
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "  ${GREEN}Node.js $(node -v) installed${NC}"
  fi

  # Check openssl (used for auto-SSL certificate generation)
  if command -v openssl &>/dev/null; then
    echo -e "  ${GREEN}openssl found${NC}"
  else
    echo -e "  ${YELLOW}openssl not found (needed for auto-SSL certificates)${NC}"
  fi
}

# ────────────────────────────────────────
# Shared: Ensure npm dependencies
# ────────────────────────────────────────
ensure_deps() {
  if [ ! -d "$APP_DIR/node_modules/mqtt" ] || [ ! -d "$APP_DIR/node_modules/@3mfconsortium" ]; then
    echo -e "${BOLD}Installing dependencies...${NC}"
    cd "$APP_DIR"
    npm install --omit=dev
    echo -e "  ${GREEN}Dependencies installed${NC}"
  fi
}

# ────────────────────────────────────────
# Shared: Ensure directories
# ────────────────────────────────────────
ensure_dirs() {
  mkdir -p "$APP_DIR/data"
  mkdir -p "$APP_DIR/data/uploads"
  mkdir -p "$APP_DIR/data/library"
  mkdir -p "$APP_DIR/data/model-cache"
  mkdir -p "$APP_DIR/data/history-models"
  mkdir -p "$APP_DIR/data/toolpath-cache"
  mkdir -p "$APP_DIR/certs"
  [ -f "$APP_DIR/start.sh" ] && chmod +x "$APP_DIR/start.sh"
}

# ════════════════════════════════════════
# WEB WIZARD MODE (default)
# ════════════════════════════════════════
run_web_wizard() {
  ensure_node
  ensure_deps
  ensure_dirs

  IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  IP=${IP:-localhost}
  PORT=${PORT:-3000}

  echo ""
  echo -e "  ${CYAN}Starting 7-step setup wizard...${NC}"
  echo -e "  Open ${BOLD}http://${IP}:${PORT}${NC} in your browser."
  echo -e "  Steps: EULA → System Check → Network Scan → Printers → Security → Settings → Launch"
  echo ""
  echo -e "  ${YELLOW}Press Ctrl+C to cancel.${NC}"
  echo ""

  # Run the setup wizard server (blocks until wizard finishes or user cancels)
  # --lan allows access from any IP (needed when installing on a remote/headless server)
  cd "$APP_DIR"
  node server/setup-wizard.js --lan
  WIZARD_EXIT=$?

  if [ $WIZARD_EXIT -eq 0 ]; then
    echo ""
    echo -e "${GREEN}  Setup complete! Dashboard spawned by wizard.${NC}"
    echo ""
  else
    echo ""
    echo -e "${YELLOW}  Setup wizard exited. Run ${BOLD}./install.sh${NC}${YELLOW} to try again.${NC}"
    exit 1
  fi
}

# ════════════════════════════════════════
# CLI MODE (--cli flag)
# ════════════════════════════════════════
run_cli() {
  # 1. Check Node.js
  echo -e "${BOLD}[1/6] Checking Node.js...${NC}"
  ensure_node

  # 2. Check ffmpeg
  echo ""
  echo -e "${BOLD}[2/6] Checking ffmpeg...${NC}"
  if command -v ffmpeg &>/dev/null; then
    echo -e "  ${GREEN}ffmpeg found${NC}"
  else
    echo -e "  ${YELLOW}ffmpeg not found (required for camera streaming)${NC}"
    read -p "  Install ffmpeg? [Y/n] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
      sudo apt-get update && sudo apt-get install -y ffmpeg
      echo -e "  ${GREEN}ffmpeg installed${NC}"
    else
      echo -e "  ${YELLOW}Camera streaming will not work without ffmpeg${NC}"
    fi
  fi

  # 3. Install dependencies
  echo ""
  echo -e "${BOLD}[3/6] Installing dependencies...${NC}"
  cd "$APP_DIR"
  npm install --omit=dev
  echo -e "  ${GREEN}Dependencies installed${NC}"

  # 4. Config
  echo ""
  echo -e "${BOLD}[4/6] Configuration...${NC}"
  if [ ! -f "$APP_DIR/config.json" ]; then
    cp "$APP_DIR/config.example.json" "$APP_DIR/config.json"
    echo -e "  ${GREEN}Created config.json from template${NC}"
    echo -e "  ${YELLOW}Edit config.json to add your printer details${NC}"
  else
    echo -e "  config.json already exists, skipping"
  fi

  # 5. Create data directory
  echo ""
  echo -e "${BOLD}[5/6] Setting up directories...${NC}"
  ensure_dirs
  echo -e "  ${GREEN}Directories ready${NC}"

  # 6. Optional: systemd service
  echo ""
  echo -e "${BOLD}[6/6] System service (optional)${NC}"
  read -p "  Create systemd service for auto-start? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    SERVICE_FILE="/etc/systemd/system/3dprintforge.service"
    NODE_PATH=$(which node)
    CURRENT_USER=$(whoami)

    sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=3DPrintForge
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$APP_DIR
ExecStart=$NODE_PATH server/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable 3dprintforge
    sudo systemctl start 3dprintforge
    echo -e "  ${GREEN}Service created and started${NC}"
    echo -e "  Manage with: ${YELLOW}sudo systemctl {start|stop|restart|status} 3dprintforge${NC}"
  fi

  # Done
  echo ""
  echo -e "${BOLD}========================================${NC}"
  echo -e "${GREEN}  Installation complete!${NC}"
  echo -e "${BOLD}========================================${NC}"
  echo ""
  echo -e "  Dashboard: ${BOLD}https://$(hostname -I | awk '{print $1}'):3443${NC}"
  echo ""
  echo -e "  Next steps:"
  echo -e "  1. Edit ${YELLOW}config.json${NC} with your printer IP, serial & access code"
  echo -e "  2. Start manually: ${YELLOW}./start.sh${NC} or ${YELLOW}npm start${NC}"
  echo -e "  3. Open the dashboard in your browser"
  echo ""
}

# ════════════════════════════════════════
# Entry point
# ════════════════════════════════════════
case "${1:-}" in
  --cli|-c)
    run_cli
    ;;
  --help|-h)
    echo "Usage: ./install.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  (default)    Launch web-based setup wizard"
    echo "  --cli, -c    Run classic terminal-based installer"
    echo "  --help, -h   Show this help"
    echo ""
    ;;
  *)
    run_web_wizard
    ;;
esac
