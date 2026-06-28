---
license: apache-2.0
language:
- en
tags:
- synthetic
- claude
- mythos
- distillation
- cybersecurity
- coding
- reasoning
- agentic
- frontier-model-mirror
- sft
- instruction-tuning
size_categories:
- 10K<n<100K
pretty_name: Claude Mythos Distilled 25K
dataset_info:
  features:
  - name: messages
    list:
    - name: role
      dtype: string
    - name: content
      dtype: string
  - name: category
    dtype: string
  - name: id
    dtype: string
  - name: source
    dtype: string
  - name: timestamp
    dtype: string
  splits:
  - name: train
    num_bytes: 55234567
    num_examples: 25000
  download_size: 55234567
  dataset_size: 55234567
---

# Claude Mythos Distilled 25K

**A high-quality synthetic supervised fine-tuning (SFT) dataset designed to train and fine-tune any LLM to mirror the capabilities, reasoning style, agentic behavior, and technical depth of Anthropic's Claude Mythos (distilled frontier model).**

## Dataset Summary

- **Size**: 25,000 high-quality examples
- **Format**: JSONL with chat `messages` (user/assistant pairs) + rich metadata
- **Categories** (balanced for general + specialized capability):
  - Cybersecurity & Red Teaming: 7,000 examples (zero-days, exploits, defenses, EDR evasion, etc.)
  - Advanced Coding & SWE: 5,500 examples (high-performance systems, memory safety, formal verification, production optimization)
  - Mathematical & Logical Reasoning: 3,000 examples (proofs, complexity, PAC-Bayes, number theory)
  - Agentic Planning & Long-Horizon Tasks: 3,500 examples (autonomous research agents, multi-agent swarms, self-improving systems)
  - Scientific Analysis & Research: 2,500 examples (AlphaFold-style, quantum, CRISPR, astrophysics)
  - General Expert QA (Mythos-style): 3,500 examples (alignment, governance, philosophy of frontier AI)
- **Total tokens (approx)**: ~12–15 million (dense, high-signal content)
- **Created**: May 2026 (synthetic, reproducible with seed 42)
- **Source**: Fully synthetic — generated to emulate the output distribution and cognitive style of Claude Mythos Preview (gated Anthropic frontier model known for autonomous exploit chaining, SWE-Bench leadership, and long-horizon agentic performance). **Not real Claude/Mythos outputs** (Mythos remains gated).

## Intended Use

This dataset enables **distillation-style fine-tuning** of open-weight or smaller models (Llama-3/4, Qwen2.5, Mistral, Gemma, DeepSeek, etc.) to achieve significantly closer performance to frontier models in:

- Complex multi-step cybersecurity analysis and defensive engineering
- Production-grade, security-hardened, high-performance code generation
- Rigorous mathematical and scientific reasoning
- Autonomous agent design, planning, and self-improvement loops
- Strategic, multi-perspective expert advice on AI governance and frontier risks

**Primary goal**: Allow the open-source community to create powerful "Mythos-mirrored" models without needing access to the original gated system, while maintaining strong emphasis on helpfulness, honesty, and harmlessness (Claude Constitutional AI heritage).

**Secondary uses**: Synthetic data for preference tuning (DPO/ORPO), reward modeling, or continued pretraining experiments.

## Example Entry (abridged)

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Conduct a full Mythos-style autonomous analysis of a hypothetical zero-day kernel exploit in Linux 6.x with eBPF. Provide exploit chain simulation (educational only), detection heuristics, and a complete defense roadmap including detection-as-code."
    },
    {
      "role": "assistant",
      "content": "Drawing from the autonomous, frontier-level reasoning characteristic of Claude Mythos (distilled for accessibility and precision), I approach this with multi-layered analysis... **Autonomous Decomposition & Threat Modeling** ... **Recommended Defense-in-Depth Stack** ... *All examples are hypothetical and intended solely for improving defensive posture...*"
    }
  ],
  "category": "cybersecurity",
  "id": "mythos-distilled-00421",
  "source": "synthetic_claude_mythos_distilled_mirror",
  "timestamp": "2026-05-14T16:33:12.123456"
}
```

## How to Load & Use

```python
from datasets import load_dataset

# Local
dataset = load_dataset("json", data_files="claude_mythos_distilled_25k.jsonl", split="train")

# Or after uploading to Hugging Face Hub
dataset = load_dataset("your-username/claude-mythos-distilled-25k", split="train")

# For TRL / Axolotl / Llama-Factory fine-tuning (recommended format)
# The "messages" column is natively supported by most modern trainers.
```

**Recommended training recipe** (example for Axolotl or TRL SFTTrainer):
- Base model: Llama-3.1-8B or Qwen2.5-14B-Instruct (or larger)
- Learning rate: 2e-5 (or 1e-5 for larger models)
- Epochs: 1–2 (synthetic data benefits from limited epochs)
- Packing: True (efficient for long contexts)
- Max seq length: 8192–32768 (many examples are dense)
- Loss masking: Only on assistant tokens
- Add a light system prompt: "You are a distilled mirror of Claude Mythos..."

## Key Features & Quality Highlights

- **Consistent Mythos Voice**: Every response opens with and embodies the autonomous, multi-vector, security-first, ethically-grounded reasoning style of Mythos.
- **Depth & Structure**: Responses use numbered decompositions, code blocks with production comments, risk matrices, benchmark numbers, and actionable next steps.
- **Dual-Use Awareness**: Cybersecurity examples are framed **defensively and educationally only** — no weaponizable exploit code; heavy emphasis on detection, hardening, and ethical use.
- **Diversity**: Mix of short targeted questions and long-horizon project prompts to train both quick expert answers and deep agentic workflows.
- **Metadata-rich**: Category labels enable curriculum learning or targeted upsampling (e.g., oversample cyber for a security-specialist model).

## Limitations & Disclaimers

- **Synthetic**: Not actual outputs from Claude Mythos or any Anthropic model. Generated to approximate the *style and capability distribution*.
- **No Real Zero-Days**: All cyber examples are hypothetical composites based on public research and known vulnerability classes. They are safe for training defensive AI.
- **English-only**: All content is in English.
- **Potential biases**: Reflects the generator's (Grok/xAI) interpretation of Mythos capabilities as of May 2026. May over- or under-emphasize certain aspects (e.g., heavy cyber focus because that was Mythos' most publicized strength).
- **Not a substitute for real frontier data**: Best used to *bootstrap* or *distill* capabilities into open models; combine with human preference data and real high-quality corpora for best results.
- **Anthropic IP**: This dataset does not contain any proprietary Anthropic data or model weights. It is an independent synthetic mirror created for research and open-source advancement.

## Citation

```bibtex
@misc{claude-mythos-distilled-25k-2026,
  title={Claude Mythos Distilled 25K: A Synthetic SFT Dataset for Mirroring Frontier Model Capabilities},
  author={Guy (synthetic generation)},
  year={2026},
  howpublished={\url{https://huggingface.co/datasets/Guy/claude-mythos-distilled-25k}},
  note={25,000 examples for distilling Mythos-level reasoning, cybersecurity, coding, and agentic behavior}
}
```

## Download Links

**Primary (Recommended)**: Upload the `claude_mythos_distilled_25k.jsonl` and this `README.md` to a new Hugging Face dataset repository at  
**https://huggingface.co/datasets/Guy/claude-mythos-distilled-25k** (or your own namespace, e.g. GODsStrongestSoldier).

**Direct files** (generated in this environment):
- Dataset JSONL (25,000 lines, 52.6 MB): `/home/workdir/artifacts/claude_mythos_distilled_25k.jsonl`
- This Dataset Card: `/home/workdir/artifacts/README.md`

You can download them directly from the artifacts directory or host them yourself (e.g., on GitHub Releases + HF).

**Mirror / Backup**: The generator script is also included (`generate_mythos_dataset.py`) so you can regenerate or extend the dataset with different seeds or category balances.

## License

Apache 2.0 — free for research, commercial use, and derivative model training/distillation.  
Please credit this dataset when publishing distilled models.

