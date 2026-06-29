"""Counts from 1 to 1,000,000,000,000 (one trillion)."""

def main():
    trillion = 1_000_000_000_000
    for i in range(1, trillion + 1):
        if i % 100_000_000_000 == 0:  # Print progress every 100 billion
            print(f"{i:,}")
    print("Done counting to one trillion!")


if __name__ == "__main__":
    main()
