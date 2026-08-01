const { expectedGoals } = require('./poisson');

/**
 * Monte Carlo match prediction.
 * Runs `simulations` random matches sampled from a Poisson distribution whose
 * lambda comes from team Elo strengths. Returns win/draw/loss probabilities
 * and expected goals.
 */
function monteCarloMatch(homeTeam, awayTeam, homeElo = 1500, awayElo = 1500, simulations = 10000) {
  const { home, away } = expectedGoals(homeElo, awayElo);
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalHomeGoals = 0;
  let totalAwayGoals = 0;

  for (let i = 0; i < simulations; i++) {
    const hg = poissonSample(home);
    const ag = poissonSample(away);
    totalHomeGoals += hg;
    totalAwayGoals += ag;
    if (hg > ag) homeWins++;
    else if (hg === ag) draws++;
    else awayWins++;
  }

  return {
    homeTeam,
    awayTeam,
    homeElo,
    awayElo,
    homeWin: homeWins / simulations,
    draw: draws / simulations,
    awayWin: awayWins / simulations,
    avgHomeGoals: totalHomeGoals / simulations,
    avgAwayGoals: totalAwayGoals / simulations,
    simulations,
  };
}

/**
 * Tournament simulation: run a round-robin (each team plays every other team
 * twice). Returns final standings (points, GD) and a champion probability.
 */
function simulateTournament(teams, simulations = 1000) {
  const elos = {};
  teams.forEach((t) => (elos[t] = 1500));
  const pairings = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairings.push([teams[i], teams[j]]);
      pairings.push([teams[j], teams[i]]); // home and away legs
    }
  }

  const championCount = {};
  teams.forEach((t) => (championCount[t] = 0));

  for (let s = 0; s < simulations; s++) {
    const points = {};
    const gf = {};
    const ga = {};
    teams.forEach((t) => {
      points[t] = 0;
      gf[t] = 0;
      ga[t] = 0;
    });
    for (const [home, away] of pairings) {
      const { homeGoals, awayGoals } = sampleMatchResult(elos[home], elos[away]);
      gf[home] += homeGoals;
      ga[home] += awayGoals;
      gf[away] += awayGoals;
      ga[away] += homeGoals;
      if (homeGoals > awayGoals) points[home] += 3;
      else if (homeGoals === awayGoals) {
        points[home] += 1;
        points[away] += 1;
      } else points[away] += 3;
    }
    const sorted = teams
      .map((t) => ({ team: t, points: points[t], gd: gf[t] - ga[t] }))
      .sort((a, b) => b.points - a.points || b.gd - a.gd);
    championCount[sorted[0].team]++;
  }

  const championProb = {};
  teams.forEach((t) => (championProb[t] = championCount[t] / simulations));

  // Expected points table (average over simulations).
  const avgPoints = {};
  const avgGF = {};
  const avgGA = {};
  teams.forEach((t) => {
    avgPoints[t] = 0;
    avgGF[t] = 0;
    avgGA[t] = 0;
  });
  for (let s = 0; s < simulations; s++) {
    const points = {};
    const gf = {};
    const ga = {};
    teams.forEach((t) => {
      points[t] = 0;
      gf[t] = 0;
      ga[t] = 0;
    });
    for (const [home, away] of pairings) {
      const { homeGoals, awayGoals } = sampleMatchResult(elos[home], elos[away]);
      gf[home] += homeGoals;
      ga[home] += awayGoals;
      gf[away] += awayGoals;
      ga[away] += homeGoals;
      if (homeGoals > awayGoals) points[home] += 3;
      else if (homeGoals === awayGoals) {
        points[home] += 1;
        points[away] += 1;
      } else points[away] += 3;
    }
    teams.forEach((t) => {
      avgPoints[t] += points[t];
      avgGF[t] += gf[t];
      avgGA[t] += ga[t];
    });
  }

  const table = teams
    .map((t) => ({
      team: t,
      points: avgPoints[t] / simulations,
      goalsFor: avgGF[t] / simulations,
      goalsAgainst: avgGA[t] / simulations,
      championProb: championProb[t],
    }))
    .sort((a, b) => b.points - a.points || b.championProb - a.championProb);

  return { table, championProb, simulations };
}

// --- internal helpers --------------------------------------------------------

function poissonSample(lambda) {
  // Knuth's algorithm.
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function sampleMatchResult(eloHome, eloAway) {
  const { home, away } = expectedGoals(eloHome, eloAway);
  return { homeGoals: poissonSample(home), awayGoals: poissonSample(away) };
}

module.exports = { monteCarloMatch, simulateTournament, poissonSample, sampleMatchResult };

