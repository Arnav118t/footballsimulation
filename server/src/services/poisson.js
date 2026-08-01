/**
 * Poisson distribution helpers.
 * Goals in football follow a Poisson distribution: rare, independent events
 * occurring at a constant average rate lambda (λ).
 */

function poissonPMF(k, lambda) {
  // P(X = k) = e^-λ * λ^k / k!
  let result = Math.exp(-lambda) * Math.pow(lambda, k);
  for (let i = 2; i <= k; i++) result /= i;
  return result;
}

function expectedGoals(eloA, eloB, homeAdvantage = 55, totalAvg = 2.7) {
  // Win expectancy from Elo.
  const we = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  // Scale to a plausible match expectation between 0.4 and 3.2 goals.
  const base = 0.4 + we * 2.8;
  const strength = (base * totalAvg) / 2.7;
  const homeBoost = strength + (homeAdvantage - 50) / 25;
  return {
    home: Math.max(0.2, homeBoost),
    away: Math.max(0.2, 2 * strength - homeBoost),
  };
}

module.exports = { poissonPMF, expectedGoals };

