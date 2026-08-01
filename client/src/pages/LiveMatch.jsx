import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api';

export default function LiveMatch() {
  const [socket, setSocket] = useState(null);
  const [teams, setTeams] = useState([]);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [speed, setSpeed] = useState(800);
  const [state, setState] = useState(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const stateRef = useRef(null);

  useEffect(() => {
    api.get('/matches/teams').then(({ data }) => setTeams(data.teams)).catch(() => {});
    const s = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
    });
    setSocket(s);

    s.on('match:tick', (st) => {
      stateRef.current = st;
      setState(st);
    });
    s.on('match:finished', (st) => {
      setState(st);
      setRunning(false);
    });
    s.on('match:started', (res) => {
      if (res.started) setRunning(true);
    });
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (state && state.events && state.events.length > 0) {
      const last = state.events[state.events.length - 1];
      setLog((prev) => [...prev.slice(-40), `${last.minute}' ${last.team === 'home' ? '🏠' : '✈️'} ${last.detail}${last.player ? ' — ' + last.player : ''}`]);
    }
  }, [state]);

  function startSim() {
    if (!home || !away || !socket) return;
    setLog([]);
    setState(null);
    const match = { homeTeam: home, awayTeam: away, id: `${Date.now()}` };
    socket.emit('match:start', { match, speed: Number(speed) });
  }

  function stopSim() {
    if (socket && state) socket.emit('match:stop', state.id);
    setRunning(false);
  }

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="card p-4">
          <h2 className="fw-bold"><i className="bi bi-broadcast me-2"></i>Live Simulator</h2>
          <p className="text-muted">Socket.IO real-time 90-minute simulation with tick events.</p>

          <label className="form-label">Home Team</label>
          <select className="form-select mb-3" value={home} onChange={(e) => setHome(e.target.value)}>
            <option value="">Select…</option>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <label className="form-label">Away Team</label>
          <select className="form-select mb-3" value={away} onChange={(e) => setAway(e.target.value)}>
            <option value="">Select…</option>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <label className="form-label">Tick Speed</label>
          <select className="form-select mb-3" value={speed} onChange={(e) => setSpeed(e.target.value)}>
            <option value="400">Fast (400ms)</option>
            <option value="800">Normal (800ms)</option>
            <option value="1500">Slow (1500ms)</option>
          </select>

          <div className="d-flex gap-2">
            <button className="btn btn-brand flex-fill" onClick={startSim} disabled={running || !home || !away}>
              <i className="bi bi-play-fill me-1"></i> Start
            </button>
            <button className="btn btn-outline-danger flex-fill" onClick={stopSim} disabled={!running}>
              <i className="bi bi-stop-fill me-1"></i> Stop
            </button>
          </div>
        </div>

        <div className="card p-3 mt-4">
          <h6 className="card-title mb-2">Event Feed</h6>
          <div className="overflow-auto" style={{ maxHeight: 320 }}>
            {log.length === 0 ? (
              <p className="text-muted mb-0 small">No events yet. Start a match.</p>
            ) : (
              <ul className="list-unstyled mb-0 small">
                {log.map((line, i) => (
                  <li key={i} className="border-bottom py-1">
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="card p-4 text-center">
          <h5 className="card-title mb-4">Scoreboard</h5>
          <div className="d-flex justify-content-center align-items-center gap-4 mb-3">
            <div className="text-end" style={{ minWidth: 160 }}>
              <div className="fs-4 fw-bold">{state?.homeTeam || home || '—'}</div>
            </div>
            <div className="fs-1 fw-bold">
              {state ? `${state.homeGoals} - ${state.awayGoals}` : '0 - 0'}
            </div>
            <div className="text-start" style={{ minWidth: 160 }}>
              <div className="fs-4 fw-bold">{state?.awayTeam || away || '—'}</div>
            </div>
          </div>

          {state && (
            <div className="mb-3">
              {state.status === 'finished' ? (
                <span className="badge text-bg-success fs-6">Full Time</span>
              ) : (
                <span className="badge badge-live fs-6">
                  {state.status === 'live' ? `LIVE · ${state.minute}'` : 'Waiting'}
                </span>
              )}
            </div>
          )}

          {!state && running && (
            <div className="text-muted">Waiting for first tick…</div>
          )}

          {!state && !running && (
            <p className="text-muted mb-0">Configure teams and press Start to run a live simulation.</p>
          )}

          {state && state.status === 'live' && (
            <div className="progress mt-3" style={{ height: 14 }}>
              <div
                className="progress-bar bg-success"
                style={{ width: `${(state.minute / 90) * 100}%` }}
              >
                {state.minute}'
              </div>
            </div>
          )}
        </div>

        {state && state.events?.length > 0 && (
          <div className="card p-3 mt-4">
            <h6 className="card-title mb-3">Match Timeline</h6>
            <div className="d-flex flex-wrap gap-2">
              {state.events.map((ev, i) => (
                <span
                  key={i}
                  className="badge rounded-pill text-bg-light text-dark"
                  title={`${ev.player || ''} ${ev.detail || ''}`}
                >
                  {ev.minute}' {ev.team === 'home' ? '🏠' : '✈️'} {ev.detail}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

