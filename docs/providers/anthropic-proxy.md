---
summary: "Use a proxy server to access Anthropic Claude models without direct API keys"
read_when:
  - You want to use Claude through a proxy server
  - You need to centralize Anthropic API access
  - You want to route Claude requests through a custom gateway
title: "Anthropic Proxy Setup"
---

# Anthropic Proxy Setup

You can configure OpenClaw to access Anthropic Claude models through a proxy server instead of using direct Anthropic API keys. This is useful for:

- **Centralized API management**: Route all Claude requests through a corporate proxy
- **Cost tracking**: Monitor and control API usage through a proxy layer
- **Custom routing**: Use intermediary services like LiteLLM, Claude Max API Proxy, or custom gateways
- **Load balancing**: Distribute requests across multiple API keys or endpoints

## How It Works

```
OpenClaw → Your Proxy Server → Anthropic API
         (custom baseUrl)    (actual API calls)
```

The proxy server receives requests in Anthropic's API format and forwards them to Anthropic (or handles them locally).

## Configuration Options

### Option 1: Anthropic-Compatible Proxy (Recommended)

If your proxy implements the Anthropic Messages API format, use this configuration:

```json5
{
  models: {
    mode: "merge",
    providers: {
      "anthropic-proxy": {
        baseUrl: "http://your-proxy-server:8080/v1",
        apiKey: "${PROXY_API_KEY}",
        api: "anthropic-messages",
        headers: {
          // Optional: add custom headers for your proxy
          "X-Proxy-Region": "us-west",
        },
        models: [
          {
            id: "claude-opus-4",
            name: "Claude Opus 4 (via proxy)",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 7.5 },
            contextWindow: 200000,
            maxTokens: 16000,
          },
          {
            id: "claude-sonnet-4",
            name: "Claude Sonnet 4 (via proxy)",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 1.5 },
            contextWindow: 200000,
            maxTokens: 16000,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "anthropic-proxy/claude-opus-4" },
    },
  },
}
```

### Option 2: OpenAI-Compatible Proxy

If your proxy exposes an OpenAI-compatible endpoint (like Claude Max API Proxy), use this configuration:

```json5
{
  models: {
    mode: "merge",
    providers: {
      "claude-proxy": {
        baseUrl: "http://localhost:3456/v1",
        apiKey: "not-needed",
        api: "openai-responses",
        models: [
          {
            id: "claude-opus-4",
            name: "Claude Opus 4",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 16000,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "claude-proxy/claude-opus-4" },
    },
  },
}
```

### Option 3: Override Native Anthropic Provider

If you want to keep using the `anthropic` provider name but route through a proxy, you can configure the built-in provider:

```json5
{
  models: {
    mode: "merge",
    providers: {
      anthropic: {
        baseUrl: "http://your-proxy-server:8080",
        apiKey: "${PROXY_API_KEY}",
        api: "anthropic-messages",
        // Models will be auto-discovered from the pi-ai catalog
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-5" },
    },
  },
}
```

**Note**: When overriding the native provider, you don't need to specify models unless you want to customize them. The pi-ai catalog models will be used with your custom baseUrl.

## Environment Variables

Set environment variables in your config or shell:

```json5
{
  env: {
    PROXY_API_KEY: "your-proxy-key-here",
  },
}
```

Or in your shell:

```bash
export PROXY_API_KEY="your-proxy-key-here"
```

## Proxy Server Requirements

Your proxy server must:

1. **Implement the correct API format**:
   - For `api: "anthropic-messages"`: Anthropic Messages API (recommended)
   - For `api: "openai-responses"`: OpenAI Chat Completions API

2. **Support streaming** (optional but recommended):
   - Anthropic: Server-Sent Events (SSE) with `stream: true`
   - OpenAI: SSE with streaming responses

3. **Handle authentication**:
   - Accept the `apiKey` in the appropriate header
   - Anthropic format: `x-api-key` header
   - OpenAI format: `Authorization: Bearer <token>` header

## Common Proxy Solutions

### LiteLLM Proxy

LiteLLM is a popular proxy that supports multiple LLM providers:

```bash
# Install
pip install litellm[proxy]

# Configure (config.yaml)
model_list:
  - model_name: claude-opus-4
    litellm_params:
      model: anthropic/claude-opus-4
      api_key: sk-ant-...

# Run
litellm --config config.yaml --port 8080
```

Then use in OpenClaw:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:8080",
        apiKey: "your-litellm-key",
        api: "openai-responses",
        models: [{ id: "claude-opus-4", name: "Claude Opus 4" }],
      },
    },
  },
}
```

### Claude Max API Proxy

For Claude Max/Pro subscriptions, see [Claude Max API Proxy](/providers/claude-max-api-proxy) for a specialized proxy that converts your subscription to an API endpoint.

### Custom Proxy Server

Build your own proxy in any language. Example (Node.js):

```javascript
const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post("/v1/messages", async (req, res) => {
  try {
    const stream = await anthropic.messages.create({
      ...req.body,
      stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(8080, () => console.log("Proxy running on :8080"));
```

## Testing Your Proxy

Verify your proxy works before configuring OpenClaw:

```bash
# Test Anthropic-format proxy
curl -X POST http://localhost:8080/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-opus-4",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# Test OpenAI-format proxy
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-key" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Verify OpenClaw Configuration

After configuring your proxy in `openclaw.json`:

```bash
# Check model status
openclaw models status

# List available models
openclaw models list

# Test the proxy
openclaw agent --model anthropic-proxy/claude-opus-4 --message "Hello"
```

## Troubleshooting

### Connection refused

- Verify the proxy server is running
- Check the `baseUrl` port and hostname
- Ensure firewall rules allow connections

### Authentication errors

- Verify `apiKey` matches what your proxy expects
- Check if your proxy requires custom headers
- Look at proxy server logs for auth failures

### Model not found

- Ensure model IDs in your config match what the proxy expects
- Check if the proxy requires specific model naming conventions
- Try `openclaw models list` to see discovered models

### Streaming not working

- Verify your proxy supports SSE streaming
- Check if your proxy requires specific headers for streaming
- Try setting `stream: false` in model params as a fallback

## Security Considerations

- **TLS/HTTPS**: Use HTTPS for proxy connections in production
- **API Key Storage**: Store proxy API keys in environment variables, not in config
- **Network Security**: Use VPN or private networks for proxy communication
- **Rate Limiting**: Implement rate limiting in your proxy to prevent abuse
- **Logging**: Be careful with logging; don't log sensitive request content

## See Also

- [Anthropic provider](/providers/anthropic) - Native Anthropic integration
- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Subscription-based proxy
- [Model Providers](/concepts/model-providers) - Full provider configuration guide
- [Configuration](/gateway/configuration) - Complete configuration reference
