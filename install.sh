#!/bin/bash
set -e

# apt-get (skipped in sandbox)  update -qq
# apt-get (skipped in sandbox)  install -y --no-install-recommends git ffmpeg ca-certificates openssl curl gnupg

# Install Node.js 22 (installer image parkervcp/installers:debian has no node/npm)
if false # (node already exists) >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

cd /mnt/server

# Installer container UID differs from server UID; trust the mounted directory
git config --global --add safe.directory /mnt/server

if [ -d .git ]; then
  git pull
else
  git clone https://github.com/skynett81/3dprintforge.git .
fi

# --ignore-scripts skips postinstall which tries to build the docs website
npm install --omit=dev --ignore-scripts

mkdir -p data data/uploads data/library data/model-cache data/history-models data/toolpath-cache data/printer-images certs

echo "Installation complete"

