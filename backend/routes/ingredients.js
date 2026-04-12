const express = require('express');
const router = express.Router();
const db = require('../config/db');

// CREATE ingredient
router.post('/', (req, res) => {
  const { ingredient_name, quantity_available, unit } = req.body;

  const sql = `
    INSERT INTO ingredients (ingredient_name, quantity_available, unit)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [ingredient_name, quantity_available, unit], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to insert ingredient' });
    }

    res.json({
      message: 'Ingredient added successfully',
      id: result.insertId
    });
  });
});



// READ all ingredients
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM ingredients';

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch ingredients' });
    }

    res.json(results);
  });
});


// DELETE ingredient
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM ingredients WHERE ingredient_id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete ingredient' });
    }

    res.json({ message: 'Ingredient deleted successfully' });
  });
});

// UPDATE ingredient
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { ingredient_name, quantity_available, unit } = req.body;

  const sql = `
    UPDATE ingredients
    SET ingredient_name = ?, quantity_available = ?, unit = ?
    WHERE ingredient_id = ?
  `;

  db.query(sql, [ingredient_name, quantity_available, unit, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update ingredient' });
    }

    res.json({ message: 'Ingredient updated successfully' });
  });
});


//should always be lastt
module.exports = router;