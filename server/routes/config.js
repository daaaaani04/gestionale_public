const express = require('express');
const supabase = require('../supabase');

const router = express.Router();

// GET /api/config
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('config').select('*').eq('id', 1).single();
  if (error) return res.status(500).json({ error: 'Errore nel caricamento configurazione' });
  res.json({ floors: data.floors });
});

// PUT /api/config
router.put('/', async (req, res) => {
  const { floors } = req.body;
  if (!Array.isArray(floors) || floors.length > 20) {
    return res.status(400).json({ error: 'floors non valido' });
  }

  const sanitized = floors.map(f => ({
    id:         Number(f.id),
    name:       String(f.name || '').slice(0, 50),
    tableCount: Math.min(Math.max(Number(f.tableCount) || 1, 1), 50),
  }));

  const { data, error } = await supabase.from('config')
    .upsert({ id: 1, floors: sanitized })
    .select().single();

  if (error) return res.status(500).json({ error: 'Errore nel salvataggio' });
  res.json({ floors: data.floors });
});

module.exports = router;
