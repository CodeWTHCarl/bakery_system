const express = require('express');
const router = express.Router();
const db = require('../config/db');

// CREATE bread
router.post('/', (req, res) => {
  const { bread_name, category, price } = req.body;

  const sql = `
    INSERT INTO bread_catalog (bread_name, category, price)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [bread_name, category, price], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to add bread' });
    }

    res.json({
      message: 'Bread added successfully',
      id: result.insertId
    });
  });
});

// READ breads
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM bread_catalog';

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch breads' });
    }

    res.json(results);
  });
});


// UPDATE bread
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { bread_name, category, price } = req.body;

  const sql = `
    UPDATE bread_catalog
    SET bread_name = ?, category = ?, price = ?
    WHERE bread_id = ?
  `;

  db.query(sql, [bread_name, category, price, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update bread' });
    }

    res.json({ message: 'Bread updated successfully' });
  });
});


// DELETE bread
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM bread_catalog WHERE bread_id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete bread' });
    }

    res.json({ message: 'Bread deleted successfully' });
  });
});

module.exports = router;