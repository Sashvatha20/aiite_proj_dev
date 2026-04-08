const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

// GET /api/followups — list with filters
router.get('/', auth, async (req, res) => {
  try {
    const { followup_type, student_id } = req.query;

    let query = `
      SELECT f.*, s.candidate_name, s.phone,
        b.batch_name
      FROM student_followups f
      JOIN students s ON f.student_id = s.id
      JOIN batches b ON s.batch_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (followup_type) {
      query += ` AND f.followup_type = $${i++}`;
      params.push(followup_type);
    }
    if (student_id) {
      query += ` AND f.student_id = $${i++}`;
      params.push(student_id);
    }

    query += ` ORDER BY f.created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ followups: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch followups' });
  }
});

// GET /api/followups/:studentId/history
router.get('/:studentId/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, s.candidate_name
       FROM student_followups f
       JOIN students s ON f.student_id = s.id
       WHERE f.student_id = $1
       ORDER BY f.created_at DESC`,
      [req.params.studentId]
    );
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch followup history' });
  }
});

// POST /api/followups — save followup
router.post('/', auth, async (req, res) => {
  try {
    const {
      student_id, followup_type, call_status,
      last_contact_date, remarks, resume_status,
      no_of_interview_calls, no_of_rounds_cleared,
      interested, placed_status
    } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'Student is required' });
    }

    const result = await pool.query(
      `INSERT INTO student_followups
        (student_id, followup_type, call_status, last_contact_date,
         remarks, resume_status, no_of_interview_calls,
         no_of_rounds_cleared, interested, placed_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [student_id, followup_type || 'general', call_status,
       last_contact_date, remarks, resume_status,
       no_of_interview_calls || 0, no_of_rounds_cleared || 0,
       interested, placed_status]
    );

    res.status(201).json({ message: 'Followup saved', followup: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save followup' });
  }
});

// PUT /api/followups/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      call_status, last_contact_date, remarks,
      resume_status, no_of_interview_calls,
      no_of_rounds_cleared, interested, placed_status
    } = req.body;

    const result = await pool.query(
      `UPDATE student_followups SET
        call_status           = COALESCE($1, call_status),
        last_contact_date     = COALESCE($2, last_contact_date),
        remarks               = COALESCE($3, remarks),
        resume_status         = COALESCE($4, resume_status),
        no_of_interview_calls = COALESCE($5, no_of_interview_calls),
        no_of_rounds_cleared  = COALESCE($6, no_of_rounds_cleared),
        interested            = COALESCE($7, interested),
        placed_status         = COALESCE($8, placed_status),
        updated_at            = NOW()
       WHERE id = $9
       RETURNING *`,
      [call_status, last_contact_date, remarks, resume_status,
       no_of_interview_calls, no_of_rounds_cleared,
       interested, placed_status, req.params.id]
    );

    res.json({ message: 'Followup updated', followup: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update followup' });
  }
});

module.exports = router;