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
| GET | `/api/health` | stato del server |

## Struttura

```
client/src/components/   TableGrid, TableDetail, NewOrderForm, OrderCard, BillPanel, FloorTabs
client/src/hooks/        useTableLock (blocco tavolo con heartbeat)
server/routes/           orders, locks, config
```

## Autore

Danilo Cimmino
