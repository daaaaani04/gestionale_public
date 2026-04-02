const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabase');

const router = express.Router();

// Mappa snake_case DB → camelCase app
function toOrder(row) {
  return {
    id:          row.id,
    tableNumber: row.table_number,
    items:       row.items,
    notes:       row.notes,
    status:      row.status,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

// GET /api/orders
router.get('/', async (req, res) => {
  let query = supabase.from('orders').select('*').order('created_at', { ascending: true });
  if (req.query.status) query = query.eq('status', req.query.status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Errore nel caricamento' });
  res.json(data.map(toOrder));
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Ordine non trovato' });
  res.json(toOrder(data));
});

// POST /api/orders
router.post('/', async (req, res) => {
  const { tableNumber, items, notes } = req.body;

  const tableNum = Number(tableNumber);
  if (!Number.isInteger(tableNum) || tableNum < 1 || tableNum > 999) {
    return res.status(400).json({ error: 'tableNumber non valido' });
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return res.status(400).json({ error: 'items non valido' });
  }
  if (notes && typeof notes !== 'string') {
    return res.status(400).json({ error: 'notes non valido' });
  }

  const { data, error } = await supabase.from('orders').insert({
    id:           uuidv4(),
    table_number: tableNum,
    items:        items.map(item => ({ ...item, paidQty: 0 })),
    notes:        String(notes || '').slice(0, 500),
    status:       'delivered',
  }).select().single();

  if (error) return res.status(500).json({ error: 'Errore nel salvataggio' });
  res.status(201).json(toOrder(data));
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'delivered'].includes(status)) {
    return res.status(400).json({ error: 'Stato non valido' });
  }

  const { data, error } = await supabase.from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(toOrder(data));
});

// PATCH /api/orders/:id/pay
router.patch('/:id/pay', async (req, res) => {
  const { payments } = req.body;
  if (!Array.isArray(payments) || payments.length > 100) {
    return res.status(400).json({ error: 'payments non valido' });
  }

  const { data: row, error: fetchError } = await supabase
    .from('orders').select('*').eq('id', req.params.id).single();
  if (fetchError) return res.status(404).json({ error: 'Ordine non trovato' });

  const items = [...row.items];
  payments.forEach(({ itemIndex, count }) => {
    const idx = Number(itemIndex);
    const cnt = Number(count);
    if (!Number.isInteger(idx) || idx < 0 || idx >= items.length) return;
    if (!Number.isInteger(cnt) || cnt < 1) return;
    items[idx] = {
      ...items[idx],
      paidQty: Math.min((items[idx].paidQty ?? 0) + cnt, items[idx].quantity),
    };
  });

  const { data, error } = await supabase.from('orders')
    .update({ items, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: 'Errore nel pagamento' });
  res.json(toOrder(data));
});

// DELETE /api/orders/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('orders').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;
