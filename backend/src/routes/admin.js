const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard
// ─────────────────────────────────────────────────────────────────────
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    const [
      batchCount, studentCount, trainerCount, enquiryCount,
      escalationCount, placementCount,
      feeCollectedRes, feePendingRes,
      trainerPerf, enquiryFunnel, recentEscalations,
      enquiryTrend, feeTrend, placementTrend,
      overdueFees, staleEnquiries, inactiveBatches,
      todayLogs, todayActiveTrainers, todayEnquiries,
      todayFeeRes, todayStudents, todayPlacements,
    ] = await Promise.all([

      // ── KPI counts ──────────────────────────────────────────────────
      pool.query(`SELECT COUNT(*) FROM batches WHERE status = 'ongoing'`),
      pool.query(`SELECT COUNT(*) FROM students`),
      pool.query(`SELECT COUNT(*) FROM trainers`),
      pool.query(`
        SELECT COUNT(*) FROM enquiries
        WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR  FROM date) = EXTRACT(YEAR  FROM NOW())
      `),
      pool.query(`SELECT COUNT(*) FROM escalations WHERE status = 'open'`),
      pool.query(`SELECT COUNT(*) FROM placements WHERE placed_status = 'placed'`),

      // ── Fee KPIs ─────────────────────────────────────────────────────
      pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total FROM fee_payments
        WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR  FROM payment_date) = EXTRACT(YEAR  FROM NOW())
      `),
      pool.query(`
        SELECT COALESCE(SUM(s.total_fee - COALESCE(fp.paid, 0)), 0) AS total
        FROM students s
        LEFT JOIN (
          SELECT student_id, SUM(amount) AS paid FROM fee_payments GROUP BY student_id
        ) fp ON fp.student_id = s.id
        WHERE s.total_fee > COALESCE(fp.paid, 0)
      `),

      // ── Trainer performance ──────────────────────────────────────────
      pool.query(`
        SELECT
          t.id, t.name AS trainer_name,
          COUNT(DISTINCT w.id)                           AS work_logs,
          COALESCE(SUM(w.progressive_working_hours), 0)  AS total_hours,
          COALESCE(SUM(w.star_points), 0)                AS star_points,
          COUNT(DISTINCT e.id)                           AS open_escalations
        FROM trainers t
        LEFT JOIN daily_work_log w ON t.id = w.trainer_id
          AND EXTRACT(MONTH FROM w.log_date) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR  FROM w.log_date) = EXTRACT(YEAR  FROM NOW())
        LEFT JOIN escalations e ON t.id = e.trainer_id AND e.status = 'open'
        GROUP BY t.id, t.name
        ORDER BY work_logs DESC
      `),

      // ── Enquiry funnel ───────────────────────────────────────────────
      pool.query(`
        SELECT status, COUNT(*) AS count FROM enquiries
        WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR  FROM date) = EXTRACT(YEAR  FROM NOW())
        GROUP BY status
      `),

      // ── Recent open escalations ──────────────────────────────────────
      pool.query(`
        SELECT e.*, t.name AS trainer_name FROM escalations e
        LEFT JOIN trainers t ON e.trainer_id = t.id
        WHERE e.status != 'resolved'
        ORDER BY e.escalation_date DESC LIMIT 5
      `),

      // ── Chart 1: Enquiries vs Enrollments ────────────────────────────
      pool.query(`
        WITH months AS (
          SELECT generate_series(
            DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
            DATE_TRUNC('month', NOW()), '1 month'
          ) AS month
        )
        SELECT
          TO_CHAR(m.month, 'Mon YY') AS label,
          COALESCE(e.enquiries,   0) AS enquiries,
          COALESCE(s.enrollments, 0) AS enrollments
        FROM months m
        LEFT JOIN (
          SELECT DATE_TRUNC('month', date) AS month, COUNT(*) AS enquiries
          FROM enquiries GROUP BY 1
        ) e ON e.month = m.month
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS enrollments
          FROM students GROUP BY 1
        ) s ON s.month = m.month
        ORDER BY m.month
      `),

      // ── Chart 2: Fee Collection ──────────────────────────────────────
      pool.query(`
        WITH months AS (
          SELECT generate_series(
            DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
            DATE_TRUNC('month', NOW()), '1 month'
          ) AS month
        )
        SELECT
          TO_CHAR(m.month, 'Mon YY') AS label,
          COALESCE(f.collected, 0)   AS collected
        FROM months m
        LEFT JOIN (
          SELECT DATE_TRUNC('month', payment_date) AS month, SUM(amount) AS collected
          FROM fee_payments GROUP BY 1
        ) f ON f.month = m.month
        ORDER BY m.month
      `),

      // ── Chart 3: Placements ──────────────────────────────────────────
      pool.query(`
        WITH months AS (
          SELECT generate_series(
            DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
            DATE_TRUNC('month', NOW()), '1 month'
          ) AS month
        )
        SELECT
          TO_CHAR(m.month, 'Mon YY') AS label,
          COALESCE(p.placements, 0)  AS placements
        FROM months m
        LEFT JOIN (
          SELECT DATE_TRUNC('month', placed_date) AS month, COUNT(*) AS placements
          FROM placements WHERE placed_status = 'placed' GROUP BY 1
        ) p ON p.month = m.month
        ORDER BY m.month
      `),

      // ── Alert 1: Overdue Fees ─────────────────────────────────────────
      pool.query(`
        SELECT
          s.id, s.candidate_name, s.phone, s.total_fee,
          COALESCE(fp.paid, 0)               AS paid_amount,
          s.total_fee - COALESCE(fp.paid, 0) AS pending_amount,
          fp.last_payment                    AS last_payment_date,
          CURRENT_DATE - fp.last_payment::date AS days_since_payment
        FROM students s
        LEFT JOIN (
          SELECT student_id, SUM(amount) AS paid, MAX(payment_date) AS last_payment
          FROM fee_payments GROUP BY student_id
        ) fp ON fp.student_id = s.id
        WHERE s.total_fee > COALESCE(fp.paid, 0)
          AND (fp.last_payment IS NULL OR (CURRENT_DATE - fp.last_payment::date) > 30)
        ORDER BY pending_amount DESC
        LIMIT 10
      `),

      // ── Alert 2: Stale Enquiries ──────────────────────────────────────
      pool.query(`
        SELECT
          e.id, e.name, e.contact, e.course_enquired_for, e.status,
          e.date AS enquiry_date,
          MAX(f.followup_date) AS last_followup,
          CURRENT_DATE - MAX(f.followup_date) AS days_since_followup
        FROM enquiries e
        LEFT JOIN enquiry_followups f ON f.enquiry_id = e.id
        WHERE e.status NOT IN ('converted', 'not_interested', 'closed')
        GROUP BY e.id, e.name, e.contact, e.course_enquired_for, e.status, e.date
        HAVING (MAX(f.followup_date) IS NULL OR (CURRENT_DATE - MAX(f.followup_date)) >= 3)
        ORDER BY days_since_followup DESC NULLS FIRST
        LIMIT 10
      `),

      // ── Alert 3: Inactive Batches ─────────────────────────────────────
      pool.query(`
        SELECT
          b.id, b.batch_name, b.batch_start_date, b.timing,
          MAX(w.log_date) AS last_log_date,
          CURRENT_DATE - MAX(w.log_date) AS days_since_log
        FROM batches b
        LEFT JOIN daily_work_log w ON w.batch_id = b.id
        WHERE b.status = 'ongoing'
        GROUP BY b.id, b.batch_name, b.batch_start_date, b.timing
        HAVING (MAX(w.log_date) IS NULL OR (CURRENT_DATE - MAX(w.log_date)) >= 7)
        ORDER BY days_since_log DESC NULLS FIRST
        LIMIT 10
      `),

      // ── Today's Summary ───────────────────────────────────────────────
      pool.query(`SELECT COUNT(*) FROM daily_work_log WHERE log_date = CURRENT_DATE`),
      pool.query(`SELECT COUNT(DISTINCT trainer_id) FROM daily_work_log WHERE log_date = CURRENT_DATE`),
      pool.query(`SELECT COUNT(*) FROM enquiries WHERE date::date = CURRENT_DATE`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM fee_payments WHERE payment_date::date = CURRENT_DATE`),
      pool.query(`SELECT COUNT(*) FROM students WHERE created_at::date = CURRENT_DATE`),
      pool.query(`SELECT COUNT(*) FROM placements WHERE placed_date = CURRENT_DATE AND placed_status = 'placed'`),
    ]);

    res.json({
      metrics: {
        active_batches:   parseInt(batchCount.rows[0].count),
        total_students:   parseInt(studentCount.rows[0].count),
        total_trainers:   parseInt(trainerCount.rows[0].count),
        enquiries_month:  parseInt(enquiryCount.rows[0].count),
        open_escalations: parseInt(escalationCount.rows[0].count),
        total_placed:     parseInt(placementCount.rows[0].count),
        fee_collected:    parseFloat(feeCollectedRes.rows[0].total),
        fee_pending:      parseFloat(feePendingRes.rows[0].total),
      },
      trainer_performance: trainerPerf.rows,
      enquiry_funnel:      enquiryFunnel.rows,
      recent_escalations:  recentEscalations.rows,
      charts: {
        enquiry_trend:   enquiryTrend.rows,
        fee_trend:       feeTrend.rows,
        placement_trend: placementTrend.rows,
      },
      alerts: {
        overdue_fees:     overdueFees.rows,
        stale_enquiries:  staleEnquiries.rows,
        inactive_batches: inactiveBatches.rows,
      },
      today: {
        work_logs:       parseInt(todayLogs.rows[0].count),
        active_trainers: parseInt(todayActiveTrainers.rows[0].count),
        enquiries:       parseInt(todayEnquiries.rows[0].count),
        fee_collected:   parseFloat(todayFeeRes.rows[0].total),
        students_joined: parseInt(todayStudents.rows[0].count),
        placements:      parseInt(todayPlacements.rows[0].count),
      },
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/trainers
// ─────────────────────────────────────────────────────────────────────
router.get('/trainers', auth, adminOnly, async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year  || new Date().getFullYear();

    const result = await pool.query(`
      SELECT
        t.id, t.name, t.phone, u.username, u.is_active,
        COUNT(DISTINCT w.id)                           AS work_logs,
        COALESCE(SUM(w.progressive_working_hours), 0)  AS total_hours,
        COALESCE(SUM(w.star_points), 0)                AS star_points,
        COUNT(DISTINCT e.id)                           AS open_escalations
      FROM trainers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN daily_work_log w ON t.id = w.trainer_id
        AND EXTRACT(MONTH FROM w.log_date) = $1
        AND EXTRACT(YEAR  FROM w.log_date) = $2
      LEFT JOIN escalations e ON t.id = e.trainer_id AND e.status = 'open'
      GROUP BY t.id, t.name, t.phone, u.username, u.is_active
      ORDER BY work_logs DESC
    `, [m, y]);

    res.json({ trainers: result.rows });
  } catch (err) {
    console.error('Trainers error:', err);
    res.status(500).json({ error: 'Failed to fetch trainer stats' });
  }
});

module.exports = router;