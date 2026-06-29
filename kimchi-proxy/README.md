# Kimchi OpenAI-Compatible Proxy Server

A lightweight proxy server that exposes kimchi CLI as an OpenAI-compatible API endpoint, with built-in support for Pi coding agent.

## Quick Start

```bash
cd kimchi-proxy
node server.js
```

The server starts on port 3000 by default. Use `--port` to change:

```bash
node server.js --port 8080
```

## Usage with Python (openai SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="not-needed"  # Not required, just a placeholder
)

response = client.chat.completions.create(
    model="kimchi-local",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the capital of France?"}
    ]
)

print(response.choices[0].message.content)
```

## Usage with curl

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kimchi-local",
    "messages": [
      {"role": "user", "content": "Say hello in one word"}
    ]
  }'
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/chat/completions` | POST | Chat completions (OpenAI compatible) |
| `/v1/models` | GET | List available models |
| `/health` | GET | Health check |

## How It Works

1. Receives OpenAI-format chat completion request
2. Extracts messages and builds a prompt
3. Executes `kimchi -p "prompt"` via CLI
4. Returns response in OpenAI chat completion format

## Limitations

- Streaming responses are supported but kimchi processes the full prompt first
- Token usage counts are not reported (kimchi doesn't expose them)
- Only the last assistant message content is used (no tool calls, etc.)

## Integration with Pi Coding Agent

A Pi extension is included at `~/.pi/agent/extensions/kimchi-provider.ts`.

### Setup

1. Start the proxy server:
   ```bash
   cd kimchi-proxy
   node server.js &
   ```

2. Run Pi with the extension:
   ```bash
   pi -e ~/.pi/agent/extensions/kimchi-provider.ts
   ```

3. Select the model with `/model` and choose `kimchi/kimchi-local`

### Custom Port

If using a different port, set the environment variable:

```bash
KIMCHI_PROXY_PORT=8080 pi -e ~/.pi/agent/extensions/kimchi-provider.ts
```

## Configuration

You can configure kimchi's behavior through environment variables:

```bash
# Use a specific model
KIMCHI_MODEL=anthropic/claude-3.5-sonnet node server.js

# Set permissions
KIMCHI_PERMISSIONS=yolo node server.js
```
