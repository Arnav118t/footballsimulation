require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const matchRoutes = require('./routes/match.routes');
const tournamentRoutes = require('./routes/tournament.routes');
const SimEngine = require('./services/simEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'football-analytics-server', time: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/tournaments', tournamentRoutes);

// Realtime engine
const simEngine = new SimEngine(io);

io.on('connection', (socket) => {
  console.log('[socket] client connected:', socket.id);
  socket.on('match:join', (matchId) => {
    if (matchId) socket.join(`match:${matchId}`);
  });
  socket.on('match:start', (data) => {
    const match = data.match || {};
    const result = simEngine.startMatch(match, {
      speed: data.speed || 1000,
      homeElo: data.homeElo || 1500,
      awayElo: data.awayElo || 1500,
    });
    socket.emit('match:started', result);
  });
  socket.on('match:stop', (matchId) => {
    simEngine.stopMatch(matchId);
  });
  socket.on('disconnect', () => {
    console.log('[socket] client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n⚽ Football Analytics Server`);
    console.log(`   REST API   -> http://localhost:${PORT}/api`);
    console.log(`   Socket.IO  -> ws://localhost:${PORT}\n`);
  });
});

