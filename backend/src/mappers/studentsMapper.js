function mapStudentRow(s) {
  const totalFee = Number(s.total_fee ?? s.totalfee ?? 0);
  const paidAmount = Number(s.paid_amount ?? s.paidamount ?? 0);
  const balanceAmount = Number(
    s.balance_amount ?? s.balanceamount ?? Math.max(totalFee - paidAmount, 0)
  );

  let paymentStatus =
    s.fee_status ??
    s.feestatus ??
    s.payment_status ??
    s.paymentstatus ??
    '';

  if (!paymentStatus) {
    if (totalFee > 0 && balanceAmount === 0) paymentStatus = 'paid';
    else if (paidAmount > 0) paymentStatus = 'partial';
    else if (totalFee > 0) paymentStatus = 'pending';
  }

  return [
    s.id ?? '',
    s.candidate_name ?? s.candidatename ?? '',
    s.phone ?? '',
    s.email ?? '',
    s.whatsapp_number ?? s.whatsappnumber ?? '',
    s.batch_id ?? s.batchid ?? '',
    s.batch_name ?? s.batchname ?? '',
    s.course_id ?? s.courseid ?? '',
    s.course_name ?? s.coursename ?? '',
    totalFee,
    paidAmount,
    balanceAmount,
    paymentStatus,
    s.payment_mode ?? s.paymentmode ?? '',
    s.joined_date ?? s.join_date ?? s.joindate ?? '',
    s.status ?? s.placement_status ?? s.placementstatus ?? '',
    s.created_at ?? s.createdat ?? '',
    s.updated_at ?? s.updatedat ?? '',
  ];
}

module.exports = { mapStudentRow };