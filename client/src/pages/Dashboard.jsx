import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api';

const PIE_COLORS = ['#4dd0e1', '#ced4da', '#ff8a65'];

export default function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/matches').then(({ data }) => {
      setMatches(data);
      setStats(computeStats(data));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function computeStats(list) {
    const totals = { predicted: 0, homeWins: 0, draws: 0, awayWins: 0, avgGoals: 0 };
    const homeHisto = { '0-1': 0, '2': 0, '3': 0, '4+': 0 };
    list.forEach((m) => {
      const p = m.predictions;
      if (!p) return;
      totals.predicted++;
      if (p.homeWin >= p.draw && p.homeWin >= p.awayWin) totals.homeWins++;
      else if (p.awayWin >= p.homeWin && p.awayWin >= p.draw) totals.awayWins++;
      else totals.draws++;
      totals.avgGoals += (p.avgHomeGoals || 0) + (p.avgAwayGoals || 0);
      const total = Math.round((p.avgHomeGoals || 0) + (p.avgAwayGoals || 0));
      if (total <= 1) homeHisto['0-1']++;
      else if (total === 2) homeHisto['2']++;
      else if (total === 3) homeHisto['3']++;
      else homeHisto['4+']++;
    });
    totals.avgGoals = list.length ? totals.avgGoals / list.length : 0;
    return { ...totals, homeHisto, count: list.length };
  }

  const outcomePie = stats
    ? [
        { name: 'Home Win', value: stats.homeWins },
        { name: 'Draw', value: stats.draws },
        { name: 'Away Win', value: stats.awayWins },
      ]
    : [];

  const goalBars = stats
    ? Object.entries(stats.homeHisto).map(([range, count]) => ({ range, count }))
    : [];

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>;
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <h2 className="fw-bold"><i className="bi bi-speedometer2 me-2"></i>Analytics Dashboard</h2>
        <p className="text-muted">
          Aggregate view of Monte Carlo predictions, outcome distribution and expected goal ranges.
        </p>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="stat-card">
          <div className="stat-value">{stats?.count ?? 0}</div>
          <div className="stat-label">Predicted Matches</div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="stat-card">
          <div className="stat-value">{stats?.avgGoals?.toFixed(2) ?? '—'}</div>
          <div className="stat-label">Avg Expected Goals</div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="stat-card">
          <div className="stat-value text-warning">{stats?.homeWins ?? 0}</div>
          <div className="stat-label">Favorite = Home</div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="stat-card">
          <div className="stat-value">{stats?.matches ? '' : matches.length}</div>
          <div className="stat-label">Saved Matches</div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card p-3 h-100">
          <h5 className="card-title mb-3">Outcome Distribution</h5>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={outcomePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {outcomePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ background: '#203a43', border: 'none', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card p-3 h-100">
          <h5 className="card-title mb-3">Expected Total Goals Range</h5>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={goalBars}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="range" stroke="#adb5bd" />
              <YAxis allowDecimals={false} stroke="#adb5bd" />
              <Tooltip contentStyle={{ background: '#203a43', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#ffc107" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-12">
        <div className="card p-3">
          <h5 className="card-title mb-3">Recent Predictions</h5>
          {matches.length === 0 ? (
            <p className="text-muted mb-0">No matches yet. Go to <b>Predict</b> to create one.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Home Win</th>
                    <th>Draw</th>
                    <th>Away Win</th>
                    <th>xG (Home)</th>
                    <th>xG (Away)</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.slice(0, 10).map((m) => (
                    <tr key={m._id || m.id}>
                      <td className="fw-semibold">{m.homeTeam} vs {m.awayTeam}</td>
                      <td>{(m.predictions?.homeWin * 100).toFixed(1)}%</td>
                      <td>{(m.predictions?.draw * 100).toFixed(1)}%</td>
                      <td>{(m.predictions?.awayWin * 100).toFixed(1)}%</td>
                      <td>{m.predictions?.avgHomeGoals?.toFixed(2)}</td>
                      <td>{m.predictions?.avgAwayGoals?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

