#!/bin/bash
set -e

# Bambu Dashboard - Uninstaller
# Removes systemd service, Docker container, and optionally cleans up data/config/certs.
# Project source files are always kept.

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

APP_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  echo "Usage: ./uninstall.sh"
  echo ""
  echo "Interactively removes:"
  echo "  - systemd service (bambu-dashboard)"
  echo "  - Docker container (if running)"
  echo "  - node_modules/"
  echo "  - data/ (database, logs, uploads)"
  echo "  - config.json (printer credentials)"
  echo "  - certs/ (SSL certificates)"
  echo ""
  echo "Project source files are always kept."
  exit 0
fi

echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  Bambu Dashboard - Uninstaller${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# 1. Stop and remove systemd service
if [ -f /etc/systemd/system/bambu-dashboard.service ]; then
  echo -e "${BOLD}Stopping systemd service...${NC}"
  sudo systemctl stop bambu-dashboard 2>/dev/null || true
  sudo systemctl disable bambu-dashboard 2>/dev/null || true
  sudo rm /etc/systemd/system/bambu-dashboard.service
  sudo systemctl daemon-reload
  echo -e "  ${GREEN}Service removed${NC}"
else
  echo -e "  No systemd service found"
fi

echo ""

# 2. Stop Docker container if running
if command -v docker &>/dev/null; then
  if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q '^bambu-dashboard$'; then
    echo -e "${BOLD}Stopping Docker container...${NC}"
    docker stop bambu-dashboard 2>/dev/null || true
    docker rm bambu-dashboard 2>/dev/null || true
    echo -e "  ${GREEN}Docker container removed${NC}"
    echo ""
  fi
fi

# 3. Stop running server process (if started manually)
SERVER_PIDS=$(lsof -ti:3000 -ti:3443 2>/dev/null || true)
if [ -n "$SERVER_PIDS" ]; then
  echo -e "${BOLD}Stopping running server (port 3000/3443)...${NC}"
  echo "$SERVER_PIDS" | xargs -r kill 2>/dev/null || true
  echo -e "  ${GREEN}Server stopped${NC}"
  echo ""
fi

# 4. Remove node_modules
if [ -d "$APP_DIR/node_modules" ]; then
  read -p "Remove node_modules? [Y/n] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    rm -rf "$APP_DIR/node_modules"
    echo -e "  ${GREEN}node_modules removed${NC}"
  fi
fi

# 5. Remove data
if [ -d "$APP_DIR/data" ]; then
  read -p "Remove database, data, and uploads? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$APP_DIR/data"
    echo -e "  ${GREEN}data/ removed${NC}"
  fi
fi

# 6. Remove config
if [ -f "$APP_DIR/config.json" ]; then
  read -p "Remove config.json (contains printer credentials)? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$APP_DIR/config.json"
    echo -e "  ${GREEN}config.json removed${NC}"
  fi
fi

# 7. Remove certs
if [ -d "$APP_DIR/certs" ] && [ "$(ls -A "$APP_DIR/certs" 2>/dev/null)" ]; then
  read -p "Remove SSL certificates? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$APP_DIR/certs"
    echo -e "  ${GREEN}certs/ removed${NC}"
  fi
fi

echo ""
echo -e "${GREEN}Uninstall complete.${NC}"
echo -e "Project source files remain in ${YELLOW}$APP_DIR${NC}"
echo -e "To remove everything: ${YELLOW}rm -rf $APP_DIR${NC}"
