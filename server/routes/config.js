const express = require('express');
const supabase = require('../supabase');

const router = express.Router();

// GET /api/config
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('config').select('*').eq('id', 1).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ floors: data.floors });
});

// PUT /api/config
router.put('/', async (req, res) => {
  const { floors } = req.body;
  if (!Array.isArray(floors)) {
    return res.status(400).json({ error: 'floors deve essere un array' });
  }

  const { data, error } = await supabase.from('config')
    .upsert({ id: 1, floors })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ floors: data.floors });
});

module.exports = router;
