const express = require('express');
const router = express.Router();

const LOCK_TTL_MS = 25_000; // scade dopo 25s senza heartbeat

// { tableNumber: { sessionId, lockedAt, expiresAt } }
const locks = {};

function isExpired(lock) {
  return Date.now() > lock.expiresAt;
}

function cleanExpired() {
  Object.keys(locks).forEach(t => {
    if (isExpired(locks[t])) delete locks[t];
  });
}

// GET /api/locks — tutti i lock attivi
router.get('/', (req, res) => {
  cleanExpired();
  res.json(locks);
});

// POST /api/locks/:table — acquisisce lock
router.post('/:table', (req, res) => {
  cleanExpired();
  const table = Number(req.params.table);
  const { sessionId } = req.body;

  if (!sessionId) return res.status(400).json({ error: 'sessionId obbligatorio' });

  const existing = locks[table];
  if (existing && existing.sessionId !== sessionId) {
    return res.status(409).json({ error: 'Tavolo aperto da un altro dispositivo' });
  }

  locks[table] = { sessionId, lockedAt: Date.now(), expiresAt: Date.now() + LOCK_TTL_MS };
  res.json({ ok: true });
});

// PUT /api/locks/:table/heartbeat — rinnova TTL
router.put('/:table/heartbeat', (req, res) => {
  const table = Number(req.params.table);
  const { sessionId } = req.body;

  const lock = locks[table];
  if (!lock || lock.sessionId !== sessionId) {
    return res.status(409).json({ error: 'Lock non valido' });
  }

  lock.expiresAt = Date.now() + LOCK_TTL_MS;
  res.json({ ok: true });
});

// DELETE /api/locks/:table — rilascia lock
router.delete('/:table', (req, res) => {
  const table = Number(req.params.table);
  const { sessionId } = req.body;

  const lock = locks[table];
  if (lock && lock.sessionId === sessionId) delete locks[table];

  res.json({ ok: true });
});

module.exports = router;
