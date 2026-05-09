const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// CREATE supplier
router.post('/', (req, res) => {
  const { supplier_name, contact, email, address } = req.body;

  if (!supplier_name) {
    return res.status(400).json({ error: 'Supplier name is required.' });
  }

  const sql = `
    INSERT INTO suppliers (supplier_name, contact, email, address)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [supplier_name, contact || null, email || null, address || null], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to add supplier.' });
    }
    res.json({ message: 'Supplier added successfully', id: result.insertId });
  });
});

// READ all suppliers
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      s.*,
      COUNT(i.ingredient_id) AS ingredient_count
    FROM suppliers s
    LEFT JOIN ingredients i ON i.supplier_id = s.supplier_id
    GROUP BY s.supplier_id
    ORDER BY s.supplier_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch suppliers.' });
    }
    res.json(results);
  });
});

// READ single supplier with its ingredients
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      s.*,
      i.ingredient_id,
      i.ingredient_name,
      i.quantity_available,
      i.unit,
      i.cost_per_unit
    FROM suppliers s
    LEFT JOIN ingredients i ON i.supplier_id = s.supplier_id
    WHERE s.supplier_id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch supplier.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }
    res.json(results);
  });
});

// UPDATE supplier
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { supplier_name, contact, email, address } = req.body;

  const sql = `
    UPDATE suppliers
    SET supplier_name = ?, contact = ?, email = ?, address = ?
    WHERE supplier_id = ?
  `;

  db.query(sql, [supplier_name, contact || null, email || null, address || null, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update supplier.' });
    }
    res.json({ message: 'Supplier updated successfully' });
  });
});

// DELETE supplier
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM suppliers WHERE supplier_id = ?', [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete supplier.' });
    }
    res.json({ message: 'Supplier deleted successfully' });
  });
});

module.exports = router;