const express = require('express');
const router = express.Router();
const db = require('../config/db');


//create batch(safe auto-deduct)
router.post('/', (req, res) => {
  const { bread_id, quantity, baking_date, expiry_date, status } = req.body;

  // get recipe first
  const recipeSql = `
    SELECT r.ingredient_id, r.quantity, i.quantity_available, i.ingredient_name
    FROM recipe r
    JOIN ingredients i ON r.ingredient_id = i.ingredient_id
    WHERE r.bread_id = ?
  `;

  db.query(recipeSql, [bread_id], (err, recipes) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch recipe' });
    }

    //no recipe found
    if (recipes.length === 0) {
      return res.status(400).json({ error: 'No recipe found for this bread' });
    }

    //check stock firstt
    for (let item of recipes) {
      const totalNeeded = item.quantity * quantity;

      if (item.quantity_available < totalNeeded) {
        return res.status(400).json({
          error: `Not enough ${item.ingredient_name}. Required: ${totalNeeded}`
        });
      }
    }

    // insert batch only if stock is okay
    const insertBatchSql = `
      INSERT INTO bread_batch (bread_id, quantity, baking_date, expiry_date, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertBatchSql, [bread_id, quantity, baking_date, expiry_date, status], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to insert batch' });
      }

      //deduct ingredients (safe)
      recipes.forEach(item => {
        const totalUsed = item.quantity * quantity;

        const updateSql = `
          UPDATE ingredients
          SET quantity_available = quantity_available - ?
          WHERE ingredient_id = ?
        `;

        db.query(updateSql, [totalUsed, item.ingredient_id]);
      });

      res.json({
        message: 'Batch recorded and ingredients deducted successfully'
      });
    });
  });
});


//read batches
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      bread_batch.batch_id,
      bread_catalog.bread_name,
      bread_batch.quantity,
      bread_batch.baking_date,
      bread_batch.expiry_date,
      bread_batch.status
    FROM bread_batch
    JOIN bread_catalog ON bread_batch.bread_id = bread_catalog.bread_id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch batches' });
    }

    res.json(results);
  });
});

module.exports = router;