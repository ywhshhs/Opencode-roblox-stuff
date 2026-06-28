//! OpenCode Zen provider — single-provider TUI addition.
//!
//! Self-contained module. Defines its own types, its own HTTP client, and its
//! own on-disk model cache. Does **not** depend on `forge_api` or
//! `forge_infra` (those crates were stripped from this skeleton).
//!
//! ## Public surface
//!
//! - [`OpenCodeZen`]                 — provider handle (cheap to clone)
//! - [`ZenModel`]                    — single model record (OpenAI-compatible)
//! - [`ZenModelsResponse`]           — top-level `/v1/models` response
//! - [`OpenCodeZenError`]            — typed error
//! - [`CACHE_TTL`]                   — disk-cache freshness window
//!
//! ## Endpoints (OpenAI-compatible)
//!
//! | Purpose         | Method | Path                                |
//! |-----------------|--------|-------------------------------------|
//! | List models     | GET    | `https://opencode.ai/zen/v1/models` |
//! | Chat completion | POST   | `https://opencode.ai/zen/v1/chat/completions` |
//!
//! Model listing is unauthenticated. Chat completion requires an API key
//! supplied as `Authorization: Bearer <key>`.
//!
//! ## Wire-up notes
//!
//! See `INTEGRATION.md` at the repository root for the exact insertion points
//! in `crates/forge_main/src/ui.rs` (provider picker) and the chat dispatch
//! path. This module is intentionally UI-agnostic so it can be reused.

use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

// ============================================================================
// Configuration constants
// ============================================================================

/// Default base URL for the OpenCode Zen API.
pub const ZEN_BASE_URL: &str = "https://opencode.ai/zen";

/// HTTP timeout for fetching the model list.
pub const FETCH_TIMEOUT: Duration = Duration::from_secs(10);

/// Disk cache lifetime. After this age, the next call to
/// [`OpenCodeZen::load_or_refresh_models`] will refetch on the calling task.
pub const CACHE_TTL: Duration = Duration::from_secs(60 * 60);

/// Filename for the on-disk model list cache. Stored inside the provider's
/// `cache_dir`, which is normally `~/.forge/cache/` or similar.
pub const MODELS_CACHE_FILENAME: &str = "opencode_zen_models.json";

// ============================================================================
// API response types (OpenAI-compatible)
// ============================================================================

/// Top-level shape of `GET /v1/models`. Mirrors the OpenAI Models schema.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZenModelsResponse {
    pub object: String,
    pub data: Vec<ZenModel>,
}

/// A single model entry returned by `GET /v1/models`.
///
/// `created` is optional — early or partial responses from the Zen endpoint
/// have been observed to omit it. `owned_by` defaults to `"opencode"`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ZenModel {
    pub id: String,
    #[serde(default = "default_object")]
    pub object: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub created: Option<u64>,
    #[serde(default = "default_owned_by")]
    pub owned_by: String,
}

fn default_object() -> String {
    "model".to_string()
}

fn default_owned_by() -> String {
    "opencode".to_string()
}

impl ZenModel {
    /// Returns the model id prefixed with the canonical provider namespace
    /// (`opencode/<id>`), matching OpenCode's own config convention.
    pub fn namespaced(&self) -> String {
        format!("opencode/{}", self.id)
    }
}

// ============================================================================
// Provider handle
// ============================================================================

/// OpenCode Zen provider handle. Cheap to clone (`Arc` inside).
#[derive(Debug, Clone)]
pub struct OpenCodeZen {
    inner: Arc<Inner>,
}

#[derive(Debug)]
struct Inner {
    base_url: String,
    api_key: Option<String>,
    cache_dir: PathBuf,
    http: reqwest::Client,
    cached_models: RwLock<Option<Vec<ZenModel>>>,
}

impl OpenCodeZen {
    /// Construct an unauthenticated provider. Only the public model list
    /// endpoint can be called until [`with_api_key`](Self::with_api_key) is
    /// used.
    pub fn new(cache_dir: impl Into<PathBuf>) -> Self {
        Self::with_key(cache_dir, None)
    }

    /// Construct a provider with an explicit (optional) API key.
    pub fn with_key(cache_dir: impl Into<PathBuf>, api_key: Option<String>) -> Self {
        let http = reqwest::Client::builder()
            .timeout(FETCH_TIMEOUT)
            .user_agent(concat!(
                "forgecode-skeleton/",
                env!("CARGO_PKG_VERSION", "CARGO_PKG_VERSION=0.1.0")
            ))
            .build()
            .expect("reqwest client should build with default config");
        Self {
            inner: Arc::new(Inner {
                base_url: ZEN_BASE_URL.to_string(),
                api_key,
                cache_dir: cache_dir.into(),
                http,
                cached_models: RwLock::new(None),
            }),
        }
    }

    /// Returns a new handle that is identical to `self` but with the given
    /// API key set. The in-memory model cache is carried over.
    pub fn with_api_key(&self, api_key: impl Into<String>) -> Self {
        let cached = self
            .inner
            .cached_models
            .try_read()
            .ok()
            .and_then(|g| g.clone());
        Self {
            inner: Arc::new(Inner {
                base_url: self.inner.base_url.clone(),
                api_key: Some(api_key.into()),
                cache_dir: self.inner.cache_dir.clone(),
                http: self.inner.http.clone(),
                cached_models: RwLock::new(cached),
            }),
        }
    }

    // ------------------------------------------------------------------
    // Accessors
    // ------------------------------------------------------------------

    pub fn base_url(&self) -> &str {
        &self.inner.base_url
    }

    pub fn has_api_key(&self) -> bool {
        self.inner.api_key.is_some()
    }

    pub fn api_key(&self) -> Option<&str> {
        self.inner.api_key.as_deref()
    }

    pub fn cache_dir(&self) -> &PathBuf {
        &self.inner.cache_dir
    }

    /// URL of the model-listing endpoint.
    pub fn models_url(&self) -> String {
        format!("{}/v1/models", self.inner.base_url)
    }

    /// URL of the chat-completions endpoint.
    pub fn chat_url(&self) -> String {
        format!("{}/v1/chat/completions", self.inner.base_url)
    }

    // ------------------------------------------------------------------
    // Fetching
    // ------------------------------------------------------------------

    /// Always hits the network. Returns the parsed, freshly fetched model
    /// list and updates the in-memory cache.
    pub async fn fetch_models(&self) -> Result<Vec<ZenModel>, OpenCodeZenError> {
        let url = self.models_url();
        tracing::debug!(target: "opencode_zen", "GET {url}");

        let resp = self
            .inner
            .http
            .get(&url)
            .header("Accept", "application/json")
            .send()
            .await
            .map_err(|e| OpenCodeZenError::Fetch(e.to_string()))?;

        let status = resp.status();
        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(OpenCodeZenError::Http {
                status: status.as_u16(),
                body,
            });
        }

        let parsed: ZenModelsResponse = resp
            .json()
            .await
            .map_err(|e| OpenCodeZenError::Parse(e.to_string()))?;

        // Update in-memory cache for the rest of this process.
        {
            let mut guard = self.inner.cached_models.write().await;
            *guard = Some(parsed.data.clone());
        }

        Ok(parsed.data)
    }

    /// Returns the current model list using this priority:
    ///
    /// 1. In-memory cache (set by a previous call this process)
    /// 2. Fresh disk cache (younger than [`CACHE_TTL`])
    /// 3. Stale disk cache + sync refresh
    /// 4. Cold cache + sync fetch
    ///
    /// In every case the disk cache is rewritten with the latest payload so
    /// the next launch can start fast.
    pub async fn load_or_refresh_models(&self) -> Result<Vec<ZenModel>, OpenCodeZenError> {
        // 1. In-memory.
        if let Some(models) = self.cached_models().await {
            return Ok(models);
        }

        // 2 / 3 / 4. Disk + network.
        match self.read_cache().await {
            Some(cached) if !cached.is_stale() => {
                {
                    let mut guard = self.inner.cached_models.write().await;
                    *guard = Some(cached.models.clone());
                }
                Ok(cached.models)
            }
            maybe_stale => {
                match self.fetch_models().await {
                    Ok(models) => {
                        self.write_cache(&models).await;
                        Ok(models)
                    }
                    Err(err) => {
                        // Network failed but we may have a stale cache — use it.
                        if let Some(cached) = maybe_stale {
                            tracing::warn!(
                                target: "opencode_zen",
                                "refresh failed ({err}); using stale cache ({} models)",
                                cached.models.len()
                            );
                            let mut guard = self.inner.cached_models.write().await;
                            *guard = Some(cached.models.clone());
                            Ok(cached.models)
                        } else {
                            Err(err)
                        }
                    }
                }
            }
        }
    }

    /// Force a synchronous refresh and overwrite the on-disk cache. Useful
    /// from the `/models` command, from login, and from launch.
    pub async fn refresh_models(&self) -> Result<Vec<ZenModel>, OpenCodeZenError> {
        let models = self.fetch_models().await?;
        self.write_cache(&models).await;
        Ok(models)
    }

    /// Snapshot of the in-memory cache, if populated.
    pub async fn cached_models(&self) -> Option<Vec<ZenModel>> {
        self.inner.cached_models.read().await.clone()
    }

    /// Clear the in-memory cache (does not touch disk).
    pub async fn invalidate_memory_cache(&self) {
        let mut guard = self.inner.cached_models.write().await;
        *guard = None;
    }

    // ------------------------------------------------------------------
    // On-disk cache
    // ------------------------------------------------------------------

    fn cache_path(&self) -> PathBuf {
        self.inner.cache_dir.join(MODELS_CACHE_FILENAME)
    }

    async fn read_cache(&self) -> Option<CachedModels> {
        let path = self.cache_path();
        let bytes = tokio::fs::read(&path).await.ok()?;
        match serde_json::from_slice::<CachedModels>(&bytes) {
            Ok(c) => Some(c),
            Err(e) => {
                tracing::warn!(
                    target: "opencode_zen",
                    "cache at {} is corrupt, ignoring: {e}",
                    path.display()
                );
                None
            }
        }
    }

    async fn write_cache(&self, models: &[ZenModel]) {
        let path = self.cache_path();
        if let Some(parent) = path.parent() {
            if let Err(e) = tokio::fs::create_dir_all(parent).await {
                tracing::warn!(
                    target: "opencode_zen",
                    "failed to create cache dir {}: {e}",
                    parent.display()
                );
                return;
            }
        }
        let payload = CachedModels {
            cached_at: unix_now_secs(),
            models: models.to_vec(),
        };
        match serde_json::to_vec_pretty(&payload) {
            Ok(bytes) => {
                if let Err(e) = tokio::fs::write(&path, bytes).await {
                    tracing::warn!(
                        target: "opencode_zen",
                        "failed to write cache {}: {e}",
                        path.display()
                    );
                }
            }
            Err(e) => tracing::warn!(target: "opencode_zen", "failed to serialize cache: {e}"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct CachedModels {
    cached_at: u64,
    models: Vec<ZenModel>,
}

impl CachedModels {
    fn is_stale(&self) -> bool {
        let age = unix_now_secs().saturating_sub(self.cached_at);
        age > CACHE_TTL.as_secs()
    }
}

fn unix_now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

// ============================================================================
// Error type
// ============================================================================

#[derive(Debug, thiserror::Error)]
pub enum OpenCodeZenError {
    #[error("network error fetching OpenCode Zen models: {0}")]
    Fetch(String),

    #[error("OpenCode Zen returned HTTP {status}: {body}")]
    Http { status: u16, body: String },

    #[error("failed to parse OpenCode Zen response: {0}")]
    Parse(String),

    #[error("OpenCode Zen is not authenticated — call with_api_key() first")]
    Unauthenticated,
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_canonical_response() {
        let body = r#"{
            "object": "list",
            "data": [
                {"id": "claude-opus-4-1", "object": "model", "created": 1762047082, "owned_by": "opencode"},
                {"id": "grok-code",        "object": "model", "created": 1762047082, "owned_by": "opencode"},
                {"id": "claude-sonnet-4",  "object": "model", "created": 1762047082, "owned_by": "opencode"}
            ]
        }"#;
        let parsed: ZenModelsResponse = serde_json::from_str(body).unwrap();
        assert_eq!(parsed.object, "list");
        assert_eq!(parsed.data.len(), 3);
        assert_eq!(parsed.data[0].id, "claude-opus-4-1");
        assert_eq!(parsed.data[0].owned_by, "opencode");
        assert_eq!(parsed.data[0].created, Some(1762047082));
    }

    #[test]
    fn parses_response_without_optional_fields() {
        let body = r#"{ "object": "list", "data": [ { "id": "x" } ] }"#;
        let parsed: ZenModelsResponse = serde_json::from_str(body).unwrap();
        assert_eq!(parsed.data.len(), 1);
        assert_eq!(parsed.data[0].id, "x");
        assert_eq!(parsed.data[0].object, "model");
        assert_eq!(parsed.data[0].owned_by, "opencode");
        assert_eq!(parsed.data[0].created, None);
    }

    #[test]
    fn parses_empty_data_list() {
        let body = r#"{ "object": "list", "data": [] }"#;
        let parsed: ZenModelsResponse = serde_json::from_str(body).unwrap();
        assert!(parsed.data.is_empty());
    }

    #[test]
    fn rejects_malformed_response() {
        let body = r#"{ "object": "list", "data": [ { "object": "model" } ] }"#;
        // Missing required `id`.
        assert!(serde_json::from_str::<ZenModelsResponse>(body).is_err());
    }

    #[test]
    fn models_url_uses_base() {
        let z = OpenCodeZen::new("/tmp");
        assert_eq!(z.models_url(), "https://opencode.ai/zen/v1/models");
    }

    #[test]
    fn chat_url_uses_base() {
        let z = OpenCodeZen::new("/tmp");
        assert_eq!(z.chat_url(), "https://opencode.ai/zen/v1/chat/completions");
    }

    #[test]
    fn has_api_key_reflects_state() {
        let z = OpenCodeZen::new("/tmp");
        assert!(!z.has_api_key());

        let z = z.with_api_key("sk-test");
        assert!(z.has_api_key());
        assert_eq!(z.api_key(), Some("sk-test"));
    }

    #[test]
    fn namespaced_id_matches_opencode_convention() {
        let m = ZenModel {
            id: "claude-opus-4-1".into(),
            object: "model".into(),
            created: Some(1),
            owned_by: "opencode".into(),
        };
        assert_eq!(m.namespaced(), "opencode/claude-opus-4-1");
    }

    #[test]
    fn cache_staleness_logic() {
        let fresh = CachedModels {
            cached_at: unix_now_secs(),
            models: vec![],
        };
        assert!(!fresh.is_stale());

        let ancient = CachedModels {
            cached_at: unix_now_secs().saturating_sub(CACHE_TTL.as_secs() + 60),
            models: vec![],
        };
        assert!(ancient.is_stale());
    }
}
