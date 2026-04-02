import React from 'react';
import './TableGrid.css';

const STATUS_META = {
  free:      { label: 'Libero',     icon: '○' },
  delivered: { label: 'Consegnato', icon: '✓' },
};

export default function TableGrid({ tables, onSelectTable }) {
  return (
    <div className="table-grid-wrapper">
      <div className="table-grid">
        {tables.map(table => {
          if (table.locked) {
            return (
              <div key={table.number} className="table-card status-locked" title="Aperto da un altro dispositivo">
                <span className="table-icon">🔒</span>
                <span className="table-num">Tavolo {table.number}</span>
                <span className="table-status-label">In uso</span>
              </div>
            );
          }

          const meta = STATUS_META[table.status];
          return (
            <button
              key={table.number}
              className={`table-card status-${table.status}`}
              onClick={() => onSelectTable(table.number)}
            >
              <span className="table-icon">{meta.icon}</span>
              <span className="table-num">Tavolo {table.number}</span>
              <span className="table-status-label">{meta.label}</span>
              {table.orderCount > 0 && (
                <span className="table-order-count">
                  {table.orderCount} {table.orderCount === 1 ? 'ordine' : 'ordini'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
