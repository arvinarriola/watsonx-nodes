// Load .env for local development — Railway injects env vars directly, so this is a no-op in production
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');

const authRoutes         = require('./routes/auth');
const nodeRoutes         = require('./routes/nodes');
const updateRoutes       = require('./routes/updates');
const updateActionRoutes = require('./routes/updateActions');
const subscriptionRoutes = require('./routes/subscriptions');
const botRoutes          = require('./routes/bot');

require('./jobs/scheduler');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://watsonx-nodes.vercel.app',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/nodes',         nodeRoutes);
app.use('/api/nodes',         updateRoutes);
app.use('/api/nodes',         subscriptionRoutes);
app.use('/api/updates',       updateActionRoutes);
app.use('/api/bot',           botRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
