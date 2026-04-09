const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const authMiddleware = require('../middleware/auth');

// ─── OFFICE IP CONFIG ─────────────────────────────────────
const OFFICE_IP  = process.env.OFFICE_WIFI_IP || '49.206.9.252';
const allowedIPs = OFFICE_IP.split(',').map(ip => ip.trim());

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress;
  // Strip IPv6 prefix e.g. ::ffff:49.206.9.252 → 49.206.9.252
  ip = ip.replace(/^::ffff:/, '');
  return ip;
}

function checkOfficeWifi(req, res, clientIP) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Client IP  :', clientIP);
  console.log('Allowed IPs:', allowedIPs);
  console.log('Match      :', allowedIPs.includes(clientIP));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!allowedIPs.includes(clientIP)) {
    res.status(403).json({
      success: false,
      message: `Not on office WiFi. Your IP: ${clientIP}. Expected: ${allowedIPs.join(', ')}`
    });
    return false;
  }
  return true;
}

// ─── TEST ROUTE (no auth) ─────────────────────────────────
// GET /api/attendance/my-ip
router.get('/my-ip', (req, res) => {
  const ip = getClientIP(req);
  res.json({
    detected_ip:    ip,
    allowed_ips:    allowedIPs,
    is_office_wifi: allowedIPs.includes(ip),
    raw_forwarded:  req.headers['x-forwarded-for'] || 'none',
    raw_socket:     req.socket.remoteAddress
  });
});

// ─── CHECK-IN ────────────────────────────────────────────
// POST /api/attendance/checkin
router.post('/checkin', authMiddleware, async (req, res) => {
  // Use IP sent from frontend (more reliable since backend is on localhost)
  const clientIP = req.body.clientIP || getClientIP(req);

  if (!checkOfficeWifi(req, res, clientIP)) return;

  const trainerId = req.user.id;
  const today     = new Date().toISOString().split('T')[0];

  try {
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE trainer_id = $1 AND date = $2',
      [trainerId, today]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today.'
      });
    }

    const result = await pool.query(
      `INSERT INTO attendance (trainer_id, date, check_in, ip_address, status)
       VALUES ($1, $2, NOW(), $3, 'present')
       RETURNING *`,
      [trainerId, today, clientIP]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Check-in error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CHECK-OUT ───────────────────────────────────────────
// POST /api/attendance/checkout
router.post('/checkout', authMiddleware, async (req, res) => {
  const clientIP = req.body.clientIP || getClientIP(req);

  if (!checkOfficeWifi(req, res, clientIP)) return;

  const trainerId = req.user.id;
  const today     = new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query(
      `UPDATE attendance
       SET check_out = NOW()
       WHERE trainer_id = $1 AND date = $2 AND check_out IS NULL
       RETURNING *`,
      [trainerId, today]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active check-in found for today.'
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Check-out error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── TODAY STATUS ─────────────────────────────────────────
// GET /api/attendance/today-status
router.get('/today-status', authMiddleware, async (req, res) => {
  const trainerId = req.user.id;
  const today     = new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query(
      'SELECT * FROM attendance WHERE trainer_id = $1 AND date = $2',
      [trainerId, today]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    console.error('Today status error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── MY RECORDS (THIS MONTH) ──────────────────────────────
// GET /api/attendance/my
router.get('/my', authMiddleware, async (req, res) => {
  const trainerId       = req.user.id;
  const { month, year } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM attendance
       WHERE trainer_id = $1
         AND EXTRACT(MONTH FROM date) = COALESCE($2::int, EXTRACT(MONTH FROM NOW()))
         AND EXTRACT(YEAR  FROM date) = COALESCE($3::int, EXTRACT(YEAR  FROM NOW()))
       ORDER BY date DESC`,
      [trainerId, month || null, year || null]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('My records error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ESCALATIONS AGAINST ME ───────────────────────────────
// GET /api/attendance/escalations/against-me
router.get('/escalations/against-me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM escalations
       WHERE trainer_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Escalations error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;