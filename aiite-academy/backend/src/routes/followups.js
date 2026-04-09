const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

const nullIfEmpty = v => (v === '' || v === undefined || v === null) ? null : v;

const validFollowupType = ['project', 'playwright', 'general'];
const validCallStatus   = ['picked', 'not_picked', 'busy'];
const validPlacedStatus = ['placed', 'offer_pending', 'rejected', 'in_process'];

// GET /api/followups
router.get('/', auth, async (req, res) => {
  try {
    const { followup_type, student_id } = req.query;
    let query = `
      SELECT f.*, s.candidate_name, s.phone, b.batch_name
      FROM student_followups f
      JOIN students s ON f.student_id = s.id
      LEFT JOIN batches b ON s.batch_id = b.id
      WHERE 1=1
    `;
    const params = []; let i = 1;
    if (followup_type) { query += ` AND f.followup_type = $${i++}`; params.push(followup_type); }
    if (student_id)    { query += ` AND f.student_id = $${i++}`;    params.push(student_id); }
    query += ` ORDER BY f.created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ followups: result.rows });
  } catch (err) {
    console.error(err);
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

// POST /api/followups
router.post('/', auth, async (req, res) => {
  try {
    const {
      student_id, followup_type, call_status,
      last_contact_date, remarks, resume_status,
      no_of_interview_calls, no_of_rounds_cleared,
      interested, placed_status
    } = req.body;

    if (!student_id)
      return res.status(400).json({ error: 'Student is required' });

    // ✅ Validate all ENUMs — use null if invalid/empty (not empty string)
    const safeFollowupType  = validFollowupType.includes(followup_type)   ? followup_type   : 'general';
    const safeCallStatus    = validCallStatus.includes(call_status)        ? call_status     : null;
    const safePlacedStatus  = validPlacedStatus.includes(placed_status)    ? placed_status   : null;

    const result = await pool.query(
      `INSERT INTO student_followups
        (student_id, followup_type, call_status, last_contact_date,
         remarks, resume_status, no_of_interview_calls,
         no_of_rounds_cleared, interested, placed_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        student_id,
        safeFollowupType,
        safeCallStatus,
        nullIfEmpty(last_contact_date),
        nullIfEmpty(remarks),
        nullIfEmpty(resume_status),
        parseInt(no_of_interview_calls) || 0,
        parseInt(no_of_rounds_cleared)  || 0,
        interested === true || interested === 'true' ? true : interested === false || interested === 'false' ? false : null,
        safePlacedStatus
      ]
    );
    res.status(201).json({ message: 'Followup saved', followup: result.rows[0] });
  } catch (err) {
    console.error('Followup save error:', err.message);
    res.status(500).json({ error: 'Failed to save followup', detail: err.message });
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

    const safeCallStatus   = call_status   && validCallStatus.includes(call_status)     ? call_status   : null;
    const safePlacedStatus = placed_status && validPlacedStatus.includes(placed_status) ? placed_status : null;

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
      [
        safeCallStatus,
        nullIfEmpty(last_contact_date),
        nullIfEmpty(remarks),
        nullIfEmpty(resume_status),
        no_of_interview_calls !== undefined && no_of_interview_calls !== '' ? parseInt(no_of_interview_calls) : null,
        no_of_rounds_cleared  !== undefined && no_of_rounds_cleared  !== '' ? parseInt(no_of_rounds_cleared)  : null,
        interested !== undefined && interested !== '' ? (interested === true || interested === 'true') : null,
        safePlacedStatus,
        req.params.id
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Followup not found' });
    res.json({ message: 'Followup updated', followup: result.rows[0] });
  } catch (err) {
    console.error('Followup update error:', err.message);
    res.status(500).json({ error: 'Failed to update followup', detail: err.message });
  }
});

module.exports = router;