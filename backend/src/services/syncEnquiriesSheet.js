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

function mapEnquiryRow(row) {
  return [
    pick(row, ['id']),
    fmtDate(pick(row, ['date'])),
    pick(row, ['name']),
    pick(row, ['contact']),
    pick(row, ['email']),
    pick(row, ['course_enquired_for']),
    pick(row, ['course_suggested']),
    pick(row, ['enquiry_mode']),
    pick(row, ['source']),
    pick(row, ['referred_by']),
    pick(row, ['list_type']),
    pick(row, ['status']),
    pick(row, ['assigned_trainer_id']),
    pick(row, ['assigned_trainer_name']),
    row.student_id ? 'YES' : 'NO',
    pick(row, ['notes']),
    fmtDateTime(pick(row, ['created_at'])),
    fmtDateTime(pick(row, ['updated_at'])),
  ];
}

async function syncEnquiriesSheet() {
  const result = await db.query(`
    SELECT
      e.*,
      t.name AS assigned_trainer_name
    FROM enquiries e
    LEFT JOIN trainers t ON e.assigned_trainer_id = t.id
    ORDER BY e.created_at DESC
  `);

  const rows = normalizeRows(result);
  const values = rows.map(mapEnquiryRow);

  await replaceSheetData('Enquiries', values, 'Z');

  return {
    success: true,
    count: values.length,
    sheet: 'Enquiries',
  };
}

module.exports = { syncEnquiriesSheet };