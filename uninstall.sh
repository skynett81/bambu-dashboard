#!/bin/bash
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  Bambu Dashboard - Uninstaller${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

APP_DIR="$(cd "$(dirname "$0")" && pwd)"

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

# 2. Remove node_modules
read -p "Remove node_modules? [Y/n] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  rm -rf "$APP_DIR/node_modules"
  echo -e "  ${GREEN}node_modules removed${NC}"
fi

# 3. Remove data
read -p "Remove database and data? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -rf "$APP_DIR/data"
  echo -e "  ${GREEN}data/ removed${NC}"
fi

# 4. Remove config
read -p "Remove config.json? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -f "$APP_DIR/config.json"
  echo -e "  ${GREEN}config.json removed${NC}"
fi

# 5. Remove certs
if [ -d "$APP_DIR/certs" ]; then
  read -p "Remove SSL certificates? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$APP_DIR/certs"
    echo -e "  ${GREEN}certs/ removed${NC}"
  fi
fi

echo ""
echo -e "${GREEN}Uninstall complete.${NC}"
echo -e "Project files remain in ${YELLOW}$APP_DIR${NC}"
