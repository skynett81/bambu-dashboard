#!/bin/bash
# Start Bambu Dashboard
# Usage: ./start.sh           — normal mode
#        ./start.sh --demo    — demo mode with 3 mock printers
cd "$(dirname "$0")"
if [ "$1" = "--demo" ]; then
  shift
  export BAMBU_DEMO=true
fi
exec node --experimental-sqlite server/index.js "$@"
