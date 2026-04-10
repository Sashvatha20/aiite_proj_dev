const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

// GET /api/placements
router.get('/', auth, async (req, res) => {
  try {
    const { status, batch_id, search } = req.query;

    let query = `
      SELECT p.*, s.candidate_name, s.phone,
        b.batch_name, c.course_name
      FROM placements p
      JOIN students s ON p.student_id = s.id
      JOIN batches b ON s.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (status) {
      query += ` AND p.placed_status = $${i++}`;
      params.push(status);
    }
    if (batch_id) {
      query += ` AND s.batch_id = $${i++}`;
      params.push(batch_id);
    }
    if (search) {
      query += ` AND (s.candidate_name ILIKE $${i} OR p.company_name ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    query += ` ORDER BY p.placed_date DESC NULLS LAST`;
    const result = await pool.query(query, params);
    res.json({ placements: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch placements' });
  }
});

// POST /api/placements — log placement
router.post('/', auth, async (req, res) => {
  try {
    const {
      student_id, company_name, role_offered, placed_as,
      cooperation_mode, rounds_cleared, placed_status, placed_date
    } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'Student is required' });
    }

    const result = await pool.query(
      `INSERT INTO placements
        (student_id, company_name, role_offered, placed_as,
         cooperation_mode, rounds_cleared, placed_status, placed_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [student_id, company_name, role_offered, placed_as,
       cooperation_mode || false, rounds_cleared || 0,
       placed_status || 'in_process', placed_date]
    );

    res.status(201).json({ message: 'Placement logged', placement: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log placement' });
  }
});

// PUT /api/placements/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      company_name, role_offered, placed_as,
      rounds_cleared, placed_status, placed_date, cooperation_mode
    } = req.body;

    const result = await pool.query(
      `UPDATE placements SET
        company_name     = COALESCE($1, company_name),
        role_offered     = COALESCE($2, role_offered),
        placed_as        = COALESCE($3, placed_as),
        rounds_cleared   = COALESCE($4, rounds_cleared),
        placed_status    = COALESCE($5, placed_status),
        placed_date      = COALESCE($6, placed_date),
        cooperation_mode = COALESCE($7, cooperation_mode),
        updated_at       = NOW()
       WHERE id = $8
       RETURNING *`,
      [company_name, role_offered, placed_as, rounds_cleared,
       placed_status, placed_date, cooperation_mode, req.params.id]
    );

    res.json({ message: 'Placement updated', placement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update placement' });
  }
});

module.exports = router;