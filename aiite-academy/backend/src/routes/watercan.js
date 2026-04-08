const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

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
      params.push(month, year);
    }

    query += ` ORDER BY date DESC`;
    const result = await pool.query(query, params);

    // Summary totals
    const summary = await pool.query(
      `SELECT
        SUM(total_water_cans) as total_cans,
        SUM(amount) as total_amount,
        SUM(CASE WHEN paid_or_balance = 'paid' THEN amount ELSE 0 END) as paid_amount,
        SUM(balance) as total_balance
       FROM water_can_details
       WHERE EXTRACT(MONTH FROM date) = $1
         AND EXTRACT(YEAR FROM date) = $2`,
      [month || new Date().getMonth() + 1, year || new Date().getFullYear()]
    );

    res.json({ entries: result.rows, summary: summary.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch water can data' });
  }
});

// POST /api/watercan — add entry
router.post('/', auth, async (req, res) => {
  try {
    const {
      date, no_of_ro_water, no_of_bisleri_water,
      paid_or_balance, balance
    } = req.body;

    const ro    = no_of_ro_water    || 0;
    const bis   = no_of_bisleri_water || 0;
    const total = ro + bis;
    const roPrice  = 40;
    const bisPrice = 120;
    const amount   = (ro * roPrice) + (bis * bisPrice);

    const result = await pool.query(
      `INSERT INTO water_can_details
        (date, no_of_ro_water, no_of_bisleri_water, total_water_cans,
         amount, paid_or_balance, balance, ro_price, bisleri_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [date || new Date(), ro, bis, total, amount,
       paid_or_balance || 'paid', balance || 0, roPrice, bisPrice]
    );

    res.status(201).json({ message: 'Water log saved', entry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save water log' });
  }
});

// PUT /api/watercan/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      no_of_ro_water, no_of_bisleri_water,
      paid_or_balance, balance
    } = req.body;

    const ro    = no_of_ro_water    || 0;
    const bis   = no_of_bisleri_water || 0;
    const total = ro + bis;
    const amount = (ro * 40) + (bis * 120);

    const result = await pool.query(
      `UPDATE water_can_details SET
        no_of_ro_water      = $1,
        no_of_bisleri_water = $2,
        total_water_cans    = $3,
        amount              = $4,
        paid_or_balance     = COALESCE($5, paid_or_balance),
        balance             = COALESCE($6, balance),
        updated_at          = NOW()
       WHERE id = $7
       RETURNING *`,
      [ro, bis, total, amount, paid_or_balance, balance, req.params.id]
    );

    res.json({ message: 'Water log updated', entry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update water log' });
  }
});

// DELETE /api/watercan/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM water_can_details WHERE id = $1', [req.params.id]);
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

module.exports = router;