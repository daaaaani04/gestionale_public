import { useEffect, useRef } from 'react';
import { acquireLock, releaseLock, heartbeatLock } from '../api';

const HEARTBEAT_INTERVAL = 10_000; // ogni 10s (TTL server = 25s)

export function useTableLock(tableNumber, sessionId, onLockLost) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!tableNumber) return;

    // Heartbeat periodico per mantenere il lock
    intervalRef.current = setInterval(async () => {
      try {
        await heartbeatLock(tableNumber, sessionId);
      } catch {
        // Lock perso (es. server riavviato) — notifica l'app
        onLockLost?.();
      }
    }, HEARTBEAT_INTERVAL);

    // Rilascio al dismount o cambio tavolo
    return () => {
      clearInterval(intervalRef.current);
      releaseLock(tableNumber, sessionId);
    };
  }, [tableNumber, sessionId]);

  // Rilascio anche se l'utente chiude la scheda
  useEffect(() => {
    if (!tableNumber) return;
    function onUnload() { releaseLock(tableNumber, sessionId); }
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [tableNumber, sessionId]);
}
