"""
Data processing pipeline for Fable 5 traces.
Supports multiple datasets, tokenizes, and creates training batches.
"""

import json
import os
from typing import Iterator, Dict, List, Optional, Tuple
from dataclasses import dataclass, field

import torch
from torch.utils.data import Dataset, DataLoader
from datasets import load_dataset
from tokenizers import Tokenizer, models, pre_tokenizers, trainers, processors


@dataclass
class DataConfig:
    """Data configuration."""
    # Dataset names
    datasets: List[str] = field(default_factory=lambda: [
        "Crownelius/Complete-FABLE.5-traces-2M",
        "DavidrPatton/Fable-5-GLM-5.2-Traces"
    ])
    max_samples_per_dataset: int = 500_000  # Max samples per dataset
    total_max_samples: int = 800_000        # Total max samples across all datasets
    val_split: float = 0.05
    seq_len: int = 512
    vocab_size: int = 8192
    tokenizer_path: str = "tokenizer.json"
    
    # Text extraction settings
    min_text_length: int = 50
    max_text_length: int = 4096


def extract_text_from_trace(row_json: str) -> Optional[str]:
    """Extract meaningful text from a trace row (Crownelius dataset format)."""
    try:
        row = json.loads(row_json)
    except json.JSONDecodeError:
        return None
    
    parts = []
    
    # Extract user prompts
    if row.get("message") and isinstance(row["message"], dict):
        content = row["message"].get("content")
        if content and isinstance(content, str):
            parts.append(f"[USER] {content}")
    
    # Extract content field (prompts, commands)
    if row.get("content") and isinstance(row["content"], str):
        parts.append(row["content"])
    
    # Extract completions (model outputs with chain-of-thought)
    if row.get("completion") and isinstance(row["completion"], str):
        parts.append(row["completion"])
    
    # Extract last prompt
    if row.get("lastPrompt") and isinstance(row["lastPrompt"], str):
        parts.append(f"[CONTEXT] {row['lastPrompt']}")
    
    # Extract operation context
    if row.get("operation"):
        parts.append(f"[OP] {row['operation']}")
    
    if not parts:
        return None
    
    # Join with separator
    text = "\n".join(parts)
    
    return text


def extract_text_from_messages(messages, model: str = None) -> Optional[str]:
    """Extract meaningful text from messages format (DavidrPatton dataset)."""
    if not messages:
        return None
    
    # Parse messages if string
    if isinstance(messages, str):
        try:
            messages = eval(messages)  # Safe for known format
        except:
            return None
    
    if not isinstance(messages, list):
        return None
    
    parts = []
    
    # Add model info if available
    if model:
        parts.append(f"[MODEL] {model}")
    
    # Process each message
    for msg in messages:
        if not isinstance(msg, dict):
            continue
        
        role = msg.get("role", "")
        content = msg.get("content", "")
        
        if not content or not isinstance(content, str):
            continue
        
        # Skip very short messages
        if len(content.strip()) < 10:
            continue
        
        # Truncate very long messages
        if len(content) > 2000:
            content = content[:2000] + "..."
        
        if role == "user":
            parts.append(f"[USER] {content}")
        elif role == "assistant":
            parts.append(f"[ASSISTANT] {content}")
        else:
            parts.append(content)
    
    if not parts:
        return None
    
    return "\n\n".join(parts)


def load_crownelius_dataset(max_samples: int) -> List[str]:
    """Load and process Crownelius dataset."""
    print(f"\nLoading Crownelius/Complete-FABLE.5-traces-2M...")
    
    ds = load_dataset(
        "Crownelius/Complete-FABLE.5-traces-2M", 
        split="train", 
        streaming=True
    )
    
    texts = []
    for i, sample in enumerate(ds):
        if i >= max_samples:
            break
        
        text = extract_text_from_trace(sample["row_json"])
        if text and len(text.strip()) >= 50:
            texts.append(text)
        
        if (i + 1) % 100000 == 0:
            print(f"  Crownelius: {i+1} rows processed, {len(texts)} valid texts")
    
    print(f"  Crownelius: {len(texts)} texts extracted from {min(i+1, max_samples)} rows")
    return texts


def load_davidpatton_dataset(max_samples: int) -> List[str]:
    """Load and process DavidrPatton dataset."""
    print(f"\nLoading DavidrPatton/Fable-5-GLM-5.2-Traces...")
    
    try:
        ds = load_dataset(
            "DavidrPatton/Fable-5-GLM-5.2-Traces",
            split="train",
            streaming=True
        )
        
        texts = []
        iterator = iter(ds)
        for i in range(max_samples):
            try:
                sample = next(iterator)
            except StopIteration:
                break
            
            text = extract_text_from_messages(
                sample.get("messages"),
                model=sample.get("model")
            )
            if text and len(text.strip()) >= 50:
                texts.append(text)
            
            if (i + 1) % 100000 == 0:
                print(f"  DavidrPatton: {i+1} rows processed, {len(texts)} valid texts")
        
        print(f"  DavidrPatton: {len(texts)} texts extracted")
        return texts
    except Exception as e:
        # Catch any error including CastError during iteration
        print(f"  Warning: Could not load DavidrPatton dataset: {type(e).__name__}")
        print(f"  Continuing with Crownelius dataset only...")
        return []


def train_tokenizer(texts: List[str], vocab_size: int = 8192, save_path: str = "tokenizer.json") -> Tokenizer:
    """Train a BPE tokenizer on the dataset."""
    print(f"\nTraining tokenizer with vocab_size={vocab_size}...")
    
    tokenizer = Tokenizer(models.BPE())
    tokenizer.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False)
    
    trainer = trainers.BpeTrainer(
        vocab_size=vocab_size,
        special_tokens=[
            "[PAD]", "[UNK]", "[CLS]", "[SEP]", "[MASK]", 
            "[USER]", "[ASSISTANT]", "[CONTEXT]", "[OP]", "[MODEL]"
        ],
        show_progress=True
    )
    
    # Train from iterator
    def text_iterator():
        for text in texts:
            yield text
    
    tokenizer.train_from_iterator(text_iterator(), trainer=trainer)
    
    # Save
    tokenizer.save(save_path)
    print(f"Tokenizer saved to {save_path}")
    
    return tokenizer


class FableTraceDataset(Dataset):
    """Dataset for Fable 5 traces."""
    
    def __init__(
        self, 
        texts: List[str], 
        tokenizer: Tokenizer, 
        seq_len: int = 512,
        max_length: int = 4096
    ):
        self.texts = texts
        self.tokenizer = tokenizer
        self.seq_len = seq_len
        self.max_length = max_length
        self.encodings = []
        
        # Pre-tokenize all texts
        print(f"\nTokenizing {len(texts)} samples...")
        skipped = 0
        for i, text in enumerate(texts):
            if i % 50000 == 0:
                print(f"  Tokenizing: {i}/{len(texts)}")
            
            # Truncate long texts
            if len(text) > max_length:
                text = text[:max_length]
            
            encoded = tokenizer.encode(text)
            
            # Skip very short sequences
            if len(encoded.ids) < 10:
                skipped += 1
                continue
            
            self.encodings.append(encoded.ids)
        
        print(f"Tokenization complete. Kept {len(self.encodings)}, skipped {skipped}")
        print(f"Avg tokens per sample: {sum(len(e) for e in self.encodings) / len(self.encodings):.0f}")
    
    def __len__(self):
        return len(self.encodings)
    
    def __getitem__(self, idx):
        ids = self.encodings[idx]
        
        # Truncate or pad to seq_len + 1 (for labels)
        if len(ids) >= self.seq_len + 1:
            # Random chunk for training variety
            start = torch.randint(0, len(ids) - self.seq_len, (1,)).item()
            ids = ids[start:start + self.seq_len + 1]
        else:
            ids = ids + [0] * (self.seq_len + 1 - len(ids))
        
        x = torch.tensor(ids[:-1], dtype=torch.long)
        y = torch.tensor(ids[1:], dtype=torch.long)
        
        # Mask padding tokens in labels
        y[y == 0] = -100
        
        return {"input_ids": x, "labels": y}


def load_and_process_data(
    config: DataConfig,
    force_retrain: bool = False
) -> Tuple[List[str], List[str], Tokenizer]:
    """Load data and prepare for training."""
    
    # Load all datasets
    all_texts = []
    
    # Crownelius dataset (larger)
    crownelius_texts = load_crownelius_dataset(config.max_samples_per_dataset)
    all_texts.extend(crownelius_texts)
    
    # DavidrPatton dataset
    davidpatton_texts = load_davidpatton_dataset(config.max_samples_per_dataset)
    all_texts.extend(davidpatton_texts)
    
    # Limit total samples
    if len(all_texts) > config.total_max_samples:
        print(f"\nTruncating from {len(all_texts)} to {config.total_max_samples} samples")
        # Random shuffle for diversity
        import random
        random.seed(42)
        random.shuffle(all_texts)
        all_texts = all_texts[:config.total_max_samples]
    
    print(f"\n{'='*60}")
    print(f"Total texts: {len(all_texts)}")
    print(f"  - Crownelius: {len(crownelius_texts)}")
    print(f"  - DavidrPatton: {len(davidpatton_texts)}")
    print(f"{'='*60}")
    
    # Load or train tokenizer
    if os.path.exists(config.tokenizer_path) and not force_retrain:
        print(f"\nLoading existing tokenizer from {config.tokenizer_path}")
        tokenizer = Tokenizer.from_file(config.tokenizer_path)
    else:
        tokenizer = train_tokenizer(all_texts, config.vocab_size, config.tokenizer_path)
    
    # Split into train/val
    import random
    random.seed(42)
    random.shuffle(all_texts)
    
    val_size = int(len(all_texts) * config.val_split)
    train_texts = all_texts[val_size:]
    val_texts = all_texts[:val_size]
    
    print(f"\nDataset split:")
    print(f"  Train: {len(train_texts)} samples")
    print(f"  Val: {len(val_texts)} samples")
    
    return train_texts, val_texts, tokenizer


def create_dataloaders(
    train_texts: List[str],
    val_texts: List[str],
    tokenizer: Tokenizer,
    config: DataConfig,
    batch_size: int = 32,
    num_workers: int = 2
) -> Tuple[DataLoader, DataLoader]:
    """Create train and validation dataloaders."""
    
    train_dataset = FableTraceDataset(train_texts, tokenizer, config.seq_len, config.max_text_length)
    val_dataset = FableTraceDataset(val_texts, tokenizer, config.seq_len, config.max_text_length)
    
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    return train_loader, val_loader


if __name__ == "__main__":
    config = DataConfig(max_samples_per_dataset=1000, total_max_samples=1500)  # Small test
    
    train_texts, val_texts, tokenizer = load_and_process_data(config)
    
    print(f"\nSample tokenization:")
    sample = train_texts[0][:300]
    print(f"  Text: {sample}")
    encoded = tokenizer.encode(sample)
    print(f"  Tokens: {encoded.tokens[:30]}...")
    print(f"  IDs: {encoded.ids[:30]}...")
