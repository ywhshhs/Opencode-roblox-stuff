"""
Training script for Fable LM.
"""

import os
import time
import json
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.amp import autocast as autocast_ctx, GradScaler
from torch.optim.lr_scheduler import CosineAnnealingWarmRestarts

from config import ModelConfig, TrainConfig
from model import FableLM, count_parameters
from data import (
    DataConfig, 
    load_and_process_data, 
    create_dataloaders
)


def get_device(config: TrainConfig) -> torch.device:
    """Get best available device."""
    if config.device == "auto":
        if torch.cuda.is_available():
            return torch.device("cuda")
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return torch.device("mps")
        else:
            return torch.device("cpu")
    return torch.device(config.device)


def create_optimizer(
    model: nn.Module, 
    config: TrainConfig
) -> AdamW:
    """Create optimizer with weight decay for non-bias/non-norm parameters."""
    
    # Separate parameters for weight decay
    decay_params = []
    no_decay_params = []
    
    for name, param in model.named_parameters():
        if not param.requires_grad:
            continue
        if param.ndim == 1 or "bias" in name or "norm" in name or "embedding" in name:
            no_decay_params.append(param)
        else:
            decay_params.append(param)
    
    optim_groups = [
        {"params": decay_params, "weight_decay": config.weight_decay},
        {"params": no_decay_params, "weight_decay": 0.0}
    ]
    
    return AdamW(optim_groups, lr=config.learning_rate, betas=(0.9, 0.95))


@torch.no_grad()
def evaluate(
    model: FableLM, 
    val_loader, 
    device: torch.device,
    max_batches: int = 50
) -> dict:
    """Evaluate model on validation set."""
    model.eval()
    total_loss = 0
    n_batches = 0
    
    for batch in val_loader:
        if n_batches >= max_batches:
            break
        
        input_ids = batch["input_ids"].to(device)
        labels = batch["labels"].to(device)
        
        output = model(input_ids, labels=labels)
        total_loss += output["loss"].item()
        n_batches += 1
    
    model.train()
    
    avg_loss = total_loss / max(n_batches, 1)
    return {"val_loss": avg_loss}


def train(
    model_config: Optional[ModelConfig] = None,
    train_config: Optional[TrainConfig] = None
):
    """Main training loop."""
    
    # Configs
    if model_config is None:
        model_config = ModelConfig()
    if train_config is None:
        train_config = TrainConfig()
    
    device = get_device(train_config)
    print(f"\nUsing device: {device}")
    print(f"Model config: {model_config.param_count_approx():,} approx params")
    
    # Create output directory
    output_dir = Path(train_config.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load data
    data_config = DataConfig(
        datasets=train_config.datasets,
        max_samples_per_dataset=train_config.max_samples_per_dataset,
        total_max_samples=train_config.total_max_samples,
        seq_len=model_config.max_seq_len,
        vocab_size=model_config.vocab_size
    )
    
    train_texts, val_texts, tokenizer = load_and_process_data(data_config)
    train_loader, val_loader = create_dataloaders(
        train_texts, val_texts, tokenizer, data_config, train_config.batch_size,
        num_workers=train_config.num_workers
    )
    
    # Update vocab size based on tokenizer
    model_config.vocab_size = tokenizer.get_vocab_size()
    print(f"\nActual vocab size: {model_config.vocab_size}")
    
    # Create model
    model = FableLM(model_config).to(device)
    n_params = count_parameters(model)
    print(f"Trainable parameters: {n_params:,} ({n_params/1e6:.1f}M)")
    
    # Optimizer and scheduler
    optimizer = create_optimizer(model, train_config)
    
    # Cosine annealing with warm restarts
    scheduler = CosineAnnealingWarmRestarts(
        optimizer, 
        T_0=train_config.save_every,
        T_mult=1,
        eta_min=1e-6
    )
    
    # Mixed precision
    scaler = GradScaler(device.type, enabled=train_config.mixed_precision and device.type == "cuda")
    
    # Training state
    global_step = 0
    best_val_loss = float("inf")
    train_losses = []
    val_losses = []
    
    # Save config
    config_path = output_dir / "config.json"
    with open(config_path, "w") as f:
        json.dump({
            "model": model_config.__dict__,
            "train": train_config.__dict__,
            "vocab_size": model_config.vocab_size,
            "n_params": n_params
        }, f, indent=2)
    
    print(f"\nStarting training...")
    print(f"  Max steps: {train_config.max_steps}")
    print(f"  Batch size: {train_config.batch_size}")
    print(f"  Effective batch size: {train_config.batch_size * 1}")
    
    # Training loop
    model.train()
    start_time = time.time()
    
    while global_step < train_config.max_steps:
        for batch in train_loader:
            if global_step >= train_config.max_steps:
                break
            
            input_ids = batch["input_ids"].to(device)
            labels = batch["labels"].to(device)
            
            # Forward pass with mixed precision
            with autocast_ctx(device.type, enabled=train_config.mixed_precision and device.type == "cuda"):
                output = model(input_ids, labels=labels)
                loss = output["loss"]
            
            # Backward pass
            optimizer.zero_grad()
            scaler.scale(loss).backward()
            
            # Gradient clipping
            scaler.unscale_(optimizer)
            nn.utils.clip_grad_norm_(model.parameters(), train_config.grad_clip)
            
            # Optimizer step
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()
            
            # Logging
            train_losses.append(loss.item())
            
            if global_step % train_config.log_every == 0:
                elapsed = time.time() - start_time
                lr = optimizer.param_groups[0]["lr"]
                avg_loss = sum(train_losses[-train_config.log_every:]) / train_config.log_every
                print(f"Step {global_step:>6} | Loss: {avg_loss:.4f} | LR: {lr:.2e} | Time: {elapsed:.0f}s")
            
            # Evaluation
            if global_step % train_config.eval_every == 0:
                val_metrics = evaluate(model, val_loader, device)
                val_losses.append((global_step, val_metrics["val_loss"]))
                
                print(f"  → Val Loss: {val_metrics['val_loss']:.4f}")
                
                # Save best model
                if val_metrics["val_loss"] < best_val_loss:
                    best_val_loss = val_metrics["val_loss"]
                    save_checkpoint(
                        model, optimizer, global_step, val_metrics,
                        output_dir / "best_model.pt", model_config
                    )
                    print(f"  → New best model saved!")
            
            # Periodic checkpoint
            if global_step % train_config.save_every == 0 and global_step > 0:
                save_checkpoint(
                    model, optimizer, global_step, {"val_loss": best_val_loss},
                    output_dir / f"checkpoint_{global_step}.pt", model_config
                )
            
            global_step += 1
    
    # Final save
    save_checkpoint(
        model, optimizer, global_step, {"val_loss": best_val_loss},
        output_dir / "final_model.pt", model_config
    )
    
    # Save training history
    history = {
        "train_losses": train_losses,
        "val_losses": val_losses,
        "final_step": global_step,
        "best_val_loss": best_val_loss
    }
    with open(output_dir / "history.json", "w") as f:
        json.dump(history, f)
    
    print(f"\n{'='*60}")
    print(f"Training complete!")
    print(f"  Total steps: {global_step}")
    print(f"  Best val loss: {best_val_loss:.4f}")
    print(f"  Total time: {(time.time() - start_time)/60:.1f} minutes")
    print(f"  Model saved to: {output_dir}")
    print(f"{'='*60}")


def save_checkpoint(
    model: FableLM,
    optimizer: torch.optim.Optimizer,
    step: int,
    metrics: dict,
    path: Path,
    config: ModelConfig
):
    """Save model checkpoint."""
    torch.save({
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "step": step,
        "metrics": metrics,
        "config": config.__dict__
    }, path)


def load_checkpoint(path: Path, model: FableLM, optimizer: Optional[torch.optim.Optimizer] = None):
    """Load model checkpoint."""
    checkpoint = torch.load(path, map_location="cpu")
    model.load_state_dict(checkpoint["model_state_dict"])
    if optimizer is not None:
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
    return checkpoint["step"], checkpoint.get("metrics", {})


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Train Fable LM")
    parser.add_argument("--small", action="store_true", help="Use small config for testing")
    parser.add_argument("--medium", action="store_true", help="Use medium config (200K samples)")
    args = parser.parse_args()
    
    if args.small:
        # Quick test run
        model_config = ModelConfig(
            n_layers=2,
            d_model=128,
            n_heads=4,
            d_ff=512,
            max_seq_len=128
        )
        train_config = TrainConfig(
            max_samples_per_dataset=500,
            total_max_samples=800,
            batch_size=8,
            max_steps=100,
            log_every=10,
            eval_every=50,
            save_every=50
        )
    elif args.medium:
        # Medium run
        model_config = ModelConfig()
        train_config = TrainConfig(
            max_samples_per_dataset=100_000,
            total_max_samples=150_000,
            batch_size=16,
            max_steps=10_000,
            log_every=100,
            eval_every=500,
            save_every=2000
        )
    else:
        # Full run
        model_config = ModelConfig()
        train_config = TrainConfig()
    
    train(model_config, train_config)
