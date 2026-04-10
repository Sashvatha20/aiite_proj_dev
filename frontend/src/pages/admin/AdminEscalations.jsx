import { useState, useEffect } from 'react';
import { getEscalations, updateEscalation } from '../../api/escalations';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const S = {
  card:   { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:  { fontSize:14, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0' },
  table:  { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:     { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:     { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333', verticalAlign:'top' },
  badge:  (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='green'?'#E1F5EE': c==='orange'?'#FEF3C7': c==='red'?'#FCEBEB':'#f0f0f0',
    color:      c==='green'?'#0F6E56': c==='orange'?'#92400E': c==='red'?'#A32D2D':'#666' }),
  input:  { padding:'6px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff' },
  actBtn: { fontSize:10, padding:'3px 8px', borderRadius:6, border:'1px solid #ddd', background:'#fff', cursor:'pointer', marginRight:4 },
};
const statusColor = s => s==='resolved'?'green': s==='acknowledged'?'orange':'red';

export default function AdminEscalations() {
  const [escalations, setEscalations]   = useState([]);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { load(); }, []);
  const load = () => getEscalations().then(r => setEscalations(r.data.escalations || []));

  const updateStatus = async (id, status) => {
    try { await updateEscalation(id, { status }); toast.success(`Marked as ${status}`); load(); }
    catch { toast.error('Failed to update'); }
  };

  const filtered = escalations.filter(e => filterStatus ? e.status === filterStatus : true);
  const kpis = [
    { num: escalations.filter(e=>e.status==='open').length,         label:'🔴 Open',         color:'#A32D2D' },
    { num: escalations.filter(e=>e.status==='acknowledged').length, label:'🟡 Acknowledged', color:'#92400E' },
    { num: escalations.filter(e=>e.status==='resolved').length,     label:'✅ Resolved',     color:G },
  ];

  return (
    <div style={S.card}>
      <div style={S.title}>All escalations</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        {kpis.map((k,i)=>(
          <div key={i} style={{background:'#f9f9f9',borderRadius:10,padding:'12px 14px',border:'1px solid #eee'}}>
            <div style={{fontSize:22,fontWeight:700,color:k.color,lineHeight:1}}>{k.num}</div>
            <div style={{fontSize:10,color:'#888',marginTop:3}}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <select style={S.input} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['open','acknowledged','resolved'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{fontSize:11,color:'#888',alignSelf:'center'}}>{filtered.length} records</span>
      </div>
      {filtered.length===0
        ? <div style={{textAlign:'center',padding:40,color:'#aaa',fontSize:12}}>✅ No escalations found</div>
        : <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Date</th><th style={S.th}>Reported by</th><th style={S.th}>Description</th>
              <th style={S.th}>Count</th><th style={S.th}>Status</th><th style={S.th}>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(e=>(
                <tr key={e.id}>
                  <td style={S.td}>{e.escalation_date?.split('T')[0]||'—'}</td>
                  <td style={{...S.td,fontWeight:500}}>{e.reported_by||'—'}</td>
                  <td style={{...S.td,maxWidth:260}}>
                    <div style={{fontSize:11,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{e.description}</div>
                  </td>
                  <td style={S.td}>{e.no_of_count||1}</td>
                  <td style={S.td}><span style={S.badge(statusColor(e.status))}>{e.status}</span></td>
                  <td style={S.td}>
                    {e.status==='open' && <button style={S.actBtn} onClick={()=>updateStatus(e.id,'acknowledged')}>Acknowledge</button>}
                    {e.status!=='resolved' && <button style={{...S.actBtn,color:G,borderColor:G}} onClick={()=>updateStatus(e.id,'resolved')}>✓ Resolve</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );
}