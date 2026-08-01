const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken, authRequired } = require('../middleware/auth');
const { getState, readDB, writeDB } = require('../config/db');

const router = express.Router();

async function findByUsername(username) {
  if (getState().mode === 'mongo') {
    return User.findOne({ username });
  }
  const db = readDB();
  return db.users.find((u) => u.username === username) || null;
}

async function createUser(username, email, passwordHash) {
  if (getState().mode === 'mongo') {
    return User.create({ username, email, passwordHash });
  }
  const db = readDB();
  const user = { id: Date.now().toString(), username, email, passwordHash };
  db.users.push(user);
  writeDB(db);
  return user;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required.' });
    }
    const existing = await findByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(username, email, passwordHash);
    const token = signToken({ id: user.id || user._id, username: user.username });
    res.status(201).json({
      token,
      user: { id: user.id || user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required.' });
    }
    const user = await findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = signToken({ id: user.id || user._id, username: user.username });
    res.json({
      token,
      user: { id: user.id || user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

