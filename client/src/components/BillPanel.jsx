import React, { useState } from 'react';
import { payItems } from '../api';
import { fmt } from '../menu';
import './BillPanel.css';

// Espande ogni item in singole unità, distinguendo quelle già pagate
function buildRows(orders) {
  const rows = [];
  orders.forEach(order => {
    order.items.forEach((item, itemIndex) => {
      const paidQty = item.paidQty ?? 0;
      for (let unit = 0; unit < item.quantity; unit++) {
        rows.push({
          key: `${order.id}:${itemIndex}:${unit}`,
          orderId: order.id,
          itemIndex,
          unit,
          name: item.name,
          price: item.price ?? 0,
          paid: unit < paidQty,
        });
      }
    });
  });
  return rows;
}

export default function BillPanel({ orders, onPaid }) {
  const [selected, setSelected] = useState(new Set());

  const rows = buildRows(orders);
  const unpaidRows = rows.filter(r => !r.paid);
  const paidRows   = rows.filter(r => r.paid);

  const totalAll   = rows.reduce((s, r) => s + r.price, 0);
  const totalPaid  = paidRows.reduce((s, r) => s + r.price, 0);
  const totalToPay = unpaidRows.reduce((s, r) => s + r.price, 0);
  const selectedTotal = [...selected].reduce((s, key) => {
    const row = unpaidRows.find(r => r.key === key);
    return s + (row?.price ?? 0);
  }, 0);

  function toggleRow(key) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function selectAll()   { setSelected(new Set(unpaidRows.map(r => r.key))); }
  function clearAll()    { setSelected(new Set()); }

  async function handlePay() {
    // Raggruppa per ordine → per itemIndex → conta le unità selezionate
    const byOrder = {};
    [...selected].forEach(key => {
      const [orderId, itemIndex] = key.split(':');
      if (!byOrder[orderId]) byOrder[orderId] = {};
      byOrder[orderId][itemIndex] = (byOrder[orderId][itemIndex] ?? 0) + 1;
    });

    await Promise.all(
      Object.entries(byOrder).map(([orderId, items]) =>
        payItems(orderId, Object.entries(items).map(([itemIndex, count]) => ({
          itemIndex: Number(itemIndex),
          count,
        })))
      )
    );

    setSelected(new Set());
    onPaid();
  }

  if (rows.length === 0) return null;

  return (
    <div className="bill-panel">
      <div className="bill-header">
        <h2 className="bill-title">Conto tavolo</h2>
        <div className="bill-totals">
          <span className="total-chip paid">Pagato {fmt(totalPaid)}</span>
          <span className="total-chip unpaid">Da pagare {fmt(totalToPay)}</span>
          <span className="total-chip all">Totale {fmt(totalAll)}</span>
        </div>
      </div>

      {unpaidRows.length > 0 && (
        <>
          <div className="bill-section-header">
            <span className="bill-section-title">Da pagare</span>
            {selected.size < unpaidRows.length
              ? <button className="btn-select-all" onClick={selectAll}>Seleziona tutti</button>
              : <button className="btn-select-all" onClick={clearAll}>Deseleziona tutti</button>
            }
          </div>

          <ul className="bill-rows">
            {unpaidRows.map(row => {
              const checked = selected.has(row.key);
              return (
                <li key={row.key} className={`bill-row ${checked ? 'checked' : ''}`} onClick={() => toggleRow(row.key)}>
                  <input type="checkbox" checked={checked} onChange={() => toggleRow(row.key)} onClick={e => e.stopPropagation()} />
                  <span className="bill-row-name">{row.name}</span>
                  <span className="bill-row-price">{fmt(row.price)}</span>
                </li>
              );
            })}
          </ul>

          {selected.size > 0 && (
            <div className="bill-pay-bar">
              <span className="pay-bar-total">
                {selected.size} {selected.size === 1 ? 'articolo' : 'articoli'}: <strong>{fmt(selectedTotal)}</strong>
              </span>
              <button className="btn-pay" onClick={handlePay}>Segna come pagati</button>
            </div>
          )}
        </>
      )}

      {paidRows.length > 0 && (
        <>
          <div className="bill-section-header">
            <span className="bill-section-title paid-title">Pagato</span>
          </div>
          <ul className="bill-rows">
            {paidRows.map(row => (
              <li key={row.key} className="bill-row paid">
                <span className="bill-row-name">{row.name}</span>
                <span className="bill-row-price">{fmt(row.price)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
