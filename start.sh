#!/bin/bash
cd "$(dirname "$0")"
exec node --experimental-sqlite server/index.js "$@"
