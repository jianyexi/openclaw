# OpenClaw No-Auth Proxy Test Setup

This directory contains test files to demonstrate OpenClaw working with a proxy that **doesn't require API keys**.

## Files

- `test-proxy-no-auth.cjs` - Simple HTTP proxy server that accepts requests without authentication
- `test-config-no-auth-proxy.json5` - OpenClaw configuration file for testing with the no-auth proxy
- `test-proxy-setup.sh` - Setup script with instructions

## Quick Start

### 1. Start the Test Proxy Server

```bash
node test-proxy-no-auth.cjs
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║  Test Proxy Server (No Authentication Required)           ║
╚════════════════════════════════════════════════════════════╝

✓ Server running at http://127.0.0.1:8080
✓ No API key required
✓ Anthropic-compatible endpoint: POST /v1/messages
✓ Health check: GET /health
```

### 2. Test the Proxy

In another terminal:

```bash
# Health check
curl http://127.0.0.1:8080/health

# Test Anthropic-compatible endpoint
curl -X POST http://127.0.0.1:8080/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 3. Use with OpenClaw

**Option A: Use the test config directly**

```bash
openclaw agent --config test-config-no-auth-proxy.json5 --message "Hello from OpenClaw!"
```

**Option B: Copy to default config location**

```bash
mkdir -p ~/.openclaw
cp test-config-no-auth-proxy.json5 ~/.openclaw/openclaw.json

# Then use normally
openclaw agent --message "Test message"
openclaw models list
openclaw models status
```

## What This Demonstrates

1. **No API Key Required**: The proxy configuration doesn't include an `apiKey` field
2. **Works with Standard OpenClaw**: No code changes needed, just configuration
3. **Anthropic-Compatible**: Uses the `anthropic-messages` API format
4. **Suitable for Internal Proxies**: Perfect for corporate proxies, localhost development, or IP-based authentication

## Configuration Details

The key part of the configuration is:

```json5
{
  models: {
    providers: {
      "test-no-auth-proxy": {
        baseUrl: "http://127.0.0.1:8080/v1",
        api: "anthropic-messages",
        // No apiKey field!
        models: [...]
      }
    }
  }
}
```

## Production Use

For production use with a real no-auth proxy:

1. Replace `baseUrl` with your actual proxy URL
2. Optionally add `authHeader: false` if you need to explicitly prevent auth headers
3. Update model definitions to match your proxy's available models
4. Set appropriate cost values if you're tracking usage

Example production config:

```json5
{
  models: {
    providers: {
      "internal-proxy": {
        baseUrl: "http://internal-proxy.company.local:8080/v1",
        api: "anthropic-messages",
        authHeader: false, // Explicitly disable auth headers
        models: [
          {
            id: "claude-opus-4",
            name: "Claude Opus 4 (Internal)",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 7.5 },
            contextWindow: 200000,
            maxTokens: 16000,
          }
        ]
      }
    }
  }
}
```

## See Also

- [Anthropic Proxy Setup Guide](docs/providers/anthropic-proxy.md)
- [Configuration Examples](docs/gateway/configuration-examples.md)
- [Complete Example Config](docs/examples/anthropic-proxy-config.json5)
