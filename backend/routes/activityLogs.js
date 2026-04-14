const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ADD LOG
router.post('/', (req, res) => {
  const { action, role } = req.body;

  const sql = `
    INSERT INTO activity_logs (action, role)
    VALUES (?, ?)
  `;

  db.query(sql, [action, role], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to log activity' });
    }

    res.json({ message: 'Logged' });
  });
});

// GET LOGS
router.get('/', (req, res) => {
  const sql = `SELECT * FROM activity_logs ORDER BY created_at DESC`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }

    res.json(results);
  });
});

module.exports = router;