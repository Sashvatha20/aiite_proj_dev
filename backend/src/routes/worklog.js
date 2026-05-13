const express = require('express');
const router = express.Router();
const db = require('../db');
const { syncWorkLogSheet } = require('../services/syncWorkLogSheet');

function normalizeRows(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.rows)) return result.rows;
  if (result && Array.isArray(result[0])) return result[0];
  return [];
}

function firstRow(result) {
  const rows = normalizeRows(result);
  return rows[0] || null;
}

function mapLog(row) {
  return {
    id: row.id,
    trainer_id: row.trainer_id,
    trainerid: row.trainer_id,
    batch_id: row.batch_id,
    batchid: row.batch_id,
    log_date: row.log_date,
    logdate: row.log_date,
    work_description: row.work_description,
    workdescription: row.work_description,
    progressive_working_hours: Number(row.progressive_working_hours || 0),
    progressiveworkinghours: Number(row.progressive_working_hours || 0),
    star_points: Number(row.star_points || 0),
    starpoints: Number(row.star_points || 0),
    whatsapp_sent_to: row.whatsapp_sent_to || null,
    wa_sent: row.wa_sent === true || row.wa_sent === 'true' || row.wa_sent === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
    batch_name: row.batch_name || null,
    batchname: row.batch_name || null,
    trainer_name: row.trainer_name || null,
    trainername: row.trainer_name || null
  };
}

async function resolveTrainerId(input) {
  if (!input) return null;

  const trainerId = String(input).trim();
  if (!trainerId) return null;

  const check = await db.query(
    'SELECT id FROM trainers WHERE id = $1::uuid',
    [trainerId]
  );

  const row = firstRow(check);
  return row ? row.id : null;
}

async function fetchLogById(id) {
  const result = await db.query(
    `
    SELECT
      wl.*,
      b.batch_name AS batch_name,
      t.name AS trainer_name
    FROM daily_work_log wl
    LEFT JOIN batches b ON b.id = wl.batch_id
    LEFT JOIN trainers t ON t.id = wl.trainer_id
    WHERE wl.id = $1
    `,
    [id]
  );

  return firstRow(result);
}

// Keep static routes before dynamic routes
router.post('/sync', async function (req, res, next) {
  try {
    const result = await syncWorkLogSheet();
    return res.json({
      message: 'Work log synced successfully',
      success: true,
      count: result.count,
      sheet: result.sheet
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', async function (req, res, next) {
  try {
    const trainerId =
      req.query.trainer_id ||
      req.query.trainerId ||
      req.query.trainerid ||
      req.query.user_id ||
      null;

    const month = req.query.month ? Number(req.query.month) : null;
    const year = req.query.year ? Number(req.query.year) : null;

    const conditions = [];
    const params = [];

    if (trainerId) {
      params.push(trainerId);
      conditions.push('wl.trainer_id = $' + params.length + '::uuid');
    }

    if (month && year) {
      params.push(month);
      conditions.push('EXTRACT(MONTH FROM wl.log_date) = $' + params.length);
      params.push(year);
      conditions.push('EXTRACT(YEAR FROM wl.log_date) = $' + params.length);
    } else if (year) {
      params.push(year);
      conditions.push('EXTRACT(YEAR FROM wl.log_date) = $' + params.length);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await db.query(
      `
      SELECT
        wl.*,
        b.batch_name AS batch_name,
        t.name AS trainer_name
      FROM daily_work_log wl
      LEFT JOIN batches b ON b.id = wl.batch_id
      LEFT JOIN trainers t ON t.id = wl.trainer_id
      ${where}
      ORDER BY wl.log_date DESC, wl.id DESC
      `,
      params
    );

    const rows = normalizeRows(result);
    return res.json({ logs: rows.map(mapLog) });
  } catch (err) {
    next(err);
  }
});

router.get('/all', async function (req, res, next) {
  try {
    const result = await db.query(
      `
      SELECT
        wl.*,
        b.batch_name AS batch_name,
        t.name AS trainer_name
      FROM daily_work_log wl
      LEFT JOIN batches b ON b.id = wl.batch_id
      LEFT JOIN trainers t ON t.id = wl.trainer_id
      ORDER BY wl.log_date DESC, wl.id DESC
      `
    );

    const rows = normalizeRows(result);
    return res.json({ logs: rows.map(mapLog) });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async function (req, res, next) {
  try {
    const trainerId =
      req.query.trainer_id ||
      req.query.trainerId ||
      req.query.trainerid ||
      req.query.user_id ||
      null;

    const totalParams = [];
    const totalWhere = trainerId ? 'WHERE trainer_id = $1::uuid' : '';

    if (trainerId) totalParams.push(trainerId);

    const totalResult = await db.query(
      'SELECT COUNT(*)::int AS total_logs FROM daily_work_log ' + totalWhere,
      totalParams
    );

    const monthParams = [];
    const monthConditions = [];

    if (trainerId) {
      monthParams.push(trainerId);
      monthConditions.push('trainer_id = $' + monthParams.length + '::uuid');
    }

    monthParams.push(new Date().getMonth() + 1);
    monthConditions.push('EXTRACT(MONTH FROM log_date) = $' + monthParams.length);

    monthParams.push(new Date().getFullYear());
    monthConditions.push('EXTRACT(YEAR FROM log_date) = $' + monthParams.length);

    const monthResult = await db.query(
      `
      SELECT COUNT(*)::int AS month_logs
      FROM daily_work_log
      WHERE ${monthConditions.join(' AND ')}
      `,
      monthParams
    );

    const hoursResult = await db.query(
      `
      SELECT COALESCE(SUM(progressive_working_hours), 0)::numeric AS total_hours
      FROM daily_work_log
      ${totalWhere}
      `,
      totalParams
    );

    const pointsResult = await db.query(
      `
      SELECT COALESCE(SUM(star_points), 0)::numeric AS total_points
      FROM daily_work_log
      ${totalWhere}
      `,
      totalParams
    );

    const total = firstRow(totalResult);
    const monthData = firstRow(monthResult);
    const hours = firstRow(hoursResult);
    const points = firstRow(pointsResult);

    return res.json({
      total_logs: Number(total && total.total_logs ? total.total_logs : 0),
      month_logs: Number(monthData && monthData.month_logs ? monthData.month_logs : 0),
      total_hours: Number(hours && hours.total_hours ? hours.total_hours : 0),
      total_points: Number(points && points.total_points ? points.total_points : 0)
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async function (req, res, next) {
  try {
    const trainerId =
      req.body.trainer_id !== undefined ? req.body.trainer_id :
      req.body.trainerId !== undefined ? req.body.trainerId :
      req.body.trainerid !== undefined ? req.body.trainerid :
      req.body.user_id !== undefined ? req.body.user_id :
      null;

    const batchId =
      req.body.batch_id !== undefined ? req.body.batch_id :
      req.body.batchid !== undefined ? req.body.batchid :
      null;

    const logDate =
      req.body.log_date !== undefined ? req.body.log_date :
      req.body.logdate !== undefined ? req.body.logdate :
      null;

    const workDescription =
      req.body.work_description !== undefined ? req.body.work_description :
      req.body.workdescription !== undefined ? req.body.workdescription :
      null;

    const workingHours =
      req.body.progressive_working_hours !== undefined ? req.body.progressive_working_hours :
      req.body.progressiveworkinghours !== undefined ? req.body.progressiveworkinghours :
      0;

    const starPoints =
      req.body.star_points !== undefined ? req.body.star_points :
      req.body.starpoints !== undefined ? req.body.starpoints :
      0;

    const whatsappSentTo =
      req.body.whatsapp_sent_to !== undefined ? req.body.whatsapp_sent_to :
      null;

    const waSent =
      req.body.wa_sent !== undefined ? req.body.wa_sent :
      false;

    if (!trainerId) {
      return res.status(400).json({ error: 'trainer_id is required' });
    }

    if (!logDate) {
      return res.status(400).json({ error: 'log_date is required' });
    }

    if (!workDescription) {
      return res.status(400).json({ error: 'work_description is required' });
    }

    const validTrainerId = await resolveTrainerId(trainerId);
    if (!validTrainerId) {
      return res.status(400).json({ error: 'Invalid trainer_id. Trainer not found.' });
    }

    const result = await db.query(
      `
      INSERT INTO daily_work_log
      (
        trainer_id,
        batch_id,
        log_date,
        work_description,
        progressive_working_hours,
        star_points,
        whatsapp_sent_to,
        wa_sent
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
      `,
      [
        validTrainerId,
        batchId || null,
        logDate,
        workDescription,
        workingHours || 0,
        starPoints || 0,
        whatsappSentTo,
        waSent
      ]
    );

    await syncWorkLogSheet();

    const inserted = firstRow(result);
    const fullRow = inserted ? await fetchLogById(inserted.id) : null;

    return res.json({
      success: true,
      log: fullRow ? mapLog(fullRow) : null
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async function (req, res, next) {
  try {
    const existing = await fetchLogById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Work log not found' });
    }

    const fields = {
      trainer_id:
        req.body.trainer_id !== undefined ? req.body.trainer_id :
        req.body.trainerId !== undefined ? req.body.trainerId :
        req.body.trainerid,
      batch_id:
        req.body.batch_id !== undefined ? req.body.batch_id :
        req.body.batchid,
      log_date:
        req.body.log_date !== undefined ? req.body.log_date :
        req.body.logdate,
      work_description:
        req.body.work_description !== undefined ? req.body.work_description :
        req.body.workdescription,
      progressive_working_hours:
        req.body.progressive_working_hours !== undefined ? req.body.progressive_working_hours :
        req.body.progressiveworkinghours,
      star_points:
        req.body.star_points !== undefined ? req.body.star_points :
        req.body.starpoints,
      whatsapp_sent_to:
        req.body.whatsapp_sent_to !== undefined ? req.body.whatsapp_sent_to :
        undefined,
      wa_sent:
        req.body.wa_sent !== undefined ? req.body.wa_sent :
        undefined
    };

    const updates = [];
    const values = [];

    if (fields.trainer_id !== undefined) {
      const validTrainerId = await resolveTrainerId(fields.trainer_id);
      if (!validTrainerId) {
        return res.status(400).json({ error: 'Invalid trainer_id. Trainer not found.' });
      }
      updates.push('trainer_id = $' + (values.length + 1) + '::uuid');
      values.push(validTrainerId);
    }

    Object.entries({
      batch_id: fields.batch_id,
      log_date: fields.log_date,
      work_description: fields.work_description,
      progressive_working_hours: fields.progressive_working_hours,
      star_points: fields.star_points,
      whatsapp_sent_to: fields.whatsapp_sent_to,
      wa_sent: fields.wa_sent
    }).forEach(function (entry) {
      const key = entry[0];
      const value = entry[1];
      if (value !== undefined) {
        updates.push(key + ' = $' + (values.length + 1));
        values.push(value);
      }
    });

    if (!updates.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    await db.query(
      'UPDATE daily_work_log SET ' + updates.join(', ') + ' WHERE id = $' + values.length,
      values
    );

    await syncWorkLogSheet();

    const updated = await fetchLogById(req.params.id);

    return res.json({
      success: true,
      message: 'Work log updated',
      log: updated ? mapLog(updated) : null
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async function (req, res, next) {
  try {
    const existing = await fetchLogById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Work log not found' });
    }

    await db.query(
      'DELETE FROM daily_work_log WHERE id = $1',
      [req.params.id]
    );

    await syncWorkLogSheet();

    return res.json({
      success: true,
      message: 'Work log deleted',
      log: mapLog(existing)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;