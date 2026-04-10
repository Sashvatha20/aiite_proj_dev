const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

// GET /api/trainers
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.phone, u.username, u.role, u.is_active
       FROM trainers t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.name`
    );
    res.json({ trainers: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trainers' });
  }
});

// GET /api/trainers/courses
router.get('/courses', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, course_name, fee, duration, mode FROM courses ORDER BY course_name`
    );
    res.json({ courses: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/trainers/dashboard
router.get('/dashboard', auth, async (req, res) => {
  const userId    = req.user.id;
  const trainerId = req.user.trainer_id;

  if (!trainerId) {
    return res.status(403).json({ success: false, error: 'Not a trainer account.' });
  }

  try {
    // 1. Attendance this month
    const attendance = await pool.query(`
      SELECT
        COUNT(*)                                     AS total_days,
        COUNT(*) FILTER (WHERE status = 'present')   AS present,
        COUNT(*) FILTER (WHERE status = 'absent')    AS absent,
        COUNT(*) FILTER (WHERE status = 'late')      AS late
      FROM attendance
      WHERE trainer_id = $1
        AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(YEAR  FROM date) = EXTRACT(YEAR  FROM NOW())
    `, [userId]);

    // 2. Work log this month
    const worklog = await pool.query(`
      SELECT
        COUNT(*)                                      AS total_logs,
        COALESCE(SUM(progressive_working_hours), 0)  AS total_hours,
        COALESCE(SUM(star_points), 0)                AS total_star_points
      FROM daily_work_log
      WHERE trainer_id = $1
        AND EXTRACT(MONTH FROM log_date) = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(YEAR  FROM log_date) = EXTRACT(YEAR  FROM NOW())
    `, [trainerId]);

    // 3. Active batches assigned to trainer
    const batches = await pool.query(`
      SELECT b.id, b.batch_name, b.status,
             b.batch_start_date, b.batch_end_date,
             COUNT(DISTINCT s.id) AS student_count
      FROM batch_trainers bt
      JOIN batches b       ON b.id = bt.batch_id
      LEFT JOIN students s ON s.batch_id = b.id
      WHERE bt.trainer_id = $1
        AND b.status = 'ongoing'
      GROUP BY b.id
      ORDER BY b.batch_start_date DESC
    `, [trainerId]);

    // 4. Recent escalations
    const escalations = await pool.query(`
      SELECT id, description, status, escalation_date, no_of_count
      FROM escalations
      WHERE trainer_id = $1
      ORDER BY escalation_date DESC
      LIMIT 5
    `, [trainerId]);

    // 5. Escalation counts
    const escCount = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open')     AS open,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved
      FROM escalations
      WHERE trainer_id = $1
    `, [trainerId]);

    // 6. Placements via trainer's batches
    const placements = await pool.query(`
      SELECT COUNT(DISTINCT p.id) AS total_placed
      FROM placements p
      JOIN students s        ON s.id = p.student_id
      JOIN batch_trainers bt ON bt.batch_id = s.batch_id
      WHERE bt.trainer_id = $1
        AND p.placed_status = 'placed'
    `, [trainerId]);

    // 7. Student followups via trainer's batches
    const followups = await pool.query(`
      SELECT COUNT(DISTINCT sf.id) AS pending
      FROM student_followups sf
      JOIN students s        ON s.id = sf.student_id
      JOIN batch_trainers bt ON bt.batch_id = s.batch_id
      WHERE bt.trainer_id = $1
    `, [trainerId]);

    // 8. Last 10 attendance records
    const recentAttendance = await pool.query(`
      SELECT date, check_in, check_out, status
      FROM attendance
      WHERE trainer_id = $1
      ORDER BY date DESC
      LIMIT 10
    `, [userId]);

    res.json({
      success: true,
      data: {
        attendance:        attendance.rows[0],
        worklog:           worklog.rows[0],
        batches:           batches.rows,
        escalations:       escalations.rows,
        esc_counts:        escCount.rows[0],
        placements:        placements.rows[0],
        followups:         followups.rows[0],
        recent_attendance: recentAttendance.rows,
      }
    });

  } catch (err) {
    console.error('🔴 Trainer dashboard error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;