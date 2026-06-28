"""Model configuration for Fable LM."""

from dataclasses import dataclass, field

@dataclass
class ModelConfig:
    """~10M parameter GPT-2 style model."""
    vocab_size: int = 8192       # BPE vocab size
    d_model: int = 288           # Embedding dimension
    n_heads: int = 8             # Number of attention heads
    n_layers: int = 6            # Number of transformer layers
    d_ff: int = 1024             # Feed-forward dimension (4x d_model)
    max_seq_len: int = 512       # Maximum sequence length
    dropout: float = 0.1
    bias: bool = False           # No bias in Linear layers (modern approach)
    
    @property
    def head_dim(self) -> int:
        return self.d_model // self.n_heads
    
    def param_count_approx(self) -> int:
        """Rough parameter count estimate."""
        embed = self.vocab_size * self.d_model  # Token embeddings
        pos_embed = self.max_seq_len * self.d_model  # Position embeddings
        
        # Per transformer layer
        attn = 4 * self.d_model ** 2  # Q, K, V, output projections
        ff = 2 * self.d_model * self.d_ff  # Two linear layers
        layer_norm = 4 * self.d_model  # Two layer norms
        per_layer = attn + ff + layer_norm
        
        total = embed + pos_embed + (per_layer * self.n_layers) + self.d_model
        return total


@dataclass
class TrainConfig:
    """Training configuration."""
    # Data
    datasets: list = field(default_factory=lambda: [
        "Crownelius/Complete-FABLE.5-traces-2M",
        "DavidrPatton/Fable-5-GLM-5.2-Traces"
    ])
    max_samples_per_dataset: int = 500_000
    total_max_samples: int = 800_000
    val_split: float = 0.05
    
    # Training
    batch_size: int = 32
    learning_rate: float = 3e-4
    weight_decay: float = 0.1
    warmup_steps: int = 1000
    max_steps: int = 50_000
    grad_clip: float = 1.0
    
    # Checkpointing
    save_every: int = 5000
    eval_every: int = 1000
    log_every: int = 100
    
    # Output
    output_dir: str = "checkpoints"
    model_name: str = "fable-10m"
    
    # Hardware
    device: str = "auto"  # auto-detect
    num_workers: int = 0
    pin_memory: bool = True
    mixed_precision: bool = True  # Use AMP for faster training


if __name__ == "__main__":
    cfg = ModelConfig()
    print(f"Model config: {cfg}")
    print(f"Approximate parameters: {cfg.param_count_approx():,}")
