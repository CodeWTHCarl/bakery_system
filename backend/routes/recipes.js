const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Unit conversion helper (recipe unit → stock unit)
function convertUnit(value, from, to) {
  if (from === to) return value;
  const f = from.toLowerCase(), t = to.toLowerCase();
  if (f === 'g'  && t === 'kg')  return value / 1000;
  if (f === 'kg' && t === 'g')   return value * 1000;
  if (f === 'ml' && t === 'l')   return value / 1000;
  if (f === 'l'  && t === 'ml')  return value * 1000;
  return null;
}

// CREATE
router.post('/', (req, res) => {
  const { bread_id, ingredient_id, quantity, unit } = req.body;

  if (!bread_id || !ingredient_id || !quantity || !unit) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  db.query(
    'INSERT INTO recipe (bread_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)',
    [bread_id, ingredient_id, quantity, unit],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'This ingredient is already in this bread recipe.' });
        console.error(err);
        return res.status(500).json({ error: 'Failed to add recipe.' });
      }
      res.json({ message: 'Recipe added successfully', id: result.insertId });
    }
  );
});

// READ — includes cost_per_unit and computed line cost
router.get('/', (req, res) => {
  const sql = `
    SELECT
      r.recipe_id,
      r.bread_id,
      bc.bread_name,
      i.ingredient_id,
      i.ingredient_name,
      i.unit        AS stock_unit,
      i.cost_per_unit,
      r.quantity,
      r.unit,
      -- Cost of this ingredient line (convert to stock unit first)
      CASE
        WHEN r.unit = i.unit THEN r.quantity * i.cost_per_unit
        WHEN r.unit = 'g'  AND i.unit = 'kg'  THEN (r.quantity / 1000) * i.cost_per_unit
        WHEN r.unit = 'kg' AND i.unit = 'g'   THEN (r.quantity * 1000) * i.cost_per_unit
        WHEN r.unit = 'ml' AND i.unit = 'L'   THEN (r.quantity / 1000) * i.cost_per_unit
        WHEN r.unit = 'L'  AND i.unit = 'ml'  THEN (r.quantity * 1000) * i.cost_per_unit
        ELSE r.quantity * i.cost_per_unit
      END AS line_cost
    FROM recipe r
    JOIN bread_catalog bc ON r.bread_id  = bc.bread_id
    JOIN ingredients   i  ON r.ingredient_id = i.ingredient_id
    ORDER BY bc.bread_name, i.ingredient_name
  `;

  db.query(sql, (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'Failed to fetch recipes.' }); }
    res.json(results);
  });
});

// UPDATE quantity + unit
router.put('/:id', (req, res) => {
  const { quantity, unit } = req.body;

  db.query('UPDATE recipe SET quantity = ?, unit = ? WHERE recipe_id = ?', [quantity, unit, req.params.id], (err) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'Failed to update recipe.' }); }
    res.json({ message: 'Recipe updated successfully' });
  });
});

// DELETE
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM recipe WHERE recipe_id = ?', [req.params.id], (err) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'Failed to delete recipe.' }); }
    res.json({ message: 'Recipe deleted successfully' });
  });
});

module.exports = router;