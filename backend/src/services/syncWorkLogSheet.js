const db = require('../db');
const { replaceSheetData } = require('./sheetSyncHelper');

function pick(row, keys, fallback = '') {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return row[k];
  }
  return fallback;
}

function fmtDate(v) {
  return v ? new Date(v).toISOString().split('T')[0] : '';
}

function fmtDateTime(v) {
  return v ? new Date(v).toISOString() : '';
}

function normalizeRows(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.rows)) return result.rows;
  if (result && Array.isArray(result[0])) return result[0];
  return [];
}

function mapWorkLogRow(row) {
  return [
    pick(row, ['id']),
    pick(row, ['trainer_id']),
    pick(row, ['trainer_name']),
    pick(row, ['batch_id']),
    pick(row, ['batch_name']),
    fmtDate(pick(row, ['log_date'])),
    pick(row, ['work_description']),
    pick(row, ['progressive_working_hours'], 0),
    pick(row, ['star_points'], 0),
    fmtDateTime(pick(row, ['created_at'])),
  ];
}

async function syncWorkLogSheet() {
  const result = await db.query(`
    SELECT
      wl.id,
      wl.trainer_id,
      t.name AS trainer_name,
      wl.batch_id,
      b.batch_name,
      wl.log_date,
      wl.work_description,
      wl.progressive_working_hours,
      wl.star_points,
      wl.created_at
    FROM daily_work_log wl
    LEFT JOIN trainers t ON t.id = wl.trainer_id
    LEFT JOIN batches b ON b.id = wl.batch_id
    ORDER BY wl.log_date DESC, wl.id DESC
  `);

  const rows = normalizeRows(result);
  const values = rows.map(mapWorkLogRow);

  await replaceSheetData('Work_Log', values, 'Z');

  return {
    success: true,
    count: values.length,
    sheet: 'Work_Log',
  };
}

module.exports = { syncWorkLogSheet };