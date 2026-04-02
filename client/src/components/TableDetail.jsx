import React, { useState } from 'react';
import OrderCard from './OrderCard';
import NewOrderForm from './NewOrderForm';
import BillPanel from './BillPanel';
import './TableDetail.css';

export default function TableDetail({ tableNumber, orders, onStatusChange, onDelete, onCreateOrder, onRefresh }) {
  const [showForm, setShowForm] = useState(false);

  async function handleCreate(data) {
    await onCreateOrder({ ...data, tableNumber });
    setShowForm(false);
  }

  return (
    <div className="table-detail">
      <div className="detail-header">
        <span className="conti-count">
          {orders.length === 0 ? 'Nessun ordine' : `${orders.length} ${orders.length === 1 ? 'ordine' : 'ordini'}`}
        </span>
        <button className="btn-new-order" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Annulla' : '+ Nuovo ordine'}
        </button>
      </div>

      {showForm && (
        <NewOrderForm
          tableNumber={tableNumber}
          onCreated={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {orders.length === 0 && !showForm ? (
        <div className="detail-empty">
          <p>Nessun ordine per questo tavolo.</p>
          <button className="btn-new-order-lg" onClick={() => setShowForm(true)}>
            + Crea il primo ordine
          </button>
        </div>
      ) : (
        orders.length > 0 && (
          <>
            <BillPanel orders={orders} onPaid={onRefresh} />

            <div className="order-grid">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}
