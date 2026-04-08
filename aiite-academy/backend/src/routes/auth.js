const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../db');
const authMiddleware = require('../middleware/auth');
const router   = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Get trainer profile if trainer
    let trainerData = null;
    if (user.role === 'trainer') {
      const trainerResult = await pool.query(
        'SELECT * FROM trainers WHERE user_id = $1',
        [user.id]
      );
      if (trainerResult.rows.length > 0) {
        trainerData = trainerResult.rows[0];
      }
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id:        user.id,
        username:  user.username,
        role:      user.role,
        trainerId: trainerData ? trainerData.id : null,
        name:      trainerData ? trainerData.name : 'Admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id:        user.id,
        username:  user.username,
        role:      user.role,
        name:      trainerData ? trainerData.name : 'Admin',
        trainerId: trainerData ? trainerData.id : null
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;