import { useState, useEffect } from 'react';
import { getEnquiries } from '../../api/enquiries';

const G = '#1D9E75';
const S = {
  card:  { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title: { fontSize:14, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:    { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:    { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  badge: (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='green'?'#E1F5EE': c==='blue'?'#E6F1FB': c==='orange'?'#FEF3C7': c==='red'?'#FCEBEB':'#f0f0f0',
    color:      c==='green'?'#0F6E56': c==='blue'?'#185FA5': c==='orange'?'#92400E': c==='red'?'#A32D2D':'#666' }),
  input: { padding:'6px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff' },
  kpi:   { background:'#f9f9f9', borderRadius:10, padding:'10px 14px', border:'1px solid #eee' },
};
const statusColor = s => s==='joined'?'green': s==='interested'?'blue': s==='not_interested'?'red': s==='follow_up'?'orange':'';

export default function AdminEnquiries() {
  const [enquiries, setEnquiries]       = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]             = useState('');

  useEffect(() => { getEnquiries().then(r => setEnquiries(r.data.enquiries || [])); }, []);

  const filtered = enquiries.filter(e => {
    const s = filterStatus ? e.status === filterStatus : true;
    const q = search ? e.name?.toLowerCase().includes(search.toLowerCase()) || e.phone?.includes(search) : true;
    return s && q;
  });

  const kpis = [
    { num: enquiries.length,                                        label:'Total',            color:'#222' },
    { num: enquiries.filter(e=>e.status==='joined').length,         label:'✅ Joined',        color:G },
    { num: enquiries.filter(e=>e.status==='interested').length,     label:'🔵 Interested',    color:'#185FA5' },
    { num: enquiries.filter(e=>e.status==='follow_up').length,      label:'🟡 Follow up',     color:'#D97706' },
    { num: enquiries.filter(e=>e.status==='not_interested').length, label:'🔴 Not interested',color:'#A32D2D' },
  ];

  return (
    <div style={S.card}>
      <div style={S.title}>All enquiries</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:10,marginBottom:16}}>
        {kpis.map((k,i)=>(
          <div key={i} style={S.kpi}>
            <div style={{fontSize:20,fontWeight:700,color:k.color,lineHeight:1}}>{k.num}</div>
            <div style={{fontSize:10,color:'#888',marginTop:3}}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <input style={S.input} placeholder="Search name / phone..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={S.input} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['interested','follow_up','joined','not_interested','no_response'].map(s=>(
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
        <span style={{fontSize:11,color:'#888',alignSelf:'center'}}>{filtered.length} records</span>
      </div>
      {filtered.length===0
        ? <div style={{textAlign:'center',padding:40,color:'#aaa',fontSize:12}}>No enquiries found</div>
        : <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Name</th><th style={S.th}>Phone</th><th style={S.th}>Course interest</th>
              <th style={S.th}>Source</th><th style={S.th}>Date</th><th style={S.th}>Status</th>
            </tr></thead>
            <tbody>
              {filtered.map(e=>(
                <tr key={e.id}>
                  <td style={{...S.td,fontWeight:500}}>{e.name||'—'}</td>
                  <td style={S.td}>{e.phone||'—'}</td>
                  <td style={S.td}>{e.course_interest||'—'}</td>
                  <td style={S.td}>{e.source||'—'}</td>
                  <td style={S.td}>{e.date?.split('T')[0]||'—'}</td>
                  <td style={S.td}><span style={S.badge(statusColor(e.status))}>{e.status?.replace(/_/g,' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );
}