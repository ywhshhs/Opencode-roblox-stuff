# OpenCode Zen Assistant - Roblox Luau Client-Sided GUI

A fully client-sided Roblox Luau script that integrates with [OpenCode Zen API](https://opencode.ai/zen/v1) using **mimo-v2.5-free** model. Features a beautiful draggable GUI with chat interface, console checking, and script execution capabilities.

## Features

- **Chat Interface** — Send messages to OpenCode Zen API and get AI responses
- **Output Window** — Scrollable window showing AI responses above the chat input
- **Console Checker** — Fetch and analyze Roblox developer console output
- **Script Runner** — Run Luau scripts directly from the chat interface
- **Draggable GUI** — Full draggable and resizable UI built with pure Roblox instances
- **Keyboard Shortcuts** — F2 to toggle, Enter to send
- **Auto-reconnect** — Tests API connection on load

## Installation

1. **Copy the script** — Open `src/Main.lua` and copy its entire contents
2. **Insert into Roblox** — In your main script (e.g., a LocalScript in StarterGui or any client-side script):
   ```lua
   -- Loader script (local)
   local scriptContent = game:GetService("HttpService"):GetAsync("your-raw-url-or-copy-pasted")
   -- Or just paste the Main.lua content directly
   loadstring(scriptContent)()
   ```

3. **Alternative** — Place the script in `StarterGui` or `StarterPlayerScripts` as a LocalScript

## Usage

### Basic Commands

| Command | Description |
|---------|-------------|
| `Type anything` | Sends input to OpenCode Zen API (mimo-v2.5-free) |
| `/help` | Shows available commands |
| `/clear` | Clears the output window |
| `/check` or `/console` | Checks the Roblox developer console |
| `/run <lua code>` | Executes Luau code directly |
| `/analyze` | Sends console data to AI for analysis |
| `F2` | Toggles GUI visibility |

### AI Query Examples

- "Write me a movement controller script"
- "What's wrong with this code? [paste your code]"
- "Create a part that follows the player"
- "Explain how Roblox DataStores work"

### Script Execution

When the AI's response contains `[[EXECUTE:<code>]]`, the script will automatically run the extracted code. You can also use `/run <script>` to execute any Luau code directly.

### Console Checking

The `/check` command attempts to inspect the Roblox developer console. For deeper analysis, type `/analyze` to have the AI review console output.

## API Configuration

The script connects to:
```
https://opencode.ai/zen/v1
```
Model: `mimo-v2.5-free`

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "model": "mimo-v2.5-free",
  "messages": [
    {
      "role": "user",
      "content": "<your message>"
    }
  ],
  "max_tokens": 2048,
  "temperature": 0.7
}
```

## File Structure

```
OpenCodeZenGUI/
├── src/
│   └── Main.lua           # Main GUI + API script
└── README.md             # This file
```

## Notes

- Fully **client-sided** — works in any Roblox environment (Studio, Player)
- Uses **CoreGui** so it stays on top of other UI elements
- Draggable frame — click and drag the title bar to reposition
- Toggle with `F2` keybind
- The close button hides the GUI (re-enable with F2)