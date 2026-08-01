import numpy as np
import pandas as pd

def monte_carlo_match(home, away, df_path="data/match_data.csv", simulations=10000):
    df = pd.read_csv(df_path)
    team_avg = df.groupby("team")["team_goals"].mean()
    λ_home = team_avg.get(home, 1.2)
    λ_away = team_avg.get(away, 1.0)

    home_sim = np.random.poisson(λ_home, simulations)
    away_sim = np.random.poisson(λ_away, simulations)

    return {
        "home": home,
        "away": away,
        "home_win": np.mean(home_sim > away_sim),
        "draw": np.mean(home_sim == away_sim),
        "away_win": np.mean(home_sim < away_sim),
        "avg_home_goals": home_sim.mean(),
        "avg_away_goals": away_sim.mean()
    }
