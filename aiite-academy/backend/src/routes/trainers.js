const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

// GET /api/trainers — list all trainers
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.phone, u.username, u.role, u.is_active
       FROM trainers t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.name`
    );
    res.json({ trainers: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trainers' });
  }
});

// GET /api/trainers/courses — all courses with IDs
router.get('/courses', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, course_name, fee, duration, mode FROM courses ORDER BY course_name`
    );
    res.json({ courses: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

module.exports = router;