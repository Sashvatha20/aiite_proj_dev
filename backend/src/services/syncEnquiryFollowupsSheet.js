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

function mapFollowupRow(row) {
  return [
    pick(row, ['id']),
    pick(row, ['enquiry_id']),
    pick(row, ['candidate_name']),
    pick(row, ['contact_number']),
    pick(row, ['course_enquiry']),
    fmtDate(pick(row, ['followup_date'])),
    pick(row, ['remarks', 'last_response']),
    pick(row, ['call_attempt']),
    fmtDate(pick(row, ['next_followup'])),
    fmtDateTime(pick(row, ['created_at'])),
  ];
}

async function syncEnquiryFollowupsSheet() {
  const result = await db.query(`
    SELECT
      ef.id,
      ef.enquiry_id,
      e.name AS candidate_name,
      e.contact AS contact_number,
      e.course_enquired_for AS course_enquiry,
      ef.followup_date,
      ef.remarks,
      ef.last_response,
      ef.call_attempt_number AS call_attempt,
      ef.next_followup_date AS next_followup,
      ef.created_at
    FROM enquiry_followups ef
    LEFT JOIN enquiries e ON e.id = ef.enquiry_id
    ORDER BY ef.followup_date DESC, ef.id DESC
  `);

  const rows = normalizeRows(result);
  const values = rows.map(mapFollowupRow);

  await replaceSheetData('Enquiry_Followups', values, 'Z');

  return {
    success: true,
    count: values.length,
    sheet: 'Enquiry_Followups',
  };
}

module.exports = { syncEnquiryFollowupsSheet };