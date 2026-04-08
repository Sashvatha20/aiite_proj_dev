const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// GET /api/batches — list all batches with filters
router.get('/', auth, async (req, res) => {
  try {
    const { status, course_id, trainer_id, search } = req.query;

    let query = `
      SELECT 
        b.id, b.batch_name, b.batch_start_date, b.batch_end_date,
        b.weekday_weekend, b.session_type, b.timing, b.status,
        c.course_name,
        STRING_AGG(DISTINCT t.name, ', ') AS trainers,
        COUNT(DISTINCT s.id) AS student_count,
        bp.last_topic_covered, bp.phase, bp.progress_date
      FROM batches b
      LEFT JOIN courses c ON b.course_id = c.id
      LEFT JOIN batch_trainers bt ON b.id = bt.batch_id
      LEFT JOIN trainers t ON bt.trainer_id = t.id
      LEFT JOIN students s ON b.id = s.batch_id
      LEFT JOIN LATERAL (
        SELECT last_topic_covered, phase, progress_date
        FROM batch_progress
        WHERE batch_id = b.id
        ORDER BY progress_date DESC
        LIMIT 1
      ) bp ON true
      WHERE 1=1
    `;

    const params = [];
    let i = 1;

    if (status) {
      query += ` AND b.status = $${i++}`;
      params.push(status);
    }
    if (course_id) {
      query += ` AND b.course_id = $${i++}`;
      params.push(course_id);
    }
    if (trainer_id) {
      query += ` AND bt.trainer_id = $${i++}`;
      params.push(trainer_id);
    }
    if (search) {
      query += ` AND b.batch_name ILIKE $${i++}`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY b.id, c.course_name, bp.last_topic_covered, bp.phase, bp.progress_date`;
    query += ` ORDER BY b.batch_start_date DESC`;

    const result = await pool.query(query, params);
    res.json({ batches: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// GET /api/batches/:id — single batch with full details
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.course_name,
        STRING_AGG(DISTINCT t.name, ', ') AS trainers
       FROM batches b
       LEFT JOIN courses c ON b.course_id = c.id
       LEFT JOIN batch_trainers bt ON b.id = bt.batch_id
       LEFT JOIN trainers t ON bt.trainer_id = t.id
       WHERE b.id = $1
       GROUP BY b.id, c.course_name`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json({ batch: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch batch' });
  }
});

// POST /api/batches — create new batch
router.post('/', auth, async (req, res) => {
  try {
    const {
      batch_name, course_id, batch_start_date, batch_end_date,
      weekday_weekend, session_type, timing, trainer_ids
    } = req.body;

    if (!batch_name || !course_id) {
      return res.status(400).json({ error: 'Batch name and course are required' });
    }

    const result = await pool.query(
      `INSERT INTO batches 
        (batch_name, course_id, batch_start_date, batch_end_date, 
         weekday_weekend, session_type, timing, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'upcoming')
       RETURNING *`,
      [batch_name, course_id, batch_start_date, batch_end_date,
       weekday_weekend, session_type, timing]
    );

    const batch = result.rows[0];

    // Link trainers to batch
    if (trainer_ids && trainer_ids.length > 0) {
      for (let i = 0; i < trainer_ids.length; i++) {
        await pool.query(
          `INSERT INTO batch_trainers (batch_id, trainer_id, role_in_batch)
           VALUES ($1, $2, $3)`,
          [batch.id, trainer_ids[i], i === 0 ? 'primary' : 'secondary']
        );
      }
    }

    res.status(201).json({ message: 'Batch created successfully', batch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

// PUT /api/batches/:id — update batch
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      batch_name, batch_start_date, batch_end_date,
      weekday_weekend, session_type, timing, status
    } = req.body;

    const result = await pool.query(
      `UPDATE batches SET
        batch_name = COALESCE($1, batch_name),
        batch_start_date = COALESCE($2, batch_start_date),
        batch_end_date = COALESCE($3, batch_end_date),
        weekday_weekend = COALESCE($4, weekday_weekend),
        session_type = COALESCE($5, session_type),
        timing = COALESCE($6, timing),
        status = COALESCE($7, status),
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [batch_name, batch_start_date, batch_end_date,
       weekday_weekend, session_type, timing, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json({ message: 'Batch updated successfully', batch: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

// DELETE /api/batches/:id — admin only
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM batches WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json({ message: 'Batch deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// GET /api/batches/:id/progress — batch progress history
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM batch_progress 
       WHERE batch_id = $1 
       ORDER BY progress_date DESC`,
      [req.params.id]
    );
    res.json({ progress: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// POST /api/batches/:id/progress — add progress update
router.post('/:id/progress', auth, async (req, res) => {
  try {
    const {
      progress_date, last_topic_covered, session_hours,
      phase, phase_completion_date, next_phase_start_date, remarks
    } = req.body;

    const result = await pool.query(
      `INSERT INTO batch_progress
        (batch_id, progress_date, last_topic_covered, session_hours,
         phase, phase_completion_date, next_phase_start_date, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [req.params.id, progress_date, last_topic_covered, session_hours,
       phase, phase_completion_date, next_phase_start_date, remarks]
    );

    // Update batch status if needed
    if (phase === 'completed') {
      await pool.query(
        `UPDATE batches SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [req.params.id]
      );
    } else if (phase) {
      await pool.query(
        `UPDATE batches SET status = 'ongoing', updated_at = NOW() WHERE id = $1`,
        [req.params.id]
      );
    }

    res.status(201).json({ message: 'Progress updated', progress: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// PUT /api/batches/:id/progress/:progressId — edit a progress entry
router.put('/:id/progress/:progressId', auth, async (req, res) => {
  try {
    const {
      last_topic_covered, session_hours, phase,
      phase_completion_date, next_phase_start_date, remarks
    } = req.body;

    const result = await pool.query(
      `UPDATE batch_progress SET
        last_topic_covered = COALESCE($1, last_topic_covered),
        session_hours = COALESCE($2, session_hours),
        phase = COALESCE($3, phase),
        phase_completion_date = COALESCE($4, phase_completion_date),
        next_phase_start_date = COALESCE($5, next_phase_start_date),
        remarks = COALESCE($6, remarks),
        updated_at = NOW()
       WHERE id = $7 AND batch_id = $8
       RETURNING *`,
      [last_topic_covered, session_hours, phase,
       phase_completion_date, next_phase_start_date,
       remarks, req.params.progressId, req.params.id]
    );

    res.json({ message: 'Progress entry updated', progress: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress entry' });
  }
});

module.exports = router;