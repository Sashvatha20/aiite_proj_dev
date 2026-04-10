const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

const nullIfEmpty = v => (v === '' || v === undefined || v === null) ? null : v;

// GET /api/mentor-feedback — trainer's own records
router.get('/', auth, async (req, res) => {
  try {
    const { batch_id } = req.query;
    let query = `
      SELECT mf.*, b.batch_name, c.course_name
      FROM mentor_feedback mf
      LEFT JOIN batches b ON mf.batch_id = b.id
      LEFT JOIN courses c ON b.course_id = c.id
      WHERE 1=1
    `;
    const params = []; let i = 1;
    // ✅ only filter by trainer if trainerId exists (skip for admin)
    if (req.user.trainerId) {
      query += ` AND mf.trainer_id = $${i++}`;
      params.push(req.user.trainerId);
    }
    if (batch_id) { query += ` AND mf.batch_id = $${i++}`; params.push(batch_id); }
    query += ` ORDER BY mf.last_updated_date DESC NULLS LAST, mf.created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ feedbacks: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mentor feedback' });
  }
});

// GET /api/mentor-feedback/all — admin view (must be before /:id)
router.get('/all', auth, async (req, res) => {
  try {
    const { trainer_id, batch_id } = req.query;
    let query = `
      SELECT mf.*, b.batch_name, c.course_name, t.name as trainer_name
      FROM mentor_feedback mf
      LEFT JOIN batches  b ON mf.batch_id   = b.id
      LEFT JOIN courses  c ON b.course_id   = c.id
      LEFT JOIN trainers t ON mf.trainer_id = t.id
      WHERE 1=1
    `;
    const params = []; let i = 1;
    if (trainer_id) { query += ` AND mf.trainer_id = $${i++}`; params.push(trainer_id); }
    if (batch_id)   { query += ` AND mf.batch_id = $${i++}`;   params.push(batch_id); }
    query += ` ORDER BY mf.last_updated_date DESC NULLS LAST`;
    const result = await pool.query(query, params);
    res.json({ feedbacks: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all mentor feedback' });
  }
});

// POST /api/mentor-feedback
router.post('/', auth, async (req, res) => {
  try {
    const {
      batch_id, total_members, form_shared,
      received_response, pending, followup_notes,
      google_form_link, last_updated_date
      // ✅ removed wa_sent — no such column in mentor_feedback table
    } = req.body;

    if (!batch_id)
      return res.status(400).json({ error: 'Batch is required' });

    if (!req.user.trainerId)
      return res.status(400).json({ error: 'Trainer ID not found in token. Please re-login.' });

    const result = await pool.query(
      `INSERT INTO mentor_feedback
        (batch_id, trainer_id, total_members, form_shared,
         received_response, pending, followup_notes,
         google_form_link, last_updated_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        batch_id,
        req.user.trainerId,
        nullIfEmpty(total_members),
        form_shared === true || form_shared === 'true' ? true : false,
        nullIfEmpty(received_response) || 0,
        nullIfEmpty(pending) || 0,
        nullIfEmpty(followup_notes),
        nullIfEmpty(google_form_link),
        nullIfEmpty(last_updated_date) || new Date(),
      ]
    );
    res.status(201).json({ message: 'Mentor feedback saved', feedback: result.rows[0] });
  } catch (err) {
    console.error('Mentor feedback save error:', err.message);
    res.status(500).json({ error: 'Failed to save mentor feedback', detail: err.message });
  }
});

// PUT /api/mentor-feedback/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      total_members, form_shared, received_response,
      pending, followup_notes, google_form_link, last_updated_date
      // ✅ removed wa_sent
    } = req.body;

    const result = await pool.query(
      `UPDATE mentor_feedback SET
        total_members     = COALESCE($1, total_members),
        form_shared       = COALESCE($2, form_shared),
        received_response = COALESCE($3, received_response),
        pending           = COALESCE($4, pending),
        followup_notes    = COALESCE($5, followup_notes),
        google_form_link  = COALESCE($6, google_form_link),
        last_updated_date = COALESCE($7, last_updated_date),
        updated_at        = NOW()
       WHERE id = $8 AND trainer_id = $9
       RETURNING *`,
      [
        nullIfEmpty(total_members),
        form_shared !== undefined && form_shared !== '' ? (form_shared === true || form_shared === 'true') : null,
        nullIfEmpty(received_response),
        nullIfEmpty(pending),
        nullIfEmpty(followup_notes),
        nullIfEmpty(google_form_link),
        nullIfEmpty(last_updated_date),
        req.params.id,
        req.user.trainerId
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Record not found or not yours' });
    res.json({ message: 'Mentor feedback updated', feedback: result.rows[0] });
  } catch (err) {
    console.error('Mentor feedback update error:', err.message);
    res.status(500).json({ error: 'Failed to update mentor feedback', detail: err.message });
  }
});

// DELETE /api/mentor-feedback/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM mentor_feedback WHERE id = $1 AND trainer_id = $2 RETURNING id`,
      [req.params.id, req.user.trainerId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete mentor feedback' });
  }
});

module.exports = router;