const jwt  = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

module.exports = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // ✅ FIX: Token uses 'trainerId' (camelCase), normalize to trainer_id
    if (!req.user.trainer_id) {
      req.user.trainer_id = req.user.trainerId || null;
    }

    // If still null, try fetching from DB (safety fallback)
    if (!req.user.trainer_id && req.user.role === 'trainer') {
      const result = await pool.query(
        'SELECT id FROM trainers WHERE user_id = $1',
        [req.user.id]
      );
      req.user.trainer_id = result.rows[0]?.id || null;
    }

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};