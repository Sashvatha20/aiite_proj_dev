const db = require('../db');
const { replaceSheetData } = require('./sheetSyncHelper');

const SHEET_NAME = 'Student_Followups';

function formatDateOnly(value) {
  if (!value) return '';
  return String(value).split('T')[0];
}

function formatDateTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toISOString();
  } catch {
    return '';
  }
}

function mapStudentFollowupRow(row) {
  return [
    row.id ?? '',
    row.student_id ?? '',
    row.candidate_name ?? '',
    row.phone ?? '',
    row.batch_id ?? '',
    row.batch_name ?? '',
    row.followup_type ?? '',
    row.call_status ?? '',
    formatDateOnly(row.last_contact_date),
    row.resume_status ?? '',
    row.no_of_interview_calls ?? 0,
    row.no_of_rounds_cleared ?? 0,
    row.interested === true ? 'true' : row.interested === false ? 'false' : '',
    row.placed_status ?? '',
    row.remarks ?? '',
    formatDateTime(row.created_at),
    formatDateTime(row.updated_at),
  ];
}

async function syncStudentFollowupsSheet() {
  const result = await db.query(`
    SELECT
      sf.id,
      sf.student_id,
      s.candidate_name,
      s.phone,
      s.batch_id,
      b.batch_name,
      sf.followup_type,
      sf.call_status,
      sf.last_contact_date,
      sf.resume_status,
      sf.no_of_interview_calls,
      sf.no_of_rounds_cleared,
      sf.interested,
      sf.placed_status,
      sf.remarks,
      sf.created_at,
      sf.updated_at
    FROM student_followups sf
    JOIN students s ON s.id = sf.student_id
    LEFT JOIN batches b ON b.id = s.batch_id
    ORDER BY sf.created_at DESC
  `);

  const rows = result.rows || [];
  const values = rows.map(mapStudentFollowupRow);

  await replaceSheetData(SHEET_NAME, values, 'Q');

  return {
    success: true,
    count: values.length,
    sheet: SHEET_NAME,
    message: `Student Followups sheet synced successfully (${values.length} rows)`,
  };
}

module.exports = { syncStudentFollowupsSheet };