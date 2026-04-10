import { useState, useEffect } from 'react';
import { getStudents } from '../../api/students';
import { getBatches } from '../../api/batches';

const G = '#1D9E75';
const S = {
  card:   { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:  { fontSize:14, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0' },
  table:  { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:     { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:     { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  badge:  (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='green'?'#E1F5EE': c==='orange'?'#FEF3C7':'#f0f0f0',
    color:      c==='green'?'#0F6E56': c==='orange'?'#92400E':'#666' }),
  input:  { padding:'6px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none' },
  avatar: { width:26,height:26,borderRadius:'50%',background:G,color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,marginRight:6,flexShrink:0 },
};

export default function AdminStudents() {
  const [students, setStudents]   = useState([]);
  const [batches, setBatches]     = useState([]);
  const [filterBatch, setFilterBatch] = useState('');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    getStudents().then(r => setStudents(r.data.students || []));
    getBatches().then(r => setBatches(r.data.batches || []));
  }, []);

  useEffect(() => {
    getStudents(filterBatch ? { batch_id: filterBatch } : {}).then(r => setStudents(r.data.students || []));
  }, [filterBatch]);

  const filtered = students.filter(s =>
    search ? s.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
             s.phone?.includes(search) : true
  );

  return (
    <div style={S.card}>
      <div style={S.title}>All students — {filtered.length} total</div>
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <input style={S.input} placeholder="Search name / phone..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={S.input} value={filterBatch} onChange={e=>setFilterBatch(e.target.value)}>
          <option value="">All batches</option>
          {batches.map(b=><option key={b.id} value={b.id}>{b.batch_name}</option>)}
        </select>
      </div>
      {filtered.length===0
        ? <div style={{textAlign:'center',padding:40,color:'#aaa',fontSize:12}}>No students found</div>
        : <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Name</th>
              <th style={S.th}>Phone</th>
              <th style={S.th}>Email</th>
              <th style={S.th}>Batch</th>
              <th style={S.th}>Course</th>
              <th style={S.th}>Joined</th>
              <th style={S.th}>Status</th>
            </tr></thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id}>
                  <td style={S.td}>
                    <div style={{display:'flex',alignItems:'center'}}>
                      <div style={S.avatar}>{s.candidate_name?.[0]?.toUpperCase()}</div>
                      {s.candidate_name}
                    </div>
                  </td>
                  <td style={S.td}>{s.phone||'—'}</td>
                  <td style={S.td}>{s.email||'—'}</td>
                  <td style={S.td}>{s.batch_name||'—'}</td>
                  <td style={S.td}>{s.course_name||'—'}</td>
                  <td style={S.td}>{s.joined_date?.split('T')[0]||'—'}</td>
                  <td style={S.td}><span style={S.badge(s.status==='active'?'green':'orange')}>{s.status||'active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );
}