const db = require('../db');
const { replaceSheetData } = require('./sheetSyncHelper');

async function syncBatchProgressSheet() {
  const result = await db.query(`
    SELECT
      bp.id,
      bp.batch_id,
      b.batch_name,
      bp.progress_date,
      bp.phase,
      bp.last_topic_covered,
      bp.session_hours,
      bp.remarks,
      bp.created_at,
      bp.updated_at
    FROM batch_progress bp
    LEFT JOIN batches b ON b.id = bp.batch_id
    ORDER BY bp.progress_date DESC, bp.id DESC
  `);

  const rows = result.rows || [];

  const values = rows.map((bp) => [
    bp.id ?? '',
    bp.batch_id ?? '',
    bp.batch_name ?? '',
    bp.progress_date ? new Date(bp.progress_date).toISOString().split('T')[0] : '',
    bp.phase ?? '',
    bp.last_topic_covered ?? '',
    bp.session_hours ?? '',
    bp.remarks ?? '',
    '',
    bp.created_at ? new Date(bp.created_at).toISOString() : '',
    bp.updated_at ? new Date(bp.updated_at).toISOString() : '',
  ]);

  await replaceSheetData('Batch Progress', values, 'K');

  return {
    success: true,
    count: values.length,
    sheet: 'Batch Progress',
    message: 'Batch Progress sheet synced successfully',
  };
}

module.exports = { syncBatchProgressSheet };