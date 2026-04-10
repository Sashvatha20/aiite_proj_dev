import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const S = {
  card:   { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:  { fontSize:14, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  row2:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 },
  field:  { marginBottom:10 },
  label:  { fontSize:11, color:'#666', display:'block', marginBottom:3 },
  input:  { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box' },
  btnRow: { display:'flex', gap:8, marginTop:12 },
  btn:    { padding:'8px 16px', borderRadius:8, border:'1px solid #ddd', background:'#fff', fontSize:12, cursor:'pointer' },
  btnP:   { padding:'8px 16px', borderRadius:8, border:'none', background:G, color:'#fff', fontSize:12, cursor:'pointer' },
  table:  { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:     { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:     { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  actBtn: { fontSize:10, padding:'3px 8px', borderRadius:6, border:'1px solid #ddd', background:'#fff', cursor:'pointer', marginRight:4 },
  badge:  (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='green'?'#E1F5EE': c==='red'?'#FCEBEB':'#f0f0f0',
    color:      c==='green'?'#0F6E56': c==='red'?'#A32D2D':'#666' }),
  tabs:   { display:'flex', borderBottom:'1px solid #eee', marginBottom:14 },
  tab:    { padding:'7px 14px', fontSize:12, cursor:'pointer', borderBottom:'2px solid transparent', color:'#888' },
  tabA:   { borderBottomColor:G, color:G, fontWeight:500 },
};

export default function AdminTrainers() {
  const [tab, setTab]         = useState(0);
  const [trainers, setTrainers] = useState([]);
  const [stats, setStats]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth]     = useState(new Date().getMonth()+1);
  const [year, setYear]       = useState(new Date().getFullYear());

  const blank = { name:'', phone:'', email:'', username:'', password:'' };
  const [form, setForm]       = useState(blank);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => { loadTrainers(); loadStats(); }, [month, year]);

  const loadTrainers = async () => {
    try { const r = await api.get('/trainers'); setTrainers(r.data.trainers || []); } catch {}
  };
  const loadStats = async () => {
    try { const r = await api.get(`/admin/trainers?month=${month}&year=${year}`); setStats(r.data.trainers || []); } catch {}
  };

  const handleCreate = async () => {
    if (!form.name || !form.username || !form.password) return toast.error('Name, username & password required');
    setLoading(true);
    try {
      await api.post('/trainers', form);
      toast.success('Trainer created!');
      setForm(blank); loadTrainers(); loadStats(); setTab(0);
    } catch(e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>
          Trainers
          <button style={S.btnP} onClick={()=>setTab(1)}>+ Add trainer</button>
        </div>

        <div style={S.tabs}>
          {['Performance','Add trainer'].map((t,i)=>(
            <div key={i} style={{...S.tab,...(tab===i?S.tabA:{})}} onClick={()=>setTab(i)}>{t}</div>
          ))}
        </div>

        {tab===0 && (
          <div>
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              <select style={{padding:'6px 10px',border:'1px solid #ddd',borderRadius:8,fontSize:12,background:'#fff'}}
                value={month} onChange={e=>setMonth(e.target.value)}>
                {Array.from({length:12},(_,i)=>(
                  <option key={i+1} value={i+1}>{new Date(0,i).toLocaleString('default',{month:'long'})}</option>
                ))}
              </select>
              <select style={{padding:'6px 10px',border:'1px solid #ddd',borderRadius:8,fontSize:12,background:'#fff'}}
                value={year} onChange={e=>setYear(e.target.value)}>
                {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Username</th>
                <th style={S.th}>Phone</th>
                <th style={S.th}>⭐ Points</th>
                <th style={S.th}>Hours</th>
                <th style={S.th}>Days logged</th>
                <th style={S.th}>Escalations</th>
                <th style={S.th}>Status</th>
              </tr></thead>
              <tbody>
                {stats.map((t,i)=>(
                  <tr key={i}>
                    <td style={{...S.td,fontWeight:500}}>{t.name}</td>
                    <td style={S.td}>{t.username}</td>
                    <td style={S.td}>{t.phone||'—'}</td>
                    <td style={{...S.td,color:G,fontWeight:600}}>{parseFloat(t.total_star_points).toFixed(1)}</td>
                    <td style={S.td}>{parseFloat(t.total_hours).toFixed(1)}h</td>
                    <td style={S.td}>{t.days_logged}</td>
                    <td style={S.td}>{parseInt(t.open_escalations)>0
                      ? <span style={S.badge('red')}>{t.open_escalations} open</span>
                      : <span style={S.badge('green')}>None</span>}</td>
                    <td style={S.td}><span style={S.badge(t.is_active?'green':'red')}>{t.is_active?'Active':'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab===1 && (
          <div>
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Full name *</label><input style={S.input} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Sundar"/></div>
              <div style={S.field}><label style={S.label}>Phone</label><input style={S.input} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="9876543210"/></div>
            </div>
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Username *</label><input style={S.input} value={form.username} onChange={e=>set('username',e.target.value)} placeholder="e.g. sundar"/></div>
              <div style={S.field}><label style={S.label}>Password *</label><input style={S.input} type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Default: password"/></div>
            </div>
            <div style={S.field}><label style={S.label}>Email</label><input style={S.input} value={form.email} onChange={e=>set('email',e.target.value)} placeholder="trainer@aiite.com"/></div>
            <div style={S.btnRow}>
              <button style={S.btnP} onClick={handleCreate} disabled={loading}>{loading?'Creating...':'Create trainer'}</button>
              <button style={S.btn} onClick={()=>setForm(blank)}>Clear</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}