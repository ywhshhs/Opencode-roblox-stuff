# Fable LM

A small (~10M parameter) transformer language model trained on Fable 5 agent traces.

## Architecture

- **Type:** GPT-2 style decoder-only transformer
- **Parameters:** ~10M (configurable)
- **Features:**
  - Rotary positional embeddings (RoPE)
  - RMSNorm (more efficient than LayerNorm)
  - SiLU activation in FFN
  - Weight tying between input/output embeddings
  - Mixed precision training support

## Model Config

| Parameter | Value |
|-----------|-------|
| vocab_size | 8192 |
| d_model | 384 |
| n_heads | 8 |
| n_layers | 6 |
| d_ff | 1536 |
| max_seq_len | 512 |

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Train the Model

```bash
# Full training (uses 500K samples from HuggingFace)
python train.py

# Quick test run (small config, 1K samples)
python train.py --small
```

### 3. Generate Text

```bash
# Interactive mode
python generate.py checkpoints/best_model.pt --interactive

# Single prompt
python generate.py checkpoints/best_model.pt --prompt "Create a Python function"

# With custom parameters
python generate.py checkpoints/best_model.pt \
    --prompt "<think>\nLet me analyze this code" \
    --temperature 0.7 \
    --max-tokens 300
```

## Data

The model is trained on the [Complete-FABLE.5-traces-2M](https://huggingface.co/datasets/Crownelius/Complete-FABLE.5-traces-2M) dataset from HuggingFace.

Data includes:
- User prompts and commands
- Agent completions with chain-of-thought reasoning
- Tool call operations
- Session metadata

## Project Structure

```
fable-lm/
├── config.py       # Model and training configuration
├── model.py        # Transformer architecture
├── data.py         # Data loading and tokenization
├── train.py        # Training loop
├── generate.py     # Text generation
├── requirements.txt
└── README.md
```

## Training Tips

1. **Start with small config** for testing: `python train.py --small`
2. **Monitor val loss** to avoid overfitting
3. **Adjust learning rate** if training is unstable (try 1e-4 or 5e-4)
4. **Increase max_samples** for better results (up to 2M)

## Generated Examples

After training, the model should be able to:
- Complete user prompts for code generation
- Reason about programming tasks (chain-of-thought)
- Predict agent operations based on context

## License

MIT
