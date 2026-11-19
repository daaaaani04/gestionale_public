import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuthStatus, login } from '../api';
import './AuthGate.css';

// Mostra l'app solo se il server non richiede il PIN oppure l'utente è già autenticato.
export default function AuthGate({ children }) {
  const [state, setState] = useState('loading'); // loading | locked | open | offline
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const check = useCallback(async () => {
    try {
      const s = await fetchAuthStatus();
      setState(!s.required || s.authenticated ? 'open' : 'locked');
    } catch {
      setState('offline');
    }
  }, []);

  useEffect(() => {
    check();
    const onAuthRequired = () => setState('locked');
    window.addEventListener('auth-required', onAuthRequired);
    return () => window.removeEventListener('auth-required', onAuthRequired);
  }, [check]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(pin);
      setPin('');
      setState('open');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (state === 'open') return children;

  if (state === 'loading') return <div className="auth-gate"><p>Caricamento…</p></div>;

  if (state === 'offline') {
    return (
      <div className="auth-gate">
        <p>Server non raggiungibile.</p>
        <button onClick={check}>Riprova</button>
      </div>
    );
  }

  return (
    <div className="auth-gate">
      <form onSubmit={submit} className="auth-card">
        <h1>Accesso staff</h1>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          placeholder="PIN"
          value={pin}
          onChange={e => setPin(e.target.value)}
          autoFocus
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={busy || !pin}>Entra</button>
      </form>
    </div>
  );
}
