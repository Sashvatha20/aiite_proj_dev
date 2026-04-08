import { useState, useEffect } from 'react';
import { getBatches } from '../../api/batches';
import { getStudents } from '../../api/students';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';

const getAssessments  = (params) => api.get('/assessments', { params });
const createAssessment = (data)  => api.post('/assessments', data);
const updateAssessment = (id, data) => api.put(`/assessments/${id}`, data);

const G = '#1D9E75';
const S = {
  card:     { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:    { fontSize:15, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  tag:      { fontSize:9, background:'#E6F1FB', color:'#185FA5', padding:'2px 6px', borderRadius:4 },
  tabs:     { display:'flex', borderBottom:'1px solid #eee', marginBottom:14 },
  tab:      { padding:'7px 14px', fontSize:12, cursor:'pointer', borderBottom:'2px solid transparent', color:'#888' },
  tabA:     { borderBottomColor:G, color:G, fontWeight:500 },
  row2:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 },
  row3:     { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 },
  field:    { marginBottom:10 },
  label:    { fontSize:11, color:'#666', display:'block', marginBottom:3 },
  input:    { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box' },
  select:   { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff', boxSizing:'border-box' },
  textarea: { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', resize:'vertical', minHeight:70, boxSizing:'border-box', fontFamily:'inherit' },
  btnRow:   { display:'flex', gap:8, marginTop:12 },
  btn:      { padding:'8px 16px', borderRadius:8, border:'1px solid #ddd', background:'#fff', fontSize:12, cursor:'pointer' },
  btnP:     { padding:'8px 16px', borderRadius:8, border:'none', background:G, color:'#fff', fontSize:12, cursor:'pointer' },
  table:    { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:       { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:       { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  actBtn:   { fontSize:10, padding:'3px 8px', borderRadius:6, border:'1px solid #ddd', background:'#fff', cursor:'pointer', marginRight:4 },
  badge:    (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='excellent'?'#E1F5EE': c==='good'?'#E6F1FB': c==='average'?'#FEF9C3':'#FCEBEB',
    color:      c==='excellent'?'#0F6E56': c==='good'?'#185FA5': c==='average'?'#854F0B':'#A32D2D' }),
  waBox:    { background:'#E1F5EE', border:'1px solid #9FE1CB', borderRadius:8, padding:'12px 14px', fontSize:11, color:'#0F6E56', marginTop:10 },
  waBtn:    { marginTop:10, padding:'7px 16px', background:'#25D366', color:'#fff', border:'none', borderRadius:8, fontSize:12, cursor:'pointer' },
};

const today = () => new Date().toISOString().split('T')[0];
const ratings = ['excellent','good','average','needs_improvement'];

export default function Assessment() {
  const [tab, setTab]           = useState(0);
  const [batches, setBatches]   = useState([]);
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [editId, setEditId]     = useState(null);

  const blank = {
    batch_id: '', student_id: '', assessment_date: today(),
    topic_covered: '', no_of_questions_asked: '',
    feedback_rating: 'good', outcome_remarks: '',
    session_type: 'weekday', no_of_participants: '',
    session_hours: '', wa_sent: false
  };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    getBatches({ status:'ongoing' }).then(r => setBatches(r.data.batches || []));
    loadAssessments();
  }, []);

  useEffect(() => {
    if (form.batch_id) {
      getStudents({ batch_id: form.batch_id }).then(r => setStudents(r.data.students || []));
    } else {
      setStudents([]);
    }
  }, [form.batch_id]);

  const loadAssessments = async () => {
    try {
      const r = await getAssessments();
      setAssessments(r.data.assessments || []);
    } catch {}
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // WhatsApp message builder
  const buildWA = () => {
    const batch   = batches.find(b => String(b.id) === String(form.batch_id));
    const student = students.find(s => String(s.id) === String(form.student_id));
    return `📋 Batch Assessment Update (${form.assessment_date})

Batch: ${batch?.batch_name || '—'}
Student: ${student?.candidate_name || 'All participants'}
Topic: ${form.topic_covered || '—'}
Questions asked: ${form.no_of_questions_asked || '—'}
Rating: ${form.feedback_rating?.replace(/_/g,' ')}
Participants: ${form.no_of_participants || '—'}
Session hours: ${form.session_hours || '—'}h
${form.outcome_remarks ? 'Remarks: ' + form.outcome_remarks : ''}`.trim();
  };

  const openWA = () => {
    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(buildWA())}`, '_blank');
    set('wa_sent', true);
    toast.success('WhatsApp opened — select contact manually');
  };

  const showWAPreview = form.topic_covered || form.feedback_rating;

  const handleSubmit = async () => {
    if (!form.batch_id || !form.topic_covered) {
      return toast.error('Batch and topic are required');
    }
    setLoading(true);
    try {
      if (editId) {
        await updateAssessment(editId, form);
        toast.success('Assessment updated!');
      } else {
        await createAssessment(form);
        toast.success('Assessment logged!');
      }
      setForm(blank); setEditId(null);
      loadAssessments(); setTab(1);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (a) => {
    setForm({
      batch_id:              a.batch_id            || '',
      student_id:            a.student_id          || '',
      assessment_date:       a.assessment_date?.split('T')[0] || today(),
      topic_covered:         a.topic_covered       || '',
      no_of_questions_asked: a.no_of_questions_asked || '',
      feedback_rating:       a.feedback_rating     || 'good',
      outcome_remarks:       a.outcome_remarks     || '',
      session_type:          a.session_type        || 'weekday',
      no_of_participants:    a.no_of_participants  || '',
      session_hours:         a.session_hours       || '',
      wa_sent:               a.wa_sent             || false,
    });
    setEditId(a.id); setTab(0);
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>
          Batch assessment
          <span style={S.tag}>→ Batch Assessment Report</span>
        </div>

        <div style={S.tabs}>
          {['Add assessment', 'View history'].map((t, i) => (
            <div key={i} style={{ ...S.tab, ...(tab === i ? S.tabA : {}) }} onClick={() => setTab(i)}>{t}</div>
          ))}
        </div>

        {/* ── Tab 0: Add ── */}
        {tab === 0 && (
          <div>
            {editId && (
              <div style={{ background:'#FAEEDA', border:'1px solid #FAC775', borderRadius:8, padding:'8px 12px', fontSize:11, color:'#854F0B', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>✏️ Editing existing assessment</span>
                <button style={S.actBtn} onClick={() => { setForm(blank); setEditId(null); }}>✕ Cancel</button>
              </div>
            )}

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Batch *</label>
                <select style={S.select} value={form.batch_id} onChange={e => set('batch_id', e.target.value)}>
                  <option value="">Select batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name} — {b.course_name}</option>)}
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Student (optional — leave blank for whole batch)</label>
                <select style={S.select} value={form.student_id} onChange={e => set('student_id', e.target.value)}>
                  <option value="">All participants</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.candidate_name}</option>)}
                </select>
              </div>
            </div>

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>Assessment date</label>
                <input style={S.input} type="date" value={form.assessment_date} onChange={e => set('assessment_date', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Session type</label>
                <select style={S.select} value={form.session_type} onChange={e => set('session_type', e.target.value)}>
                  <option value="weekday">Weekday</option>
                  <option value="weekend">Weekend</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Session hours</label>
                <input style={S.input} type="number" step="0.5" min="0" placeholder="e.g. 1.5" value={form.session_hours} onChange={e => set('session_hours', e.target.value)} />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Topic covered *</label>
              <input style={S.input} value={form.topic_covered} onChange={e => set('topic_covered', e.target.value)} placeholder="e.g. Exception Handling, Collections" />
            </div>

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>No. of questions asked</label>
                <input style={S.input} type="number" min="0" placeholder="e.g. 5" value={form.no_of_questions_asked} onChange={e => set('no_of_questions_asked', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>No. of participants</label>
                <input style={S.input} type="number" min="0" placeholder="e.g. 12" value={form.no_of_participants} onChange={e => set('no_of_participants', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Rating</label>
                <select style={S.select} value={form.feedback_rating} onChange={e => set('feedback_rating', e.target.value)}>
                  {ratings.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                </select>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Outcome / Remarks</label>
              <textarea style={S.textarea} value={form.outcome_remarks} onChange={e => set('outcome_remarks', e.target.value)} placeholder="How did the session go? Any notable observations..." />
            </div>

            {/* WhatsApp Preview */}
            {showWAPreview && (
              <div style={S.waBox}>
                <div style={{ fontWeight:600, marginBottom:6 }}>📱 WhatsApp message preview:</div>
                <div style={{ whiteSpace:'pre-wrap', lineHeight:1.8, fontFamily:'monospace', fontSize:11 }}>{buildWA()}</div>
                <button style={S.waBtn} onClick={openWA}>
                  Open WhatsApp Web → select contact manually
                </button>
                {form.wa_sent && <span style={{ marginLeft:10, fontSize:10, color:'#0F6E56', fontWeight:500 }}>✓ Sent</span>}
              </div>
            )}

            <div style={S.btnRow}>
              <button style={S.btnP} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editId ? 'Update assessment' : 'Submit assessment'}
              </button>
              <button style={S.btn} onClick={() => { setForm(blank); setEditId(null); }}>Clear</button>
            </div>
          </div>
        )}

        {/* ── Tab 1: History ── */}
        {tab === 1 && (
          <div>
            {assessments.length === 0
              ? <div style={{ textAlign:'center', padding:'40px 20px', color:'#aaa', fontSize:12 }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>📋</div>No assessments logged yet
                </div>
              : (
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
                    {assessments.map(a => (
                      <tr key={a.id}>
                        <td style={S.td}>{a.assessment_date?.split('T')[0]}</td>
                        <td style={S.td}>{a.batch_name || '—'}</td>
                        <td style={S.td}>{a.candidate_name || 'All'}</td>
                        <td style={S.td}>{a.topic_covered}</td>
                        <td style={S.td}>{a.no_of_questions_asked || '—'}</td>
                        <td style={S.td}><span style={S.badge(a.feedback_rating)}>{a.feedback_rating?.replace(/_/g,' ')}</span></td>
                        <td style={S.td}><span style={S.badge(a.wa_sent ? 'good' : '')}>{a.wa_sent ? 'Sent' : '—'}</span></td>
                        <td style={S.td}><button style={S.actBtn} onClick={() => handleEdit(a)}>✎ Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}