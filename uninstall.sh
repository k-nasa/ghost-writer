#!/bin/bash

# Ghost Writer CLI Uninstallation Script

set -e

echo "🗑️  Uninstalling Ghost Writer CLI..."

INSTALL_DIR="$HOME/.local/bin"
GHOST_PATH="$INSTALL_DIR/ghost"

if [ -f "$GHOST_PATH" ]; then
    echo "📦 Removing ghost command..."
    rm -f "$GHOST_PATH"
    echo "✅ Ghost Writer CLI uninstalled successfully!"
else
    echo "❌ Error: ghost command not found at $GHOST_PATH"
    exit 1
fi