const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

// GET /api/escalations
router.get('/', auth, async (req, res) => {
  try {
    const { status, trainer_id, month, year } = req.query;

    let query = `
      SELECT e.*, t.name as trainer_name
      FROM escalations e
      LEFT JOIN trainers t ON e.trainer_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (status) {
      query += ` AND e.status = $${i++}`;
      params.push(status);
    }
    if (trainer_id) {
      query += ` AND e.trainer_id = $${i++}`;
      params.push(trainer_id);
    }
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM e.escalation_date) = $${i++}
                 AND EXTRACT(YEAR FROM e.escalation_date) = $${i++}`;
      params.push(month, year);
    }

    query += ` ORDER BY e.escalation_date DESC`;
    const result = await pool.query(query, params);
    res.json({ escalations: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch escalations' });
  }
});

// POST /api/escalations — report escalation
router.post('/', auth, async (req, res) => {
  try {
    const { escalation_date, trainer_id, description, no_of_count } = req.body;

    if (!trainer_id || !description) {
      return res.status(400).json({ error: 'Trainer and description are required' });
    }

    const result = await pool.query(
      `INSERT INTO escalations
        (escalation_date, trainer_id, reported_by, description, no_of_count, status)
       VALUES ($1,$2,$3,$4,$5,'open')
       RETURNING *`,
      [escalation_date || new Date(), trainer_id,
       req.user.name, description, no_of_count || 1]
    );

    res.status(201).json({ message: 'Escalation reported', escalation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to report escalation' });
  }
});

// PUT /api/escalations/:id — resolve or acknowledge (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['open', 'acknowledged', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const result = await pool.query(
      `UPDATE escalations SET
        status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Escalation not found' });
    }

    res.json({ message: `Escalation ${status}`, escalation: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update escalation' });
  }
});

module.exports = router;