const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

const toNull = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  return v;
};

const toNumberOrNull = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const getFeeStatus = (totalFee, totalPaid) => {
  const total_fee = Number(totalFee || 0);
  const total_paid = Number(totalPaid || 0);
  const balance = Math.max(total_fee - total_paid, 0);

  let fee_status = null;
  if (total_fee > 0) {
    if (balance <= 0) fee_status = 'paid';
    else if (total_paid > 0) fee_status = 'partial';
    else fee_status = 'pending';
  }

  return { total_fee, total_paid, balance, fee_status };
};

// GET /api/fee-payments/:studentId — fee history + summary
router.get('/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    const studentRes = await pool.query(
      `SELECT
         s.id,
         s.candidate_name,
         s.phone,
         s.email,
         s.whatsapp_number,
         s.certificate_no,
         s.batch_id,
         s.total_fee,
         s.joined_date,
         s.status,
         s.notes,
         b.batch_name
       FROM students s
       LEFT JOIN batches b ON b.id = s.batch_id
       WHERE s.id = $1`,
      [studentId]
    );

    if (!studentRes.rows.length) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const paymentsRes = await pool.query(
      `SELECT
         fp.*,
         SUM(fp.amount) OVER (
           PARTITION BY fp.student_id
           ORDER BY fp.payment_date ASC, fp.created_at ASC, fp.id ASC
         ) AS running_total
       FROM fee_payments fp
       WHERE fp.student_id = $1
       ORDER BY fp.payment_date DESC, fp.created_at DESC, fp.id DESC`,
      [studentId]
    );

    const student = studentRes.rows[0];
    const payments = paymentsRes.rows;
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const summary = getFeeStatus(student.total_fee, totalPaid);

    res.json({
      success: true,
      student,
      payments,
      summary,
    });
  } catch (err) {
    console.error('GET /api/fee-payments/:studentId error:', err);
    res.status(500).json({ error: 'Failed to fetch fee details' });
  }
});

// POST /api/fee-payments/:studentId — add new payment
router.post('/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { amount, payment_mode, reference_no, notes, payment_date } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    const amountPaying = toNumberOrNull(amount);

    if (amountPaying === null || amountPaying <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

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
      [studentId]
    );

    if (!studentRes.rows.length) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentRes.rows[0];
    const totalFee = Number(student.total_fee || 0);
    const alreadyPaid = Number(student.paid || 0);
    const balance = Math.max(totalFee - alreadyPaid, 0);

    if (totalFee > 0 && amountPaying > balance + 0.01) {
      return res.status(400).json({
        error: `Payment ₹${amountPaying} exceeds pending balance ₹${balance.toFixed(2)} for ${student.candidate_name}`,
      });
    }

    const result = await pool.query(
      `INSERT INTO fee_payments
        (student_id, amount, payment_mode, reference_no, notes, payment_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        studentId,
        amountPaying,
        toNull(payment_mode) || 'cash',
        toNull(reference_no),
        toNull(notes),
        toNull(payment_date) || new Date(),
      ]
    );

    res.status(201).json({
      success: true,
      payment: result.rows[0],
      message: `Payment recorded for ${student.candidate_name}`,
    });
  } catch (err) {
    console.error('POST /api/fee-payments/:studentId error:', err);
    res.status(500).json({ error: 'Failed to add payment' });
  }
});

// DELETE /api/fee-payments/:paymentId — remove a payment
router.delete('/:paymentId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM fee_payments WHERE id = $1 RETURNING id',
      [req.params.paymentId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    console.error('DELETE /api/fee-payments/:paymentId error:', err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

module.exports = router;