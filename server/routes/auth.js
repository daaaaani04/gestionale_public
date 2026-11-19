const express = require('express');
const rateLimit = require('express-rate-limit');
const { authEnabled, isAuthenticated, makeToken, checkPin } = require('../auth');

const router = express.Router();

// Massimo 10 tentativi ogni 15 minuti per IP, per rendere inutile un attacco a forza bruta sul PIN
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppi tentativi, riprova tra qualche minuto' },
});

// GET /api/auth/status — il client capisce se serve il PIN e se è già autenticato
router.get('/status', (req, res) => {
  res.json({ required: authEnabled, authenticated: isAuthenticated(req) });
});

// POST /api/auth/login { pin } -> { token }
router.post('/login', loginLimiter, (req, res) => {
  if (!authEnabled) return res.json({ token: '' });
  if (!checkPin(req.body?.pin)) return res.status(401).json({ error: 'PIN errato' });
  res.json({ token: makeToken() });
});

module.exports = router;
