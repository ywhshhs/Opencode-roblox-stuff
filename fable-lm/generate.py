"""
Text generation with Fable LM.
"""

import argparse
import json
from pathlib import Path

import torch
from tokenizers import Tokenizer

from config import ModelConfig
from model import FableLM
from train import load_checkpoint


def load_model(
    checkpoint_path: str, 
    device: str = "auto"
) -> tuple:
    """Load model from checkpoint."""
    
    # Determine device
    if device == "auto":
        if torch.cuda.is_available():
            device = torch.device("cuda")
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            device = torch.device("mps")
        else:
            device = torch.device("cpu")
    else:
        device = torch.device(device)
    
    # Load checkpoint
    checkpoint = torch.load(checkpoint_path, map_location=device)
    
    # Recreate model config
    config = ModelConfig(**checkpoint["config"])
    
    # Create model
    model = FableLM(config).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    
    # Load tokenizer
    tokenizer_path = Path(checkpoint_path).parent / "tokenizer.json"
    tokenizer = Tokenizer.from_file(str(tokenizer_path))
    
    print(f"Model loaded from {checkpoint_path}")
    print(f"  Device: {device}")
    print(f"  Parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    return model, tokenizer, device


def generate(
    model: FableLM,
    tokenizer: Tokenizer,
    prompt: str,
    max_new_tokens: int = 200,
    temperature: float = 0.8,
    top_k: int = 50,
    top_p: float = 0.9
) -> str:
    """Generate text from a prompt."""
    
    # Tokenize prompt
    encoded = tokenizer.encode(prompt)
    input_ids = torch.tensor([encoded.ids], dtype=torch.long)
    
    # Move to model device
    device = next(model.parameters()).device
    input_ids = input_ids.to(device)
    
    # Generate
    output_ids = model.generate(
        input_ids,
        max_new_tokens=max_new_tokens,
        temperature=temperature,
        top_k=top_k,
        top_p=top_p
    )
    
    # Decode
    output_ids = output_ids[0].cpu().tolist()
    generated = tokenizer.decode(output_ids)
    
    return generated


def interactive_mode(model, tokenizer, device):
    """Interactive generation mode."""
    print("\n" + "="*60)
    print("Fable LM - Interactive Generation")
    print("="*60)
    print("Type your prompt and press Enter to generate.")
    print("Commands: /quit, /temp <value>, /tokens <value>")
    print("="*60 + "\n")
    
    temperature = 0.8
    max_tokens = 200
    
    while True:
        try:
            prompt = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break
        
        if not prompt:
            continue
        
        if prompt == "/quit":
            break
        
        if prompt.startswith("/temp "):
            try:
                temperature = float(prompt.split()[1])
                print(f"Temperature set to {temperature}")
            except ValueError:
                print("Invalid temperature value")
            continue
        
        if prompt.startswith("/tokens "):
            try:
                max_tokens = int(prompt.split()[1])
                print(f"Max tokens set to {max_tokens}")
            except ValueError:
                print("Invalid token count")
            continue
        
        # Generate
        print("\nGenerating...")
        output = generate(
            model, tokenizer, prompt,
            max_new_tokens=max_tokens,
            temperature=temperature
        )
        
        print(f"\nFable LM:\n{output}\n")
        print("-"*60)


def main():
    parser = argparse.ArgumentParser(description="Generate text with Fable LM")
    parser.add_argument("checkpoint", help="Path to model checkpoint")
    parser.add_argument("--prompt", "-p", type=str, help="Prompt for generation")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interactive mode")
    parser.add_argument("--max-tokens", "-n", type=int, default=200, help="Max new tokens")
    parser.add_argument("--temperature", "-t", type=float, default=0.8, help="Temperature")
    parser.add_argument("--top-k", type=int, default=50, help="Top-k sampling")
    parser.add_argument("--top-p", type=float, default=0.9, help="Top-p (nucleus) sampling")
    parser.add_argument("--device", "-d", type=str, default="auto", help="Device")
    
    args = parser.parse_args()
    
    # Load model
    model, tokenizer, device = load_model(args.checkpoint, args.device)
    
    if args.interactive:
        interactive_mode(model, tokenizer, device)
    elif args.prompt:
        output = generate(
            model, tokenizer, args.prompt,
            max_new_tokens=args.max_tokens,
            temperature=args.temperature,
            top_k=args.top_k,
            top_p=args.top_p
        )
        print(f"\nPrompt: {args.prompt}")
        print(f"\nGenerated:\n{output}")
    else:
        # Default prompts for testing
        prompts = [
            "[USER] Create a function that sorts a list\n[OP] enqueue",
            "<think>\nI need to analyze this code and find the bug",
            "[CONTEXT] The user wants a web server\n[USER] Set up an Express server with routes",
        ]
        
        for prompt in prompts:
            print(f"\n{'='*60}")
            print(f"Prompt: {prompt}")
            print(f"{'='*60}")
            output = generate(model, tokenizer, prompt, max_new_tokens=150)
            print(f"\nGenerated:\n{output}")


if __name__ == "__main__":
    main()
