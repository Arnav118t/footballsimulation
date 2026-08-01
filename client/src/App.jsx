import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './authContext';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import Tournament from './pages/Tournament';
import LiveMatch from './pages/LiveMatch';
import Login from './pages/Login';

function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow">
      <div className="container-fluid">
        <NavLink className="navbar-brand fw-bold" to="/">
          <i className="bi bi-controller me-2"></i>Football Analytics
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                <i className="bi bi-speedometer2 me-1"></i> Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/predict">
                <i className="bi bi-graph-up me-1"></i> Predict
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/tournament">
                <i className="bi bi-trophy me-1"></i> Tournament
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/live">
                <i className="bi bi-broadcast me-1"></i> Live
              </NavLink>
            </li>
          </ul>
          <ul className="navbar-nav ms-auto">
            {user ? (
              <>
                <li className="nav-item">
                  <span className="nav-link text-warning">
                    <i className="bi bi-person-circle me-1"></i>{user.username}
                  </span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-light btn-sm mt-1" onClick={logout}>
                    <i className="bi bi-box-arrow-right me-1"></i>Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <NavLink className="nav-link" to="/login">
                  <i className="bi bi-key me-1"></i> Login
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-vh-100 d-flex flex-column">
        <Navbar />
        <div className="container-fluid py-4 flex-grow-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/tournament" element={<Tournament />} />
            <Route path="/live" element={<LiveMatch />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
        <footer className="text-center py-3 text-muted border-top">
          © 2025 Football Analytics Platform · Poisson · Elo · Monte Carlo · React + Node + Flask + MongoDB
        </footer>
      </div>
    </AuthProvider>
  );
}

