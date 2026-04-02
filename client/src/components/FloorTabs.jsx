import React, { useState } from 'react';
import './FloorTabs.css';

export default function FloorTabs({ floors, selectedFloor, onSelect, onAdd, onDelete, onRename }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCount, setNewCount] = useState(6);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  function submitAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName.trim(), Number(newCount));
    setNewName('');
    setNewCount(6);
    setAdding(false);
  }

  function startEdit(floor) {
    setEditingId(floor.id);
    setEditName(floor.name);
  }

  function submitEdit(e) {
    e.preventDefault();
    if (editName.trim()) onRename(editingId, editName.trim());
    setEditingId(null);
  }

  return (
    <div className="floor-tabs-wrapper">
      <div className="floor-tabs">
        {floors.map(floor => (
          <div key={floor.id} className={`floor-tab ${selectedFloor === floor.id ? 'active' : ''}`}>
            {editingId === floor.id ? (
              <form onSubmit={submitEdit} className="edit-form">
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={submitEdit}
                />
              </form>
            ) : (
              <span onClick={() => onSelect(floor.id)} onDoubleClick={() => startEdit(floor)}>
                {floor.name}
                <em className="tab-count">{floor.tableCount} tavoli</em>
              </span>
            )}
            {floors.length > 1 && (
              <button
                className="tab-delete"
                onClick={() => onDelete(floor.id)}
                title="Elimina piano"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {adding ? (
          <form className="floor-add-form" onSubmit={submitAdd}>
            <input
              autoFocus
              placeholder="Nome piano"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <input
              type="number"
              min="1"
              max="30"
              value={newCount}
              onChange={e => setNewCount(e.target.value)}
              style={{ width: 60 }}
              title="Numero tavoli"
            />
            <button type="submit">OK</button>
            <button type="button" onClick={() => setAdding(false)}>✕</button>
          </form>
        ) : (
          <button className="floor-add-btn" onClick={() => setAdding(true)}>+ Piano</button>
        )}
      </div>
    </div>
  );
}
