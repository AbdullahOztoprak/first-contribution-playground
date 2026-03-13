#!/usr/bin/env python3
"""
Dice Roller - simple CLI game
"""
import random
import sys

def roll_dice():
    return random.randint(1, 6)

def main():
    print("\nDice Roller")
    print("Press Enter to roll a six-sided dice. Type 'q' then Enter to quit.\n")

    while True:
        try:
            user = input("Roll (Enter) or quit (q): ")
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            sys.exit(0)

        if user.strip().lower() == 'q':
            print("Goodbye!")
            break

        result = roll_dice()
        print(f"You rolled: {result}\n")

if __name__ == '__main__':
    main()
