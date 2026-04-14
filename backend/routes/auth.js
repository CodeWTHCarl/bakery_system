const express = require('express');
const router = express.Router();
const db = require('../config/db');

// LOGIN
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = `
    SELECT * FROM users
    WHERE username = ? AND password = ?
  `;

  db.query(sql, [username, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];

    res.json({
      message: 'Login successful',
      role: user.role,
      username: user.username
    });
  });
});

module.exports = router;