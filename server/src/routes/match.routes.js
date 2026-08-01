const express = require('express');
const Match = require('../models/Match');
const { monteCarloMatch } = require('../services/monteCarlo');
const { updateElo } = require('../services/elo');
const { getState, readDB, writeDB } = require('../config/db');

const router = express.Router();

const DEFAULT_TEAMS = ['TeamA', 'TeamB', 'TeamC', 'TeamD', 'Liverpool', 'Manchester United', 'Arsenal', 'Chelsea'];

async function listMatches() {
  if (getState().mode === 'mongo') {
    return Match.find().sort({ createdAt: -1 });
  }
  const db = readDB();
  return [...db.matches].reverse();
}

async function findMatch(id) {
  if (getState().mode === 'mongo') {
    return Match.findById(id);
  }
  const db = readDB();
  return db.matches.find((m) => m.id === id) || null;
}

async function saveMatch(matchObj) {
  if (getState().mode === 'mongo') {
    const doc = new Match(matchObj);
    await doc.save();
    return doc;
  }
  const db = readDB();
  const record = { id: Date.now().toString(), ...matchObj };
  db.matches.push(record);
  writeDB(db);
  return record;
}

async function patchMatch(id, patch) {
  if (getState().mode === 'mongo') {
    return Match.findByIdAndUpdate(id, patch, { new: true });
  }
  const db = readDB();
  const idx = db.matches.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  db.matches[idx] = { ...db.matches[idx], ...patch };
  writeDB(db);
  return db.matches[idx];
}

// GET /api/matches
router.get('/', async (req, res) => {
  try {
    const matches = await listMatches();
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches/predict
router.post('/predict', (req, res) => {
  try {
    const { home, away, homeElo = 1500, awayElo = 1500, simulations = 10000 } = req.body || {};
    if (!home || !away) {
      return res.status(400).json({ error: 'home and away are required.' });
    }
    if (home === away) {
      return res.status(400).json({ error: 'Home and away teams must differ.' });
    }
    const result = monteCarloMatch(home, away, homeElo, awayElo, simulations);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches (create + auto-predict)
router.post('/', async (req, res) => {
  try {
    const { homeTeam, awayTeam, homeElo = 1500, awayElo = 1500 } = req.body || {};
    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ error: 'homeTeam and awayTeam are required.' });
    }
    const prediction = monteCarloMatch(homeTeam, awayTeam, homeElo, awayElo, 10000);
    const match = await saveMatch({
      homeTeam,
      awayTeam,
      homeElo,
      awayElo,
      status: 'scheduled',
      minute: 0,
      predictions: {
        homeWin: prediction.homeWin,
        draw: prediction.draw,
        awayWin: prediction.awayWin,
        avgHomeGoals: prediction.avgHomeGoals,
        avgAwayGoals: prediction.avgAwayGoals,
      },
      events: [],
    });
    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches/:id/finish (apply Elo after a real result)
router.post('/:id/finish', async (req, res) => {
  try {
    const match = await findMatch(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found.' });
    const homeGoals = Number(req.body?.homeGoals ?? match.homeGoals ?? 0);
    const awayGoals = Number(req.body?.awayGoals ?? match.awayGoals ?? 0);
    const scoreA = homeGoals > awayGoals ? 1 : homeGoals === awayGoals ? 0.5 : 0;
    const newElo = updateElo(match.homeElo || 1500, match.awayElo || 1500, scoreA);
    const updated = await patchMatch(req.params.id, {
      homeGoals,
      awayGoals,
      status: 'finished',
      eloHome: newElo.home,
      eloAway: newElo.away,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/teams
router.get('/teams', (req, res) => {
  res.json({ teams: DEFAULT_TEAMS });
});

module.exports = router;

