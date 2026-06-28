---
license: agpl-3.0
language:
- en
tags:
- agentic
- chain-of-thought
- distillation
- claude
- claude-fable-5
- agent-traces
- sft
- qwen-chat-template
- qwable
task_categories:
- text-generation
size_categories:
- 1K<n<10K
configs:
- config_name: default
  data_files:
  - split: train
    path: data/train-*.parquet
---

# Fable-5 SFT — prepared for Qwable fine-tuning

4,659 single-turn pairs from **Claude Fable-5** (Anthropic preview model, suspended globally 2026-06-22 under U.S. export-control directives), reformatted into a single-`text`-column parquet ready for `SFTTrainer(dataset_text_field="text") + train_on_responses_only`.

**Composition:**
- 3,793 rows (81%) end in a `<tool_use>` block — agentic tool-call patterns
- 866 rows (19%) end in a pure text response

This is **agentic data**, not pure reasoning data. The `<think>` blocks reason about code edits and tool calls, not about abstract problems. The narrow training distribution is essentially one developer''s week of Claude Code sessions plus assorted preview-tool work.

## Used to train

🤖 **[`lordx64/Qwable-v1`](https://huggingface.co/lordx64/Qwable-v1)** — `Qwen3.6-35B-A3B` warm-started from the [Opus 4.7 distill](https://huggingface.co/lordx64/Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled), then SFT''d on this dataset for 2 epochs (582 steps) on a single H200. Final loss 0.7956 (last-20 avg).

GGUF quants: [`lordx64/Qwable-v1-GGUF`](https://huggingface.co/lordx64/Qwable-v1-GGUF) (IQ4_XS, Q5_K_M, Q8_0).

## What this repo adds on top of upstream

1. **Format**: collapsed into a single `text` column with full Qwen chat template (system + user + `<think>…</think>` + visible response).
2. **Tool serialization**: `tool_use` blocks rendered as `<tool_use name="X" id="Y">…</tool_use>`; `tool_result` rendered as `<tool_result id="X">…</tool_result>`. Custom XML envelope — NOT Qwen native `<tool_call>` tokens. Parses with a small regex.
3. **Filtering**: dropped Claude Code''s `<synthetic>` rate-limit injections; dropped assistant turns with no thinking trace; dropped rows where CoT < 50 chars or output failed validation.
4. **Noise stripping**: removed Claude Code slash-command meta blocks (`<local-command-caveat>`, `<command-name>`, `<command-message>`, `<command-args>`, `<local-command-stdout>`) and ANSI escape codes from user-side content.
5. **Secrets scrubbed**: 204 occurrences of 2 active Groq API keys redacted from upstream session JSONLs (Claude Code captured them via `Read` of `.env` files in the original developer''s repo).
6. **Dedup**: SHA-256 over user-turn content (6 dups removed).
7. **Packaging**: single parquet under `data/train-*.parquet` for HF datasets auto-detection.

The source data and CoT credit go entirely to the upstream creators — we just shaped it for training.

## Provenance

| Source | Rows | Chars |
|---|---:|---:|
| `Glint-Research/Fable-5-traces` | 4,659 | 48,772,554 |

Total: **48,772,554 chars** (~12,193,138 Qwen tokens), avg ~2.6k tokens/row.

### Note on the other Fable-5 sources

We initially planned a 3-source merge including [`armand0e/claude-fable-5-claude-code`](https://huggingface.co/datasets/armand0e/claude-fable-5-claude-code) and [`victor/fable-5-boeing-747-trace`](https://huggingface.co/datasets/victor/fable-5-boeing-747-trace). Both turned out to have **100% of `thinking` blocks redacted** by Anthropic''s API (only the cryptographic `signature` is preserved; the cleartext thinking field is empty). This is consistent with Anthropic''s preview-model IP protection — useful for trace integrity verification, but not for SFT.

Only `Glint-Research/Fable-5-traces` ships cleartext CoT (their README notes they "added the CoT data" — likely they had a different API tier or synthesized post-hoc; quality is high-signal reasoning consistent with the final response).

## Row format

```
<|im_start|>system
You are a helpful AI assistant.<|im_end|>
<|im_start|>user
{user_or_tool_result}<|im_end|>
<|im_start|>assistant
<think>
{fable5_thinking}
</think>

{fable5_response_with_tool_calls}<|im_end|>
```

## License & terms

Inherits AGPL-3.0 from upstream [`Glint-Research/Fable-5-traces`](https://huggingface.co/datasets/Glint-Research/Fable-5-traces). The underlying content is output from Anthropic''s gated `claude-fable-5` model (briefly available 2026-06-10 to 2026-06-22) — downstream users must verify compliance with [Anthropic''s usage policies](https://www.anthropic.com/legal/usage-policy) for their specific use case.
