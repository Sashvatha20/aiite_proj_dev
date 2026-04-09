const express = require('express');
const router  = require('express').Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

const nullIfEmpty = v => (v === '' || v === undefined || v === null) ? null : v;

// GET /api/assessments
router.get('/', auth, async (req, res) => {
  try {
    const { batch_id, student_id } = req.query;
    let query = `
      SELECT a.*, b.batch_name, s.candidate_name
      FROM batch_assessment a
      LEFT JOIN batches  b ON a.batch_id   = b.id
      LEFT JOIN students s ON a.student_id = s.id
      WHERE 1=1
    `;
    const params = []; let i = 1;
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

// GET /api/assessments/all — admin view (must be before /:id)
router.get('/all', auth, async (req, res) => {
  try {
    const { batch_id } = req.query;
    let query = `
      SELECT a.*, b.batch_name, s.candidate_name
      FROM batch_assessment a
      LEFT JOIN batches  b ON a.batch_id   = b.id
      LEFT JOIN students s ON a.student_id = s.id
      WHERE 1=1
    `;
    const params = []; let i = 1;
    if (batch_id) { query += ` AND a.batch_id = $${i++}`; params.push(batch_id); }
    query += ` ORDER BY a.assessment_date DESC`;
    const result = await pool.query(query, params);
    res.json({ assessments: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// POST /api/assessments
router.post('/', auth, async (req, res) => {
  try {
    const {
      batch_id, student_id, assessment_date, topic_covered,
      no_of_questions_asked, feedback_rating, outcome_remarks,
      session_type, no_of_participants, session_hours
    } = req.body;

    if (!batch_id || !topic_covered)
      return res.status(400).json({ error: 'Batch and topic are required' });

    const validST     = ['regular', 'crash', 'recorded'];
    const validRating = ['excellent', 'good', 'average', 'needs_improvement'];

    const result = await pool.query(
      `INSERT INTO batch_assessment
        (batch_id, student_id, assessment_date, topic_covered,
         no_of_questions_asked, feedback_rating, outcome_remarks,
         session_type, no_of_participants, session_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        batch_id,
        nullIfEmpty(student_id),
        nullIfEmpty(assessment_date) || new Date(),
        topic_covered,
        nullIfEmpty(no_of_questions_asked),
        validRating.includes(feedback_rating) ? feedback_rating : 'good',
        nullIfEmpty(outcome_remarks),
        validST.includes(session_type) ? session_type : 'regular',
        nullIfEmpty(no_of_participants),
        nullIfEmpty(session_hours),
      ]
    );
    res.status(201).json({ message: 'Assessment logged', assessment: result.rows[0] });
  } catch (err) {
    console.error('Assessment save error:', err.message);
    res.status(500).json({ error: 'Failed to save assessment', detail: err.message });
  }
});

// PUT /api/assessments/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      topic_covered, no_of_questions_asked, feedback_rating,
      outcome_remarks, no_of_participants, session_hours, session_type
    } = req.body;

    const validST     = ['regular', 'crash', 'recorded'];
    const validRating = ['excellent', 'good', 'average', 'needs_improvement'];

    const result = await pool.query(
      `UPDATE batch_assessment SET
        topic_covered         = COALESCE($1, topic_covered),
        no_of_questions_asked = COALESCE($2, no_of_questions_asked),
        feedback_rating       = COALESCE($3, feedback_rating),
        outcome_remarks       = COALESCE($4, outcome_remarks),
        no_of_participants    = COALESCE($5, no_of_participants),
        session_hours         = COALESCE($6, session_hours),
        session_type          = COALESCE($7, session_type),
        updated_at            = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        nullIfEmpty(topic_covered),
        nullIfEmpty(no_of_questions_asked),
        feedback_rating && validRating.includes(feedback_rating) ? feedback_rating : null,
        nullIfEmpty(outcome_remarks),
        nullIfEmpty(no_of_participants),
        nullIfEmpty(session_hours),
        session_type && validST.includes(session_type) ? session_type : null,
        req.params.id
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Assessment not found' });
    res.json({ message: 'Assessment updated', assessment: result.rows[0] });
  } catch (err) {
    console.error('Assessment update error:', err.message);
    res.status(500).json({ error: 'Failed to update assessment', detail: err.message });
  }
});

// DELETE /api/assessments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM batch_assessment WHERE id = $1 RETURNING id`, [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Assessment not found' });
    res.json({ message: 'Assessment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

module.exports = router;