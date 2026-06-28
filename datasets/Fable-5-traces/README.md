---
license: agpl-3.0
pretty_name: Fable 5 Pi Agent Traces
annotations_creators:
- machine-generated
language:
- en
size_categories:
- 1K<n<10K
task_categories:
- text-generation
tags:
- agent-traces
- pi-agent
- claude-code
- fable-5
- chain-of-thought
- tool-use
- coding-agents
- synthetic-data
- distillation
- cot
configs:
- config_name: pi_agent
  data_files:
  - split: train
    path: "pi-traces/*.jsonl"
---

<p align="center">
  <img src="https://huggingface.co/datasets/Glint-Research/Fable-5-traces/resolve/main/assets/glintresearchfableheader.png" alt="Glint Research Fable 5 Agent Traces" style="width:100%; max-width:1200px; border-radius:18px; border:1px solid rgba(0,220,255,0.45);" />
</p>

<div style="font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; border:1px solid rgba(0,229,255,0.35); border-radius:18px; overflow:hidden; background:linear-gradient(135deg,#010407 0%,#031820 34%,#062a34 68%,#0a0d18 100%); margin:24px 0;">
  <div style="padding:28px 30px 22px 30px; border-bottom:1px solid rgba(0,229,255,0.22); background:linear-gradient(90deg,rgba(0,255,255,0.08),rgba(255,255,255,0.02));">
    <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:14px;">
      <div>
        <div style="font-size:12px; letter-spacing:0.22em; text-transform:uppercase; color:#79f7ff; font-weight:800;">Glint Research Dataset Card</div>
        <h1 style="margin:8px 0 0 0; color:#eaffff; font-size:34px; line-height:1.05; font-weight:900; border:0;">Fable 5 Pi Agent Traces</h1>
        <p style="margin:10px 0 0 0; color:#b9faff; max-width:820px; font-size:15px; line-height:1.65;">A compact, high-signal corpus of Fable 5 coding-agent traces converted into Hugging Face Agent Traces / Pi-compatible sessions for Data Studio inspection, tool-use policy learning, and reasoning/action distillation.</p>
      </div>
      <div style="border:1px solid rgba(113,255,246,0.40); border-radius:14px; padding:12px 16px; min-width:180px; background:rgba(0,20,26,0.72);">
        <div style="font-size:11px; color:#6fefff; text-transform:uppercase; letter-spacing:0.14em; font-weight:800;">Primary Config</div>
        <div style="font-size:20px; color:#f3ffff; font-weight:900; margin-top:4px;"><code style="color:#8ffcff;">pi_agent/train</code></div>
        <div style="font-size:12px; color:#9deaf0; margin-top:6px;">Agent Trace preview enabled</div>
      </div>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:9px; margin-top:20px;">
      <span style="border:1px solid rgba(0,229,255,0.45); color:#dfffff; background:rgba(0,174,197,0.20); padding:6px 10px; border-radius:999px; font-size:12px; font-weight:800;">4,665 Pi trace sessions</span>
      <span style="border:1px solid rgba(0,229,255,0.45); color:#dfffff; background:rgba(0,174,197,0.20); padding:6px 10px; border-radius:999px; font-size:12px; font-weight:800;">60 source sessions</span>
      <span style="border:1px solid rgba(0,229,255,0.45); color:#dfffff; background:rgba(0,174,197,0.20); padding:6px 10px; border-radius:999px; font-size:12px; font-weight:800;">3,799 tool actions</span>
      <span style="border:1px solid rgba(0,229,255,0.45); color:#dfffff; background:rgba(0,174,197,0.20); padding:6px 10px; border-radius:999px; font-size:12px; font-weight:800;">866 assistant text actions</span>
      <span style="border:1px solid rgba(182,139,255,0.45); color:#f4ecff; background:rgba(112,77,255,0.18); padding:6px 10px; border-radius:999px; font-size:12px; font-weight:800;">AGPL-3.0</span>
    </div>
  </div>
  <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:1px; background:rgba(0,229,255,0.18);">
    <div style="padding:18px; background:rgba(1,11,15,0.92);">
      <div style="font-size:11px; color:#6ff6ff; text-transform:uppercase; letter-spacing:0.16em; font-weight:900;">Rows</div>
      <div style="font-size:30px; color:#ffffff; font-weight:950; margin-top:4px;">4,665</div>
      <div style="font-size:12px; color:#9deaf0; margin-top:4px;">one converted Pi trace per merged row</div>
    </div>
    <div style="padding:18px; background:rgba(1,11,15,0.92);">
      <div style="font-size:11px; color:#6ff6ff; text-transform:uppercase; letter-spacing:0.16em; font-weight:900;">Tool Calls</div>
      <div style="font-size:30px; color:#ffffff; font-weight:950; margin-top:4px;">81.44%</div>
      <div style="font-size:12px; color:#9deaf0; margin-top:4px;">Bash, Edit, Read, Write, browser/preview tools</div>
    </div>
    <div style="padding:18px; background:rgba(1,11,15,0.92);">
      <div style="font-size:11px; color:#6ff6ff; text-transform:uppercase; letter-spacing:0.16em; font-weight:900;">Reasoning Median</div>
      <div style="font-size:30px; color:#ffffff; font-weight:950; margin-top:4px;">2,365</div>
      <div style="font-size:12px; color:#9deaf0; margin-top:4px;">median characters in <code style="color:#8ffcff;">cot</code></div>
    </div>
    <div style="padding:18px; background:rgba(1,11,15,0.92);">
      <div style="font-size:11px; color:#6ff6ff; text-transform:uppercase; letter-spacing:0.16em; font-weight:900;">Model</div>
      <div style="font-size:30px; color:#ffffff; font-weight:950; margin-top:4px;">Fable 5</div>
      <div style="font-size:12px; color:#9deaf0; margin-top:4px;">all rows report <code style="color:#8ffcff;">claude-fable-5</code></div>
    </div>
  </div>
</div>

## Overview

`Glint-Research/Fable-5-traces` preserves Fable 5 coding-agent behavior in two complementary surfaces:

| Surface | Location | Purpose |
|:--|:--|:--|
| Agent Trace view | `pi-traces/*.jsonl` through config `pi_agent/train` | Hugging Face Agent Traces / Data Studio inspection. Each file is a Pi-style trace containing a `session`, `model_change`, `thinking_level_change`, user context, and assistant reasoning plus text/tool output. |
| Merged training rows | `fable5_cot_merged.jsonl` | Flat JSONL for direct SFT, filtering, and custom conversion. Each row contains `context`, `cot`, `output_type`, `output`, `completion`, and provenance fields. |
| Raw logs | `/claude/` | Original session-level material retained for archival inspection and alternative converters. |

The active dataset viewer is intentionally pointed at the Pi trace files so the Hub can render the examples as agent trajectories rather than as a plain JSONL table.

## Dataset Anatomy

The merged row corpus was audited on June 19, 2026. Counts below are computed over `fable5_cot_merged.jsonl` and the generated `pi-traces/` conversion.

| Metric | Value |
|:--|--:|
| Total merged examples | 4,665 |
| Pi trace files | 4,665 |
| Unique source sessions | 60 |
| Model rows | 4,665 `claude-fable-5` |
| Tool-use rows | 3,799 |
| Assistant text rows | 866 |
| Local-origin rows | 3,712 |
| Imported/HF-origin rows | 953 |
| Median rows per source session | 38 |
| P90 rows per source session | 207 |
| Largest source session slice | 439 rows |

### Output Distribution

| Output type | Rows | Share |
|:--|--:|--:|
| `tool_use` | 3,799 | 81.44% |
| `text` | 866 | 18.56% |

### Tool Distribution

| Tool | Rows |
|:--|--:|
| `Bash` | 1,544 |
| `Edit` | 960 |
| `Read` | 443 |
| `Write` | 311 |
| `PowerShell` | 136 |
| `WebSearch` | 72 |
| `mcp__Claude_Preview__preview_eval` | 63 |
| `WebFetch` | 44 |
| `TaskUpdate` | 37 |
| `ToolSearch` | 35 |
| `TaskCreate` | 26 |
| `mcp__Claude_Preview__preview_screenshot` | 24 |
| `ScheduleWakeup` | 23 |
| Other tools | 81 |

### Source Mix

| Source root | Rows |
|:--|--:|
| `-home-lane-MythosMini` | 2,024 |
| imported HF slice / other | 953 |
| `-home-lane-GR` | 447 |
| `-home-lane` | 425 |
| `-home-lane-AIArchives` | 316 |
| `-home-lane-rblx` | 215 |
| `-home-lane-Blindbot-hf-space` | 87 |
| `-home-lane-AOTpy` | 60 |
| `-home-lane-Blindbot` | 58 |
| `-home-lane-log` | 52 |
| `-home-lane-letsclaudething` | 28 |

### Text Length Profile

| Field | Median chars | P90 chars | P95 chars | Max chars | Mean chars |
|:--|--:|--:|--:|--:|--:|
| `context` | 7,022 | 7,022 | 7,022 | 7,022 | 6,593.2 |
| `cot` | 2,365 | 4,186 | 5,274 | 9,145 | 2,669.4 |
| `completion` | 2,726 | 6,166 | 8,848 | 73,607 | 3,754.9 |

The fixed upper bound in many `context` rows reflects the merged-file truncation policy. Use `/claude/` if you need to inspect fuller raw session logs.

## Pi Agent Trace Mapping

Each merged row is converted into a minimal Pi-compatible trace:

| Event | Meaning |
|:--|:--|
| `session` | Synthetic stable UUID derived from row UID; `cwd` normalized to `/workspace`. |
| `model_change` | Records `claude-fable-5`. |
| `thinking_level_change` | Set to `high` for trace viewer grouping. |
| `message` user | The merged row `context`, preserving the prompt and preceding tool/result transcript. |
| `message` assistant | A `thinking` item from `cot`, then either a `text` item or a `toolCall` item derived from `output`. |

This mapping is designed for visualization and distillation. It does not claim that each converted file was originally a standalone Pi run; it is a faithful row-level projection of the merged Fable 5 trace data into the Hub-supported Agent Traces format.

## Fields in `fable5_cot_merged.jsonl`

| Field | Type | Description |
|:--|:--|:--|
| `uid` | string | Stable row identifier, usually `session_id#index`. |
| `source_file` | string | Original raw trace source path. |
| `session` | string | Source session identifier. |
| `model` | string | Captured model name; all audited rows are `claude-fable-5`. |
| `context` | string | Prompt and prior transcript context used for the row. |
| `cot` | string | Reasoning trace captured for the assistant action. |
| `output_type` | string | `tool_use` or `text`. |
| `output` | object | Tool name and arguments for tool rows, or text payload for assistant message rows. |
| `completion` | string | Full serialized completion-style representation containing reasoning and output. |
| `origin` | string | Provenance bucket, currently `local` or `hf`. |

## Loading

### View Agent Traces

Open the Hub viewer at:

```text
https://huggingface.co/datasets/Glint-Research/Fable-5-traces/viewer/pi_agent/train
```

### Stream the Pi Agent Trace Projection

```python
from datasets import load_dataset

ds = load_dataset(
    "Glint-Research/Fable-5-traces",
    "pi_agent",
    split="train",
    streaming=True,
)

row = next(iter(ds))
print(row["harness"])
print(row["session_id"])
print(row["messages"][-1])
print(row["file_path"])
```

### Load the Flat Merged JSONL

```python
from datasets import load_dataset

merged = load_dataset(
    "json",
    data_files="https://huggingface.co/datasets/Glint-Research/Fable-5-traces/resolve/main/fable5_cot_merged.jsonl",
    split="train",
)

print(merged.column_names)
print(merged[0]["output_type"])
```

## Intended Uses

- SFT and distillation research for coding-agent reasoning plus action prediction.
- Tool-call policy modeling over realistic shell, file-editing, preview, web, and task-management actions.
- Agent trace visualization and qualitative inspection in Hugging Face Data Studio.
- Debugging row-level conversions between flat training JSONL and event-oriented agent traces.
- Studying how long-form reasoning, terminal observations, and concrete tool invocations interleave in coding sessions.

## Caveats and Responsible Use

- The dataset contains coding-agent transcripts, terminal outputs, local file paths, and generated work logs. Treat it as agent telemetry, not as sanitized benchmark data.
- Many merged `context` values are intentionally truncated; use raw `/claude/` files when session-level continuity matters.
- Tool outputs and command logs are not guaranteed to be executable in your environment.
- This is not a hidden-eval dataset and should not be used as a claim of model capability by itself.
- The active card is optimized for Agent Trace inspection. The flat JSONL remains available for training workflows that prefer row-level examples.
- License: AGPL-3.0. Check compatibility before using this data in commercial or closed-source training pipelines.

## Provenance

This dataset was assembled from Fable 5 agent traces collected by Glint Research and companion trace material contributed through the TeichAI ecosystem. The Pi Agent trace projection was generated from `fable5_cot_merged.jsonl` so the corpus can be inspected through the Hugging Face Agent Traces viewer.

## Related Links

- Hugging Face Agent Traces documentation: https://huggingface.co/docs/hub/agent-traces
- Pretty external viewer: https://tracehouse.ai/d/glint-research-fable-5-traces-0d89ee?t=qVJ4V1EOeQyQlJEhxYwmIZo11gyPnVBW
- Full logs reference: https://huggingface.co/datasets/cfahlgren1/Fable-5-traces
