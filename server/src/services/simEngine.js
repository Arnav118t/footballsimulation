const { sampleMatchResult } = require('./monteCarlo');

const PLAYER_POOL = [
  'Varane', 'Rashford', 'TAA', 'Fernand', 'Garnacho', 'Bruno',
  'Nunez', 'Salah', 'Diaz', 'MacAllister', 'Van Dijk', 'Casemiro',
];

const ACTION_LABELS = ['Goal', 'Yellow Card', 'Chance', 'Save', 'Corner', 'Free Kick', 'Offside', 'Shot on Target'];

/**
 * Real-time live match simulation engine.
 * Drives a 90-minute match forward with tick-based events and broadcasts
 * state over Socket.IO.
 */
class SimEngine {
  constructor(io) {
    this.io = io;
    this.active = new Map(); // matchId -> interval handle
  }

  startMatch(match, opts = {}) {
    const { speed = 1000, homeElo = 1500, awayElo = 1500 } = opts;
    const id = match._id ? String(match._id) : match.id;
    if (this.active.has(id)) return { started: false, message: 'Match already running.' };

    const state = {
      id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeGoals: 0,
      awayGoals: 0,
      minute: 0,
      events: [],
      status: 'live',
    };

    // Pre-sample the final scoreline so the simulation trends toward it.
    const target = sampleMatchResult(homeElo, awayElo);
    const homeGoalMinutes = this._spreadGoals(target.homeGoals, 90);
    const awayGoalMinutes = this._spreadGoals(target.awayGoals, 90);
    const goalClock = {};
    homeGoalMinutes.forEach((m) => {
      if (!goalClock[m]) goalClock[m] = [];
      goalClock[m].push('home');
    });
    awayGoalMinutes.forEach((m) => {
      if (!goalClock[m]) goalClock[m] = [];
      goalClock[m].push('away');
    });

    const tick = () => {
      state.minute += 1;
      if (state.minute > 90) {
        clearInterval(handle);
        this.active.delete(id);
        state.status = 'finished';
        this.io.to(`match:${id}`).emit('match:finished', state);
        this.io.emit('match:update', state);
        return;
      }

      // Goals scheduled this minute.
      if (goalClock[state.minute]) {
        goalClock[state.minute].forEach((team) => {
          state[team === 'home' ? 'homeGoals' : 'awayGoals'] += 1;
          const ev = {
            minute: state.minute,
            team,
            type: 'goal',
            player: PLAYER_POOL[Math.floor(Math.random() * PLAYER_POOL.length)],
            detail: '⚽ GOAL!',
          };
          state.events.push(ev);
        });
      } else if (Math.random() < 0.18) {
        // Random non-goal event (yellow, chance, save...)
        const team = Math.random() < 0.5 ? 'home' : 'away';
        const label = ACTION_LABELS[Math.floor(Math.random() * ACTION_LABELS.length)];
        state.events.push({
          minute: state.minute,
          team,
          type: label.toLowerCase().replace(/\s/g, '_'),
          player: PLAYER_POOL[Math.floor(Math.random() * PLAYER_POOL.length)],
          detail: label,
        });
      }

      this.io.to(`match:${id}`).emit('match:tick', state);
      this.io.emit('match:update', state);
    };

    const handle = setInterval(tick, speed);
    this.active.set(id, handle);

    this.io.to(`match:${id}`).emit('match:start', state);
    this.io.emit('match:update', state);
    return { started: true, state };
  }

  stopMatch(id) {
    if (this.active.has(id)) {
      clearInterval(this.active.get(id));
      this.active.delete(id);
      return { stopped: true };
    }
    return { stopped: false };
  }

  _spreadGoals(count, maxMinute = 90) {
    const minutes = [];
    for (let i = 0; i < count; i++) {
      minutes.push(1 + Math.floor(Math.random() * maxMinute));
    }
    return minutes.sort((a, b) => a - b);
  }
}

module.exports = SimEngine;

