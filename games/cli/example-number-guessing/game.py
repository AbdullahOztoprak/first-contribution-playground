"""
Number Guessing Game - Example Submission
Author: @platform-bot
Category: CLI Game
Difficulty: Beginner

A simple number guessing game where the computer picks a random number
and the player tries to guess it.
"""

import random


def play():
    """Main game loop."""
    print("=" * 40)
    print("  Welcome to Number Guessing Game!")
    print("=" * 40)
    print()

    secret = random.randint(1, 100)
    attempts = 0
    max_attempts = 7

    print(f"I'm thinking of a number between 1 and 100.")
    print(f"You have {max_attempts} attempts. Good luck!\n")

    while attempts < max_attempts:
        try:
            guess = int(input(f"Attempt {attempts + 1}/{max_attempts} - Your guess: "))
        except ValueError:
            print("Please enter a valid number.\n")
            continue

        attempts += 1

        if guess < secret:
            print("Too low! Try higher.\n")
        elif guess > secret:
            print("Too high! Try lower.\n")
        else:
            print(f"\n🎉 Congratulations! You guessed it in {attempts} attempts!")
            return

    print(f"\n😔 Out of attempts! The number was {secret}.")


if __name__ == "__main__":
    play()
