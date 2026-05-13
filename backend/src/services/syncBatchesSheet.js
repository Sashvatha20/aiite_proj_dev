const pool = require('../db');
const { sheets, spreadsheetId } = require('./googleSheets');

async function syncBatchesSheet() {
  const range = 'Batches!A1';

  const result = await pool.query(`
    SELECT
      b.id,
      b.batch_name,
      b.course_id,
      c.course_name,
      b.batch_start_date,
      b.batch_end_date,
      b.weekday_weekend,
      b.session_type,
      b.timing,
      b.status,
      b.created_at,
      b.updated_at
    FROM batches b
    LEFT JOIN courses c ON c.id = b.course_id
    ORDER BY b.id ASC
  `);

  const rows = result.rows || [];

  const values = [
    [
      'ID',
      'Batch Name',
      'Course ID',
      'Course Name',
      'Batch Start Date',
      'Batch End Date',
      'Weekday/Weekend',
      'Session Type',
      'Timing',
      'Status',
      'Created At',
      'Updated At',
    ],
    ...rows.map((b) => [
      b.id ?? '',
      b.batch_name ?? '',
      b.course_id ?? '',
      b.course_name ?? '',
      b.batch_start_date ? new Date(b.batch_start_date).toISOString().split('T')[0] : '',
      b.batch_end_date ? new Date(b.batch_end_date).toISOString().split('T')[0] : '',
      b.weekday_weekend ?? '',
      b.session_type ?? '',
      b.timing ?? '',
      b.status ?? '',
      b.created_at ? new Date(b.created_at).toISOString() : '',
      b.updated_at ? new Date(b.updated_at).toISOString() : '',
    ]),
  ];

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Batches!A:Z',
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  });

  return {
    success: true,
    message: 'Batches sheet synced successfully',
    count: rows.length,
  };
}

module.exports = { syncBatchesSheet };