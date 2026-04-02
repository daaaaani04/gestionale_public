import React, { useState, useMemo } from 'react';
import { loadMenu, getCategories, fmt, orderTotal } from '../menu';
import './NewOrderForm.css';

export default function NewOrderForm({ tableNumber, onCreated, onCancel }) {
  const menu = useMemo(() => loadMenu(), []);
  const categories = useMemo(() => getCategories(menu), [menu]);

  const [selected, setSelected] = useState({}); // { menuItemId: quantity }
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const filtered = menu.filter(item => item.category === activeCategory);
  const selectedItems = Object.entries(selected)
    .map(([id, quantity]) => ({ ...menu.find(m => m.id === Number(id)), quantity }))
    .filter(Boolean);
  const total = orderTotal(selectedItems);

  function add(item) {
    setSelected(prev => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }));
  }

  function remove(item) {
    setSelected(prev => {
      const qty = (prev[item.id] ?? 0) - 1;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: qty };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (selectedItems.length === 0) {
      setError('Seleziona almeno un piatto.');
      return;
    }
    setLoading(true);
    try {
      await onCreated({
        tableNumber,
        items: selectedItems.map(({ name, quantity, price }) => ({ name, quantity, price })),
        notes,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-overlay">
      <form className="new-order-form" onSubmit={handleSubmit}>
        <div className="form-top">
          <h2>Nuovo ordine — Tavolo {tableNumber}</h2>
          <button type="button" className="btn-cancel-x" onClick={onCancel}>✕</button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="picker-layout">
          {/* Lista menu */}
          <div className="menu-panel">
            <div className="category-tabs">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <ul className="menu-list">
              {filtered.map(item => {
                const qty = selected[item.id] ?? 0;
                return (
                  <li key={item.id} className={`menu-item ${qty > 0 ? 'selected' : ''}`}>
                    <div className="menu-item-info">
                      <span className="menu-item-name">{item.name}</span>
                      <span className="menu-item-price">{fmt(item.price)}</span>
                    </div>
                    <div className="menu-item-controls">
                      {qty > 0 && (
                        <>
                          <button type="button" className="qty-btn minus" onClick={() => remove(item)}>−</button>
                          <span className="qty-value">{qty}</span>
                        </>
                      )}
                      <button type="button" className="qty-btn plus" onClick={() => add(item)}>+</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Riepilogo */}
          <div className="order-summary">
            <h3>
              Riepilogo
              {selectedItems.length > 0 && (
                <span className="summary-count">{selectedItems.reduce((s, i) => s + i.quantity, 0)}</span>
              )}
            </h3>

            {selectedItems.length === 0 ? (
              <p className="summary-empty">Nessun piatto selezionato</p>
            ) : (
              <ul className="summary-list">
                {selectedItems.map(item => (
                  <li key={item.id} className="summary-item">
                    <span className="summary-qty">{item.quantity}×</span>
                    <span className="summary-name">{item.name}</span>
                    <span className="summary-price">{fmt(item.price * item.quantity)}</span>
                    <button type="button" className="summary-remove" onClick={() => {
                      setSelected(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                    }}>✕</button>
                  </li>
                ))}
              </ul>
            )}

            {selectedItems.length > 0 && (
              <div className="summary-total">
                <span>Totale</span>
                <span>{fmt(total)}</span>
              </div>
            )}

            <div className="form-group notes-group">
              <label>Note</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Allergie, preferenze..."
                rows={2}
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading || selectedItems.length === 0}>
              {loading ? 'Salvataggio...' : 'Crea ordine'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
