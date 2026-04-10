import { useState, useEffect } from 'react';
import { submitLog, getMyLogs, updateLog } from '../../api/worklog';
import { getBatches } from '../../api/batches';
import toast from 'react-hot-toast';

const S = {
  card:    { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:   { fontSize:15, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  tag:     { fontSize:9, background:'#E6F1FB', color:'#185FA5', padding:'2px 6px', borderRadius:4 },
  tabs:    { display:'flex', borderBottom:'1px solid #eee', marginBottom:14 },
  tab:     { padding:'7px 14px', fontSize:12, cursor:'pointer', borderBottom:'2px solid transparent', color:'#888' },
  tabA:    { borderBottomColor:'#1D9E75', color:'#1D9E75', fontWeight:500 },
  row2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 },
  row3:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 },
  field:   { marginBottom:10 },
  label:   { fontSize:11, color:'#666', display:'block', marginBottom:3 },
  input:   { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box' },
  textarea:{ width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', resize:'vertical', minHeight:80, boxSizing:'border-box', fontFamily:'inherit' },
  select:  { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff', boxSizing:'border-box' },
  readonly:{ width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, background:'#f8f8f8', color:'#888', boxSizing:'border-box' },
  btnRow:  { display:'flex', gap:8, marginTop:12 },
  btn:     { padding:'8px 16px', borderRadius:8, border:'1px solid #ddd', background:'#fff', fontSize:12, cursor:'pointer' },
  btnP:    { padding:'8px 16px', borderRadius:8, border:'none', background:'#1D9E75', color:'#fff', fontSize:12, cursor:'pointer' },
  wa:      { background:'#E1F5EE', border:'1px solid #9FE1CB', borderRadius:8, padding:'10px 12px', fontSize:11, color:'#0F6E56', marginTop:8 },
  divider: { border:'none', borderTop:'1px solid #f0f0f0', margin:'12px 0' },
  table:   { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:      { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:      { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  badge:   (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10, background: c==='green'?'#E1F5EE': c==='red'?'#FCEBEB':'#f0f0f0', color: c==='green'?'#0F6E56': c==='red'?'#A32D2D':'#666' }),
  actBtn:  { fontSize:10, padding:'3px 8px', borderRadius:6, border:'1px solid #ddd', background:'#fff', cursor:'pointer', marginRight:4 },
};

export default function WorkLog() {
  const [tab, setTab]         = useState(0);
  const [batches, setBatches] = useState([]);
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId]   = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    log_date: today,
    batch_id: '',
    work_description: '',
    progressive_working_hours: '',
    star_points: '',
    wa_sent: false
  });

  useEffect(() => {
    getBatches({ status: 'ongoing' }).then(r => setBatches(r.data.batches || []));
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const r = await getMyLogs();
      setLogs(r.data.logs || []);
    } catch {}
  };

  const calcStarPoints = (hours) => {
    const h = parseFloat(hours) || 0;
    return (h * 0.5).toFixed(2);
  };

  const set = (k, v) => {
    const updated = { ...form, [k]: v };
    if (k === 'progressive_working_hours') {
      updated.star_points = calcStarPoints(v);
    }
    setForm(updated);
  };

  const clearForm = () => {
    setForm({
      log_date: today,
      batch_id: '',
      work_description: '',
      progressive_working_hours: '',
      star_points: '',
      wa_sent: false
    });
    setEditId(null);
  };

  const buildWAMessage = () =>
    `Hi bros, today's work status (${form.log_date})\n\n${form.work_description}\n\nWorking hours: ${form.progressive_working_hours}\nStar points: ${form.star_points}`;

  const openWhatsApp = () => {
    const msg = encodeURIComponent(buildWAMessage());
    window.open(`https://web.whatsapp.com/send?text=${msg}`, '_blank');
    set('wa_sent', true);
  };

  const handleSubmit = async () => {
    if (!form.log_date || !form.work_description) {
      toast.error('Date and work description are required');
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await updateLog(editId, form);
        toast.success('Work log updated!');
      } else {
        await submitLog(form);
        toast.success('Work log submitted!');
      }
      clearForm();
      fetchLogs();
      setTab(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log) => {
    setForm({
      log_date: log.log_date?.split('T')[0] || today,
      batch_id: log.batch_id || '',
      work_description: log.work_description || '',
      progressive_working_hours: log.progressive_working_hours || '',
      star_points: log.star_points || '',
      wa_sent: log.wa_sent || false
    });
    setEditId(log.id);
    setTab(0);
  };

  return (
    <div>
      <div style={S.card}>

        <div style={S.title}>
          Daily work log
          <span style={S.tag}>→ Employee Performance Tracker</span>
        </div>

        <div style={S.tabs}>
          {["Add today's log", "View history"].map((t, i) => (
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
              <div style={{ background:'#FAEEDA', border:'1px solid #FAC775', borderRadius:8, padding:'8px 12px', fontSize:11, color:'#854F0B', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>✏️ Editing existing log</span>
                <button style={S.actBtn} onClick={clearForm}>✕ Cancel edit</button>
              </div>
            )}

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Date</label>
                <input
                  style={S.input}
                  type="date"
                  value={form.log_date}
                  onChange={e => set('log_date', e.target.value)}
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Batch (optional)</label>
                <select
                  style={S.select}
                  value={form.batch_id}
                  onChange={e => set('batch_id', e.target.value)}
                >
                  <option value="">Select batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.batch_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Work description (what you did today)</label>
              <textarea
                style={S.textarea}
                placeholder={"10:00 AM – 11:00 AM  Java Batch 2 – OOP concepts\n11:00 AM – 12:00 PM  Selenium Batch 1 – Waits..."}
                value={form.work_description}
                onChange={e => set('work_description', e.target.value)}
              />
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Working hours</label>
                <input
                  style={S.input}
                  type="number"
                  step="0.5"
                  placeholder="e.g. 6.5"
                  value={form.progressive_working_hours}
                  onChange={e => set('progressive_working_hours', e.target.value)}
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Star points (auto-calculated)</label>
                <input style={S.readonly} readOnly value={form.star_points || '0.00'} />
              </div>
            </div>

            {form.work_description && (
              <div style={S.wa}>
                <div style={{ fontWeight:500, marginBottom:6 }}>WhatsApp message preview:</div>
                <div style={{ whiteSpace:'pre-wrap', lineHeight:1.7 }}>{buildWAMessage()}</div>
                <button
                  type="button"
                  style={{ marginTop:10, padding:'7px 16px', background:'#25D366', color:'#fff', border:'none', borderRadius:8, fontSize:12, cursor:'pointer' }}
                  onClick={openWhatsApp}
                >
                  Open WhatsApp Web → select contact manually
                </button>
              </div>
            )}

            <div style={S.btnRow}>
              <button style={S.btnP} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editId ? 'Update log' : 'Submit log + Sync to Sheets'}
              </button>
              <button style={S.btn} onClick={clearForm}>
                Clear
              </button>
            </div>

          </div>
        )}

        {tab === 1 && (
          <div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Batch</th>
                  <th style={S.th}>Description</th>
                  <th style={S.th}>Hours</th>
                  <th style={S.th}>Star pts</th>
                  <th style={S.th}>WA sent</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...S.td, textAlign:'center', color:'#aaa', padding:24 }}>
                      No logs yet. Submit your first work log!
                    </td>
                  </tr>
                )}
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={S.td}>{log.log_date?.split('T')[0]}</td>
                    <td style={S.td}>{log.batch_name || '—'}</td>
                    <td style={S.td} title={log.work_description}>
                      {log.work_description?.slice(0, 40)}
                      {log.work_description?.length > 40 ? '...' : ''}
                    </td>
                    <td style={S.td}>{log.progressive_working_hours}h</td>
                    <td style={S.td}>{log.star_points}</td>
                    <td style={S.td}>
                      <span style={S.badge(log.wa_sent ? 'green' : 'red')}>
                        {log.wa_sent ? 'Sent' : 'Not sent'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button style={S.actBtn} onClick={() => handleEdit(log)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}