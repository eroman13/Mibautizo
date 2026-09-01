#!/bin/bash

# Redirect all output to file AND stdout
LOG_FILE=/tmp/railway_diagnostic.log
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "=================================="
echo "RAILWAY DIAGNOSTIC START: $(date)"
echo "=================================="

# Environment
echo ""
echo "=== ENVIRONMENT ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "USER: $(whoami)"
echo "PWD: $(pwd)"
echo "HOME: $HOME"
echo "PATH: $PATH"

# System
echo ""
echo "=== SYSTEM ==="
echo "Available memory:"
free -h 2>/dev/null || vm_stat
echo "Disk space:"
df -h . 2>/dev/null || du -h .
echo "Processes:"
ps aux | head -10

# Node & npm
echo ""
echo "=== NODE & NPM ==="
which node && node --version
which npm && npm --version
which tsc && tsc --version

# Try to build
echo ""
echo "=== BUILDING ==="
npm run build 2>&1
BUILD_EXIT=$?
echo "Build exit code: $BUILD_EXIT"

if [ $BUILD_EXIT -ne 0 ]; then
  echo "BUILD FAILED! Checking errors..."
  ls -la dist/ 2>&1 || echo "dist/ not found"
  exit $BUILD_EXIT
fi

# Check dist
echo ""
echo "=== DIST DIRECTORY ==="
ls -la dist/ | head -20

# Check node_modules
echo ""
echo "=== NODE_MODULES CHECK ==="
echo "Total modules: $(find node_modules -type d -depth 1 2>/dev/null | wc -l)"
if [ ! -f "node_modules/.package-lock.json" ]; then
  echo "WARNING: .package-lock.json not found!"
fi

# Start the server
echo ""
echo "=== STARTING SERVER ==="
echo "Running: node dist/index.js"
node dist/index.js 2>&1

# If we get here, server exited
echo ""
echo "SERVER EXITED WITH CODE: $?"
echo "=================================="
echo "DIAGNOSTIC END: $(date)"
echo "=================================="
