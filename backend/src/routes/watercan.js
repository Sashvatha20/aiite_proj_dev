const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { syncWaterCanSheet } = require('../services/syncWaterCanSheet');

function isUUID(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

// GET /api/watercan
router.get('/', auth, async (req, res) => {
  try {
    const { month, year } = req.query;

    let query = `SELECT * FROM water_can_details WHERE 1=1`;
    const params = [];
    let i = 1;

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM date) = $${i++}
                 AND EXTRACT(YEAR FROM date) = $${i++}`;
      params.push(Number(month), Number(year));
    }

    query += ` ORDER BY date DESC, created_at DESC`;

    const result = await pool.query(query, params);

    const summaryMonth = Number(month) || new Date().getMonth() + 1;
    const summaryYear = Number(year) || new Date().getFullYear();

    const summary = await pool.query(
      `
        SELECT
          COALESCE(SUM(total_water_cans), 0) AS total_cans,
          COALESCE(SUM(amount), 0) AS total_amount,
          COALESCE(SUM(CASE WHEN paid_or_balance = 'paid' THEN amount ELSE 0 END), 0) AS paid_amount,
          COALESCE(SUM(balance), 0) AS total_balance
        FROM water_can_details
        WHERE EXTRACT(MONTH FROM date) = $1
          AND EXTRACT(YEAR FROM date) = $2
      `,
      [summaryMonth, summaryYear]
    );

    return res.json({
      entries: result.rows,
      summary: summary.rows[0],
    });
  } catch (err) {
    console.error('GET /watercan error:', err);
    return res.status(500).json({ error: 'Failed to fetch water can data' });
  }
});

// POST /api/watercan
router.post('/', auth, async (req, res) => {
  try {
    const {
      date,
      no_of_ro_water,
      no_of_bisleri_water,
      paid_or_balance,
      balance,
    } = req.body;

    const ro = Number(no_of_ro_water) || 0;
    const bis = Number(no_of_bisleri_water) || 0;
    const total = ro + bis;
    const roPrice = 40;
    const bisPrice = 120;
    const amount = (ro * roPrice) + (bis * bisPrice);
    const finalStatus = paid_or_balance || 'paid';
    const finalBalance = Number(balance) || 0;

    const result = await pool.query(
      `
        INSERT INTO water_can_details
          (date, no_of_ro_water, no_of_bisleri_water, total_water_cans,
           amount, paid_or_balance, balance, ro_price, bisleri_price)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
      `,
      [
        date || new Date(),
        ro,
        bis,
        total,
        amount,
        finalStatus,
        finalBalance,
        roPrice,
        bisPrice,
      ]
    );

    try {
      await syncWaterCanSheet();
    } catch (syncErr) {
      console.error('Water can auto-sync failed after create:', syncErr.message || syncErr);
    }

    return res.status(201).json({
      message: 'Water log saved',
      entry: result.rows[0],
    });
  } catch (err) {
    console.error('POST /watercan error:', err);
    return res.status(500).json({ error: 'Failed to save water log' });
  }
});

// PUT /api/watercan/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      no_of_ro_water,
      no_of_bisleri_water,
      paid_or_balance,
      balance,
    } = req.body;

    if (!isUUID(id)) {
      return res.status(400).json({ error: 'Invalid water log id' });
    }

    const ro = Number(no_of_ro_water) || 0;
    const bis = Number(no_of_bisleri_water) || 0;
    const total = ro + bis;
    const roPrice = 40;
    const bisPrice = 120;
    const amount = (ro * roPrice) + (bis * bisPrice);

    const result = await pool.query(
      `
        UPDATE water_can_details
        SET
          date = COALESCE($1, date),
          no_of_ro_water = $2,
          no_of_bisleri_water = $3,
          total_water_cans = $4,
          amount = $5,
          paid_or_balance = COALESCE($6, paid_or_balance),
          balance = COALESCE($7, balance),
          ro_price = $8,
          bisleri_price = $9,
          updated_at = NOW()
        WHERE id = $10
        RETURNING *
      `,
      [
        date || null,
        ro,
        bis,
        total,
        amount,
        paid_or_balance || null,
        balance ?? null,
        roPrice,
        bisPrice,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Water log entry not found' });
    }

    try {
      await syncWaterCanSheet();
    } catch (syncErr) {
      console.error('Water can auto-sync failed after update:', syncErr.message || syncErr);
    }

    return res.json({
      message: 'Water log updated',
      entry: result.rows[0],
    });
  } catch (err) {
    console.error('PUT /watercan/:id error:', err);
    return res.status(500).json({ error: 'Failed to update water log' });
  }
});

// DELETE /api/watercan/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({ error: 'Invalid water log id' });
    }

    const result = await pool.query(
      `
        DELETE FROM water_can_details
        WHERE id = $1
        RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Water log entry not found' });
    }

    try {
      await syncWaterCanSheet();
    } catch (syncErr) {
      console.error('Water can auto-sync failed after delete:', syncErr.message || syncErr);
    }

    return res.json({
      message: 'Entry deleted',
      entry: result.rows[0],
    });
  } catch (err) {
    console.error('DELETE /watercan/:id error:', err);
    return res.status(500).json({ error: 'Failed to delete entry' });
  }
});

module.exports = router;