import { useEffect, useMemo, useState } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../api/students';
import { getFeeDetails, addPayment } from '../../api/feePayments';
import { getBatches } from '../../api/batches';
import { syncStudentsSheet } from '../../api/sheetsSync';
import toast from 'react-hot-toast';

const BRAND = '#1D9E75';

const styles = {
  page: {
    display: 'grid',
    gap: 16,
  },

  card: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #edf0f2',
    boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)',
  },

  section: {
    padding: 18,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
  },

  sub: {
    fontSize: 12,
    color: '#64748b',
  },

  tabs: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  tab: {
    padding: '9px 14px',
    borderRadius: 999,
    border: '1px solid #dbe4ea',
    background: '#fff',
    color: '#475569',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },

  tabActive: {
    background: BRAND,
    color: '#fff',
    borderColor: BRAND,
  },

  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },

  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
  },

  field: {
    display: 'grid',
    gap: 5,
  },

  label: {
    fontSize: 11,
    fontWeight: 600,
    color: '#475569',
  },

  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #d9e2e8',
    fontSize: 13,
    outline: 'none',
    background: '#fff',
  },

  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #d9e2e8',
    fontSize: 13,
    outline: 'none',
    background: '#fff',
  },

  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #d9e2e8',
    fontSize: 13,
    outline: 'none',
    background: '#fff',
    minHeight: 88,
    resize: 'vertical',
  },

  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6,
  },

  btnPrimary: {
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    background: BRAND,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },

  btnSecondary: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #d9e2e8',
    background: '#fff',
    color: '#334155',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },

  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
  },

  kpi: {
    background: '#fff',
    border: '1px solid #edf0f2',
    borderRadius: 14,
    padding: 16,
  },

  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: 600,
  },

  kpiValue: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.1,
  },

  filterBar: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr auto',
    gap: 10,
    alignItems: 'center',
  },

  resultText: {
    fontSize: 12,
    color: '#64748b',
    justifySelf: 'end',
    whiteSpace: 'nowrap',
  },

  tableWrap: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontSize: 13,
  },

  th: {
    textAlign: 'left',
    padding: '12px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    borderBottom: '1px solid #e9eef2',
    background: '#fafcfd',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },

  td: {
    padding: '14px 12px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
    color: '#0f172a',
  },

  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#e8f7f1',
    color: BRAND,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },

  nameMain: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 2,
  },

  nameSub: {
    fontSize: 11,
    color: '#64748b',
  },

  moneyDark: {
    fontWeight: 700,
    color: '#0f172a',
  },

  moneyGreen: {
    fontWeight: 700,
    color: '#0f766e',
  },

  moneyRed: {
    fontWeight: 700,
    color: '#b42318',
  },

  rowActions: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },

  miniBtn: {
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid #d9e2e8',
    background: '#fff',
    color: '#334155',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },

  infoBox: {
    background: '#f8fafc',
    border: '1px solid #e6edf3',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 12,
    color: '#475569',
    lineHeight: 1.6,
  },

  feeSummary: {
    background: '#f7fcfa',
    border: '1px solid #d9efe6',
    borderRadius: 12,
    padding: 14,
  },

  feeSummaryTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: BRAND,
    marginBottom: 8,
  },

  feeLine: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    fontSize: 13,
    padding: '4px 0',
  },

  empty: {
    textAlign: 'center',
    padding: '42px 18px',
    color: '#94a3b8',
    fontSize: 13,
  },

  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
  },

  modalBox: {
    width: 900,
    maxWidth: '100%',
    maxHeight: '92vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 20px 60px rgba(2, 6, 23, 0.28)',
    border: '1px solid #eef2f5',
  },

  modalHead: {
    padding: '18px 20px',
    borderBottom: '1px solid #eef2f5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  modalBody: {
    padding: 20,
    display: 'grid',
    gap: 16,
  },

  closeBtn: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    width: 34,
    height: 34,
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 18,
    lineHeight: 1,
    color: '#64748b',
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
  },

  summaryCard: {
    border: '1px solid #edf0f2',
    borderRadius: 14,
    padding: 16,
    background: '#fff',
  },

  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 600,
    marginBottom: 6,
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0f172a',
  },

  historyCard: {
    border: '1px solid #edf0f2',
    borderRadius: 14,
    overflow: 'hidden',
    background: '#fff',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 10,
  },
};

const badgeStyle = {
  paid: { background: '#e7f8ee', color: '#067647', label: 'Paid' },
  partial: { background: '#fff4dd', color: '#b54708', label: 'Partial' },
  pending: { background: '#feeceb', color: '#b42318', label: 'Pending' },
};

function formatMoney(v) {
  return `₹${Number(v || 0).toLocaleString()}`;
}

export default function Students() {
  const [tab, setTab] = useState(1);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncingSheet, setSyncingSheet] = useState(false);

  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterFee, setFilterFee] = useState('');

  const [editId, setEditId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [showAddPayment, setShowAddPayment] = useState(false);

  const blank = {
    batch_id: '',
    candidate_name: '',
    phone: '',
    email: '',
    whatsapp_number: '',
    certificate_no: '',
    total_fee: '',
    fee_paid: '',
    payment_mode: 'cash',
    reference_no: '',
    notes: '',
  };

  const blankPay = {
    amount: '',
    payment_mode: 'cash',
    reference_no: '',
    notes: '',
    payment_date: new Date().toISOString().split('T')[0],
  };

  const [form, setForm] = useState(blank);
  const [payForm, setPayForm] = useState(blankPay);

  useEffect(() => {
    loadAll();
    loadBatches();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await getStudents();
      setStudents(res.data.students || []);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const res = await getBatches();
      setBatches(res.data.batches || []);
    } catch (err) {
      toast.error('Failed to load batches');
    }
  };

  const handleSyncStudentsSheet = async () => {
    try {
      setSyncingSheet(true);
      const res = await syncStudentsSheet();

      if (res?.data?.success) {
        toast.success(res?.data?.message || `Students sheet synced (${res?.data?.count || 0} rows)`);
      } else {
        toast.error(res?.data?.error || 'Students sheet sync failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to sync students sheet');
    } finally {
      setSyncingSheet(false);
    }
  };

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const setPayField = (k, v) => setPayForm((prev) => ({ ...prev, [k]: v }));

  const totalFeeNum = Number(form.total_fee || 0);
  const feePaidNum = Number(form.fee_paid || 0);
  const pendingNum = Math.max(totalFeeNum - feePaidNum, 0);

  const studentsWithFee = useMemo(() => {
    return (students || []).map((s) => {
      const total = Number(s.total_fee || 0);
      const paid = Number(
        s.total_paid !== undefined && s.total_paid !== null
          ? s.total_paid
          : s.paid_amount || 0
      );
      const balance = Math.max(total - paid, 0);

      let fee_status = null;
      if (total > 0) {
        if (balance <= 0) fee_status = 'paid';
        else if (paid > 0) fee_status = 'partial';
        else fee_status = 'pending';
      }

      return {
        ...s,
        total_paid: paid,
        balance,
        fee_status,
      };
    });
  }, [students]);

  const filteredStudents = useMemo(() => {
    return studentsWithFee.filter((s) => {
      const matchSearch = search
        ? (s.candidate_name || '').toLowerCase().includes(search.toLowerCase()) ||
          (s.phone || '').includes(search) ||
          (s.email || '').toLowerCase().includes(search.toLowerCase())
        : true;

      const matchBatch = filterBatch ? String(s.batch_id) === String(filterBatch) : true;
      const matchFee = filterFee ? s.fee_status === filterFee : true;

      return matchSearch && matchBatch && matchFee;
    });
  }, [studentsWithFee, search, filterBatch, filterFee]);

  const kpis = useMemo(() => {
    return {
      total: studentsWithFee.length,
      paid: studentsWithFee.filter((s) => s.fee_status === 'paid').length,
      partial: studentsWithFee.filter((s) => s.fee_status === 'partial').length,
      pending: studentsWithFee.filter((s) => s.fee_status === 'pending').length,
    };
  }, [studentsWithFee]);

  const resetForm = () => {
    setForm(blank);
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.batch_id || !form.candidate_name.trim()) {
      return toast.error('Batch and student name are required');
    }

    if (totalFeeNum < 0) return toast.error('Total fee cannot be negative');
    if (!editId && feePaidNum < 0) return toast.error('Fee paid cannot be negative');
    if (!editId && totalFeeNum > 0 && feePaidNum > totalFeeNum) {
      return toast.error('Fee paid cannot be greater than total fee');
    }

    const payload = editId
      ? {
          batch_id: form.batch_id,
          candidate_name: form.candidate_name,
          phone: form.phone,
          email: form.email,
          whatsapp_number: form.whatsapp_number,
          certificate_no: form.certificate_no,
          total_fee: form.total_fee,
          notes: form.notes,
        }
      : {
          batch_id: form.batch_id,
          candidate_name: form.candidate_name,
          phone: form.phone,
          email: form.email,
          whatsapp_number: form.whatsapp_number,
          certificate_no: form.certificate_no,
          total_fee: form.total_fee,
          initial_payment: form.fee_paid || 0,
          payment_mode: form.payment_mode,
          reference_no: form.reference_no,
          notes: form.notes,
        };

    setLoading(true);
    try {
      if (editId) {
        await updateStudent(editId, payload);
        toast.success('Student updated');
      } else {
        await createStudent(payload);
        toast.success('Student enrolled');
      }
      resetForm();
      setTab(1);
      await loadAll();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setForm({
      batch_id: student.batch_id || '',
      candidate_name: student.candidate_name || '',
      phone: student.phone || '',
      email: student.email || '',
      whatsapp_number: student.whatsapp_number || '',
      certificate_no: student.certificate_no || '',
      total_fee: student.total_fee || '',
      fee_paid: '',
      payment_mode: 'cash',
      reference_no: '',
      notes: student.notes || '',
    });
    setEditId(student.id);
    setTab(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;

    try {
      await deleteStudent(id);
      toast.success('Student deleted');
      await loadAll();
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };

  const openProfile = async (student) => {
    setProfile(student);
    setFeeData(null);
    setShowAddPayment(false);
    setPayForm(blankPay);

    try {
      const res = await getFeeDetails(student.id);
      setFeeData(res.data);
    } catch (err) {
      toast.error('Failed to load fee details');
    }
  };

  const closeProfile = () => {
    setProfile(null);
    setFeeData(null);
    setShowAddPayment(false);
    setPayForm(blankPay);
  };

  const submitPayment = async () => {
    if (!payForm.amount || Number(payForm.amount) <= 0) {
      return toast.error('Enter a valid amount');
    }

    try {
      setLoading(true);
      await addPayment(profile.id, payForm);
      toast.success('Payment added');

      const res = await getFeeDetails(profile.id);
      setFeeData(res.data);
      await loadAll();

      setShowAddPayment(false);
      setPayForm(blankPay);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, ...styles.section }}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>Students & Fees</div>
            <div style={styles.sub}>Simple view for enrollments, fee status, and payment tracking</div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={styles.tabs}>
              <button
                type="button"
                style={{ ...styles.tab, ...(tab === 1 ? styles.tabActive : {}) }}
                onClick={() => setTab(1)}
              >
                Fee Dashboard
              </button>
              <button
                type="button"
                style={{ ...styles.tab, ...(tab === 0 ? styles.tabActive : {}) }}
                onClick={() => setTab(0)}
              >
                {editId ? 'Edit Student' : 'Enroll Student'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSyncStudentsSheet}
              disabled={syncingSheet}
              style={{
                ...styles.btnPrimary,
                opacity: syncingSheet ? 0.7 : 1,
                cursor: syncingSheet ? 'not-allowed' : 'pointer',
              }}
            >
              {syncingSheet ? 'Syncing...' : 'Sync Students Sheet'}
            </button>
          </div>
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gap: 16 }}>
            {editId && (
              <div style={styles.infoBox}>
                You are editing student details only. To collect a new payment, open the student profile and use <strong>Add Payment</strong>.
              </div>
            )}

            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Batch *</label>
                <select
                  style={styles.select}
                  value={form.batch_id}
                  onChange={(e) => setField('batch_id', e.target.value)}
                >
                  <option value="">Select batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_name} — {b.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Student name *</label>
                <input
                  style={styles.input}
                  value={form.candidate_name}
                  onChange={(e) => setField('candidate_name', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Phone</label>
                <input
                  style={styles.input}
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="Mobile number"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>WhatsApp number</label>
                <input
                  style={styles.input}
                  value={form.whatsapp_number}
                  onChange={(e) => setField('whatsapp_number', e.target.value)}
                  placeholder="If different from phone"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Certificate number</label>
                <input
                  style={styles.input}
                  value={form.certificate_no}
                  onChange={(e) => setField('certificate_no', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Total fee (₹)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  value={form.total_fee}
                  onChange={(e) => setField('total_fee', e.target.value)}
                  placeholder="e.g. 25000"
                />
              </div>

              {!editId ? (
                <div style={styles.field}>
                  <label style={styles.label}>Fee paid now (₹)</label>
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    value={form.fee_paid}
                    onChange={(e) => setField('fee_paid', e.target.value)}
                    placeholder="e.g. 5000"
                  />
                </div>
              ) : (
                <div style={styles.field}>
                  <label style={styles.label}>Payment update</label>
                  <div style={{ ...styles.input, background: '#f8fafc', color: '#64748b' }}>
                    Add new payments from student profile
                  </div>
                </div>
              )}
            </div>

            {!editId && (
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Payment mode</label>
                  <select
                    style={styles.select}
                    value={form.payment_mode}
                    onChange={(e) => setField('payment_mode', e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Reference no.</label>
                  <input
                    style={styles.input}
                    value={form.reference_no}
                    onChange={(e) => setField('reference_no', e.target.value)}
                    placeholder="UPI / cheque / bank ref"
                  />
                </div>
              </div>
            )}

            {(totalFeeNum > 0 || feePaidNum > 0) && (
              <div style={styles.feeSummary}>
                <div style={styles.feeSummaryTitle}>Fee Summary</div>
                <div style={styles.feeLine}>
                  <span>Total fee</span>
                  <strong>{formatMoney(totalFeeNum)}</strong>
                </div>
                {!editId && (
                  <>
                    <div style={styles.feeLine}>
                      <span>Paid now</span>
                      <strong>{formatMoney(feePaidNum)}</strong>
                    </div>
                    <div style={styles.feeLine}>
                      <span>Pending</span>
                      <strong style={{ color: pendingNum > 0 ? '#b42318' : '#067647' }}>
                        {formatMoney(pendingNum)}
                      </strong>
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Notes</label>
              <textarea
                style={styles.textarea}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Optional notes"
              />
            </div>

            <div style={styles.actions}>
              <button type="button" style={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editId ? 'Update Student' : 'Enroll Student'}
              </button>
              <button type="button" style={styles.btnSecondary} onClick={resetForm}>
                Clear
              </button>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={styles.kpiGrid}>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Total Students</div>
                <div style={styles.kpiValue}>{kpis.total}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Fully Paid</div>
                <div style={{ ...styles.kpiValue, color: '#067647' }}>{kpis.paid}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Partial</div>
                <div style={{ ...styles.kpiValue, color: '#b54708' }}>{kpis.partial}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Pending</div>
                <div style={{ ...styles.kpiValue, color: '#b42318' }}>{kpis.pending}</div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.section}>
                <div style={styles.filterBar}>
                  <input
                    style={styles.input}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student, phone, or email"
                  />

                  <select
                    style={styles.select}
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                  >
                    <option value="">All batches</option>
                    {batches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.batch_name}
                      </option>
                    ))}
                  </select>

                  <select
                    style={styles.select}
                    value={filterFee}
                    onChange={(e) => setFilterFee(e.target.value)}
                  >
                    <option value="">All fee status</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="pending">Pending</option>
                  </select>

                  <div style={styles.resultText}>
                    {filteredStudents.length} result{filteredStudents.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div style={styles.tableWrap}>
                {loading ? (
                  <div style={styles.empty}>Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                  <div style={styles.empty}>No students found</div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Student</th>
                        <th style={styles.th}>Batch</th>
                        <th style={styles.th}>Total Fee</th>
                        <th style={styles.th}>Paid</th>
                        <th style={styles.th}>Pending</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => (
                        <tr key={s.id}>
                          <td style={styles.td}>
                            <div style={styles.nameCell}>
                              <div style={styles.avatar}>
                                {(s.candidate_name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={styles.nameMain}>{s.candidate_name}</div>
                                <div style={styles.nameSub}>{s.phone || s.email || 'No contact'}</div>
                              </div>
                            </div>
                          </td>

                          <td style={styles.td}>
                            <div style={styles.nameMain}>{s.batch_name || '-'}</div>
                            <div style={styles.nameSub}>{s.course_name || ''}</div>
                          </td>

                          <td style={{ ...styles.td, ...styles.moneyDark }}>
                            {s.total_fee ? formatMoney(s.total_fee) : '-'}
                          </td>

                          <td style={{ ...styles.td, ...styles.moneyGreen }}>
                            {s.total_paid > 0 ? formatMoney(s.total_paid) : '-'}
                          </td>

                          <td style={{ ...styles.td, ...styles.moneyRed }}>
                            {s.total_fee ? formatMoney(s.balance) : '-'}
                          </td>

                          <td style={styles.td}>
                            {s.fee_status ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '5px 10px',
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: badgeStyle[s.fee_status].background,
                                  color: badgeStyle[s.fee_status].color,
                                }}
                              >
                                {badgeStyle[s.fee_status].label}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>No fee set</span>
                            )}
                          </td>

                          <td style={styles.td}>
                            <div style={styles.rowActions}>
                              <button type="button" style={styles.miniBtn} onClick={() => openProfile(s)}>
                                View
                              </button>
                              <button type="button" style={styles.miniBtn} onClick={() => handleEdit(s)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                style={{ ...styles.miniBtn, color: '#b42318' }}
                                onClick={() => handleDelete(s.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {profile && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && closeProfile()}>
          <div style={styles.modalBox}>
            <div style={styles.modalHead}>
              <div>
                <div style={styles.title}>{profile.candidate_name}</div>
                <div style={styles.sub}>
                  {profile.batch_name || '-'} {profile.course_name ? `• ${profile.course_name}` : ''}
                </div>
              </div>

              <button type="button" style={styles.closeBtn} onClick={closeProfile}>
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              {feeData ? (
                <>
                  <div style={styles.summaryGrid}>
                    <div style={styles.summaryCard}>
                      <div style={styles.summaryLabel}>Total Fee</div>
                      <div style={styles.summaryValue}>{formatMoney(feeData.summary?.total_fee || 0)}</div>
                    </div>
                    <div style={styles.summaryCard}>
                      <div style={styles.summaryLabel}>Total Paid</div>
                      <div style={{ ...styles.summaryValue, color: '#067647' }}>
                        {formatMoney(feeData.summary?.total_paid || 0)}
                      </div>
                    </div>
                    <div style={styles.summaryCard}>
                      <div style={styles.summaryLabel}>Pending</div>
                      <div
                        style={{
                          ...styles.summaryValue,
                          color: Number(feeData.summary?.balance || 0) > 0 ? '#b42318' : '#067647',
                        }}
                      >
                        {formatMoney(feeData.summary?.balance || 0)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={styles.sectionTitle}>Payment History</div>
                      <div style={styles.sub}>
                        Track all payments clearly in one place
                      </div>
                    </div>

                    {Number(feeData.summary?.balance || 0) > 0 && (
                      <button
                        type="button"
                        style={styles.btnPrimary}
                        onClick={() => setShowAddPayment((v) => !v)}
                      >
                        {showAddPayment ? 'Close Payment Form' : 'Add Payment'}
                      </button>
                    )}
                  </div>

                  {showAddPayment && (
                    <div style={{ ...styles.card, ...styles.section }}>
                      <div style={styles.sectionTitle}>Record New Payment</div>

                      <div style={styles.grid2}>
                        <div style={styles.field}>
                          <label style={styles.label}>Amount (₹)</label>
                          <input
                            style={styles.input}
                            type="number"
                            min="0"
                            value={payForm.amount}
                            onChange={(e) => setPayField('amount', e.target.value)}
                            placeholder="Enter amount"
                          />
                        </div>

                        <div style={styles.field}>
                          <label style={styles.label}>Payment mode</label>
                          <select
                            style={styles.select}
                            value={payForm.payment_mode}
                            onChange={(e) => setPayField('payment_mode', e.target.value)}
                          >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div style={styles.grid2}>
                        <div style={styles.field}>
                          <label style={styles.label}>Payment date</label>
                          <input
                            style={styles.input}
                            type="date"
                            value={payForm.payment_date}
                            onChange={(e) => setPayField('payment_date', e.target.value)}
                          />
                        </div>

                        <div style={styles.field}>
                          <label style={styles.label}>Reference no.</label>
                          <input
                            style={styles.input}
                            value={payForm.reference_no}
                            onChange={(e) => setPayField('reference_no', e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                      </div>

                      <div style={styles.field}>
                        <label style={styles.label}>Notes</label>
                        <textarea
                          style={styles.textarea}
                          value={payForm.notes}
                          onChange={(e) => setPayField('notes', e.target.value)}
                          placeholder="Optional notes"
                        />
                      </div>

                      <div style={styles.actions}>
                        <button type="button" style={styles.btnPrimary} onClick={submitPayment} disabled={loading}>
                          Save Payment
                        </button>
                        <button
                          type="button"
                          style={styles.btnSecondary}
                          onClick={() => {
                            setShowAddPayment(false);
                            setPayForm(blankPay);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={styles.historyCard}>
                    <div style={styles.tableWrap}>
                      {feeData.payments && feeData.payments.length > 0 ? (
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Date</th>
                              <th style={styles.th}>Amount</th>
                              <th style={styles.th}>Mode</th>
                              <th style={styles.th}>Reference</th>
                              <th style={styles.th}>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {feeData.payments.map((p) => (
                              <tr key={p.id}>
                                <td style={styles.td}>
                                  {String(p.payment_date || '').split('T')[0] || '-'}
                                </td>
                                <td style={{ ...styles.td, ...styles.moneyGreen }}>
                                  {formatMoney(p.amount)}
                                </td>
                                <td style={styles.td}>{p.payment_mode || '-'}</td>
                                <td style={styles.td}>{p.reference_no || '-'}</td>
                                <td style={styles.td}>{p.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={styles.empty}>No payment history found</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div style={styles.empty}>Loading fee details...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}