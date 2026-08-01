# ⚽ Full-Stack Football Analytics Platform

> **React + Node.js + Flask + MongoDB**
> A modern, complete football data-simulation and analytics platform featuring
> **Poisson models**, **Elo ratings**, **Monte Carlo simulation (10,000+ runs)**,
> **real-time Socket.IO match simulation**, **JWT authentication**, and
> **interactive dashboards**.

---

## 🧠 What Is This Project?

A full-stack sports-analytics platform that turns classic Computer Science concepts
into a polished, production-shaped product. It's the story of a football match told
through **probability, greedy algorithms, and compression** — served over real APIs
with a real frontend.

| Algorithm / Concept | Where | What it does |
|---------------------|-------|--------------|
| **Huffman Coding** | `server/src/services/` + `utils/huffman_module.py` | Variable-length binary codes from frequencies (min-heap greedy compression) |
| **Activity Selection** | `activity.py` + `utils/plots.py` | Maximum non-overlapping interval scheduling |
| **Poisson Model** | `server/src/services/poisson.js` | Expected goals (λ) from Elo strength |
| **Elo Ratings** | `server/src/services/elo.js` | Team strength updating from match results |
| **Monte Carlo** | `server/src/services/monteCarlo.js` + `prediction.py` | 10,000+ simulated matches → win/draw/loss probabilities |
| **Real-time Simulation** | `server/src/services/simEngine.js` | Socket.IO tick-by-tick 90-minute live match engine |
| **JWT Auth** | `server/src/middleware/auth.js` | Secure register/login with bcrypt |
| **Dashboards** | `client/src/pages/` | Recharts visualizations (pie, bar, tables) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA (Vite)                          │
│  client/  · React 18 · React Router · Recharts · Socket.IO  │
│  Port 5173 · proxies /api -> 5001 and /socket.io -> 5001    │
└───────────────┬─────────────────────────────┬───────────────┘
                │ REST /api/*                 │ WebSocket /socket.io
┌───────────────▼─────────────────┐   ┌───────▼──────────────────┐
│  Node.js + Express API          │   │  Socket.IO Realtime      │
│  server/  · JWT · bcrypt        │   │  SimEngine (live match)  │
│  Port 5001                       │   └────────────────────────┘
└───────────────┬─────────────────┘
                │ Mongoose (optional) / JSON file store (default)
┌───────────────▼─────────────────┐
│  MongoDB (opt.) / server/data/  │
│  db.json fallback               │
└───────────────┬─────────────────┘
┌───────────────▼─────────────────┐
│  Flask Analytics Microservice   │
│  flask_service.py · prediction  │
│  Port 5000                       │
└─────────────────────────────────┘
```

**Data flow:** React calls the Node REST API for predictions, tournament forecasts,
auth, and persisted matches. Socket.IO pushes live match ticks to the Live page.
Flask serves an additional analytics microservice (`/api/flask/*`) built on the
original `prediction.py` / `activity.py` modules.

---

## 📁 Project Structure

```
datasimulation/
│
├── package.json               # Root orchestration (concurrently runs all 3 services)
├── README.md                  # This file
│
├── server/                    # ── Node.js + Express + Socket.IO ──
│   ├── package.json
│   ├── .env                   # PORT, JWT_SECRET, MONGO_URI, CLIENT_ORIGIN
│   ├── data/                  # JSON file store (db.json) auto-created
│   └── src/
│       ├── index.js           # Entry: express + socket.io + routes
│       ├── config/db.js       # Mongo ↔ JSON file store auto-fallback
│       ├── middleware/auth.js # JWT verify + sign
│       ├── models/            # User, Match, Tournament (Mongoose schemas)
│       ├── routes/            # auth, match, tournament routers
│       └── services/
│           ├── poisson.js     # Poisson PMF + Elo→expected goals
│           ├── elo.js         # Elo rating update
│           ├── monteCarlo.js  # Match + tournament simulation
│           └── simEngine.js   # Real-time 90-min match engine
│
├── client/                    # ── React (Vite) SPA ──
│   ├── package.json
│   ├── vite.config.js         # dev server + API/WS proxy
│   ├── index.html
│   └── src/
│       ├── main.jsx / App.jsx / index.css
│       ├── api.js             # axios instance (JWT interceptor)
│       ├── authContext.jsx    # React auth state
│       └── pages/
│           ├── Dashboard.jsx  # Charts + stats + recent predictions
│           ├── Predict.jsx    # Monte Carlo match predictor
│           ├── Tournament.jsx # Round-robin season forecaster
│           ├── LiveMatch.jsx  # Socket.IO live sim viewer
│           └── Login.jsx      # JWT login / register
│
├── flask_service.py           # ── Flask analytics microservice (port 5000) ──
├── prediction.py              # Monte Carlo (Poisson) match predictor
├── activity.py                # Greedy activity-selection algorithm
├── app.py                     # Original Flask demo (Huffman/Activities/Predict)
├── FOOTBALL_SIMUlation.py     # Original Tkinter desktop app
│
├── utils/                     # Reusable Python helpers
│   ├── __init__.py
│   ├── helper.py              # generate_random_frequencies
│   ├── huffman_module.py      # Huffman Node/build_tree/generate_codes/encode/decode
│   └── plots.py               # plot_huffman_tree
│
├── data/
│   ├── match_data.csv         # Small CSV used by prediction.py
│   └── full_data.csv          # ~96k rows of real Championship 2010-11 stats
│
├── templates/front.html       # Original Flask base layout
└── FIFA-21 Complete.csv.zip   # Bonus FIFA-21 player dataset (unused)
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18 (tested on v24)
- **Python** ≥ 3.9 (tested on 3.14)
- **MongoDB** *(optional)* — if not installed, the server automatically falls back
  to a JSON file store, so the project runs **fully offline**.

### One-command setup
```powershell
# from the project root
npm install                 # installs root concurrently package
npm --prefix server install
npm --prefix client install
python -m pip install flask flask-cors pandas numpy matplotlib
```

### Run everything
```powershell
npm run dev
```
This runs (via `concurrently`):
| Service | Port | URL |
|---------|------|-----|
| **React client** | 5173 | http://localhost:5173 |
| **Node API + Socket.IO** | 5001 | http://localhost:5001/api/health |
| **Flask microservice** | 5000 | http://localhost:5000/api/flask/health |

> Or run each in its own terminal:
> - `npm --prefix server run dev`
> - `npm --prefix client run dev`
> - `python flask_service.py`

---

## 🔐 Auth (JWT)

- `POST /api/auth/register` `{username, email, password}` → `{token, user}`
- `POST /api/auth/login` `{username, password}` → `{token, user}`
- `GET /api/auth/me` (Bearer token) → current user
- Passwords hashed with **bcryptjs** (10 salt rounds). Tokens expire in 7 days.

---

## 🌐 API Reference

### Node.js API — `http://localhost:5001/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health |
| GET | `/matches` | List saved matches |
| GET | `/matches/teams` | Available teams |
| POST | `/matches/predict` | `{home, away, homeElo?, awayElo?, simulations?}` → probabilities |
| POST | `/matches` | Create + auto-predict a match |
| POST | `/matches/:id/finish` | Apply a real result, update Elo |
| GET | `/tournaments` | List tournaments |
| POST | `/tournaments` | `{name, teams[], simulations?}` create |
| POST | `/tournaments/:id/simulate` | Run season forecast |

### Flask microservice — `http://localhost:5000/api/flask`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/teams` | Team list |
| POST | `/predict` | `{home, away, simulations?}` Poisson Monte Carlo |
| POST | `/tournament` | `{teams[]}` expected standings + greedy selection |

### Sample predict response
```json
{
  "homeTeam": "Liverpool",
  "awayTeam": "Arsenal",
  "homeWin": 0.471,
  "draw": 0.273,
  "awayWin": 0.256,
  "avgHomeGoals": 1.82,
  "avgAwayGoals": 1.31,
  "simulations": 10000
}
```

---

## 📡 Real-Time Simulation (Socket.IO)

Events (on `http://localhost:5001`):

| Event | Direction | Payload |
|-------|-----------|---------|
| `match:start` | client → server | `{match, speed, homeElo, awayElo}` |
| `match:started` | server → client | `{started, state}` |
| `match:tick` | server → client | live match state (minute, score, events) |
| `match:finished` | server → client | final state |
| `match:update` | server → client | broadcast to all |
| `match:join` | client → server | join a match room |
| `match:stop` | client → server | stop a running match |

---

## 🧮 Algorithms (Deep Dive)

### Poisson Model — `poisson.js`
Goals are modeled as a Poisson process. `expectedGoals(eloA, eloB)` converts Elo
win-expectancy into a λ for each team, then `poissonPMF(k, λ)` gives the probability
of exactly *k* goals.

### Monte Carlo — `monteCarlo.js`
`monteCarloMatch()` runs **N=10,000+** random matches:
1. Sample `homeGoals ~ Poisson(λ_h)`, `awayGoals ~ Poisson(λ_a)` (Knuth's algorithm).
2. Tally home win / draw / away win.
3. Return normalized probabilities + expected goals.

`simulateTournament()` runs a double round-robin N times and averages points,
goal difference, and **champion probability** per team.

### Elo — `elo.js`
`updateElo(ratingA, ratingB, scoreA)` with K=32:
```
E_A = 1 / (1 + 10^((R_B - R_A)/400))
R_A' = R_A + K * (score_A - E_A)
```

### Greedy Activity Selection — `activity.py`
Sorts intervals by end time, then greedily picks non-overlapping actions — the
coach's "maximum compatible actions" problem.

### Huffman Coding — `utils/huffman_module.py`
Min-heap + binary tree → optimal prefix-free codes where frequent players get
shorter codes.

---

## 📊 The Datasets

- **`data/match_data.csv`** — small hand-built CSV (`team,team_goals`) used by `prediction.py`.
- **`data/full_data.csv`** — ~96,000 rows of real English Championship 2010–11
  match statistics: scores, odds, possession, shots, cards, corners, event timelines.
- **`FIFA-21 Complete.csv.zip`** — FIFA-21 player attributes (bonus, unused).

---

## ⚠️ Known Notes

- MongoDB is **optional**. Set `MONGO_URI` in `server/.env` to use it; otherwise the
  JSON file store at `server/data/db.json` persists data automatically.
- `app.py` (original demo) references templates that aren't all present — the new
  platform uses the React client instead, so this is not an issue for the main flow.
- `test.csv.py` uses a hardcoded absolute path.

---

## 🔮 Possible Extensions

- Add a real ML model (XGBoost / Logistic Regression) trained on `full_data.csv`.
- Dockerize (`Dockerfile` + `docker-compose.yml` with mongo service).
- Add betting-odds comparison against predicted probabilities.
- Add player-level analytics using the FIFA-21 dataset.

---

*Made with ❤️ for CSE Project · Football Analytics Platform*

