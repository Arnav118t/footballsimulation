import matplotlib.pyplot as plt
import heapq
import random
import pandas as pd
import numpy as np

class Node:
    def __init__(self, freq, symbol, left=None, right=None):
        self.freq = freq
        self.symbol = symbol
        self.left = left
        self.right = right

    def __lt__(self, other):
        return self.freq < other.freq

def build_huffman_tree(player_freq):
    heap = [Node(freq, player) for player, freq in player_freq.items()]
    heapq.heapify(heap)
    while len(heap) > 1:
        n1 = heapq.heappop(heap)
        n2 = heapq.heappop(heap)
        new_node = Node(n1.freq + n2.freq, '', n1, n2)
        heapq.heappush(heap, new_node)
    return heap[0]

def get_codes(node, prefix='', code_map=None):
    if code_map is None:
        code_map = {}
    if node:
        if node.symbol:
            code_map[node.symbol] = prefix
        get_codes(node.left, prefix + '0', code_map)
        get_codes(node.right, prefix + '1', code_map)
    return code_map

def save_huffman_plot(freqs, filename='static/images/huffman.png'):
    root = build_huffman_tree(freqs)
    codes = get_codes(root)
    fig, ax = plt.subplots(figsize=(6, 4))
    plot_huffman_tree(root, ax)
    ax.set_title("Huffman Tree - Player Pass Codes")
    ax.axis('off')
    fig.tight_layout()
    fig.savefig(filename)
    return codes

def plot_huffman_tree(node, ax, x=0.5, y=1.0, dx=0.2, dy=0.1):
    if node is None:
        return
    ax.text(x, y, node.symbol if node.symbol else '', ha='center', bbox=dict(facecolor='white', edgecolor='black'))
    if node.left:
        ax.plot([x, x - dx], [y, y - dy], 'k-')
        plot_huffman_tree(node.left, ax, x - dx, y - dy, dx * 0.7, dy)
    if node.right:
        ax.plot([x, x + dx], [y, y - dy], 'k-')
        plot_huffman_tree(node.right, ax, x + dx, y - dy, dx * 0.7, dy)

def save_activity_plot(filename='static/images/activity.png'):
    activities = []
    for _ in range(4):
        start = random.randint(0, 60)
        end = start + random.randint(5, 30)
        activities.append((start, end))
    activities.sort(key=lambda x: x[1])

    selected = []
    current_end = -1
    for act in activities:
        if act[0] >= current_end:
            selected.append(act)
            current_end = act[1]

    fig, ax = plt.subplots(figsize=(6, 3))
    for i, (s, e) in enumerate(activities):
        color = 'green' if (s, e) in selected else 'red'
        ax.barh(f"Action {i+1}", e - s, left=s, color=color)
        ax.text((s + e) / 2, i, f"{s}-{e}", ha='center', va='center', color='white')
    ax.set_xlabel("Match Time (Minutes)")
    ax.set_xlim(0, 90)
    ax.set_title("Player's Strategic Actions")
    fig.tight_layout()
    fig.savefig(filename)

def monte_carlo_prediction(home, away, csv_file='match_data.csv'):
    if home == away:
        return "Home and Away cannot be same."

    df = pd.read_csv(csv_file)
    team_avg = df.groupby('team')['team_goals'].mean()

    λ_home = team_avg.get(home, 1.2)
    λ_away = team_avg.get(away, 1.0)

    sim = 10000
    home_sim = np.random.poisson(λ_home, sim)
    away_sim = np.random.poisson(λ_away, sim)

    win = np.sum(home_sim > away_sim)
    draw = np.sum(home_sim == away_sim)
    lose = np.sum(home_sim < away_sim)

    return (
        f"{home} vs {away}<br>"
        f"{home} Win: {win/sim:.2%}<br>"
        f"Draw: {draw/sim:.2%}<br>"
        f"{away} Win: {lose/sim:.2%}<br>"
        f"Expected Goals → {home}: {home_sim.mean():.2f}, {away}: {away_sim.mean():.2f}"
    )


