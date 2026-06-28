# Agent Harness — CLI Entry Point

A lightweight CLI harness for running AI agents with tool calling.
Built for Node.js, supports OpenCode Zen (OpenAI-compatible) and
Anthropic providers out of the box.

## Usage

```bash
# Run with the default OpenAI-compatible provider
agent-harness "write a fibonacci function in rust"

# Switch to OpenCode Zen
agent-harness --provider opencode-zen --model gpt-5.5 "write a fibonacci function"

# Run interactively
agent-harness
```

## Commands

| Command | Description |
|---------|-------------|
| `--provider` | Select the provider: `openai`, `opencode-zen`, `anthropic` |
| `--model` | Select the model |
| `--prompt` | Override the system prompt |
| `--tools` | List available tools |
| `--set` | Set a config value |
| `--state` | Show agent state |

## Architecture

```
CLI (yargs)
  │
  ├── Provider (OpenAI / Anthropic)
  │   └── Sends messages, gets tool calls
  │
  ├── ReAct Loop
  │   ├── Think → Tool call → Result → Think → Done
  │   └── Shows: thinking, tool calls, results
  │
  └── Tools
      ├── bash     (run commands)
      ├── read     (read files)
      ├── write    (write files)
      ├── grep     (search contents)
      └── find     (find files)
```

## The Agent

The agent controls the harness. It can:
- Call any registered tool
- Read/write its own config
- Switch providers mid-session
- Suggest improvements when done
- Ask "should I add this?" before doing something

## Provider: OpenCode Zen

OpenCode Zen is an OpenAI-compatible provider at:

```
https://opencode.ai/zen/v1/chat/completions
```

Models include GPT 5.5, GPT 5.4, Claude Opus 4.6, etc.
Use `--provider opencode-zen` to connect.

## System Prompt

The default system prompt is in `AGENTS.md`. It tells the agent to:
- Be helpful
- Show thinking, tool calls, and results
- Suggest improvements when done
- Ask before adding things the user didn't request
- Let the user control the flow