// forge_main - stripped skeleton
//
// Only the chat TUI and login TUI surface area is preserved.
// Everything else (commands, agents, tools, file viewers, shell plugin,
// editor integration, sandboxing, update checker, etc.) has been removed.
//
// This is a NON-FUNCTIONAL skeleton: the code is intentionally not wired up
// to any API, agent loop, file system, or persistence layer. It exists so
// the chat screen and login flow can be read and rendered as UI references.

pub mod banner;
mod cli;
mod display_constants;
mod error;
mod highlighter;
mod info;
mod model;
mod oauth_callback;
mod porcelain;
mod prompt;
mod state;
mod stream_renderer;
mod sync_display;
mod title_display;
pub mod tracker;
mod ui;
mod utils;

use std::sync::LazyLock;

pub use cli::{Cli, TopLevelCommand};
pub use title_display::*;
pub use ui::UI;

pub static TRACKER: LazyLock<forge_tracker::Tracker> =
    LazyLock::new(forge_tracker::Tracker::default);
