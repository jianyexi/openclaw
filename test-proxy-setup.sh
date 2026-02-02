#!/bin/bash
# Test setup script for OpenClaw with no-auth proxy

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  OpenClaw No-Auth Proxy Test Setup                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js to run the test proxy"
    exit 1
fi

# Create test workspace directory
WORKSPACE_DIR="/tmp/openclaw-test-workspace"
mkdir -p "$WORKSPACE_DIR"
echo "✓ Created test workspace: $WORKSPACE_DIR"

# Check if proxy is already running
if lsof -i:8080 &> /dev/null; then
    echo "⚠ Port 8080 is already in use"
    echo "  You may already have the proxy running, or another service is using the port"
    echo "  To stop: pkill -f 'test-proxy-no-auth.js'"
else
    echo "✓ Port 8080 is available"
fi

echo ""
echo "Starting test proxy server..."
echo ""
echo "In one terminal, run:"
echo "  node test-proxy-no-auth.js"
echo ""
echo "In another terminal, test with:"
echo "  curl http://127.0.0.1:8080/health"
echo ""
echo "To test with OpenClaw CLI (after installing):"
echo "  openclaw agent --config test-config-no-auth-proxy.json5 --message 'Hello, test proxy!'"
echo ""
echo "Or copy test-config-no-auth-proxy.json5 to ~/.openclaw/openclaw.json and run:"
echo "  openclaw agent --message 'Hello from no-auth proxy!'"
echo ""
