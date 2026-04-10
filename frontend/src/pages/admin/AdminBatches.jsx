import { useState, useEffect } from 'react';
import { getBatches } from '../../api/batches';
import api from '../../api/axiosInstance';

const G = '#1D9E75';
const S = {
  card:   { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:  { fontSize:14, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0' },
  table:  { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:     { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:     { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  badge:  (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='green'?'#E1F5EE': c==='blue'?'#E6F1FB': c==='orange'?'#FEF3C7': c==='red'?'#FCEBEB':'#f0f0f0',
    color:      c==='green'?'#0F6E56': c==='blue'?'#185FA5': c==='orange'?'#92400E': c==='red'?'#A32D2D':'#666' }),
  input:  { padding:'6px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none' },
};
const statusColor = s => s==='ongoing'?'green': s==='completed'?'blue': s==='upcoming'?'orange':'red';

export default function AdminBatches() {
  const [batches, setBatches]     = useState([]);
  const [trainers, setTrainers]   = useState([]);
  const [filterTrainer, setFilterTrainer] = useState('');
  const [filterStatus, setFilterStatus]   = useState('');

  useEffect(() => {
    getBatches().then(r => setBatches(r.data.batches || []));
    api.get('/trainers').then(r => setTrainers(r.data.trainers || []));
  }, []);

  const filtered = batches.filter(b => {
    const t = filterTrainer ? String(b.trainer_id) === filterTrainer : true;
    const s = filterStatus  ? b.status === filterStatus : true;
    return t && s;
  });

  return (
    <div style={S.card}>
      <div style={S.title}>All batches — {filtered.length} total</div>
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <select style={S.input} value={filterTrainer} onChange={e=>setFilterTrainer(e.target.value)}>
          <option value="">All trainers</option>
          {trainers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select style={S.input} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['ongoing','completed','upcoming','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {filtered.length===0
        ? <div style={{textAlign:'center',padding:40,color:'#aaa',fontSize:12}}>No batches found</div>
        : <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Batch name</th>
              <th style={S.th}>Course</th>
              <th style={S.th}>Trainer</th>
              <th style={S.th}>Students</th>
              <th style={S.th}>Start date</th>
              <th style={S.th}>End date</th>
              <th style={S.th}>Status</th>
            </tr></thead>
            <tbody>
              {filtered.map(b=>(
                <tr key={b.id}>
                  <td style={{...S.td,fontWeight:500}}>{b.batch_name}</td>
                  <td style={S.td}>{b.course_name||'—'}</td>
                  <td style={S.td}>{b.trainer_name||'—'}</td>
                  <td style={S.td}>{b.student_count||0}</td>
                  <td style={S.td}>{b.start_date?.split('T')[0]||'—'}</td>
                  <td style={S.td}>{b.end_date?.split('T')[0]||'—'}</td>
                  <td style={S.td}><span style={S.badge(statusColor(b.status))}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );
}