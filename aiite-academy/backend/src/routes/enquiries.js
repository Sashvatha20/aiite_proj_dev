const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

// GET /api/enquiries
router.get('/', auth, async (req, res) => {
  try {
    const { status, trainer_id, list_type, search, month, year } = req.query;
    let query = `
      SELECT e.*, t.name as assigned_trainer_name
      FROM enquiries e
      LEFT JOIN trainers t ON e.assigned_trainer_id = t.id
      WHERE 1=1
    `;
    const params = []; let i = 1;
    if (status)     { query += ` AND e.status = $${i++}`;                           params.push(status); }
    if (trainer_id) { query += ` AND e.assigned_trainer_id = $${i++}`;              params.push(trainer_id); }
    if (list_type)  { query += ` AND e.list_type = $${i++}`;                        params.push(list_type); }
    if (search)     { query += ` AND (e.name ILIKE $${i} OR e.contact ILIKE $${i})`; params.push(`%${search}%`); i++; }
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM e.date) = $${i++} AND EXTRACT(YEAR FROM e.date) = $${i++}`;
      params.push(month, year);
    }
    query += ` ORDER BY e.created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ enquiries: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// GET /api/enquiries/count/daily — MUST be before /:id routes
router.get('/count/daily', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM enquiry_daily_count ORDER BY date DESC LIMIT 30`
    );
    res.json({ counts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily counts' });
  }
});

// POST /api/enquiries/count/daily
router.post('/count/daily', auth, async (req, res) => {
  try {
    const { date, call_enquiries, walk_in_enquiries, course_suggested_by_us, remarks } = req.body;
    const total = (parseInt(call_enquiries) || 0) + (parseInt(walk_in_enquiries) || 0);
    const result = await pool.query(
      `INSERT INTO enquiry_daily_count
        (date, call_enquiries, walk_in_enquiries, total_enquiries, course_suggested_by_us, remarks)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (date) DO UPDATE SET
        call_enquiries         = EXCLUDED.call_enquiries,
        walk_in_enquiries      = EXCLUDED.walk_in_enquiries,
        total_enquiries        = EXCLUDED.total_enquiries,
        course_suggested_by_us = EXCLUDED.course_suggested_by_us,
        remarks                = EXCLUDED.remarks,
        updated_at             = NOW()
       RETURNING *`,
      [date || new Date(), call_enquiries || 0, walk_in_enquiries || 0,
       total, course_suggested_by_us, remarks]
    );
    res.status(201).json({ message: 'Daily count saved', count: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save daily count' });
  }
});

// GET /api/enquiries/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, t.name as assigned_trainer_name
       FROM enquiries e
       LEFT JOIN trainers t ON e.assigned_trainer_id = t.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ enquiry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enquiry' });
  }
});

// POST /api/enquiries
router.post('/', auth, async (req, res) => {
  try {
    const {
      date, name, contact, course_enquired_for, course_suggested,
      enquiry_mode, source, referred_by, list_type, status, assigned_trainer_id
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Candidate name is required' });

    // Validate enum values
    const validModes    = ['call','walk_in','online','referral'];
    const validStatuses = ['new','followup','converted','not_interested','closed'];
    const validTypes    = ['daily_followup','batch_allocated','not_interested'];

    const result = await pool.query(
      `INSERT INTO enquiries
        (date, name, contact, course_enquired_for, course_suggested,
         enquiry_mode, source, referred_by, list_type, status, assigned_trainer_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        date || new Date(), name, contact, course_enquired_for, course_suggested,
        validModes.includes(enquiry_mode) ? enquiry_mode : 'call',
        source, referred_by,
        validTypes.includes(list_type) ? list_type : 'daily_followup',
        validStatuses.includes(status) ? status : 'new',
        assigned_trainer_id || null
      ]
    );
    res.status(201).json({ message: 'Enquiry saved', enquiry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save enquiry' });
  }
});

// PUT /api/enquiries/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, contact, course_enquired_for, course_suggested, status, list_type, assigned_trainer_id } = req.body;
    const validStatuses = ['new','followup','converted','not_interested','closed'];
    const validTypes    = ['daily_followup','batch_allocated','not_interested'];

    const result = await pool.query(
      `UPDATE enquiries SET
        name                = COALESCE($1, name),
        contact             = COALESCE($2, contact),
        course_enquired_for = COALESCE($3, course_enquired_for),
        course_suggested    = COALESCE($4, course_suggested),
        status              = COALESCE($5, status),
        list_type           = COALESCE($6, list_type),
        assigned_trainer_id = COALESCE($7, assigned_trainer_id),
        updated_at          = NOW()
       WHERE id = $8 RETURNING *`,
      [
        name, contact, course_enquired_for, course_suggested,
        status && validStatuses.includes(status) ? status : null,
        list_type && validTypes.includes(list_type) ? list_type : null,
        assigned_trainer_id || null,
        req.params.id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ message: 'Enquiry updated', enquiry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// DELETE /api/enquiries/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM enquiries WHERE id = $1', [req.params.id]);
    res.json({ message: 'Enquiry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
});

// POST /api/enquiries/:id/followup
router.post('/:id/followup', auth, async (req, res) => {
  try {
    const { followup_date, call_picked, last_response, ticket_status, details_pitched, remarks, batch_status } = req.body;

    // ✅ Fix: convert string booleans → real booleans
    const callPickedBool    = call_picked === true || call_picked === 'yes' || call_picked === 'true';
    const detailsPitchedBool = details_pitched === true || details_pitched === 'yes' || details_pitched === 'true';

    // ✅ Fix: validate ticket_status enum (open/closed/pending only)
    const validTicket = ['open','closed','pending'];
    const safeTicket  = validTicket.includes(ticket_status) ? ticket_status : 'open';

    // ✅ Fix: validate batch_status enum (available/full/upcoming only) — free text goes to remarks
    const validBatch = ['available','full','upcoming'];
    const safeBatch  = validBatch.includes(batch_status) ? batch_status : null;
    const batchNote  = !validBatch.includes(batch_status) && batch_status ? batch_status : null;
    const finalRemarks = [remarks, batchNote].filter(Boolean).join(' | ') || null;

    // Get attempt count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM enquiry_followups WHERE enquiry_id = $1', [req.params.id]
    );
    const attemptNumber = parseInt(countResult.rows[0].count) + 1;

    const result = await pool.query(
      `INSERT INTO enquiry_followups
        (enquiry_id, followup_date, call_picked, last_response,
         ticket_status, details_pitched, call_attempt_number, remarks, batch_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.params.id, followup_date || new Date(),
        callPickedBool, last_response,
        safeTicket, detailsPitchedBool,
        attemptNumber, finalRemarks, safeBatch
      ]
    );

    // Update enquiry status based on ticket_status
    const newEnquiryStatus = ticket_status === 'converted' ? 'converted'
      : ticket_status === 'closed' ? 'not_interested' : 'followup';

    await pool.query(
      `UPDATE enquiries SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newEnquiryStatus, req.params.id]
    );

    res.status(201).json({ message: 'Followup logged', followup: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log followup' });
  }
});

// GET /api/enquiries/:id/followups
router.get('/:id/followups', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM enquiry_followups WHERE enquiry_id = $1 ORDER BY followup_date DESC`,
      [req.params.id]
    );
    res.json({ followups: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch followup history' });
  }
});

module.exports = router;