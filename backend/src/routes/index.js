const express = require('express');
const router  = express.Router();
const db      = require('../db'); // your db connection

// ════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await db.query(
    `SELECT u.*, r.role_name FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.username = ? AND u.password = ?`,
    [username, password]
  );
  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ user: rows[0] });
});

// ════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════

// GET /api/dashboard
router.get('/dashboard', async (req, res) => {
  const [[students]]   = await db.query(`SELECT COUNT(*) AS count FROM students`);
  const [[enquiries]]  = await db.query(`SELECT COUNT(*) AS count FROM enquiries`);
  const [[trainers]]   = await db.query(`SELECT COUNT(*) AS count FROM trainers WHERE is_active = 1`);
  const [[placements]] = await db.query(`SELECT COUNT(*) AS count FROM placements WHERE placed_status = 'placed'`);
  const [[revenue]]    = await db.query(`SELECT COALESCE(SUM(paid_amount),0) AS total FROM students`);
  const [[pending]]    = await db.query(`SELECT COALESCE(SUM(total_fee - paid_amount),0) AS total FROM students`);

  const [recentStudents] = await db.query(
    `SELECT s.*, b.batch_name FROM students s
     LEFT JOIN batches b ON b.id = s.batch_id
     ORDER BY s.created_at DESC LIMIT 5`
  );
  const [recentEnquiries] = await db.query(
    `SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 5`
  );

  res.json({
    stats: {
      students:   students.count,
      enquiries:  enquiries.count,
      trainers:   trainers.count,
      placements: placements.count,
      revenue:    revenue.total,
      pending:    pending.total,
    },
    recentStudents,
    recentEnquiries,
  });
});

// ════════════════════════════════════════════════
// COURSES
// ════════════════════════════════════════════════

// GET /api/courses
router.get('/courses', async (req, res) => {
  const [rows] = await db.query(`SELECT * FROM courses ORDER BY course_name`);
  res.json({ courses: rows });
});

// POST /api/courses
router.post('/courses', async (req, res) => {
  const { course_name, description } = req.body;
  const [r] = await db.query(
    `INSERT INTO courses (course_name, description) VALUES (?, ?)`,
    [course_name, description]
  );
  res.json({ id: r.insertId });
});

// ════════════════════════════════════════════════
// BATCHES
// ════════════════════════════════════════════════

// GET /api/batches
router.get('/batches', async (req, res) => {
  const [rows] = await db.query(
    `SELECT b.*, c.course_name,
       (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) AS student_count
     FROM batches b
     LEFT JOIN courses c ON c.id = b.course_id
     ORDER BY b.created_at DESC`
  );
  res.json({ batches: rows });
});

// POST /api/batches
router.post('/batches', async (req, res) => {
  const { batch_name, course_id, start_date, end_date, timing, status } = req.body;
  const [r] = await db.query(
    `INSERT INTO batches (batch_name, course_id, start_date, end_date, timing, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [batch_name, course_id, start_date, end_date, timing, status || 'active']
  );
  res.json({ id: r.insertId });
});

// PUT /api/batches/:id
router.put('/batches/:id', async (req, res) => {
  const fields = ['batch_name','course_id','start_date','end_date','timing','status'];
  const updates = fields.filter(f => req.body[f] !== undefined)
    .map(f => `${f} = ?`).join(', ');
  const values  = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);
  await db.query(`UPDATE batches SET ${updates} WHERE id = ?`, [...values, req.params.id]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════
// STUDENTS
// ════════════════════════════════════════════════

// GET /api/students
router.get('/students', async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.*, b.batch_name, c.course_name
     FROM students s
     LEFT JOIN batches b ON b.id = s.batch_id
     LEFT JOIN courses c ON c.id = s.course_id
     ORDER BY s.created_at DESC`
  );
  res.json({ students: rows });
});

// GET /api/students/:id
router.get('/students/:id', async (req, res) => {
  const [[row]] = await db.query(
    `SELECT s.*, b.batch_name, c.course_name
     FROM students s
     LEFT JOIN batches b ON b.id = s.batch_id
     LEFT JOIN courses c ON c.id = s.course_id
     WHERE s.id = ?`,
    [req.params.id]
  );
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ student: row });
});

// POST /api/students
router.post('/students', async (req, res) => {
  const {
    candidate_name, phone, email, course_id, batch_id,
    total_fee, paid_amount, join_date, placement_status
  } = req.body;
  const [r] = await db.query(
    `INSERT INTO students
       (candidate_name, phone, email, course_id, batch_id,
        total_fee, paid_amount, join_date, placement_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [candidate_name, phone, email, course_id || null, batch_id || null,
     total_fee || 0, paid_amount || 0, join_date || null, placement_status || 'not_placed']
  );
  res.json({ id: r.insertId });
});

// PUT /api/students/:id
router.put('/students/:id', async (req, res) => {
  const fields = ['candidate_name','phone','email','course_id','batch_id',
                  'total_fee','paid_amount','join_date','placement_status'];
  const updates = fields.filter(f => req.body[f] !== undefined)
    .map(f => `${f} = ?`).join(', ');
  const values  = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);
  await db.query(`UPDATE students SET ${updates} WHERE id = ?`, [...values, req.params.id]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════
// FEE PAYMENTS
// ════════════════════════════════════════════════

// GET /api/fee-payments?student_id=X
router.get('/fee-payments', async (req, res) => {
  const { student_id } = req.query;
  const where = student_id ? 'WHERE student_id = ?' : '';
  const params = student_id ? [student_id] : [];
  const [rows] = await db.query(
    `SELECT * FROM fee_payments ${where} ORDER BY payment_date DESC`,
    params
  );
  res.json({ payments: rows });
});

// POST /api/fee-payments
router.post('/fee-payments', async (req, res) => {
  const { student_id, amount, payment_date, notes } = req.body;
  const [r] = await db.query(
    `INSERT INTO fee_payments (student_id, amount, payment_date, notes)
     VALUES (?, ?, ?, ?)`,
    [student_id, amount, payment_date, notes || null]
  );
  // Update paid_amount on students table
  await db.query(
    `UPDATE students SET paid_amount = paid_amount + ? WHERE id = ?`,
    [amount, student_id]
  );
  res.json({ id: r.insertId });
});

// ════════════════════════════════════════════════
// STUDENT FOLLOW-UPS
// ════════════════════════════════════════════════

// GET /api/student-followups?student_id=X  (omit param = all)
router.get('/student-followups', async (req, res) => {
  const { student_id } = req.query;
  const where  = student_id ? 'WHERE sf.student_id = ?' : '';
  const params = student_id ? [student_id] : [];
  const [rows] = await db.query(
    `SELECT sf.*, s.candidate_name, s.phone, b.batch_name
     FROM student_followups sf
     LEFT JOIN students s ON s.id = sf.student_id
     LEFT JOIN batches  b ON b.id = s.batch_id
     ${where}
     ORDER BY sf.followup_date DESC`,
    params
  );
  res.json({ followups: rows });
});

// POST /api/student-followups
router.post('/student-followups', async (req, res) => {
  const { student_id, notes, followup_date } = req.body;
  const [r] = await db.query(
    `INSERT INTO student_followups (student_id, notes, followup_date)
     VALUES (?, ?, ?)`,
    [student_id, notes, followup_date]
  );
  res.json({ id: r.insertId });
});

// DELETE /api/student-followups/:id
router.delete('/student-followups/:id', async (req, res) => {
  await db.query(`DELETE FROM student_followups WHERE id = ?`, [req.params.id]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════
// ENQUIRIES
// ════════════════════════════════════════════════

// GET /api/enquiries
router.get('/enquiries', async (req, res) => {
  const [rows] = await db.query(
    `SELECT * FROM enquiries ORDER BY created_at DESC`
  );
  res.json({ enquiries: rows });
});

// POST /api/enquiries
router.post('/enquiries', async (req, res) => {
  const { name, contact, email, course_enquired_for, enquiry_mode, status, date, notes } = req.body;
  const [r] = await db.query(
    `INSERT INTO enquiries
       (name, contact, email, course_enquired_for, enquiry_mode, status, date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, contact, email || null, course_enquired_for || null,
     enquiry_mode || 'call', status || 'new', date, notes || null]
  );
  res.json({ id: r.insertId });
});

// PUT /api/enquiries/:id
router.put('/enquiries/:id', async (req, res) => {
  const fields = ['name','contact','email','course_enquired_for',
                  'enquiry_mode','status','date','notes'];
  const updates = fields.filter(f => req.body[f] !== undefined)
    .map(f => `${f} = ?`).join(', ');
  const values  = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);
  await db.query(`UPDATE enquiries SET ${updates} WHERE id = ?`, [...values, req.params.id]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════
// ENQUIRY FOLLOW-UPS
// ════════════════════════════════════════════════

// GET /api/enquiry-followups?enquiry_id=X  (omit param = all)
router.get('/enquiry-followups', async (req, res) => {
  const { enquiry_id } = req.query;
  const where  = enquiry_id ? 'WHERE ef.enquiry_id = ?' : '';
  const params = enquiry_id ? [enquiry_id] : [];
  const [rows] = await db.query(
    `SELECT ef.*, e.name, e.contact, e.course_enquired_for
     FROM enquiry_followups ef
     LEFT JOIN enquiries e ON e.id = ef.enquiry_id
     ${where}
     ORDER BY ef.followup_date DESC`,
    params
  );
  res.json({ followups: rows });
});

// POST /api/enquiry-followups
router.post('/enquiry-followups', async (req, res) => {
  const { enquiry_id, notes, followup_date, next_followup_date } = req.body;
  const [r] = await db.query(
    `INSERT INTO enquiry_followups
       (enquiry_id, notes, followup_date, next_followup_date)
     VALUES (?, ?, ?, ?)`,
    [enquiry_id, notes, followup_date, next_followup_date || null]
  );
  res.json({ id: r.insertId });
});

// DELETE /api/enquiry-followups/:id
router.delete('/enquiry-followups/:id', async (req, res) => {
  await db.query(`DELETE FROM enquiry_followups WHERE id = ?`, [req.params.id]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════
// TRAINERS
// ════════════════════════════════════════════════

// GET /api/trainers
router.get('/trainers', async (req, res) => {
  const [rows] = await db.query(`SELECT id, name, phone, username, is_active FROM trainers`);
  res.json({ trainers: rows });
});

// GET /api/admin/trainers?month=4&year=2026
router.get('/admin/trainers', async (req, res) => {
  const { month, year } = req.query;
  const [rows] = await db.query(
    `SELECT t.*,
       COUNT(DISTINCT wl.id)              AS work_logs,
       COALESCE(SUM(wl.progressive_working_hours), 0) AS total_hours,
       COALESCE(SUM(wl.star_points), 0)   AS star_points,
       (SELECT COUNT(*) FROM escalations e
        WHERE e.trainer_id = t.id AND e.status = 'open') AS open_escalations
     FROM trainers t
     LEFT JOIN work_logs wl
       ON wl.trainer_id = t.id
       AND MONTH(wl.log_date) = ?
       AND YEAR(wl.log_date)  = ?
     GROUP BY t.id
     ORDER BY star_points DESC`,
    [month, year]
  );
  res.json({ trainers: rows });
});

// POST /api/trainers
router.post('/trainers', async (req, res) => {
  const { name, phone, username, password } = req.body;
  // Check username unique
  const [[existing]] = await db.query(
    `SELECT id FROM trainers WHERE username = ?`, [username]
  );
  if (existing) return res.status(400).json({ error: 'Username already taken' });
  const [r] = await db.query(
    `INSERT INTO trainers (name, phone, username, password, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [name, phone, username, password]
  );
  res.json({ id: r.insertId });
});

// PUT /api/trainers/:id
router.put('/trainers/:id', async (req, res) => {
  const fields = ['name','phone','username','password','is_active'];
  const updates = fields.filter(f => req.body[f] !== undefined)
    .map(f => `${f} = ?`).join(', ');
  const values  = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);
  await db.query(`UPDATE trainers SET ${updates} WHERE id = ?`, [...values, req.params.id]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════
// WORK LOGS
// ════════════════════════════════════════════════

// GET /api/worklog?trainer_id=X&month=4&year=2026
router.get('/worklog', async (req, res) => {
  const { trainer_id, month, year } = req.query;
  const conditions = [];
  const params     = [];

  if (trainer_id) { conditions.push('wl.trainer_id = ?'); params.push(trainer_id); }
  if (month)      { conditions.push('MONTH(wl.log_date) = ?'); params.push(month); }
  if (year)       { conditions.push('YEAR(wl.log_date) = ?');  params.push(year); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT wl.*, b.batch_name, t.name AS trainer_name
     FROM work_logs wl
     LEFT JOIN batches  b ON b.id = wl.batch_id
     LEFT JOIN trainers t ON t.id = wl.trainer_id
     ${where}
     ORDER BY wl.log_date DESC`,
    params
  );
  res.json({ logs: rows });
});

// POST /api/worklog
router.post('/worklog', async (req, res) => {
  const {
    trainer_id, batch_id, log_date,
    work_description, progressive_working_hours, star_points
  } = req.body;
  const [r] = await db.query(
    `INSERT INTO work_logs
       (trainer_id, batch_id, log_date, work_description,
        progressive_working_hours, star_points)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [trainer_id, batch_id || null, log_date,
     work_description, progressive_working_hours || 0, star_points || 0]
  );
  res.json({ id: r.insertId });
});

// ════════════════════════════════════════════════
// ESCALATIONS
// ════════════════════════════════════════════════

// GET /api/escalations?trainer_id=X
router.get('/escalations', async (req, res) => {
  const { trainer_id } = req.query;
  const where  = trainer_id ? 'WHERE e.trainer_id = ?' : '';
  const params = trainer_id ? [trainer_id] : [];
  const [rows] = await db.query(
    `SELECT e.*, t.name AS trainer_name
     FROM escalations e
     LEFT JOIN trainers t ON t.id = e.trainer_id
     ${where}
     ORDER BY e.escalation_date DESC`,
    params
  );
  res.json({ escalations: rows });
});

// POST /api/escalations
router.post('/escalations', async (req, res) => {
  const { trainer_id, description, reported_by, escalation_date, no_of_count } = req.body;
  const [r] = await db.query(
    `INSERT INTO escalations
       (trainer_id, description, reported_by, escalation_date, no_of_count, status)
     VALUES (?, ?, ?, ?, ?, 'open')`,
    [trainer_id, description, reported_by || null,
     escalation_date || new Date().toISOString().split('T')[0], no_of_count || 1]
  );
  res.json({ id: r.insertId });
});

// PUT /api/escalations/:id
router.put('/escalations/:id', async (req, res) => {
  const { status, resolution_notes } = req.body;
  await db.query(
    `UPDATE escalations SET status = ?, resolution_notes = ? WHERE id = ?`,
    [status, resolution_notes || null, req.params.id]
  );
  res.json({ success: true });
});

// ════════════════════════════════════════════════
// PLACEMENTS
// ════════════════════════════════════════════════

// GET /api/placements
router.get('/placements', async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, s.candidate_name, s.phone, b.batch_name
     FROM placements p
     LEFT JOIN students s ON s.id = p.student_id
     LEFT JOIN batches  b ON b.id = s.batch_id
     ORDER BY p.placed_date DESC`
  );
  res.json({ placements: rows });
});

// POST /api/placements
router.post('/placements', async (req, res) => {
  const { student_id, company_name, role, package_lpa, placed_date, placed_status, notes } = req.body;
  const [r] = await db.query(
    `INSERT INTO placements
       (student_id, company_name, role, package_lpa, placed_date, placed_status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [student_id, company_name, role || null, package_lpa || null,
     placed_date, placed_status || 'placed', notes || null]
  );
  // Update student placement_status
  await db.query(
    `UPDATE students SET placement_status = ? WHERE id = ?`,
    [placed_status || 'placed', student_id]
  );
  res.json({ id: r.insertId });
});

// PUT /api/placements/:id
router.put('/placements/:id', async (req, res) => {
  const fields = ['company_name','role','package_lpa','placed_date','placed_status','notes'];
  const updates = fields.filter(f => req.body[f] !== undefined)
    .map(f => `${f} = ?`).join(', ');
  const values  = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);
  await db.query(`UPDATE placements SET ${updates} WHERE id = ?`, [...values, req.params.id]);
  res.json({ success: true });
});

// DELETE /api/placements/:id
router.delete('/placements/:id', async (req, res) => {
  await db.query(`DELETE FROM placements WHERE id = ?`, [req.params.id]);
  res.json({ success: true });
});

module.exports = router;