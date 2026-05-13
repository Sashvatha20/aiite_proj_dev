import { useState, useEffect } from 'react';
import { getBatches } from '../../api/batches';
import { getStudents } from '../../api/students';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';

const getAssessments = (params) => api.get('/assessments', { params });
const createAssessment = (data) => api.post('/assessments', data);
const updateAssessment = (id, data) => api.put(`/assessments/${id}`, data);

const G = '#1D9E75';

const S = {
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 6px 20px rgba(15,23,42,0.04)',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    fontSize: 11,
    background: '#E6F1FB',
    color: '#185FA5',
    padding: '4px 8px',
    borderRadius: 6,
    fontWeight: 600,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #eee',
    marginBottom: 16,
  },
  tab: {
    padding: '10px 18px',
    fontSize: 13,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    color: '#64748b',
  },
  tabA: {
    borderBottomColor: G,
    color: G,
    fontWeight: 600,
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    marginBottom: 16,
  },
  row3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 14,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 600,
    marginBottom: 6,
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 13,
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 13,
    outline: 'none',
    resize: 'vertical',
    minHeight: 90,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    lineHeight: 1.6,
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    marginTop: 20,
  },
  btn: {
    padding: '10px 18px',
    borderRadius: 10,
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    color: '#374151',
  },
  btnP: {
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    background: G,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
  th: {
    textAlign: 'left',
    padding: '12px 14px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 700,
    background: '#f9fafb',
  },
  td: {
    padding: '14px 14px',
    borderBottom: '1px solid #f3f4f6',
    color: '#111827',
    verticalAlign: 'top',
  },
  actBtn: {
    fontSize: 12,
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  badge: (c) => ({
    fontSize: 11,
    padding: '4px 10px',
    borderRadius: 12,
    background:
      c === 'excellent'
        ? '#dcfce7'
        : c === 'good'
        ? '#dbeafe'
        : c === 'average'
        ? '#fef3c7'
        : '#fecaca',
    color:
      c === 'excellent'
        ? '#166534'
        : c === 'good'
        ? '#1e40af'
        : c === 'average'
        ? '#92400e'
        : '#991b1b',
    fontWeight: 600,
  }),
  waBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 12,
    padding: '16px 18px',
    fontSize: 13,
    color: '#166534',
    marginTop: 16,
  },
  waBtn: {
    marginTop: 12,
    padding: '10px 20px',
    background: '#25D366',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

const today = () => new Date().toISOString().split('T')[0];
const ratings = ['excellent', 'good', 'average', 'needs_improvement'];

export default function Assessment() {
  const [tab, setTab] = useState(0);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const blank = {
    batch_id: '',
    student_id: '',
    assessment_date: today(),
    topic_covered: '',
    questions_asked: '',
    no_of_questions_asked: '',
    feedback_rating: 'good',
    outcome_remarks: '',
    session_type: 'regular',
    no_of_participants: '',
    session_hours: '',
    wa_sent: false,
  };

  const [form, setForm] = useState(blank);

  useEffect(() => {
    getBatches({ status: 'ongoing' }).then((r) => setBatches(r.data.batches || []));
    loadAssessments();
  }, []);

  useEffect(() => {
    if (form.batch_id) {
      getStudents({ batch_id: form.batch_id }).then((r) => setStudents(r.data.students || []));
    } else {
      setStudents([]);
    }
  }, [form.batch_id]);

  const loadAssessments = async () => {
    try {
      const r = await getAssessments();
      setAssessments(r.data.assessments || []);
    } catch {
      toast.error('Failed to load assessments');
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const buildWA = () => {
    const batch = batches.find((b) => String(b.id) === String(form.batch_id));
    const student = students.find((s) => String(s.id) === String(form.student_id));

    return `📋 Batch Assessment Report (${form.assessment_date})

Batch: ${batch?.batch_name || '—'}
Student: ${student?.candidate_name || 'All participants'}
Topic: ${form.topic_covered || '—'}
Questions count: ${form.no_of_questions_asked || '—'}
Questions:
${form.questions_asked || '—'}
Rating: ${form.feedback_rating?.replace(/_/g, ' ')}
Participants: ${form.no_of_participants || '—'}
Session hours: ${form.session_hours || '—'}h
${form.outcome_remarks ? 'Remarks: ' + form.outcome_remarks : ''}`.trim();
  };

  const openWA = () => {
    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(buildWA())}`, '_blank');
    set('wa_sent', true);
    toast.success('WhatsApp opened — select contact manually');
  };

  const showWAPreview = form.topic_covered || form.feedback_rating || form.questions_asked;

  const handleSubmit = async () => {
    if (!form.batch_id || !form.topic_covered || !form.questions_asked?.trim()) {
      return toast.error('Batch, topic, and questions are required');
    }

    const payload = {
      ...form,
      student_id: form.student_id || null,
      no_of_questions_asked: form.no_of_questions_asked || null,
      no_of_participants: form.no_of_participants || null,
      session_hours: form.session_hours || null,
    };

    setLoading(true);

    try {
      if (editId) {
        await updateAssessment(editId, payload);
        toast.success('Assessment updated successfully');
      } else {
        await createAssessment(payload);
        toast.success('Assessment logged successfully');
      }

      await loadAssessments();
      setForm(blank);
      setEditId(null);
      setTab(1);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (a) => {
    const nextForm = {
      batch_id: a.batch_id || '',
      student_id: a.student_id || '',
      assessment_date: a.assessment_date?.split('T')[0] || today(),
      topic_covered: a.topic_covered || '',
      questions_asked: a.questions_asked || '',
      no_of_questions_asked: a.no_of_questions_asked || '',
      feedback_rating: a.feedback_rating || 'good',
      outcome_remarks: a.outcome_remarks || '',
      session_type: a.session_type || 'regular',
      no_of_participants: a.no_of_participants || '',
      session_hours: a.session_hours || '',
      wa_sent: !!a.wa_sent,
    };

    setForm(nextForm);
    setEditId(a.id);
    setTab(0);

    if (a.batch_id) {
      try {
        const r = await getStudents({ batch_id: a.batch_id });
        setStudents(r.data.students || []);
      } catch {
        setStudents([]);
      }
    }
  };

  const handleClear = () => {
    setForm(blank);
    setEditId(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={S.card}>
        <div style={S.title}>
          Batch Assessment
          <span style={S.tag}>Batch Assessment Report</span>
        </div>

        <div style={S.tabs}>
          {['Add assessment', 'View history'].map((t, i) => (
            <div
              key={i}
              style={{ ...S.tab, ...(tab === i ? S.tabA : {}) }}
              onClick={() => setTab(i)}
            >
              {t}
            </div>
          ))}
        </div>

        {tab === 0 && (
          <div>
            {editId && (
              <div
                style={{
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  borderRadius: 12,
                  padding: '12px 16px',
                  fontSize: 13,
                  color: '#92400E',
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>✏️ Editing existing assessment</span>
                <button style={S.actBtn} onClick={handleClear}>
                  ✕ Cancel
                </button>
              </div>
            )}

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Batch *</label>
                <select
                  style={S.select}
                  value={form.batch_id}
                  onChange={(e) => set('batch_id', e.target.value)}
                >
                  <option value="">Select batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_name} — {b.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Student (optional — leave blank for whole batch)</label>
                <select
                  style={S.select}
                  value={form.student_id}
                  onChange={(e) => set('student_id', e.target.value)}
                >
                  <option value="">All participants</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.candidate_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>Assessment date</label>
                <input
                  style={S.input}
                  type="date"
                  value={form.assessment_date}
                  onChange={(e) => set('assessment_date', e.target.value)}
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Session type</label>
                <select
                  style={S.select}
                  value={form.session_type}
                  onChange={(e) => set('session_type', e.target.value)}
                >
                  <option value="regular">Regular</option>
                  <option value="crash">Crash</option>
                  <option value="recorded">Recorded</option>
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Session hours</label>
                <input
                  style={S.input}
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g. 1.5"
                  value={form.session_hours}
                  onChange={(e) => set('session_hours', e.target.value)}
                />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Topic covered *</label>
              <input
                style={S.input}
                value={form.topic_covered}
                onChange={(e) => set('topic_covered', e.target.value)}
                placeholder="e.g. Exception Handling, Collections"
              />
            </div>

            <div style={S.field}>
              <label style={S.label}>Questions asked *</label>
              <textarea
                style={S.textarea}
                value={form.questions_asked}
                onChange={(e) => set('questions_asked', e.target.value)}
                placeholder={`Write the actual questions asked in the session.
Example:
1. What is polymorphism?
2. Explain try-catch-finally.
3. Difference between ArrayList and LinkedList.`}
              />
            </div>

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>No. of questions asked</label>
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  placeholder="e.g. 5"
                  value={form.no_of_questions_asked}
                  onChange={(e) => set('no_of_questions_asked', e.target.value)}
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>No. of participants</label>
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  placeholder="e.g. 12"
                  value={form.no_of_participants}
                  onChange={(e) => set('no_of_participants', e.target.value)}
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Rating</label>
                <select
                  style={S.select}
                  value={form.feedback_rating}
                  onChange={(e) => set('feedback_rating', e.target.value)}
                >
                  {ratings.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Outcome / Remarks</label>
              <textarea
                style={S.textarea}
                value={form.outcome_remarks}
                onChange={(e) => set('outcome_remarks', e.target.value)}
                placeholder="How did the session go? Any notable observations..."
              />
            </div>

            {showWAPreview && (
              <div style={S.waBox}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>📱 WhatsApp message preview:</div>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.8,
                    fontFamily: 'monospace',
                    fontSize: 11,
                  }}
                >
                  {buildWA()}
                </div>

                <button style={S.waBtn} onClick={openWA}>
                  Open WhatsApp Web → select contact manually
                </button>

                {form.wa_sent && (
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: 10,
                      color: '#0F6E56',
                      fontWeight: 500,
                    }}
                  >
                    ✓ Sent
                  </span>
                )}
              </div>
            )}

            <div style={S.btnRow}>
              <button style={S.btnP} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editId ? 'Update assessment' : 'Submit assessment'}
              </button>
              <button style={S.btn} onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            {assessments.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#aaa',
                  fontSize: 12,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                No assessments logged yet
              </div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Batch</th>
                    <th style={S.th}>Student</th>
                    <th style={S.th}>Topic</th>
                    <th style={S.th}>Questions</th>
                    <th style={S.th}>Rating</th>
                    <th style={S.th}>WA</th>
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => (
                    <tr key={a.id}>
                      <td style={S.td}>{a.assessment_date?.split('T')[0]}</td>
                      <td style={S.td}>{a.batch_name || '—'}</td>
                      <td style={S.td}>{a.candidate_name || 'All'}</td>
                      <td style={S.td}>{a.topic_covered}</td>
                      <td style={S.td}>{a.no_of_questions_asked || '—'}</td>
                      <td style={S.td}>
                        <span style={S.badge(a.feedback_rating)}>
                          {a.feedback_rating?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={S.badge(a.wa_sent ? 'good' : 'needs_improvement')}>
                          {a.wa_sent ? 'Sent' : '—'}
                        </span>
                      </td>
                      <td style={S.td}>
                        <button style={S.actBtn} onClick={() => handleEdit(a)}>
                          ✎ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}