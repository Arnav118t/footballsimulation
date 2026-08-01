const express = require('express');
const Tournament = require('../models/Tournament');
const { simulateTournament } = require('../services/monteCarlo');
const { getState, readDB, writeDB } = require('../config/db');

const router = express.Router();

async function listTournaments() {
  if (getState().mode === 'mongo') {
    return Tournament.find().sort({ createdAt: -1 });
  }
  const db = readDB();
  return [...db.tournaments].reverse();
}

async function findTournament(id) {
  if (getState().mode === 'mongo') {
    return Tournament.findById(id);
  }
  const db = readDB();
  return db.tournaments.find((t) => t.id === id) || null;
}

async function saveTournament(obj) {
  if (getState().mode === 'mongo') {
    const doc = new Tournament(obj);
    await doc.save();
    return doc;
  }
  const db = readDB();
  const record = { id: Date.now().toString(), ...obj };
  db.tournaments.push(record);
  writeDB(db);
  return record;
}

async function patchTournament(id, patch) {
  if (getState().mode === 'mongo') {
    return Tournament.findByIdAndUpdate(id, patch, { new: true });
  }
  const db = readDB();
  const idx = db.tournaments.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  db.tournaments[idx] = { ...db.tournaments[idx], ...patch };
  writeDB(db);
  return db.tournaments[idx];
}

// GET /api/tournaments
router.get('/', async (req, res) => {
  try {
    res.json(await listTournaments());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tournaments  { name, teams, simulations }
router.post('/', async (req, res) => {
  try {
    const { name, teams, simulations = 1000 } = req.body || {};
    if (!name || !Array.isArray(teams) || teams.length < 2) {
      return res.status(400).json({ error: 'name and a teams array (>=2) are required.' });
    }
    const t = await saveTournament({
      name,
      teams,
      simulations,
      status: 'running',
      standings: teams.map((team) => ({
        team,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        elo: 1500,
      })),
    });
    res.status(201).json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tournaments/:id/simulate
router.post('/:id/simulate', async (req, res) => {
  try {
    const t = await findTournament(req.params.id);
    if (!t) return res.status(404).json({ error: 'Tournament not found.' });
    const result = simulateTournament(t.teams, t.simulations || 1000);
    const updated = await patchTournament(req.params.id, {
      status: 'complete',
      standings: result.table,
      matches: t.matches || [],
    });
    res.json({ ...updated, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

