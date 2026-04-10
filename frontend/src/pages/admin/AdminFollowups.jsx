import { useState, useEffect } from 'react';
import { getFollowups } from '../../api/studentFollowups';

const G = '#1D9E75';
const S = {
  card:  { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title: { fontSize:14, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:    { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:    { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  badge: (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='green'?'#E1F5EE': c==='orange'?'#FEF3C7': c==='red'?'#FCEBEB': c==='blue'?'#E6F1FB': c==='purple'?'#F3E8FF':'#f0f0f0',
    color:      c==='green'?'#0F6E56': c==='orange'?'#92400E': c==='red'?'#A32D2D': c==='blue'?'#185FA5': c==='purple'?'#6D28D9':'#666' }),
  input: { padding:'6px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff' },
};

export default function AdminFollowups() {
  const [followups, setFollowups] = useState([]);
  const [filterType, setFilterType] = useState('');

  useEffect(() => { getFollowups().then(r => setFollowups(r.data.followups || [])); }, []);

  const filtered = followups.filter(f => filterType ? f.followup_type===filterType : true);
  const callColor = c => c==='picked'?'green': c==='busy'?'orange':'red';
  const typeColor = t => t==='project'?'blue': t==='playwright'?'purple':'';

  return (
    <div style={S.card}>
      <div style={S.title}>All student followups — {filtered.length} records</div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <select style={S.input} value={filterType} onChange={e=>setFilterType(e.target.value)}>
          <option value="">All types</option>
          {['project','playwright','general'].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {filtered.length===0
        ? <div style={{textAlign:'center',padding:40,color:'#aaa',fontSize:12}}>No followups found</div>
        : <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Student</th><th style={S.th}>Batch</th><th style={S.th}>Type</th>
              <th style={S.th}>Call</th><th style={S.th}>Date</th><th style={S.th}>Interviews</th>
              <th style={S.th}>Status</th><th style={S.th}>Interested</th>
            </tr></thead>
            <tbody>
              {filtered.map(f=>(
                <tr key={f.id}>
                  <td style={{...S.td,fontWeight:500}}>{f.candidate_name||'—'}</td>
                  <td style={S.td}>{f.batch_name||'—'}</td>
                  <td style={S.td}><span style={S.badge(typeColor(f.followup_type))}>{f.followup_type}</span></td>
                  <td style={S.td}><span style={S.badge(callColor(f.call_status))}>{f.call_status?.replace(/_/g,' ')}</span></td>
                  <td style={S.td}>{f.last_contact_date?.split('T')[0]||'—'}</td>
                  <td style={S.td}>{f.no_of_interview_calls||0} / {f.no_of_rounds_cleared||0}</td>
                  <td style={S.td}><span style={S.badge(f.placed_status==='placed'?'green':f.placed_status==='offer_pending'?'orange':'')}>{f.placed_status?.replace(/_/g,' ')}</span></td>
                  <td style={S.td}><span style={S.badge(f.interested?'green':'red')}>{f.interested?'Yes':'No'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );
}