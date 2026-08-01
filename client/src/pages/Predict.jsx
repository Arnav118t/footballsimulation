import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Predict() {
  const [teams, setTeams] = useState([]);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [simulations, setSimulations] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/matches/teams').then(({ data }) => setTeams(data.teams)).catch(() => {});
  }, []);

  async function handlePredict(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/matches/predict', {
        home, away, simulations: Number(simulations),
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      await api.post('/matches', { homeTeam: home, awayTeam: away });
      alert('Match saved to dashboard!');
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed.');
    }
  }

  return (
    <div className="row g-4 justify-content-center">
      <div className="col-lg-8">
        <div className="card p-4">
          <h2 className="fw-bold"><i className="bi bi-graph-up me-2"></i>Monte Carlo Match Predictor</h2>
          <p className="text-muted">
            10,000+ Poisson-sampled simulations based on team Elo strength. Pick two teams and fire.
          </p>

          <form onSubmit={handlePredict} className="row g-3 mt-1">
            <div className="col-md-4">
              <label className="form-label">Home Team</label>
              <select className="form-select" value={home} onChange={(e) => setHome(e.target.value)} required>
                <option value="">Select…</option>
                {teams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Away Team</label>
              <select className="form-select" value={away} onChange={(e) => setAway(e.target.value)} required>
                <option value="">Select…</option>
                {teams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Simulations</label>
              <select className="form-select" value={simulations} onChange={(e) => setSimulations(e.target.value)}>
                <option value="1000">1,000</option>
                <option value="10000">10,000</option>
                <option value="50000">50,000</option>
              </select>
            </div>
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-brand px-4" disabled={loading || !home || !away}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Simulating…</>
                ) : (
                  <><i className="bi bi-calculator me-2"></i>Predict</>
                )}
              </button>
              {result && (
                <button type="button" className="btn btn-outline-warning px-4" onClick={handleSave}>
                  <i className="bi bi-bookmark-plus me-2"></i>Save Match
                </button>
              )}
            </div>
          </form>

          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

          {result && (
            <div className="mt-4">
              <h5 className="mb-3">
                {result.homeTeam} vs {result.awayTeam}
                <span className="badge text-bg-secondary ms-2">{result.simulations.toLocaleString()} sims</span>
              </h5>

              <div className="prob-bar mb-2">
                <div className="prob-home" style={{ width: `${result.homeWin * 100}%` }}></div>
                <div className="prob-draw" style={{ width: `${result.draw * 100}%` }}></div>
                <div className="prob-away" style={{ width: `${result.awayWin * 100}%` }}></div>
              </div>

              <div className="row text-center g-3 mt-1">
                <div className="col-md-4">
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#4dd0e1' }}>
                      {(result.homeWin * 100).toFixed(1)}%
                    </div>
                    <div className="stat-label">Home Win ({result.homeTeam})</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#ced4da' }}>
                      {(result.draw * 100).toFixed(1)}%
                    </div>
                    <div className="stat-label">Draw</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#ff8a65' }}>
                      {(result.awayWin * 100).toFixed(1)}%
                    </div>
                    <div className="stat-label">Away Win ({result.awayTeam})</div>
                  </div>
                </div>
              </div>

              <div className="row text-center g-3 mt-2">
                <div className="col-md-6">
                  <div className="stat-card">
                    <div className="stat-value">{result.avgHomeGoals.toFixed(2)}</div>
                    <div className="stat-label">Expected Goals — {result.homeTeam}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="stat-card">
                    <div className="stat-value">{result.avgAwayGoals.toFixed(2)}</div>
                    <div className="stat-label">Expected Goals — {result.awayTeam}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

