const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

/**
 * Seamless persistence layer.
 * - If MONGO_URI is set AND reachable -> Mongo + Mongoose models.
 * - Otherwise -> lightweight JSON file store (db.json) so the app always runs.
 */
const state = {
  mode: 'file', // 'file' | 'mongo'
  mongo: false,
  file: false,
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function initFileStore() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ users: [], matches: [], tournaments: [] }, null, 2)
    );
  }
  state.file = true;
  state.mode = 'file';
  console.log('[db] Using JSON file store ->', DB_FILE);
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

async function connectDB() {
  const uri = process.env.MONGO_URI || '';
  initFileStore();

  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      state.mongo = true;
      state.mode = 'mongo';
      console.log('[db] Connected to MongoDB');
    } catch (err) {
      console.warn('[db] MongoDB unreachable -> falling back to JSON store:', err.message);
      state.mongo = false;
      state.mode = 'file';
    }
  }
  return state;
}

module.exports = { connectDB, readDB, writeDB, getState: () => state };

