from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from utils.huffman_module import build_tree, generate_codes
from activity import generate_activities, select_activities
from prediction import monte_carlo_match
from utils.helper import generate_random_frequencies

app = Flask(__name__)
app.secret_key = 'super_secret_key'

players = ['Varane', 'Rashford', 'TAA', 'Fernand', 'Garnacho', 'Bruno',
           'Nunez', 'Salah', 'Diaz', 'MacAllister', 'Van Dijk', 'Casemiro']

# Store Huffman codes in memory (temporary)
huffman_codes = {}

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/huffman', methods=['GET', 'POST'])
def huffman():
    global huffman_codes
    freqs = generate_random_frequencies(players)
    root = build_tree(freqs)
    codes = generate_codes(root)
    huffman_codes = codes
    return render_template('huffman.html', players=players, codes=codes)

@app.route('/huffman/get_code', methods=['POST'])
def get_code():
    data = request.get_json()
    player = data.get('player')
    code = huffman_codes.get(player, "N/A")
    return jsonify({'code': code})

@app.route('/activities')
def activities():
    acts = generate_activities()
    selected = select_activities(acts)
    act_labels = [
        "Pass", "Dribble", "Tackle", "Shoot",
        "Cross", "Intercept", "Clearance", "Header"
    ]
    labeled_acts = []
    for i, (s, e) in enumerate(acts):
        label = act_labels[i % len(act_labels)]
        labeled_acts.append({
            "label": label,
            "start": s,
            "end": e,
            "selected": (s, e) in selected
        })
    return render_template('activities.html', activities=labeled_acts)

@app.route('/predict', methods=['GET', 'POST'])
def predict():
    if request.method == 'POST':
        data = request.get_json()
        home = data.get('home')
        away = data.get('away')
        try:
            result = monte_carlo_match(home, away)
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return render_template("predict.html")

@app.route('/login')
def login():
    session['username'] = "demo_user"
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
