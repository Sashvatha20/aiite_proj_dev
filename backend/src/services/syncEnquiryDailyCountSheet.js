// backend/src/services/syncEnquiryDailyCountSheet.js
const db = require('../db');
const { replaceSheetData } = require('./sheetSyncHelper');

function pick(row, keys, fallback = '') {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
      return row[k];
    }
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

function mapDailyCountRow(row) {
  return [
    fmtDate(pick(row, ['date'])),
    pick(row, ['call_enquiries'], 0),
    pick(row, ['walk_in_enquiries'], 0),
    pick(row, ['total_enquiries'], 0),
    pick(row, ['course_suggested_by_us'], ''),
    pick(row, ['remarks'], ''),
    fmtDateTime(pick(row, ['updated_at'])),
  ];
}

async function syncEnquiryDailyCountSheet() {
  const result = await db.query(`
    SELECT
      date,
      call_enquiries,
      walk_in_enquiries,
      total_enquiries,
      course_suggested_by_us,
      remarks,
      updated_at
    FROM enquiry_daily_count
    ORDER BY date DESC
  `);

  const rows = normalizeRows(result);
  const values = rows.map(mapDailyCountRow);

  await replaceSheetData('EnquiryDailyCount', values, 'G');

  return {
    success: true,
    count: values.length,
    sheet: 'EnquiryDailyCount',
  };
}

module.exports = { syncEnquiryDailyCountSheet };