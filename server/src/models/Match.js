const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema(
  {
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    league: { type: String, default: 'Premier League' },
    homeGoals: { type: Number, default: 0 },
    awayGoals: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'finished'],
      default: 'scheduled',
    },
    minute: { type: Number, default: 0 },
    eloHome: { type: Number, default: 1500 },
    eloAway: { type: Number, default: 1500 },
    predictions: {
      homeWin: { type: Number, default: 0 },
      draw: { type: Number, default: 0 },
      awayWin: { type: Number, default: 0 },
      avgHomeGoals: { type: Number, default: 0 },
      avgAwayGoals: { type: Number, default: 0 },
    },
    events: [
      {
        minute: Number,
        team: String, // 'home' | 'away'
        type: String, // 'goal' | 'yellow' | 'red' | 'info'
        player: String,
        detail: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Match || mongoose.model('Match', MatchSchema);

