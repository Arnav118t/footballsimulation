import random

def generate_random_frequencies(players):
    return {player: random.randint(1, 100) for player in players}
