# forgecode-skeleton

A stripped-down copy of [forgecode](../forgecode) that keeps **only the chat TUI
and login TUI interface code**. Everything else has been removed.

This is a **non-functional skeleton**. It is not wired up to an API, agent loop,
file system, or persistence layer. It exists as a UI reference for the chat
screen and the login flow.

---

## What was kept

### Workspace crates (`crates/`)

| Crate                    | Why kept |
| ------------------------ | -------- |
| `forge_main`             | The CLI binary. Contains the `UI` struct, the chat loop, the input prompt, the banner, and the login command. |
| `forge_display`          | Shared rendering helpers (markdown, diff, grep, code, banner, completer, highlighter) used by the chat screen. |
| `forge_domain`           | Domain types referenced by the chat and login UI (`Conversation`, `Message`, `ToolCall`, `Usage`, etc.). |
| `forge_config`           | Config types read at startup. |
| `forge_spinner`          | Spinner widget used while the chat is waiting on the model. |
| `forge_markdown_stream`  | Streaming markdown renderer used by the chat screen. |
| `forge_tracker`          | Lightweight analytics tracker. Stubbed in this skeleton. |

### `forge_main/src/` modules

| File                     | Role in the chat / login TUI |
| ------------------------ | ---------------------------- |
| `main.rs`                | Entry point. Boots `UI::init` and calls `ui.run()`. |
| `lib.rs`                 | Module root. Re-exports `UI`, `Cli`, `TopLevelCommand`. |
| `ui.rs`                  | The main TUI. Contains the `UI` struct, the run loop, the chat event handlers, and the login handlers (`handle_provider_login`, `handle_mcp_login`). |
| `prompt.rs`              | The `ForgePrompt` input prompt used by the chat screen. |
| `oauth_callback.rs`      | Localhost OAuth callback HTTP server used by `forge provider login`. |
| `banner.rs`              | Login banner shown when the user has no configured providers. |
| `state.rs`               | `UIState` struct shared between the run loop and the prompt. |
| `error.rs`               | `UIError` enum used by the chat/login UI. |
| `display_constants.rs`   | UI markers, labels, and formatting constants. |
| `model.rs`               | CLI data model. Includes the `TopLevelCommand` enum (login command lives here). |
| `cli.rs`                 | Clap parser for the CLI. Defines the `provider login` subcommand. |
| `porcelain.rs`           | Single-call "porcelain" formatters used by the chat render path. |
| `stream_renderer.rs`     | Streaming renderer for model output during a chat turn. |
| `sync_display.rs`        | Sync-mode display helpers (used by the chat loop). |
| `highlighter.rs`         | Syntax highlighter used inside the chat message render. |
| `info.rs`                | Info text shown in the chat/help screen. |
| `title_display.rs`       | Title / error / success formatting. |
| `utils.rs`               | Small UI utility helpers. |
| `tracker.rs`             | Analytics tracker wrapper. Stubbed. |
| `banner/`                | Embedded banner asset directory. |

## What was removed

### Workspace crates

`forge_api`, `forge_app`, `forge_ci`, `forge_embed`, `forge_eventsource`,
`forge_eventsource_stream`, `forge_fs`, `forge_infra`, `forge_json_repair`,
`forge_repo`, `forge_select`, `forge_services`, `forge_snaps`, `forge_stream`,
`forge_template`, `forge_test_kit`, `forge_tool_macros`, `forge_walker`.

These provided the API client, agent orchestration, file system operations,
git operations, shell plugin (`:` prefix) plumbing, MCP server catalog, tool
implementations, event streaming, snapshot infrastructure, file walker, etc.
None of them render TUI surface; they all back the *functionality* behind the
chat.

### `forge_main/src/` modules

`completer/`, `zsh/`, `editor.rs`, `logs.rs`, `vscode.rs`, `sandbox.rs`,
`update.rs`, `tools_display.rs`, `code.rs`, `diff.rs`, `grep.rs`, `input.rs`,
`conversation_selector.rs`.

Removed because they implement either the shell-plugin side, file-viewer
commands, editor / VSCode integration, the sandbox flag, the update checker,
or the conversation picker (not the chat screen itself).

### Top-level

`.github/`, `.devcontainer/`, `.forge/`, `benchmarks/`, `commands/`,
`docs/`, `plans/`, `scripts/`, `shell-plugin/`, `templates/`, `.config/`,
`flake.*`, `Cross.toml`, `renovate.json`, `vertex.json`, `forge.schema.json`,
`package*.json`, and the `.git/` history.

---

## Why it is non-functional

The skeleton is **deliberately not buildable**. Specifically:

1. `forge_main/src/lib.rs` only declares the modules above. Any code in those
   files that referenced a removed module (`cli::ListCommand`,
   `ListCommandGroup`, `sandbox::Sandbox`, etc.) will fail to resolve.
2. `Cargo.toml` (workspace and per-crate) still lists the removed crates as
   dependencies. They are not present on disk, so `cargo check` will fail.
3. `ui.rs` still calls the removed crates (`forge_api`, `forge_app`,
   `forge_infra`, `forge_tracker` typed `API` trait, etc.) for actual chat
   behavior. Those calls are the "functionality" that has been stripped.
4. No `forge_api::ForgeAPI` exists, so the chat cannot talk to a model.
5. No provider credentials backend exists, so the login flow can render but
   cannot exchange codes.

If you want a buildable TUI, you would need to either restore the removed
crates or rewrite the call sites in `ui.rs` to use local stubs.

## Layout of the stripped tree

```
forgecode-skeleton/
├── AGENTS.md              # kept from upstream (general Rust style guide)
├── Cargo.lock             # kept from upstream (dependency graph snapshot)
├── Cargo.toml             # workspace manifest (deps NOT pruned)
├── LICENSE                # kept from upstream
├── README.md              # this file
├── clippy.toml            # kept from upstream
├── insta.yaml             # kept from upstream (only relevant if tests are added back)
├── rust-toolchain.toml    # kept from upstream
├── crates/
│   ├── forge_config/
│   ├── forge_display/
│   ├── forge_domain/
│   ├── forge_main/        # the TUI binary
│   ├── forge_markdown_stream/
│   ├── forge_spinner/
│   └── forge_tracker/
└── _config.yml            # kept from upstream (GitHub Pages theme stub)
```
