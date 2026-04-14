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

module.exports = router;