const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { verifyToken, requireAdmin } = require('../middleware/verifyToken');

const JWT_SECRET  = process.env.JWT_SECRET || 'bakery-super-secret-key-change-in-production';
const SALT_ROUNDS = 10;


//POST /api/auth/login

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const sql = 'SELECT * FROM users WHERE username = ?';

  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error('Login DB error:', err);
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = results[0];

    //Support BOTH bcrypt hashed AND plain-text passwords
    // (Handles existing plain-text accounts during migration period)
    let isValid = false;
    const isBcrypt = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');

    if (isBcrypt) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Plain-text match — auto-upgrade to bcrypt on successful login
      isValid = (password === user.password);

      if (isValid) {
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, user.user_id]);
        console.log(`Auto-upgraded password hash for user: ${user.username}`);
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    //Issue JWT token
    const token = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message:  'Login successful',
      token,
      role:     user.role,
      username: user.username
    });
  });
});


//  POST /api/auth/register  (Admin only — protected route)
router.post('/register', verifyToken, requireAdmin, async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required.' });
  }

  if (!['admin', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'Role must be either "admin" or "staff".' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    db.query(sql, [username, hashedPassword, role], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Username already exists.' });
        }
        console.error('Register DB error:', err);
        return res.status(500).json({ error: 'Failed to create user.' });
      }

      res.json({ message: `User "${username}" created successfully.`, id: result.insertId });
    });

  } catch (err) {
    console.error('Bcrypt error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

module.exports = router;