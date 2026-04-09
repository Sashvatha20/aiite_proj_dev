import { useState, useEffect } from 'react';
import { getBatches, createBatch, updateBatch } from '../../api/batches';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const S = {
  card:    { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:   { fontSize:15, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  tabs:    { display:'flex', borderBottom:'1px solid #eee', marginBottom:16 },
  tab:     { padding:'7px 16px', fontSize:12, cursor:'pointer', borderBottom:'2px solid transparent', color:'#888' },
  tabA:    { borderBottomColor:G, color:G, fontWeight:500 },
  row2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 },
  row3:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 },
  field:   { marginBottom:10 },
  label:   { fontSize:11, color:'#666', display:'block', marginBottom:3 },
  input:   { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box' },
  select:  { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff', boxSizing:'border-box' },
  btnRow:  { display:'flex', gap:8, marginTop:14 },
  btn:     { padding:'8px 16px', borderRadius:8, border:'1px solid #ddd', background:'#fff', fontSize:12, cursor:'pointer' },
  btnP:    { padding:'8px 16px', borderRadius:8, border:'none', background:G, color:'#fff', fontSize:12, cursor:'pointer' },
  table:   { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:      { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:      { padding:'9px 10px', borderBottom:'1px solid #f5f5f5', color:'#333', verticalAlign:'middle' },
  badge:   (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10, display:'inline-block',
    background: c==='green'?'#E1F5EE': c==='blue'?'#E6F1FB': c==='orange'?'#FEF3C7': c==='red'?'#FCEBEB':'#f0f0f0',
    color:      c==='green'?'#0F6E56': c==='blue'?'#185FA5': c==='orange'?'#92400E': c==='red'?'#A32D2D':'#666' }),
  actBtn:  { fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid #ddd', background:'#fff', cursor:'pointer', marginRight:4 },
  chip:    { display:'inline-block', fontSize:10, padding:'2px 8px', borderRadius:10, background:'#f0f0f0', color:'#555', marginRight:4 },
  noData:  { textAlign:'center', padding:'40px 0', color:'#bbb', fontSize:12 },
};

const statusColor = s => s==='ongoing'?'green': s==='upcoming'?'blue': s==='completed'?'orange':'red';

const blank = {
  batch_name:'', course_id:'', batch_start_date:'', batch_end_date:'',
  weekday_weekend:'weekday', session_type:'regular', timing:'', status:'upcoming', trainer_ids:[]
};

export default function BatchManagement() {
  const [tab, setTab]           = useState(0);
  const [batches, setBatches]   = useState([]);
  const [courses, setCourses]   = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [editBatch, setEditBatch]       = useState(null);
  const [form, setForm]         = useState(blank);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // ✅ Single useEffect — load everything in one shot, no race condition
  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [bRes, tRes, cRes] = await Promise.all([
        getBatches(),
        api.get('/trainers'),
        api.get('/trainers/courses'),   // ✅ direct courses endpoint
      ]);
      setBatches(bRes.data.batches   || []);
      setTrainers(tRes.data.trainers || []);
      setCourses(cRes.data.courses   || []);
    } catch(e) {
      toast.error('Failed to load data');
      console.error(e);
    }
    finally { setLoading(false); }
  };

  const toggleTrainer = (id) => {
    const ids = form.trainer_ids || [];
    set('trainer_ids', ids.includes(id) ? ids.filter(i=>i!==id) : [...ids, id]);
  };

  const handleSubmit = async () => {
    if (!form.batch_name) return toast.error('Batch name is required');
    if (!form.course_id)  return toast.error('Please select a course');
    setLoading(true);
    try {
      if (editBatch) {
        await updateBatch(editBatch.id, form);
        toast.success('Batch updated!');
      } else {
        await createBatch(form);
        toast.success('Batch created!');
      }
      setForm(blank); setEditBatch(null); loadAll(); setTab(0);
    } catch(e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleEdit = (b) => {
    setForm({
      batch_name:       b.batch_name || '',
      course_id:        b.course_id  || '',
      batch_start_date: b.batch_start_date?.split('T')[0] || '',
      batch_end_date:   b.batch_end_date?.split('T')[0]   || '',
      weekday_weekend:  b.weekday_weekend  || 'weekday',
      session_type:     b.session_type     || 'regular',
      timing:           b.timing           || '',
      status:           b.status           || 'upcoming',
      trainer_ids:      [],
    });
    setEditBatch(b); setTab(1);
  };

  const filtered = batches.filter(b => filterStatus ? b.status === filterStatus : true);

  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>
          Batch Management
          <button style={S.btnP} onClick={()=>{ setEditBatch(null); setForm(blank); setTab(1); }}>+ New batch</button>
        </div>

        <div style={S.tabs}>
          {['All batches', editBatch ? 'Edit batch' : 'Create batch'].map((t,i)=>(
            <div key={i} style={{...S.tab,...(tab===i?S.tabA:{})}} onClick={()=>setTab(i)}>{t}</div>
          ))}
        </div>

        {/* === TAB 0: ALL BATCHES === */}
        {tab===0 && (
          <div>
            <div style={{display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center'}}>
              <select style={{...S.select, width:'auto', minWidth:140}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                {['upcoming','ongoing','completed','cancelled'].map(s=>(
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span style={{fontSize:11, color:'#888'}}>{filtered.length} batch{filtered.length!==1?'es':''}</span>
            </div>

            {loading ? (
              <div style={S.noData}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={S.noData}>No batches found. Create your first batch →</div>
            ) : (
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Batch name</th>
                    <th style={S.th}>Course</th>
                    <th style={S.th}>Trainers</th>
                    <th style={S.th}>Students</th>
                    <th style={S.th}>Start</th>
                    <th style={S.th}>End</th>
                    <th style={S.th}>Type</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(b=>(
                      <tr key={b.id}>
                        <td style={{...S.td, fontWeight:500}}>{b.batch_name}</td>
                        <td style={S.td}>{b.course_name||'—'}</td>
                        <td style={S.td}>{b.trainers||'—'}</td>
                        <td style={S.td}>{b.student_count||0}</td>
                        <td style={S.td}>{b.batch_start_date?.split('T')[0]||'—'}</td>
                        <td style={S.td}>{b.batch_end_date?.split('T')[0]||'—'}</td>
                        <td style={S.td}>
                          <span style={S.chip}>{b.weekday_weekend||'—'}</span>
                          <span style={S.chip}>{b.session_type||'—'}</span>
                        </td>
                        <td style={S.td}><span style={S.badge(statusColor(b.status))}>{b.status}</span></td>
                        <td style={S.td}>
                          <button style={S.actBtn} onClick={()=>handleEdit(b)}>✏️ Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* === TAB 1: CREATE / EDIT BATCH === */}
        {tab===1 && (
          <div>
            {editBatch && (
              <div style={{background:'#FAEEDA',border:'1px solid #FAC775',borderRadius:8,padding:'8px 12px',fontSize:11,color:'#854F0B',marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                ✏️ Editing: <strong>{editBatch.batch_name}</strong>
                <button style={S.actBtn} onClick={()=>{setEditBatch(null);setForm(blank);}}>✕ Cancel edit</button>
              </div>
            )}

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Batch name *</label>
                <input style={S.input} value={form.batch_name} onChange={e=>set('batch_name',e.target.value)} placeholder="e.g. Jan 2026 Java Batch 1"/>
              </div>
              <div style={S.field}>
                <label style={S.label}>Course *</label>
                <select style={S.select} value={form.course_id} onChange={e=>set('course_id',e.target.value)}>
                  <option value="">Select course</option>
                  {courses.length === 0
                    ? <option disabled>Loading courses...</option>
                    : courses.map(c=><option key={c.id} value={c.id}>{c.course_name}</option>)
                  }
                </select>
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Start date</label>
                <input style={S.input} type="date" value={form.batch_start_date} onChange={e=>set('batch_start_date',e.target.value)}/>
              </div>
              <div style={S.field}>
                <label style={S.label}>End date</label>
                <input style={S.input} type="date" value={form.batch_end_date} onChange={e=>set('batch_end_date',e.target.value)}/>
              </div>
            </div>

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>Schedule type</label>
                <select style={S.select} value={form.weekday_weekend} onChange={e=>set('weekday_weekend',e.target.value)}>
                  <option value="weekday">Weekday</option>
                  <option value="weekend">Weekend</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Session type</label>
                <select style={S.select} value={form.session_type} onChange={e=>set('session_type',e.target.value)}>
                  <option value="regular">Regular</option>
                  <option value="crash">Crash</option>
                  <option value="recorded">Recorded</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Timing</label>
                <input style={S.input} value={form.timing} onChange={e=>set('timing',e.target.value)} placeholder="e.g. 10:00 AM – 12:00 PM"/>
              </div>
            </div>

            <div style={{...S.field, maxWidth:220}}>
              <label style={S.label}>Status</label>
              <select style={S.select} value={form.status} onChange={e=>set('status',e.target.value)}>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Assign trainers (click to select)</label>
              <div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:4}}>
                {trainers.length === 0
                  ? <span style={{fontSize:11,color:'#aaa'}}>Loading trainers...</span>
                  : trainers.map(t=>{
                    const selected = (form.trainer_ids||[]).includes(t.id);
                    return (
                      <div key={t.id} onClick={()=>toggleTrainer(t.id)} style={{
                        padding:'5px 14px', borderRadius:20, fontSize:11, cursor:'pointer',
                        background: selected ? G : '#f0f0f0',
                        color:      selected ? '#fff' : '#555',
                        border:     selected ? `1px solid ${G}` : '1px solid #ddd',
                        transition: 'all .15s'
                      }}>
                        {selected ? '✓ ' : ''}{t.name}
                      </div>
                    );
                  })
                }
              </div>
              {(form.trainer_ids||[]).length > 0 && (
                <div style={{fontSize:10,color:'#888',marginTop:4}}>
                  First selected = primary trainer
                </div>
              )}
            </div>

            <div style={S.btnRow}>
              <button style={S.btnP} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editBatch ? '💾 Update batch' : '✅ Create batch'}
              </button>
              <button style={S.btn} onClick={()=>{ setForm(blank); setEditBatch(null); }}>Clear</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
