const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

// GET /api/worklog — trainer's own log history
router.get('/', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = `
      SELECT w.*, b.batch_name, t.name as trainer_name
      FROM daily_work_log w
      LEFT JOIN batches b ON w.batch_id = b.id
      LEFT JOIN trainers t ON w.trainer_id = t.id
      WHERE w.trainer_id = $1
    `;
    const params = [req.user.trainerId];
    let i = 2;

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM w.log_date) = $${i++}
                 AND EXTRACT(YEAR FROM w.log_date) = $${i++}`;
      params.push(month, year);
    }

    query += ` ORDER BY w.log_date DESC`;
    const result = await pool.query(query, params);
    res.json({ logs: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch work logs' });
  }
});

// GET /api/worklog/all — admin sees all trainers
router.get('/all', auth, async (req, res) => {
  try {
    const { trainer_id, month, year } = req.query;
    let query = `
      SELECT w.*, b.batch_name, t.name as trainer_name
      FROM daily_work_log w
      LEFT JOIN batches b ON w.batch_id = b.id
      LEFT JOIN trainers t ON w.trainer_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (trainer_id) {
      query += ` AND w.trainer_id = $${i++}`;
      params.push(trainer_id);
    }
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM w.log_date) = $${i++}
                 AND EXTRACT(YEAR FROM w.log_date) = $${i++}`;
      params.push(month, year);
    }

    query += ` ORDER BY w.log_date DESC`;
    const result = await pool.query(query, params);
    res.json({ logs: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all logs' });
  }
});

// POST /api/worklog — submit daily log + sync to Google Sheets
router.post('/', auth, async (req, res) => {
  try {
    const {
      log_date, batch_id, work_description,
      progressive_working_hours, star_points,
      wa_sent
    } = req.body;

    if (!log_date || !work_description) {
      return res.status(400).json({ error: 'Date and work description are required' });
    }

    // 1 — Save to database
    const result = await pool.query(
      `INSERT INTO daily_work_log
        (trainer_id, batch_id, log_date, work_description,
         progressive_working_hours, star_points, wa_sent)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [req.user.trainerId, batch_id, log_date, work_description,
       progressive_working_hours, star_points, wa_sent || false]
    );

    const log = result.rows[0];

    // 2 — Get trainer name
    const trainerResult = await pool.query(
      'SELECT name FROM trainers WHERE id = $1',
      [req.user.trainerId]
    );
    const trainerName = trainerResult.rows[0]?.name || req.user.username;

    // 3 — Sync to Google Sheets (Employee Performance Tracker)
    try {
      const { appendRow } = require('../services/sheetsService');
      await appendRow(
        process.env.SHEET_EMPLOYEE_TRACKER_ID,
        'Month',
        [
          log_date,
          trainerName,
          work_description,
          progressive_working_hours,
          star_points,
          wa_sent ? 'Yes' : 'No'
        ]
      );
    } catch (sheetErr) {
      // Sheets sync failed but DB save succeeded — don't block the response
      console.error('Sheets sync error:', sheetErr.message);
    }

    res.status(201).json({
      message: 'Work log saved and synced to sheets',
      log
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save work log' });
  }
});

// PUT /api/worklog/:id — edit log
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      work_description, progressive_working_hours,
      star_points, batch_id
    } = req.body;

    const result = await pool.query(
      `UPDATE daily_work_log SET
        work_description          = COALESCE($1, work_description),
        progressive_working_hours = COALESCE($2, progressive_working_hours),
        star_points               = COALESCE($3, star_points),
        batch_id                  = COALESCE($4, batch_id),
        updated_at                = NOW()
       WHERE id = $5 AND trainer_id = $6
       RETURNING *`,
      [work_description, progressive_working_hours,
       star_points, batch_id, req.params.id, req.user.trainerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({ message: 'Log updated successfully', log: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update log' });
  }
});

module.exports = router;