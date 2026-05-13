const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const STUDENT_SELECT = `
  SELECT
    s.id,
    s.candidate_name,
    s.phone,
    s.email,
    s.whatsapp_number,
    s.certificate_no,
    s.batch_id,
    s.total_fee,
    s.payment_mode,
    s.joined_date,
    s.status,
    s.notes,
    s.resolution_note,
    s.created_at,
    s.updated_at,
    b.batch_name,
    c.course_name,
    COALESCE(fp.paid, 0) AS paid_amount,
    fp.last_payment AS last_payment_date,
    CASE
      WHEN fp.last_payment IS NULL THEN NULL
      ELSE (CURRENT_DATE - fp.last_payment::date)
    END AS days_since_payment
  FROM students s
  LEFT JOIN batches b ON s.batch_id = b.id
  LEFT JOIN courses c ON b.course_id = c.id
  LEFT JOIN (
    SELECT
      student_id,
      SUM(amount) AS paid,
      MAX(payment_date) AS last_payment
    FROM fee_payments
    GROUP BY student_id
  ) fp ON fp.student_id = s.id
`;

function toNull(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  return v;
}

function toTrimmedOrNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function addFeeFields(student) {
  const totalFee = Number(student.total_fee || 0);

  let totalPaidSource = student.total_paid;
  if (totalPaidSource === undefined || totalPaidSource === null) {
    totalPaidSource = student.paid_amount;
  }

  const totalPaid = Number(totalPaidSource || 0);
  const balance = Math.max(totalFee - totalPaid, 0);

  let fee_status = null;
  if (totalFee > 0) {
    if (balance <= 0) fee_status = 'paid';
    else if (totalPaid > 0) fee_status = 'partial';
    else fee_status = 'pending';
  }

  return {
    ...student,
    total_paid: totalPaid,
    balance,
    fee_status,
  };
}

// GET /api/students
router.get('/', auth, async (req, res) => {
  try {
    const { batch_id, status, search } = req.query;

    const where = [];
    const params = [];
    let idx = 1;

    if (batch_id) {
      where.push(`s.batch_id = $${idx++}`);
      params.push(batch_id);
    }

    if (status) {
      where.push(`s.status = $${idx++}`);
      params.push(status);
    }

    if (search) {
      where.push(`(
        s.candidate_name ILIKE $${idx} OR
        s.phone ILIKE $${idx} OR
        s.email ILIKE $${idx}
      )`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const result = await pool.query(
      `${STUDENT_SELECT} ${whereClause} ORDER BY s.created_at DESC`,
      params
    );

    res.json({ students: result.rows.map(addFeeFields) });
  } catch (err) {
    console.error('GET /students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/students/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `${STUDENT_SELECT} WHERE s.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student: addFeeFields(result.rows[0]) });
  } catch (err) {
    console.error('GET /students/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// POST /api/students
router.post('/', auth, async (req, res) => {
  const {
    candidate_name,
    phone,
    email,
    whatsapp_number,
    batch_id,
    total_fee,
    payment_mode,
    initial_payment,
    reference_no,
    joined_date,
    status,
    notes,
    certificate_no,
    resolution_note,
  } = req.body;

  if (!candidate_name || !String(candidate_name).trim()) {
    return res.status(400).json({ error: 'candidate_name is required' });
  }

  if (!phone || !String(phone).trim()) {
    return res.status(400).json({ error: 'phone is required' });
  }

  const totalFeeParsed = toNumberOrNull(total_fee);
  const initialPaymentParsed = toNumberOrNull(initial_payment);

  const totalFeeNum = totalFeeParsed !== null ? totalFeeParsed : 0;
  const initialPaymentNum = initialPaymentParsed !== null ? initialPaymentParsed : 0;

  if (totalFeeNum < 0) {
    return res.status(400).json({ error: 'total_fee cannot be negative' });
  }

  if (initialPaymentNum < 0) {
    return res.status(400).json({ error: 'initial_payment cannot be negative' });
  }

  if (initialPaymentNum > totalFeeNum && totalFeeNum > 0) {
    return res.status(400).json({ error: 'initial_payment cannot be greater than total_fee' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const studentResult = await client.query(
      `INSERT INTO students
        (
          candidate_name,
          phone,
          email,
          whatsapp_number,
          certificate_no,
          batch_id,
          total_fee,
          payment_mode,
          joined_date,
          status,
          notes,
          resolution_note
        )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        String(candidate_name).trim(),
        toTrimmedOrNull(phone),
        toTrimmedOrNull(email),
        toTrimmedOrNull(whatsapp_number),
        toTrimmedOrNull(certificate_no),
        toNull(batch_id),
        totalFeeNum,
        toTrimmedOrNull(payment_mode) || 'cash',
        toNull(joined_date) || new Date(),
        toTrimmedOrNull(status) || 'active',
        toTrimmedOrNull(notes),
        toTrimmedOrNull(resolution_note),
      ]
    );

    const student = studentResult.rows[0];

    if (initialPaymentNum > 0) {
      await client.query(
        `INSERT INTO fee_payments
          (student_id, amount, payment_mode, reference_no, notes, payment_date)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          student.id,
          initialPaymentNum,
          toTrimmedOrNull(payment_mode) || 'cash',
          toTrimmedOrNull(reference_no),
          toTrimmedOrNull(notes),
          toNull(joined_date) || new Date(),
        ]
      );
    }

    await client.query('COMMIT');

    const full = await pool.query(
      `${STUDENT_SELECT} WHERE s.id = $1`,
      [student.id]
    );

    res.status(201).json({
      student: addFeeFields(full.rows[0]),
      message: 'Student created successfully',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /students error:', err);

    if (err.code === '23505') {
      return res.status(400).json({ error: 'Phone, email, or certificate number already exists' });
    }

    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid batch_id or related record reference' });
    }

    res.status(500).json({ error: 'Failed to create student' });
  } finally {
    client.release();
  }
});

// PUT /api/students/:id
router.put('/:id', auth, async (req, res) => {
  const {
    candidate_name,
    phone,
    email,
    whatsapp_number,
    batch_id,
    total_fee,
    payment_mode,
    joined_date,
    status,
    notes,
    certificate_no,
    resolution_note,
  } = req.body;

  const totalFeeNum = total_fee !== undefined ? toNumberOrNull(total_fee) : undefined;

  if (total_fee !== undefined && totalFeeNum === null) {
    return res.status(400).json({ error: 'total_fee must be a valid number' });
  }

  if (totalFeeNum !== undefined && totalFeeNum < 0) {
    return res.status(400).json({ error: 'total_fee cannot be negative' });
  }

  try {
    const result = await pool.query(
      `UPDATE students SET
        candidate_name = COALESCE($1, candidate_name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        whatsapp_number = COALESCE($4, whatsapp_number),
        batch_id = COALESCE($5, batch_id),
        total_fee = COALESCE($6, total_fee),
        payment_mode = COALESCE($7, payment_mode),
        joined_date = COALESCE($8, joined_date),
        status = COALESCE($9, status),
        notes = COALESCE($10, notes),
        certificate_no = COALESCE($11, certificate_no),
        resolution_note = COALESCE($12, resolution_note),
        updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        toTrimmedOrNull(candidate_name),
        toTrimmedOrNull(phone),
        toTrimmedOrNull(email),
        toTrimmedOrNull(whatsapp_number),
        toNull(batch_id),
        totalFeeNum === undefined ? null : totalFeeNum,
        toTrimmedOrNull(payment_mode),
        toNull(joined_date),
        toTrimmedOrNull(status),
        toTrimmedOrNull(notes),
        toTrimmedOrNull(certificate_no),
        toTrimmedOrNull(resolution_note),
        req.params.id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const full = await pool.query(
      `${STUDENT_SELECT} WHERE s.id = $1`,
      [req.params.id]
    );

    res.json({
      student: addFeeFields(full.rows[0]),
      message: 'Student updated successfully',
    });
  } catch (err) {
    console.error('PUT /students/:id error:', err);

    if (err.code === '23505') {
      return res.status(400).json({ error: 'Phone, email, or certificate number already exists' });
    }

    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid batch_id or related record reference' });
    }

    res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/students/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM students
       WHERE id = $1
       RETURNING id, candidate_name`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      message: `${result.rows[0].candidate_name} deleted successfully`,
    });
  } catch (err) {
    console.error('DELETE /students/:id error:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// POST /api/students/:id/payments
router.post('/:id/payments', auth, adminOnly, async (req, res) => {
  const { amount, payment_mode, reference_no, notes, payment_date } = req.body;
  const amountPaying = toNumberOrNull(amount);

  if (amountPaying === null || amountPaying <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required' });
  }

  try {
    const studentRes = await pool.query(
      `SELECT
         s.id,
         s.candidate_name,
         s.total_fee,
         COALESCE(SUM(fp.amount), 0) AS paid
       FROM students s
       LEFT JOIN fee_payments fp ON fp.student_id = s.id
       WHERE s.id = $1
       GROUP BY s.id, s.candidate_name, s.total_fee`,
      [req.params.id]
    );

    if (!studentRes.rows.length) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const row = studentRes.rows[0];
    const candidate_name = row.candidate_name;
    const totalFee = Number(row.total_fee || 0);
    const alreadyPaid = Number(row.paid || 0);
    const balance = Math.max(totalFee - alreadyPaid, 0);

    if (totalFee > 0 && amountPaying > balance + 0.01) {
      return res.status(400).json({
        error: `Payment ₹${amountPaying} exceeds balance ₹${balance.toFixed(2)} for ${candidate_name}`,
      });
    }

    const result = await pool.query(
      `INSERT INTO fee_payments
        (student_id, amount, payment_mode, reference_no, notes, payment_date)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        req.params.id,
        amountPaying,
        toTrimmedOrNull(payment_mode) || 'cash',
        toTrimmedOrNull(reference_no),
        toTrimmedOrNull(notes),
        toNull(payment_date) || new Date(),
      ]
    );

    res.status(201).json({
      payment: result.rows[0],
      message: `Payment of ₹${amountPaying} recorded for ${candidate_name}`,
    });
  } catch (err) {
    console.error('POST /students/:id/payments error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// GET /api/students/:id/payments
router.get('/:id/payments', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         fp.*,
         SUM(fp.amount) OVER (
           PARTITION BY fp.student_id
           ORDER BY fp.payment_date ASC, fp.created_at ASC, fp.id ASC
         ) AS running_total
       FROM fee_payments fp
       WHERE fp.student_id = $1
       ORDER BY fp.payment_date DESC, fp.created_at DESC, fp.id DESC`,
      [req.params.id]
    );

    res.json({ payments: result.rows });
  } catch (err) {
    console.error('GET /students/:id/payments error:', err);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

module.exports = router;