const pool = require('../db');
const { replaceSheetData } = require('./sheetSyncHelper');

function pick(row, keys, fallback = '') {
  for (const k of keys) {
    if (row && row[k] !== undefined && row[k] !== null && row[k] !== '') {
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

async function getExistingColumns() {
  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'batch_assessment'
  `);

  return new Set(result.rows.map((r) => r.column_name));
}

function mapAssessmentRow(row) {
  return [
    pick(row, ['db_id']),
    pick(row, ['student_id']),
    row.student_id ? pick(row, ['candidate_name']) : 'All participants',
    pick(row, ['batch_id']),
    pick(row, ['batch_name']),
    fmtDate(pick(row, ['assessment_date'])),
    pick(row, ['session_type']),
    pick(row, ['topic_covered']),
    pick(row, ['questions_asked']),
    pick(row, ['no_of_questions_asked']),
    pick(row, ['no_of_participants']),
    pick(row, ['feedback_rating']),
    pick(row, ['outcome_remarks']),
    pick(row, ['wa_sent']),
    fmtDateTime(pick(row, ['created_at'])),
    fmtDateTime(pick(row, ['updated_at'])),
  ];
}

async function syncAssessmentsSheet() {
  const columns = await getExistingColumns();

  const hasQuestionsAsked = columns.has('questions_asked');
  const hasWaSent = columns.has('wa_sent');

  const result = await pool.query(`
    SELECT
      a.id AS db_id,
      a.student_id,
      s.candidate_name,
      a.batch_id,
      b.batch_name,
      a.assessment_date,
      a.session_type,
      a.topic_covered,
      ${hasQuestionsAsked ? 'a.questions_asked' : 'NULL AS questions_asked'},
      a.no_of_questions_asked,
      a.no_of_participants,
      a.feedback_rating,
      a.outcome_remarks,
      ${hasWaSent ? 'a.wa_sent' : 'NULL AS wa_sent'},
      a.created_at,
      a.updated_at
    FROM batch_assessment a
    LEFT JOIN batches b ON a.batch_id = b.id
    LEFT JOIN students s ON a.student_id = s.id
    ORDER BY a.assessment_date DESC, a.id DESC
  `);

  const rows = normalizeRows(result);
  const values = rows.map(mapAssessmentRow);

  await replaceSheetData('Assessments', values, 'Z');

  return {
    success: true,
    count: values.length,
    sheet: 'Assessments',
  };
}

module.exports = { syncAssessmentsSheet };