import random

def generate_activities(n=4):
    acts = []
    for _ in range(n):
        start = random.randint(0, 60)
        end = start + random.randint(5, 30)
        acts.append((start, end))
    acts.sort(key=lambda x: x[1])
    return acts

def select_activities(acts):
    selected = []
    current_end = -1
    for act in acts:
        if act[0] >= current_end:
            selected.append(act)
            current_end = act[1]
    return selected
