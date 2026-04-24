const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bakery-super-secret-key-change-in-production';

//Verify JWT token from Authorization header
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Session expired. Please log in again.' });
  }
}

//Admin-only guard (use after verifyToken)
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };