require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const ordersRouter = require('./routes/orders');
const locksRouter  = require('./routes/locks');
const configRouter = require('./routes/config');
const authRouter   = require('./routes/auth');
const { authEnabled, requireAuth } = require('./auth');
const helmet = require('helmet');

const app = express();
// Il frontend buildato carica risorse proprie: la CSP resta disattivata per non rompere gli stili,
// tutti gli altri header di sicurezza di helmet sono attivi.
app.use(helmet({ contentSecurityPolicy: false }));
// Se il server sta dietro a un reverse proxy imposta TRUST_PROXY=1, altrimenti il rate limit usa l'IP reale
app.set('trust proxy', Number(process.env.TRUST_PROXY) || false);
const PORT    = process.env.PORT || 3001;
const isProd  = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProd
    ? (process.env.ALLOWED_ORIGIN || false)
    : true,
}));
app.use(express.json({ limit: '100kb' }));

app.use('/api/auth',   authRouter);
app.use('/api/orders', requireAuth, ordersRouter);
app.use('/api/locks',  requireAuth, locksRouter);
app.use('/api/config', requireAuth, configRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// In produzione serve il frontend buildato
if (isProd) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  // SPA fallback — tutte le route non-API tornano index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!authEnabled) {
  console.warn('ATTENZIONE: STAFF_PIN non impostato, le API sono accessibili senza autenticazione.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
  if (!isProd) console.log(`Raggiungibile in rete su http://<IP-DEL-MAC>:${PORT}`);
});
