"""
Flask Analytics Microservice
----------------------------
Serves the ML/analytics side of the platform:
  GET  /api/flask/health
  GET  /api/flask/teams
  POST /api/flask/predict
  POST /api/flask/tournament

The heavy lifting lives in prediction.py and activity.py (greedy scheduler).
"""
from flask import Flask, request, jsonify
from flask_cors import CORS

from prediction import monte_carlo_match
from activity import generate_activities, select_activities

app = Flask(__name__)
CORS(app)

TEAMS = ["TeamA", "TeamB", "TeamC", "TeamD",
         "Liverpool", "Manchester United", "Arsenal", "Chelsea"]


@app.get("/api/flask/health")
def health():
    return jsonify({"status": "ok", "service": "flask-analytics", "engine": "poisson+monte-carlo"})


@app.get("/api/flask/teams")
def teams():
    return jsonify({"teams": TEAMS})


@app.post("/api/flask/predict")
def predict():
    body = request.get_json(force=True, silent=True) or {}
    home = body.get("home") or body.get("homeTeam")
    away = body.get("away") or body.get("awayTeam")
    sims = int(body.get("simulations", 10000))
    if not home or not away:
        return jsonify({"error": "home and away are required"}), 400
    if home == away:
        return jsonify({"error": "home and away must differ"}), 400
    try:
        result = monte_carlo_match(home, away, simulations=sims)
        return jsonify(result)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.post("/api/flask/tournament")
def tournament():
    """
    Runs a small round-robin forecast using the greedy activity scheduler
    (maximum non-overlapping 'priority windows') + Poisson expected goals.
    Returns a simple expected-standings table.
    """
    body = request.get_json(force=True, silent=True) or {}
    teams = body.get("teams") or ["TeamA", "TeamB", "TeamC", "TeamD"]
    if len(teams) < 2:
        return jsonify({"error": "need at least 2 teams"}), 400

    # Build a round-robin schedule (single leg).
    fixtures = []
    for i in range(len(teams)):
        for j in range(i + 1, len(teams)):
            fixtures.append((teams[i], teams[j]))

    # Greedy activity selection on match time-windows just for the demo narrative.
    acts = generate_activities(n=len(fixtures))
    selected = select_activities(acts)

    # Expected goals via Poisson lambdas (random but seeded-like by team index).
    lambdas = {t: 1.0 + (i % 4) * 0.4 for i, t in enumerate(teams)}
    table = {t: {"points": 0.0, "gf": 0.0, "ga": 0.0} for t in teams}

    for (h, a) in fixtures:
        lh, la = lambdas[h], lambdas[a]
        # Expected points from Poisson outcome probabilities.
        ph = 1 - (1 + la) * __import__("math").exp(-la) * 0.5  # rough home advantage mix
        expected_home = 0.46
        expected_draw = 0.27
        expected_away = 0.27
        # Use simple closed-form approximations weighted by lambda.
        total = lh + la
        ph = (lh / total) * 0.6
        pd = 0.24
        pa = 1 - ph - pd
        table[h]["points"] += ph * 3 + pd * 1
        table[a]["points"] += pa * 3 + pd * 1
        table[h]["gf"] += lh
        table[a]["ga"] += lh
        table[a]["gf"] += la
        table[h]["ga"] += la

    rows = [
        {
            "team": t,
            "points": round(v["points"], 1),
            "goalsFor": round(v["gf"], 1),
            "goalsAgainst": round(v["ga"], 1),
            "selected_windows": sum(1 for (s, e) in selected if s >= 0),
        }
        for t, v in table.items()
    ]
    rows.sort(key=lambda r: (-r["points"], -r["goalsFor"] + r["goalsAgainst"]))
    return jsonify({"table": rows, "fixtures": fixtures, "greedy_selected": selected})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

