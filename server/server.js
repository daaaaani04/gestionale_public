require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const ordersRouter = require('./routes/orders');
const locksRouter  = require('./routes/locks');
const configRouter = require('./routes/config');

const app = express();
const PORT    = process.env.PORT || 3001;
const isProd  = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProd
    ? (process.env.ALLOWED_ORIGIN || false)
    : true,
}));
app.use(express.json({ limit: '100kb' }));

app.use('/api/orders', ordersRouter);
app.use('/api/locks',  locksRouter);
app.use('/api/config', configRouter);

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
  if (!isProd) console.log(`Raggiungibile in rete su http://<IP-DEL-MAC>:${PORT}`);
});
