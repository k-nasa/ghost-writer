#!/bin/bash

# Ghost Writer CLI Installation Script

set -e

echo "🚀 Installing Ghost Writer CLI..."

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Error: Deno is not installed."
    echo "Please install Deno first: https://deno.land/#installation"
    exit 1
fi

# Build the binary
echo "🔨 Building ghost binary..."
deno task build

# Check if build was successful
if [ ! -f "./ghost" ]; then
    echo "❌ Error: Failed to build ghost binary."
    exit 1
fi

# Install directory
INSTALL_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"

# Copy the binary
echo "📦 Installing ghost command to $INSTALL_DIR..."
cp ./ghost "$INSTALL_DIR/ghost"
chmod +x "$INSTALL_DIR/ghost"

echo "✅ Ghost Writer CLI installed successfully!"
echo ""
echo "📝 Usage: ghost --help"
echo ""
echo "🔧 Make sure ~/.local/bin is in your PATH:"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
