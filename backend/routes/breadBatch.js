const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Unit conversion helper
function convertUnit(value, from, to) {
  if (from === to) return value;
  const f = from.toLowerCase(), t = to.toLowerCase();
  if (f === 'g'  && t === 'kg')  return value / 1000;
  if (f === 'kg' && t === 'g')   return value * 1000;
  if (f === 'ml' && t === 'l')   return value / 1000;
  if (f === 'l'  && t === 'ml')  return value * 1000;
  return null;
}

// CREATE batch — status always defaults to Available, no user input needed
router.post('/', (req, res) => {
  const { bread_id, quantity, baking_date, expiry_date } = req.body;

  // Step 1 — Get recipe with units and costs
  const recipeSql = `
    SELECT
      r.ingredient_id,
      r.quantity        AS recipe_qty,
      r.unit            AS recipe_unit,
      i.quantity_available,
      i.unit            AS stock_unit,
      i.ingredient_name,
      i.cost_per_unit
    FROM recipe r
    JOIN ingredients i ON r.ingredient_id = i.ingredient_id
    WHERE r.bread_id = ?
  `;

  db.query(recipeSql, [bread_id], (err, recipes) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'Failed to fetch recipe.' }); }

    if (recipes.length === 0) {
      return res.status(400).json({ error: 'No recipe found for this bread. Please set up a recipe first.' });
    }

    // Step 2 — Check stock
    for (const item of recipes) {
      const totalNeeded = item.recipe_qty * quantity;
      const converted   = convertUnit(totalNeeded, item.recipe_unit, item.stock_unit);

      if (converted === null) {
        return res.status(400).json({
          error: `Unit mismatch for "${item.ingredient_name}": recipe uses ${item.recipe_unit} but stock is in ${item.stock_unit}.`
        });
      }

      if (item.quantity_available < converted) {
        return res.status(400).json({
          error: `Not enough "${item.ingredient_name}". Need ${converted.toFixed(3)} ${item.stock_unit}, have ${item.quantity_available} ${item.stock_unit}.`
        });
      }
    }

    // Step 3 — Insert batch (status always 'Available')
    const insertSql = `
      INSERT INTO bread_batch (bread_id, quantity, baking_date, expiry_date, status)
      VALUES (?, ?, ?, ?, 'Available')
    `;

    db.query(insertSql, [bread_id, quantity, baking_date, expiry_date], (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ error: 'Failed to record batch.' }); }

      // Step 4 — Deduct ingredients
      recipes.forEach(item => {
        const deductAmt = convertUnit(item.recipe_qty * quantity, item.recipe_unit, item.stock_unit);
        db.query(
          'UPDATE ingredients SET quantity_available = quantity_available - ? WHERE ingredient_id = ?',
          [deductAmt, item.ingredient_id],
          (err) => { if (err) console.error(`Deduction failed for ${item.ingredient_name}:`, err); }
        );
      });

      res.json({ message: 'Batch recorded and ingredients deducted successfully.' });
    });
  });
});

// READ all batches — includes cost_per_bread and total_batch_cost
router.get('/', (req, res) => {
  const sql = `
    SELECT
      bb.batch_id,
      bb.bread_id,
      bc.bread_name,
      bc.price          AS selling_price,
      bb.quantity,
      bb.baking_date,
      bb.expiry_date,
      bb.status,
      -- Cost per single bread (sum of recipe ingredient costs)
      COALESCE((
        SELECT SUM(
          CASE
            WHEN r.unit = i.unit THEN r.quantity * i.cost_per_unit
            WHEN r.unit = 'g'  AND i.unit = 'kg'  THEN (r.quantity / 1000) * i.cost_per_unit
            WHEN r.unit = 'kg' AND i.unit = 'g'   THEN (r.quantity * 1000) * i.cost_per_unit
            WHEN r.unit = 'ml' AND i.unit = 'L'   THEN (r.quantity / 1000) * i.cost_per_unit
            WHEN r.unit = 'L'  AND i.unit = 'ml'  THEN (r.quantity * 1000) * i.cost_per_unit
            ELSE r.quantity * i.cost_per_unit
          END
        )
        FROM recipe r
        JOIN ingredients i ON r.ingredient_id = i.ingredient_id
        WHERE r.bread_id = bb.bread_id
      ), 0) AS cost_per_bread,
      -- Total batch cost
      bb.quantity * COALESCE((
        SELECT SUM(
          CASE
            WHEN r.unit = i.unit THEN r.quantity * i.cost_per_unit
            WHEN r.unit = 'g'  AND i.unit = 'kg'  THEN (r.quantity / 1000) * i.cost_per_unit
            WHEN r.unit = 'kg' AND i.unit = 'g'   THEN (r.quantity * 1000) * i.cost_per_unit
            WHEN r.unit = 'ml' AND i.unit = 'L'   THEN (r.quantity / 1000) * i.cost_per_unit
            WHEN r.unit = 'L'  AND i.unit = 'ml'  THEN (r.quantity * 1000) * i.cost_per_unit
            ELSE r.quantity * i.cost_per_unit
          END
        )
        FROM recipe r
        JOIN ingredients i ON r.ingredient_id = i.ingredient_id
        WHERE r.bread_id = bb.bread_id
      ), 0) AS total_batch_cost
    FROM bread_batch bb
    JOIN bread_catalog bc ON bb.bread_id = bc.bread_id
    ORDER BY bb.baking_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'Failed to fetch batches.' }); }
    res.json(results);
  });
});

// PATCH — update batch status only (Available ↔ Sold)
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;

  if (!['Available', 'Sold'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Available or Sold.' });
  }

  db.query('UPDATE bread_batch SET status = ? WHERE batch_id = ?', [status, req.params.id], (err) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'Failed to update batch status.' }); }
    res.json({ message: `Batch marked as ${status}` });
  });
});

module.exports = router;