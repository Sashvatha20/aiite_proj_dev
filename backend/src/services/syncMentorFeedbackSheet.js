const pool = require('../db');
const { replaceSheetData } = require('./sheetSyncHelper');

const SHEET_NAME = 'Mentor_Feedback';

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function normalizeBoolean(value) {
  return value === true || value === 'true' ? 'TRUE' : 'FALSE';
}

async function syncMentorFeedbackSheet() {
  const result = await pool.query(`
    SELECT
      mf.id,
      mf.batch_id,
      b.batch_name,
      mf.last_updated_date,
      mf.form_shared,
      mf.google_form_link,
      mf.total_members,
      mf.received_response,
      mf.pending,
      mf.followup_notes,
      mf.created_at,
      mf.updated_at
    FROM mentor_feedback mf
    LEFT JOIN batches b ON b.id = mf.batch_id
    ORDER BY mf.created_at DESC, mf.id DESC
  `);

  const rows = result.rows.map((row) => [
    row.id ?? '',
    row.batch_id ?? '',
    row.batch_name ?? '',
    formatDate(row.last_updated_date),
    normalizeBoolean(row.form_shared),
    row.google_form_link ?? '',
    row.total_members ?? '',
    row.received_response ?? 0,
    row.pending ?? 0,
    row.followup_notes ?? '',
    formatDate(row.created_at),
    formatDate(row.updated_at),
  ]);

  await replaceSheetData(SHEET_NAME, rows, 'L');

  return {
    success: true,
    message: 'Mentor_Feedback sheet synced successfully',
    count: rows.length,
    sheet: SHEET_NAME,
  };
}

module.exports = { syncMentorFeedbackSheet };