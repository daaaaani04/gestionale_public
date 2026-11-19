# Gestionale ristorante

Web app per la gestione di sala e comande di un ristorante: tavoli divisi per sala, ordini, conto con pagamento parziale e sincronizzazione tra più dispositivi (tablet e telefoni dei camerieri).

## Funzionalità

- **Mappa dei tavoli** per sala/piano, con numero di tavoli configurabile
- **Comande**: menu per categoria (antipasti, primi, secondi, contorni, dolci, bevande), note e stato dell'ordine
- **Conto**: pagamento anche parziale per quantità (`paidQty`), così si può dividere il conto
- **Blocco del tavolo**: se un cameriere sta lavorando su un tavolo, gli altri dispositivi non possono modificarlo contemporaneamente (lock con heartbeat ogni 10 s e scadenza a 25 s)
- Pensato per l'uso in rete locale dal telefono o tablet (il server stampa l'indirizzo IP raggiungibile)

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js, Express
- **Database:** Supabase (tabelle `orders` e `config`)

## Accesso e sicurezza

L'app è protetta da un **PIN condiviso dello staff**. Imposta in `server/.env`:

```
STAFF_PIN=un-pin-a-tua-scelta
AUTH_SECRET=una-stringa-lunga-e-casuale
```

- Senza `STAFF_PIN` l'accesso è libero: va bene solo in sviluppo, il server stampa un avviso all'avvio.
- Dopo il login il dispositivo riceve un token firmato; i tentativi di login sono limitati (10 ogni 15 minuti per IP).
- Dietro un reverse proxy (Render, Railway, nginx…) imposta anche `TRUST_PROXY=1`.
- `helmet` aggiunge gli header di sicurezza HTTP; la chiave `SUPABASE_SERVICE_KEY` resta solo sul server.

## Avvio

```bash
npm run install:all           # installa dipendenze di server e client
cp server/.env.example server/.env   # inserisci URL e chiave del tuo progetto Supabase
npm run dev                   # server (porta 3001) + client in sviluppo
```

Produzione:

```bash
npm run build                 # build del client in client/dist
NODE_ENV=production npm start # il server serve anche il frontend
```

## API

| Metodo | Percorso | Descrizione |
|---|---|---|
| GET / POST | `/api/orders` | elenco e creazione ordini |
| GET / DELETE | `/api/orders/:id` | dettaglio ed eliminazione |
| PATCH | `/api/orders/:id/status` | cambio stato |
| PATCH | `/api/orders/:id/pay` | pagamento (anche parziale) |
| GET / PUT | `/api/config` | configurazione delle sale |
| GET / POST / PUT / DELETE | `/api/locks/:table` | blocco e heartbeat del tavolo |
| POST | `/api/auth/login` | login con PIN, restituisce il token |
| GET | `/api/auth/status` | indica se serve il PIN e se si è autenticati |
| GET | `/api/health` | stato del server |

## Struttura

```
client/src/components/   TableGrid, TableDetail, NewOrderForm, OrderCard, BillPanel, FloorTabs
client/src/hooks/        useTableLock (blocco tavolo con heartbeat)
client/src/components/AuthGate.jsx   schermata del PIN
server/auth.js           PIN, token e middleware di autenticazione
server/routes/           orders, locks, config, auth
```

## Autore

Danilo Cimmino
