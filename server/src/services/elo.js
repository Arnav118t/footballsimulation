/**
 * Elo rating system.
 * Ratings start at 1500. K-factor controls how much a result moves the rating.
 */

const K_FACTOR = 32;
const START_RATING = 1500;

function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function updateElo(ratingA, ratingB, scoreA) {
  // scoreA: 1 = A wins, 0.5 = draw, 0 = A loses.
  const eA = expectedScore(ratingA, ratingB);
  const eB = 1 - eA;
  const newA = Math.round(ratingA + K_FACTOR * (scoreA - eA));
  const newB = Math.round(ratingB + K_FACTOR * (1 - scoreA - eB));
  return { home: newA, away: newB };
}

module.exports = { K_FACTOR, START_RATING, expectedScore, updateElo };

