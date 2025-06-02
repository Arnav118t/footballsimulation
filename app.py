from flask import Flask, render_template, request
from huffman_module import save_huffman_plot, save_activity_plot, monte_carlo_prediction
import random

app = Flask(__name__)

players = ['Varane', 'Rashford', 'TAA', 'Fernand', 'Garnacho', 'Bruno',
           'Nunez', 'Salah', 'Diaz', 'MacAllister', 'Van Dijk', 'Casemiro']
teams = ["TeamA", "TeamB", "TeamC", "TeamD"]

@app.route("/")
def index():
    return render_template("front.html", players=players, teams=teams)

@app.route("/huffman", methods=["POST"])
def huffman():
    selected_player = request.form.get("player")
    freqs = {p: random.randint(1, 100) for p in players}
    codes = save_huffman_plot(freqs)
    code = codes.get(selected_player, "N/A") if selected_player else "N/A"
    return render_template("front.html", players=players, teams=teams,
                           selected_player=selected_player, code=code)

@app.route("/activities", methods=["POST"])
def activities():
    save_activity_plot()
    return render_template("activities.html")

@app.route("/predict", methods=["POST"])
def predict():
    home = request.form.get("home_team")
    away = request.form.get("away_team")
    prediction = monte_carlo_prediction(home, away)
    return render_template("predict.html", prediction=prediction)

if __name__ == "__main__":
    app.run(debug=True)
