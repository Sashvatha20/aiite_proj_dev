import { useState, useEffect } from 'react';
import { getBatches, getBatchProgress, addProgress, updateProgress } from '../../api/batches';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const S = {
  card:    { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:   { fontSize:15, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  tag:     { fontSize:9, background:'#E6F1FB', color:'#185FA5', padding:'2px 6px', borderRadius:4 },
  tabs:    { display:'flex', borderBottom:'1px solid #eee', marginBottom:14 },
  tab:     { padding:'7px 14px', fontSize:12, cursor:'pointer', borderBottom:'2px solid transparent', color:'#888' },
  tabA:    { borderBottomColor:G, color:G, fontWeight:500 },
  row2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 },
  field:   { marginBottom:10 },
  label:   { fontSize:11, color:'#666', display:'block', marginBottom:3 },
  input:   { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box' },
  select:  { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff', boxSizing:'border-box' },
  textarea:{ width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', resize:'vertical', minHeight:80, boxSizing:'border-box', fontFamily:'inherit' },
  btnRow:  { display:'flex', gap:8, marginTop:12 },
  btn:     { padding:'8px 16px', borderRadius:8, border:'1px solid #ddd', background:'#fff', fontSize:12, cursor:'pointer' },
  btnP:    { padding:'8px 16px', borderRadius:8, border:'none', background:G, color:'#fff', fontSize:12, cursor:'pointer' },
  table:   { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:      { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:      { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  actBtn:  { fontSize:10, padding:'3px 8px', borderRadius:6, border:'1px solid #ddd', background:'#fff', cursor:'pointer', marginRight:4 },
  badge:   { fontSize:10, padding:'2px 8px', borderRadius:10, background:'#E6F1FB', color:'#185FA5' },
  wa:      { background:'#E1F5EE', border:'1px solid #9FE1CB', borderRadius:8, padding:'10px 12px', fontSize:11, color:'#0F6E56', marginTop:8 },
};

const today = () => new Date().toISOString().split('T')[0];
const phases = ['Phase 1','Phase 2','Phase 3','Phase 4','Revision','Project','Assessment'];

export default function BatchProgress() {
  const [tab, setTab]           = useState(0);
  const [batches, setBatches]   = useState([]);
  const [progress, setProgress] = useState([]);
  const [selBatch, setSelBatch] = useState('');
  const [loading, setLoading]   = useState(false);
  const [editId, setEditId]     = useState(null);

  const blank = { progress_date:today(), last_topic_covered:'', hours_covered:'', phase:'Phase 1', remarks:'' };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    getBatches({ status:'ongoing' }).then(r => {
      const b = r.data.batches || [];
      setBatches(b);
      if (b.length > 0) setSelBatch(String(b[0].id));
    });
  }, []);

  useEffect(() => { if (selBatch) loadProgress(selBatch); }, [selBatch]);

  const loadProgress = async (id) => {
    try { setProgress((await getBatchProgress(id)).data.progress || []); }
    catch { toast.error('Failed to load progress'); }
  };

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const selectedBatch = batches.find(b=>String(b.id)===selBatch);

  const buildWA = () =>
    `Batch Progress Update (${form.progress_date})\nBatch: ${selectedBatch?.batch_name||''}\nCourse: ${selectedBatch?.course_name||''}\n\nTopic: ${form.last_topic_covered}\nPhase: ${form.phase}\nHours: ${form.hours_covered||'—'}${form.remarks?'\nRemarks: '+form.remarks:''}`;

  const handleSubmit = async () => {
    if (!selBatch || !form.last_topic_covered) return toast.error('Batch and topic are required');
    setLoading(true);
    try {
      if (editId) { await updateProgress(selBatch, editId, form); toast.success('Updated!'); }
      else        { await addProgress(selBatch, form);             toast.success('Progress logged!'); }
      setForm(blank); setEditId(null); loadProgress(selBatch); setTab(1);
    } catch(e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleEdit = (p) => {
    setForm({ progress_date:p.progress_date?.split('T')[0]||today(), last_topic_covered:p.last_topic_covered||'', hours_covered:p.hours_covered||'', phase:p.phase||'Phase 1', remarks:p.remarks||'' });
    setEditId(p.id); setTab(0);
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>Batch progress <span style={S.tag}>→ Batch Count Details</span></div>
        <div style={{...S.field,marginBottom:14}}>
          <label style={S.label}>Select batch</label>
          <select style={{...S.select,maxWidth:320}} value={selBatch} onChange={e=>setSelBatch(e.target.value)}>
            {batches.map(b=><option key={b.id} value={b.id}>{b.batch_name} — {b.course_name}</option>)}
          </select>
        </div>
        {selectedBatch && (
          <div style={{background:'#f0faf6',borderRadius:8,padding:'8px 12px',fontSize:11,color:'#0F6E56',marginBottom:14,display:'flex',gap:16,flexWrap:'wrap'}}>
            <span>👥 {selectedBatch.student_count||0} students</span>
            <span>📅 Started: {selectedBatch.batch_start_date?.split('T')[0]||'—'}</span>
            <span>🎯 {selectedBatch.phase||'—'}</span>
            <span>📘 Last: {selectedBatch.last_topic_covered||'—'}</span>
          </div>
        )}
        <div style={S.tabs}>
          {['Add update','View history'].map((t,i)=>(
            <div key={i} style={{...S.tab,...(tab===i?S.tabA:{})}} onClick={()=>setTab(i)}>{t}</div>
          ))}
        </div>

        {tab===0 && (
          <div>
            {editId && <div style={{background:'#FAEEDA',border:'1px solid #FAC775',borderRadius:8,padding:'8px 12px',fontSize:11,color:'#854F0B',marginBottom:10,display:'flex',justifyContent:'space-between'}}>✏️ Editing entry <button style={S.actBtn} onClick={()=>{setForm(blank);setEditId(null);}}>✕ Cancel</button></div>}
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Date</label><input style={S.input} type="date" value={form.progress_date} onChange={e=>set('progress_date',e.target.value)}/></div>
              <div style={S.field}><label style={S.label}>Phase</label>
                <select style={S.select} value={form.phase} onChange={e=>set('phase',e.target.value)}>{phases.map(p=><option key={p}>{p}</option>)}</select>
              </div>
            </div>
            <div style={S.field}><label style={S.label}>Topic covered *</label>
              <textarea style={S.textarea} value={form.last_topic_covered} onChange={e=>set('last_topic_covered',e.target.value)} placeholder="e.g. Exception Handling, Collections"/>
            </div>
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Hours covered</label><input style={S.input} type="number" step="0.5" value={form.hours_covered} onChange={e=>set('hours_covered',e.target.value)} placeholder="e.g. 1.5"/></div>
              <div style={S.field}><label style={S.label}>Remarks</label><input style={S.input} value={form.remarks} onChange={e=>set('remarks',e.target.value)}/></div>
            </div>
            {form.last_topic_covered && (
              <div style={S.wa}>
                <div style={{fontWeight:600,marginBottom:6}}>WhatsApp preview:</div>
                <div style={{whiteSpace:'pre-wrap',lineHeight:1.7}}>{buildWA()}</div>
                <button onClick={()=>window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(buildWA())}`, '_blank')} style={{marginTop:10,padding:'7px 16px',background:'#25D366',color:'#fff',border:'none',borderRadius:8,fontSize:12,cursor:'pointer'}}>Open WhatsApp Web</button>
              </div>
            )}
            <div style={S.btnRow}>
              <button style={S.btnP} onClick={handleSubmit} disabled={loading}>{editId?'Update':'Submit progress'}</button>
              <button style={S.btn} onClick={()=>{setForm(blank);setEditId(null);}}>Clear</button>
            </div>
          </div>
        )}

        {tab===1 && (
          progress.length===0 ? <div style={{textAlign:'center',padding:'30px',color:'#aaa',fontSize:12}}>No progress logged yet</div> : (
            <table style={S.table}>
              <thead><tr><th style={S.th}>Date</th><th style={S.th}>Topic</th><th style={S.th}>Hours</th><th style={S.th}>Phase</th><th style={S.th}>Remarks</th><th style={S.th}>Actions</th></tr></thead>
              <tbody>
                {progress.map(p=>(
                  <tr key={p.id}>
                    <td style={S.td}>{p.progress_date?.split('T')[0]}</td>
                    <td style={S.td}>{p.last_topic_covered}</td>
                    <td style={S.td}>{p.hours_covered||'—'}h</td>
                    <td style={S.td}><span style={S.badge}>{p.phase}</span></td>
                    <td style={S.td}>{p.remarks||'—'}</td>
                    <td style={S.td}><button style={S.actBtn} onClick={()=>handleEdit(p)}>✎ Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}