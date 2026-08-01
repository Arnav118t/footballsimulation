import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';

const POOL = ['Liverpool', 'Manchester United', 'Arsenal', 'Chelsea', 'Man City', 'Tottenham', 'Newcastle', 'Aston Villa'];

export default function Tournament() {
  const [tournaments, setTournaments] = useState([]);
  const [name, setName] = useState('');
  const [teams, setTeams] = useState([]);
  const [sims, setSims] = useState(1000);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api.get('/tournaments').then(({ data }) => setTournaments(data)).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  function toggleTeam(t) {
    setTeams((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function createAndSimulate() {
    setBusy(true);
    setResult(null);
    try {
      const { data: created } = await api.post('/tournaments', { name, teams, simulations: sims });
      const { data } = await api.post(`/tournaments/${created._id || created.id}/simulate`);
      setResult(data);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Tournament simulation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <div className="card p-4">
          <h2 className="fw-bold"><i className="bi bi-trophy me-2"></i>Tournament Forecaster</h2>
          <p className="text-muted">
            Round-robin double leg, 1,000+ season simulations with Poisson scorelines, Elo-weighted.
          </p>

          <label className="form-label mt-2">Tournament Name</label>
          <input
            className="form-control mb-3"
            placeholder="e.g. Champions League 2025"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="form-label">Teams (pick at least 2)</label>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {POOL.map((t) => (
              <button
                key={t}
                type="button"
                className={`btn btn-sm ${teams.includes(t) ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                onClick={() => toggleTeam(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <label className="form-label">Season Simulations</label>
          <select className="form-select mb-3" value={sims} onChange={(e) => setSims(e.target.value)}>
            <option value="500">500</option>
            <option value="1000">1,000</option>
            <option value="5000">5,000</option>
          </select>

          <button className="btn btn-brand px-4" disabled={busy || teams.length < 2} onClick={createAndSimulate}>
            {busy ? <><span className="spinner-border spinner-border-sm me-2"></span>Simulating…</> : (
              <><i className="bi bi-magic me-2"></i>Create & Simulate</>
            )}
          </button>
        </div>

        {tournaments.length > 0 && (
          <div className="card p-3 mt-4">
            <h6 className="card-title mb-2">Saved Tournaments</h6>
            <ul className="list-unstyled mb-0">
              {tournaments.map((t) => (
                <li key={t._id || t.id} className="d-flex justify-content-between border-bottom py-2">
                  <span>{t.name}</span>
                  <span className={`badge ${t.status === 'complete' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                    {t.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="col-lg-7">
        {result ? (
          <>
            <div className="card p-4">
              <h5 className="card-title mb-3">Expected Standings — {result.simulations.toLocaleString()} seasons</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>#</th><th>Team</th><th>Pts</th><th>GF</th><th>GA</th><th>Champion %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.table.map((row, i) => (
                      <tr key={row.team}>
                        <td>{i + 1}</td>
                        <td className="fw-semibold">{row.team}</td>
                        <td>{row.points.toFixed(1)}</td>
                        <td>{row.goalsFor.toFixed(1)}</td>
                        <td>{row.goalsAgainst.toFixed(1)}</td>
                        <td>
                          <span className="badge text-bg-warning">
                            {(row.championProb * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-3 mt-4">
              <h6 className="card-title mb-3">Champion Probability</h6>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={result.table}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="team" stroke="#adb5bd" />
                  <YAxis stroke="#adb5bd" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip contentStyle={{ background: '#203a43', border: 'none', borderRadius: 8 }} />
                  <Bar dataKey="championProb" fill="#ffc107" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="card p-4 text-center text-muted">
            <i className="bi bi-trophy display-4 d-block mb-3"></i>
            <p className="mb-0">Configure a tournament on the left, then run the forecast.</p>
          </div>
        )}
      </div>
    </div>
  );
}

