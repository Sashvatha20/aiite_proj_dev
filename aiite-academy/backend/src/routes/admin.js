const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// GET /api/admin/dashboard — all metrics in one call
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    const [
      batchCount, studentCount, enquiryCount,
      escalationCount, placementCount,
      trainerStats, enquiryFunnel, recentEscalations
    ] = await Promise.all([

      // Active batches
      pool.query(`SELECT COUNT(*) FROM batches WHERE status = 'ongoing'`),

      // Total students
      pool.query(`SELECT COUNT(*) FROM students`),

      // Enquiries this month
      pool.query(`
        SELECT COUNT(*) FROM enquiries
        WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR FROM date)  = EXTRACT(YEAR FROM NOW())
      `),

      // Open escalations
      pool.query(`SELECT COUNT(*) FROM escalations WHERE status = 'open'`),

      // Total placed
      pool.query(`SELECT COUNT(*) FROM placements WHERE placed_status = 'placed'`),

      // Trainer star points this month
      pool.query(`
        SELECT t.name, t.id,
          COALESCE(SUM(w.star_points), 0) as total_star_points,
          COALESCE(SUM(w.progressive_working_hours), 0) as total_hours,
          COUNT(w.id) as days_logged,
          COUNT(DISTINCT e.id) as escalation_count
        FROM trainers t
        LEFT JOIN daily_work_log w ON t.id = w.trainer_id
          AND EXTRACT(MONTH FROM w.log_date) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR FROM w.log_date)  = EXTRACT(YEAR FROM NOW())
        LEFT JOIN escalations e ON t.id = e.trainer_id
          AND e.status = 'open'
        GROUP BY t.id, t.name
        ORDER BY total_star_points DESC
      `),

      // Enquiry funnel
      pool.query(`
        SELECT status, COUNT(*) as count
        FROM enquiries
        WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR FROM date)  = EXTRACT(YEAR FROM NOW())
        GROUP BY status
      `),

      // Recent open escalations
      pool.query(`
        SELECT e.*, t.name as trainer_name
        FROM escalations e
        LEFT JOIN trainers t ON e.trainer_id = t.id
        WHERE e.status != 'resolved'
        ORDER BY e.escalation_date DESC
        LIMIT 5
      `)
    ]);

    res.json({
      metrics: {
        active_batches:    parseInt(batchCount.rows[0].count),
        total_students:    parseInt(studentCount.rows[0].count),
        enquiries_month:   parseInt(enquiryCount.rows[0].count),
        open_escalations:  parseInt(escalationCount.rows[0].count),
        total_placed:      parseInt(placementCount.rows[0].count),
      },
      trainer_performance: trainerStats.rows,
      enquiry_funnel:      enquiryFunnel.rows,
      recent_escalations:  recentEscalations.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/trainers — trainer performance table
router.get('/trainers', auth, adminOnly, async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year  || new Date().getFullYear();

    const result = await pool.query(`
      SELECT t.name, t.id, t.phone, u.username, u.is_active,
        COALESCE(SUM(w.star_points), 0)              as total_star_points,
        COALESCE(SUM(w.progressive_working_hours), 0) as total_hours,
        COUNT(DISTINCT w.id)                          as days_logged,
        COUNT(DISTINCT e.id)                          as open_escalations
      FROM trainers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN daily_work_log w ON t.id = w.trainer_id
        AND EXTRACT(MONTH FROM w.log_date) = $1
        AND EXTRACT(YEAR  FROM w.log_date) = $2
      LEFT JOIN escalations e ON t.id = e.trainer_id
        AND e.status = 'open'
      GROUP BY t.id, t.name, t.phone, u.username, u.is_active
      ORDER BY total_star_points DESC
    `, [m, y]);

    res.json({ trainers: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trainer stats' });
  }
});

module.exports = router;