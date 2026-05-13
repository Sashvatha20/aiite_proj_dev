const db = require('../db');
const { replaceSheetData } = require('./sheetSyncHelper');
const { mapStudentRow } = require('../mappers/studentsMapper');

async function syncStudentsSheet() {
  const result = await db.query(`
    SELECT
      s.id,
      s.batch_id,
      s.candidate_name,
      s.phone,
      s.email,
      s.whatsapp_number,
      s.certificate_no,
      s.created_at,
      s.updated_at,
      s.total_fee,
      s.payment_mode,
      s.joined_date,
      s.status,
      s.notes,
      b.batch_name AS batch_name,
      b.course_id AS course_id,
      c.course_name AS course_name,
      COALESCE(SUM(fp.amount), 0) AS paid_amount,
      GREATEST(s.total_fee - COALESCE(SUM(fp.amount), 0), 0) AS balance_amount,
      CASE
        WHEN COALESCE(s.total_fee, 0) <= 0 THEN NULL
        WHEN GREATEST(s.total_fee - COALESCE(SUM(fp.amount), 0), 0) = 0 THEN 'paid'
        WHEN COALESCE(SUM(fp.amount), 0) > 0 THEN 'partial'
        ELSE 'pending'
      END AS fee_status
    FROM students s
    LEFT JOIN batches b ON b.id = s.batch_id
    LEFT JOIN courses c ON c.id = b.course_id
    LEFT JOIN fee_payments fp ON fp.student_id = s.id
    GROUP BY
      s.id,
      s.batch_id,
      s.candidate_name,
      s.phone,
      s.email,
      s.whatsapp_number,
      s.certificate_no,
      s.created_at,
      s.updated_at,
      s.total_fee,
      s.payment_mode,
      s.joined_date,
      s.status,
      s.notes,
      b.batch_name,
      b.course_id,
      c.course_name
    ORDER BY s.created_at DESC
  `);

  const rows = result.rows || [];
  const values = rows.map(mapStudentRow);

  await replaceSheetData('Students', values, 'R');

  return {
    success: true,
    count: values.length,
    sheet: 'Students',
  };
}

module.exports = { syncStudentsSheet };