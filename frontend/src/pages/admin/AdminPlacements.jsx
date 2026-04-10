import { useState, useEffect } from 'react';
import { getPlacements } from '../../api/placements';
import { getBatches } from '../../api/batches';

const G = '#1D9E75';
const S = {
  card:  { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title: { fontSize:14, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:    { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:    { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  badge: (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='green'?'#E1F5EE': c==='orange'?'#FEF3C7': c==='red'?'#FCEBEB': c==='blue'?'#E6F1FB':'#f0f0f0',
    color:      c==='green'?'#0F6E56': c==='orange'?'#92400E': c==='red'?'#A32D2D': c==='blue'?'#185FA5':'#666' }),
  input: { padding:'6px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff' },
  kpi:   { background:'#f9f9f9', borderRadius:10, padding:'12px 14px', border:'1px solid #eee' },
};
const statusColor = s => s==='placed'?'green': s==='offer_pending'?'orange': s==='rejected'?'red':'blue';

export default function AdminPlacements() {
  const [placements, setPlacements] = useState([]);
  const [batches, setBatches]       = useState([]);
  const [filterBatch,  setFilterBatch]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    getPlacements().then(r => setPlacements(r.data.placements || []));
    getBatches().then(r => setBatches(r.data.batches || []));
  }, []);

  const filtered = placements.filter(p => {
    const b = filterBatch  ? String(p.batch_id||'') === filterBatch : true;
    const s = filterStatus ? p.placed_status === filterStatus       : true;
    return b && s;
  });

  const kpis = [
    { num: placements.length, label:'Total', color:'#222' },
    { num: placements.filter(p=>p.placed_status==='placed').length, label:'✅ Placed', color:G },
    { num: placements.filter(p=>p.placed_status==='offer_pending').length, label:'🟡 Offer pending', color:'#D97706' },
    { num: placements.filter(p=>p.placed_status==='in_process').length, label:'🔵 In process', color:'#185FA5' },
  ];

  return (
    <div style={S.card}>
      <div style={S.title}>All placements</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:12,marginBottom:16}}>
        {kpis.map((k,i)=>(
          <div key={i} style={S.kpi}>
            <div style={{fontSize:22,fontWeight:700,color:k.color,lineHeight:1}}>{k.num}</div>
            <div style={{fontSize:10,color:'#888',marginTop:3}}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <select style={S.input} value={filterBatch} onChange={e=>setFilterBatch(e.target.value)}>
          <option value="">All batches</option>
          {batches.map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}
        </select>
        <select style={S.input} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['in_process','offer_pending','placed','rejected'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <span style={{fontSize:11,color:'#888',alignSelf:'center'}}>{filtered.length} records</span>
      </div>
      {filtered.length===0
        ? <div style={{textAlign:'center',padding:40,color:'#aaa',fontSize:12}}>No placements found</div>
        : <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Student</th><th style={S.th}>Company</th><th style={S.th}>Role</th>
              <th style={S.th}>Batch</th><th style={S.th}>Rounds</th><th style={S.th}>Status</th><th style={S.th}>Date</th>
            </tr></thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id}>
                  <td style={{...S.td,fontWeight:500}}>{p.candidate_name}</td>
                  <td style={S.td}><strong>{p.company_name||'—'}</strong></td>
                  <td style={S.td}>{p.role_offered||'—'}</td>
                  <td style={S.td}>{p.batch_name||'—'}</td>
                  <td style={S.td}>{p.rounds_cleared??'—'}</td>
                  <td style={S.td}><span style={S.badge(statusColor(p.placed_status))}>{p.placed_status?.replace(/_/g,' ')}</span></td>
                  <td style={S.td}>{p.placed_date?.split('T')[0]||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );
}