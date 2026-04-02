const BASE   = '/api/orders';
const CONFIG = '/api/config';

export async function fetchConfig() {
  const res = await fetch(CONFIG);
  if (!res.ok) throw new Error('Errore nel caricamento della configurazione');
  return res.json();
}

export async function saveConfig(data) {
  const res = await fetch(CONFIG, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Errore nel salvataggio della configurazione');
  return res.json();
}
const LOCKS = '/api/locks';

export async function fetchLocks() {
  const res = await fetch(LOCKS);
  if (!res.ok) throw new Error('Errore nel caricamento dei lock');
  return res.json();
}

export async function acquireLock(tableNumber, sessionId) {
  const res = await fetch(`${LOCKS}/${tableNumber}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (res.status === 409) return false;
  if (!res.ok) throw new Error('Errore nel lock');
  return true;
}

export async function releaseLock(tableNumber, sessionId) {
  await fetch(`${LOCKS}/${tableNumber}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
}

export async function heartbeatLock(tableNumber, sessionId) {
  await fetch(`${LOCKS}/${tableNumber}/heartbeat`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
}

export async function fetchOrders(status) {
  const url = status ? `${BASE}?status=${status}` : BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Errore nel caricamento degli ordini');
  return res.json();
}

export async function createOrder(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Errore nella creazione dell\'ordine');
  return res.json();
}

export async function updateOrderStatus(id, status) {
  const res = await fetch(`${BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Errore nell\'aggiornamento dello stato');
  return res.json();
}

// payments: [{ itemIndex, count }]
export async function payItems(orderId, payments) {
  const res = await fetch(`${BASE}/${orderId}/pay`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payments }),
  });
  if (!res.ok) throw new Error('Errore nel pagamento');
  return res.json();
}

export async function deleteOrder(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Errore nella cancellazione dell\'ordine');
}
