import React, { useState, useEffect, useCallback } from 'react';
import { fetchOrders, updateOrderStatus, deleteOrder, createOrder, fetchLocks, acquireLock, releaseLock, fetchConfig, saveConfig } from './api';
import { useTableLock } from './hooks/useTableLock';
import TableGrid from './components/TableGrid';
import TableDetail from './components/TableDetail';
import FloorTabs from './components/FloorTabs';
import './App.css';

function buildFloorOffsets(floors) {
  let offset = 1;
  return floors.map(f => { const start = offset; offset += f.tableCount; return { ...f, start }; });
}

function getSessionId() {
  let id = sessionStorage.getItem('sessionId');
  if (!id) {
    id = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('sessionId', id);
  }
  return id;
}

const SESSION_ID = getSessionId();

export default function App() {
  const [floors, setFloors]               = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [orders, setOrders]               = useState([]);
  const [locks, setLocks]                 = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const [lockError, setLockError]         = useState(null);
  const [error, setError]                 = useState(null);

  useTableLock(selectedTable, SESSION_ID, () => {
    setSelectedTable(null);
    setError('Il lock sul tavolo è scaduto. Sei stato riportato alla lista tavoli.');
  });

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await fetchConfig();
      setFloors(cfg.floors);
      setSelectedFloorId(prev => prev ?? cfg.floors[0]?.id);
    } catch (e) { setError(e.message); }
  }, []);

  const loadOrders = useCallback(async () => {
    try { setOrders(await fetchOrders()); setError(null); } catch (e) { setError(e.message); }
  }, []);

  const loadLocks = useCallback(async () => {
    try { setLocks(await fetchLocks()); } catch {}
  }, []);

  useEffect(() => {
    loadConfig();
    loadOrders();
    loadLocks();
    const i1 = setInterval(loadOrders, 5000);
    const i2 = setInterval(loadLocks, 2000);
    const i3 = setInterval(loadConfig, 30000);
    return () => { clearInterval(i1); clearInterval(i2); clearInterval(i3); };
  }, [loadConfig, loadOrders, loadLocks]);

  // Persiste i piani sul server ogni volta che cambiano
  async function persistFloors(updated) {
    setFloors(updated);
    try { await saveConfig({ floors: updated }); } catch (e) { setError(e.message); }
  }

  // Quando tutti gli articoli del tavolo sono pagati → elimina e torna alla griglia
  useEffect(() => {
    if (!selectedTable) return;
    const tableOrders = orders.filter(o => o.tableNumber === selectedTable);
    if (tableOrders.length === 0) return;
    const allPaid = tableOrders.every(o => o.items.every(i => (i.paidQty ?? 0) >= i.quantity));
    if (allPaid) {
      Promise.all(tableOrders.map(o => deleteOrder(o.id))).then(() => {
        releaseLock(selectedTable, SESSION_ID);
        setSelectedTable(null);
        loadOrders();
        loadLocks();
      });
    }
  }, [orders, selectedTable]);

  async function handleSelectTable(tableNumber) {
    setLockError(null);
    const acquired = await acquireLock(tableNumber, SESSION_ID);
    if (!acquired) {
      setLockError(`Il tavolo ${tableNumber} è attualmente aperto da un altro dispositivo.`);
      return;
    }
    setSelectedTable(tableNumber);
  }

  async function handleBack() {
    if (selectedTable) await releaseLock(selectedTable, SESSION_ID);
    setSelectedTable(null);
    setLockError(null);
    loadLocks();
  }

  function getTableStatus(tableNumber) {
    const tableOrders = orders.filter(o => o.tableNumber === tableNumber);
    if (tableOrders.length === 0) return 'free';
    return 'delivered';
  }

  const floorsWithOffsets = buildFloorOffsets(floors);
  const currentFloor = floorsWithOffsets.find(f => f.id === selectedFloorId);

  const tables = currentFloor
    ? Array.from({ length: currentFloor.tableCount }, (_, i) => {
        const num = currentFloor.start + i;
        const lock = locks[num];
        return { number: num, status: getTableStatus(num), orderCount: orders.filter(o => o.tableNumber === num).length, locked: lock && lock.sessionId !== SESSION_ID };
      })
    : [];

  async function handleStatusChange(id, status) {
    try { await updateOrderStatus(id, status); await loadOrders(); } catch (e) { setError(e.message); }
  }
  async function handleDelete(id) {
    try { await deleteOrder(id); await loadOrders(); } catch (e) { setError(e.message); }
  }
  async function handleCreateOrder(data) {
    try { await createOrder(data); await loadOrders(); } catch (e) { setError(e.message); }
  }

  function addFloor(name, tableCount) {
    const id = Date.now();
    const updated = [...floors, { id, name, tableCount }];
    persistFloors(updated);
    setSelectedFloorId(id);
  }
  function deleteFloor(id) {
    if (!window.confirm('Eliminare questo piano?')) return;
    const updated = floors.filter(f => f.id !== id);
    persistFloors(updated);
    if (selectedFloorId === id) setSelectedFloorId(updated[0]?.id);
  }
  function renameFloor(id, name) {
    persistFloors(floors.map(f => f.id === id ? { ...f, name } : f));
  }

  const selectedTableOrders = selectedTable ? orders.filter(o => o.tableNumber === selectedTable) : [];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          {selectedTable && (
            <button className="btn-back" onClick={handleBack}>← Tavoli</button>
          )}
          <h1>{selectedTable ? `Tavolo ${selectedTable}` : 'Gestionale Ristorante'}</h1>
        </div>
        <div className="header-legend">
          <span className="legend-dot free" /> Libero
          <span className="legend-dot delivered" /> Consegnato
          <span className="legend-dot locked" /> In uso
        </div>
      </header>

      {!selectedTable && floors.length > 0 && (
        <FloorTabs
          floors={floors}
          selectedFloor={selectedFloorId}
          onSelect={id => { setSelectedFloorId(id); setLockError(null); }}
          onAdd={addFloor}
          onDelete={deleteFloor}
          onRename={renameFloor}
        />
      )}

      {lockError && <div className="error-banner lock-error">{lockError}</div>}
      {error     && <div className="error-banner">{error}</div>}

      <main className="app-main">
        {selectedTable ? (
          <TableDetail
            tableNumber={selectedTable}
            orders={selectedTableOrders}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onCreateOrder={handleCreateOrder}
            onRefresh={loadOrders}
          />
        ) : (
          <TableGrid tables={tables} onSelectTable={handleSelectTable} />
        )}
      </main>
    </div>
  );
}
