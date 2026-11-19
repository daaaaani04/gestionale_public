const TOKEN_KEY = 'staffToken';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

function setToken(token) {
  try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch {}
}

// fetch che aggiunge il token di accesso. Se il server risponde 401 (token scaduto o PIN cambiato)
// avvisa l'app, che torna alla schermata del PIN.
async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    setToken('');
    window.dispatchEvent(new Event('auth-required'));
  }
  return res;
}

export async function fetchAuthStatus() {
  const token = getToken();
  const res = await fetch('/api/auth/status', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Server non raggiungibile');
  return res.json();
}

export async function login(pin) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (res.status === 429) throw new Error('Troppi tentativi, riprova tra qualche minuto');
  if (!res.ok) throw new Error('PIN errato');
  const { token } = await res.json();
  setToken(token);
}

const BASE   = '/api/orders';
const CONFIG = '/api/config';

export async function fetchConfig() {
  const res = await authFetch(CONFIG);
  if (!res.ok) throw new Error('Errore nel caricamento della configurazione');
  return res.json();
}

export async function saveConfig(data) {
  const res = await authFetch(CONFIG, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Errore nel salvataggio della configurazione');
  return res.json();
}
const LOCKS = '/api/locks';

export async function fetchLocks() {
  const res = await authFetch(LOCKS);
  if (!res.ok) throw new Error('Errore nel caricamento dei lock');
  return res.json();
}

export async function acquireLock(tableNumber, sessionId) {
  const res = await authFetch(`${LOCKS}/${tableNumber}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (res.status === 409) return false;
  if (!res.ok) throw new Error('Errore nel lock');
  return true;
}

export async function releaseLock(tableNumber, sessionId) {
  await authFetch(`${LOCKS}/${tableNumber}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
}

export async function heartbeatLock(tableNumber, sessionId) {
  await authFetch(`${LOCKS}/${tableNumber}/heartbeat`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
}

export async function fetchOrders(status) {
  const url = status ? `${BASE}?status=${status}` : BASE;
  const res = await authFetch(url);
  if (!res.ok) throw new Error('Errore nel caricamento degli ordini');
  return res.json();
}

export async function createOrder(data) {
  const res = await authFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Errore nella creazione dell\'ordine');
  return res.json();
}

export async function updateOrderStatus(id, status) {
  const res = await authFetch(`${BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Errore nell\'aggiornamento dello stato');
  return res.json();
}

// payments: [{ itemIndex, count }]
export async function payItems(orderId, payments) {
  const res = await authFetch(`${BASE}/${orderId}/pay`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payments }),
  });
  if (!res.ok) throw new Error('Errore nel pagamento');
  return res.json();
}

export async function deleteOrder(id) {
  const res = await authFetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Errore nella cancellazione dell\'ordine');
}
