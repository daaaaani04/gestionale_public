const crypto = require('crypto');

// PIN condiviso dello staff. Se STAFF_PIN non è impostato l'autenticazione è disattivata
// (comodo in sviluppo; in produzione imposta sempre STAFF_PIN).
const PIN = process.env.STAFF_PIN || '';
// Segreto con cui si firmano i token. Se manca ne viene generato uno a ogni avvio:
// al riavvio del server bisogna rifare il login.
const SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');

const authEnabled = PIN.length > 0;

function sha(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

function safeEqual(a, b) {
  return crypto.timingSafeEqual(sha(a), sha(b));
}

function makeToken() {
  return crypto.createHmac('sha256', SECRET).update(`staff:${PIN}`).digest('hex');
}

function tokenFromRequest(req) {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function isAuthenticated(req) {
  if (!authEnabled) return true;
  return safeEqual(tokenFromRequest(req), makeToken());
}

function requireAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  res.status(401).json({ error: 'Non autorizzato' });
}

function checkPin(pin) {
  return authEnabled && typeof pin === 'string' && safeEqual(pin, PIN);
}

module.exports = { authEnabled, requireAuth, isAuthenticated, makeToken, checkPin };
