import React from 'react';
import { fmt, orderTotal } from '../menu';
import './OrderCard.css';

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export default function OrderCard({ order, onDelete }) {
  const { id, tableNumber, items, notes, createdAt } = order;
  const total = orderTotal(items);

  function handleDelete() {
    if (window.confirm(`Eliminare questo ordine del tavolo ${tableNumber}?`)) {
      onDelete(id);
    }
  }

  return (
    <div className="order-card">
      <div className="card-header">
        <span className="card-time">{formatTime(createdAt)}</span>
      </div>

      <ul className="item-list">
        {items.map((item, i) => (
          <li key={i}>
            <span className="item-qty">{item.quantity}×</span>
            <span className="item-name">{item.name}</span>
            {item.price != null && (
              <span className="item-price">{fmt(item.price * item.quantity)}</span>
            )}
          </li>
        ))}
      </ul>

      {notes && <p className="card-notes">Note: {notes}</p>}

      <div className="card-footer">
        <span className="card-total">{fmt(total)}</span>
        <button className="btn-delete" onClick={handleDelete}>Elimina</button>
      </div>
    </div>
  );
}
