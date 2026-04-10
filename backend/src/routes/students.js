const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// GET /api/students — list with filters
router.get('/', auth, async (req, res) => {
  try {
    const { batch_id, search } = req.query;

    let query = `
      SELECT s.*, b.batch_name, c.course_name,
        b.batch_start_date, b.batch_end_date
      FROM students s
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN courses c ON b.course_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let i = 1;

    if (batch_id) {
      query += ` AND s.batch_id = $${i++}`;
      params.push(batch_id);
    }
    if (search) {
      query += ` AND (s.candidate_name ILIKE $${i} OR s.phone ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    query += ` ORDER BY s.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ students: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/students/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, b.batch_name, c.course_name
       FROM students s
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN courses c ON b.course_id = c.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ student: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// POST /api/students — enroll student
router.post('/', auth, async (req, res) => {
  try {
    const {
      batch_id, candidate_name, phone,
      email, whatsapp_number, certificate_no
    } = req.body;

    if (!batch_id || !candidate_name) {
      return res.status(400).json({ error: 'Batch and candidate name are required' });
    }

    // Auto-generate certificate number if not provided
    let certNo = certificate_no;
    if (!certNo) {
      const countResult = await pool.query('SELECT COUNT(*) FROM students');
      const count = parseInt(countResult.rows[0].count) + 98;
      certNo = `AiiTENCS${String(count).padStart(4, '0')}`;
    }

    const result = await pool.query(
      `INSERT INTO students
        (batch_id, candidate_name, phone, email, whatsapp_number, certificate_no)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [batch_id, candidate_name, phone, email, whatsapp_number, certNo]
    );

    res.status(201).json({ message: 'Student enrolled successfully', student: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

// PUT /api/students/:id — edit student
router.put('/:id', auth, async (req, res) => {
  try {
    const { candidate_name, phone, email, whatsapp_number, batch_id } = req.body;

    const result = await pool.query(
      `UPDATE students SET
        candidate_name  = COALESCE($1, candidate_name),
        phone           = COALESCE($2, phone),
        email           = COALESCE($3, email),
        whatsapp_number = COALESCE($4, whatsapp_number),
        batch_id        = COALESCE($5, batch_id),
        updated_at      = NOW()
       WHERE id = $6
       RETURNING *`,
      [candidate_name, phone, email, whatsapp_number, batch_id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully', student: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/students/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    res.json({ message: 'Student removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

module.exports = router;