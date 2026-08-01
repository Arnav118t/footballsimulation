const mongoose = require('mongoose');

const TeamStandingSchema = new mongoose.Schema({
  team: { type: String, required: true },
  played: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  goalsFor: { type: Number, default: 0 },
  goalsAgainst: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  elo: { type: Number, default: 1500 },
});

const TournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    teams: { type: [String], required: true },
    standings: { type: [TeamStandingSchema], default: [] },
    matches: { type: [Object], default: [] },
    status: { type: String, enum: ['draft', 'running', 'complete'], default: 'draft' },
    simulations: { type: Number, default: 10000 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

