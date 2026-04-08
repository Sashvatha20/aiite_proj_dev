const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

// GET /api/assessments — trainer's own records
router.get('/', auth, async (req, res) => {
  try {
    const { batch_id, student_id } = req.query;
    let query = `
      SELECT a.*, b.batch_name, s.candidate_name
      FROM batch_assessment a
      LEFT JOIN batches  b ON a.batch_id   = b.id
      LEFT JOIN students s ON a.student_id = s.id
      WHERE a.trainer_id = $1
    `;
    const params = [req.user.trainerId];
    let i = 2;
    if (batch_id)   { query += ` AND a.batch_id = $${i++}`;   params.push(batch_id); }
    if (student_id) { query += ` AND a.student_id = $${i++}`; params.push(student_id); }
    query += ` ORDER BY a.assessment_date DESC`;
    const result = await pool.query(query, params);
    res.json({ assessments: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// GET /api/assessments/all — admin view
router.get('/all', auth, async (req, res) => {
  try {
    const { batch_id, trainer_id } = req.query;
    let query = `
      SELECT a.*, b.batch_name, t.name as trainer_name, s.candidate_name
      FROM batch_assessment a
      LEFT JOIN batches  b ON a.batch_id   = b.id
      LEFT JOIN trainers t ON a.trainer_id = t.id
      LEFT JOIN students s ON a.student_id = s.id
      WHERE 1=1
    `;
    const params = []; let i = 1;
    if (batch_id)   { query += ` AND a.batch_id = $${i++}`;   params.push(batch_id); }
    if (trainer_id) { query += ` AND a.trainer_id = $${i++}`; params.push(trainer_id); }
    query += ` ORDER BY a.assessment_date DESC`;
    const result = await pool.query(query, params);
    res.json({ assessments: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all assessments' });
  }
});

// POST /api/assessments
router.post('/', auth, async (req, res) => {
  try {
    const {
      batch_id, student_id, assessment_date, topic_covered,
      no_of_questions_asked, feedback_rating, outcome_remarks,
      session_type, no_of_participants, session_hours, wa_sent
    } = req.body;

    if (!batch_id || !topic_covered)
      return res.status(400).json({ error: 'Batch and topic are required' });

    const result = await pool.query(
      `INSERT INTO batch_assessment
        (batch_id, student_id, trainer_id, assessment_date, topic_covered,
         no_of_questions_asked, feedback_rating, outcome_remarks,
         session_type, no_of_participants, session_hours, wa_sent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        batch_id,
        student_id        || null,
        req.user.trainerId,
        assessment_date   || new Date(),
        topic_covered,
        no_of_questions_asked || null,
        feedback_rating   || 'good',
        outcome_remarks   || null,
        session_type      || 'weekday',
        no_of_participants || null,
        session_hours     || null,
        wa_sent           || false
      ]
    );
    res.status(201).json({ message: 'Assessment logged', assessment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

// PUT /api/assessments/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      topic_covered, no_of_questions_asked, feedback_rating,
      outcome_remarks, no_of_participants, session_hours,
      session_type, wa_sent
    } = req.body;

    const result = await pool.query(
      `UPDATE batch_assessment SET
        topic_covered         = COALESCE($1, topic_covered),
        no_of_questions_asked = COALESCE($2, no_of_questions_asked),
        feedback_rating       = COALESCE($3, feedback_rating),
        outcome_remarks       = COALESCE($4, outcome_remarks),
        no_of_participants    = COALESCE($5, no_of_participants),
        session_hours         = COALESCE($6, session_hours),
        session_type          = COALESCE($7, session_type),
        wa_sent               = COALESCE($8, wa_sent),
        updated_at            = NOW()
       WHERE id = $9 AND trainer_id = $10
       RETURNING *`,
      [
        topic_covered, no_of_questions_asked, feedback_rating,
        outcome_remarks, no_of_participants, session_hours,
        session_type, wa_sent,
        req.params.id, req.user.trainerId
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Assessment updated', assessment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// DELETE /api/assessments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM batch_assessment WHERE id = $1 AND trainer_id = $2 RETURNING id`,
      [req.params.id, req.user.trainerId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Assessment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

module.exports = router;