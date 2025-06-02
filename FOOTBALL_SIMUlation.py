import tkinter as tk
from tkinter import ttk
from tkinter import Canvas
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import heapq
import random
import pandas as pd
import numpy as np

# === Scrollable Root Setup ===
root = tk.Tk()
root.title("Football Simulator - Huffman | Strategy | Prediction")
root.geometry("1200x800")

canvas = Canvas(root)
scroll_y = tk.Scrollbar(root, orient="vertical", command=canvas.yview)
scroll_frame = ttk.Frame(canvas)

scroll_frame.bind(
    "<Configure>",
    lambda e: canvas.configure(
        scrollregion=canvas.bbox("all")
    )
)

canvas.create_window((0, 0), window=scroll_frame, anchor="nw")
canvas.configure(yscrollcommand=scroll_y.set)

canvas.pack(side="left", fill="both", expand=True)
scroll_y.pack(side="right", fill="y")

# === Global Setup ===
players = ['Varane', 'Rashford', 'TAA', 'Fernand', 'Garnacho', 'Bruno',
           'Nunez', 'Salah', 'Diaz', 'MacAllister', 'Van Dijk', 'Casemiro']
huffman_codes = {}

class Node:
    def __init__(self, freq, symbol, left=None, right=None):
        self.freq = freq
        self.symbol = symbol
        self.left = left
        self.right = right
    def __lt__(self, other): return self.freq < other.freq

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

def plot_huffman_tree(node, ax, x=0.5, y=1.0, dx=0.2, dy=0.1):
    if node is None: return
    ax.text(x, y, node.symbol if node.symbol else '', ha='center', bbox=dict(facecolor='white', edgecolor='black'))
    if node.left:
        ax.plot([x, x - dx], [y, y - dy], 'k-')
        plot_huffman_tree(node.left, ax, x - dx, y - dy, dx * 0.7, dy)
    if node.right:
        ax.plot([x, x + dx], [y, y - dy], 'k-')
        plot_huffman_tree(node.right, ax, x + dx, y - dy, dx * 0.7, dy)

def activity_selection(n=4):
    activities = []
    for i in range(n):
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
    return activities, selected

def update_huffman_plot():
    fig1.clear()
    ax1 = fig1.add_subplot(111)
    freqs = {p: random.randint(1, 100) for p in players}
    root_node = build_huffman_tree(freqs)
    codes = get_codes(root_node)
    plot_huffman_tree(root_node, ax1)
    ax1.set_title("Huffman Tree - Player Pass Codes")
    ax1.axis('off')
    global huffman_codes
    huffman_codes = codes
    canvas1.draw()

def update_activity_plot():
    fig2.clear()
    ax2 = fig2.add_subplot(111)
    acts, selected = activity_selection()
    labels = ["Pass", "Dribble", "Tackle", "Shoot", "Cross", "Intercept", "Clearance", "Header"]
    for i, (s, e) in enumerate(acts):
        label = labels[i % len(labels)]
        color = 'green' if (s, e) in selected else 'red'
        ax2.barh(label, e - s, left=s, color=color)
        ax2.text((s + e) / 2, i, f"{s}-{e}", ha='center', va='center', color='white')
    ax2.set_xlim(0, 90)
    ax2.set_xlabel("Match Time (Minutes)")
    ax2.set_title("Player's Strategic Actions (Activity Selection)")
    canvas2.draw()

def show_code():
    player = selected_player.get()
    code = huffman_codes.get(player, "N/A")
    code_label.config(text=f"Code for {player}: {code}")

def monte_carlo_prediction():
    home = home_team.get()
    away = away_team.get()
    if home == away:
        result_label.config(text="Home and Away cannot be same.")
        return
    df = pd.read_csv("match_data.csv")
    team_avg = df.groupby('team')['team_goals'].mean()
    λ_home = team_avg.get(home, 1.2)
    λ_away = team_avg.get(away, 1.0)
    sim = 10000
    home_sim = np.random.poisson(λ_home, sim)
    away_sim = np.random.poisson(λ_away, sim)
    win = np.sum(home_sim > away_sim)
    draw = np.sum(home_sim == away_sim)
    lose = np.sum(home_sim < away_sim)
    text = (
        f"{home} vs {away}\n"
        f"{home} Win: {win/sim:.2%}\n"
        f"Draw: {draw/sim:.2%}\n"
        f"{away} Win: {lose/sim:.2%}\n"
        f"Expected Goals: {home}: {home_sim.mean():.2f}, {away}: {away_sim.mean():.2f}"
    )
    result_label.config(text=text)

# === GUI Widgets on scroll_frame ===

# Huffman Tree
selected_player = tk.StringVar()
ttk.Combobox(scroll_frame, textvariable=selected_player, values=players).grid(row=0, column=0, padx=10, pady=5)
tk.Button(scroll_frame, text="Show Code", command=show_code).grid(row=0, column=1)
code_label = tk.Label(scroll_frame, text="Code will appear here", fg="blue")
code_label.grid(row=0, column=2)

fig1 = plt.Figure(figsize=(6, 4))
canvas1 = FigureCanvasTkAgg(fig1, master=scroll_frame)
canvas1.get_tk_widget().grid(row=1, column=0, columnspan=3)
tk.Button(scroll_frame, text="Generate New Huffman Tree", command=update_huffman_plot).grid(row=2, column=1, pady=10)

# Activity Selection
fig2 = plt.Figure(figsize=(6, 3))
canvas2 = FigureCanvasTkAgg(fig2, master=scroll_frame)
canvas2.get_tk_widget().grid(row=3, column=0, columnspan=3)
tk.Button(scroll_frame, text="Generate Strategic Actions", command=update_activity_plot).grid(row=4, column=1, pady=10)

# Match Prediction
tk.Label(scroll_frame, text="Home Team:").grid(row=5, column=0)
home_team = tk.StringVar()
ttk.Combobox(scroll_frame, textvariable=home_team, values=["TeamA", "TeamB", "TeamC", "TeamD"]).grid(row=5, column=1)
tk.Label(scroll_frame, text="Away Team:").grid(row=6, column=0)
away_team = tk.StringVar()
ttk.Combobox(scroll_frame, textvariable=away_team, values=["TeamA", "TeamB", "TeamC", "TeamD"]).grid(row=6, column=1)
tk.Button(scroll_frame, text="Predict Match", command=monte_carlo_prediction).grid(row=7, column=1, pady=10)
result_label = tk.Label(scroll_frame, text="Prediction will appear here", fg="green")
result_label.grid(row=8, column=0, columnspan=3)

# Continue adding remaining widgets (e.g., What-If, Pass Simulation, etc.) here similarly on scroll_frame

# Initial Update
update_huffman_plot()
update_activity_plot()
root.mainloop()
