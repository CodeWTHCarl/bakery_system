const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/verifyToken');


//  GET /api/users  — List all users (admin only)
router.get('/', verifyToken, requireAdmin, (req, res) => {
  const sql = 'SELECT user_id, username, role FROM users ORDER BY user_id ASC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Users fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch users.' });
    }
    res.json(results);
  });
});


//  DELETE /api/users/:id  — Remove a user (admin only, not self)
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
  const targetId = parseInt(req.params.id);

  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  const sql = 'DELETE FROM users WHERE user_id = ?';
  db.query(sql, [targetId], (err, result) => {
    if (err) {
      console.error('User delete error:', err);
      return res.status(500).json({ error: 'Failed to delete user.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'User deleted successfully.' });
  });
});

module.exports = router;