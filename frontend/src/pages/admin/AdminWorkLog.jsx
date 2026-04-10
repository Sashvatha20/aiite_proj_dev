import { useState, useEffect } from 'react';
import { getAllLogs } from '../../api/worklog';
import api from '../../api/axiosInstance';

const G = '#1D9E75';
const S = {
  card:  { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title: { fontSize:14, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:    { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:    { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  input: { padding:'6px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff' },
};

export default function AdminWorkLog() {
  const [logs, setLogs]         = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [filterTrainer, setFilterTrainer] = useState('');
  const [month, setMonth] = useState(new Date().getMonth()+1);
  const [year,  setYear]  = useState(new Date().getFullYear());

  useEffect(() => { api.get('/trainers').then(r => setTrainers(r.data.trainers || [])); }, []);
  useEffect(() => {
    getAllLogs({ trainer_id: filterTrainer||undefined, month, year })
      .then(r => setLogs(r.data.logs || []));
  }, [filterTrainer, month, year]);

  return (
    <div style={S.card}>
      <div style={S.title}>All work logs — {logs.length} entries</div>
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <select style={S.input} value={filterTrainer} onChange={e=>setFilterTrainer(e.target.value)}>
          <option value="">All trainers</option>
          {trainers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select style={S.input} value={month} onChange={e=>setMonth(e.target.value)}>
          {Array.from({length:12},(_,i)=>(
            <option key={i+1} value={i+1}>{new Date(0,i).toLocaleString('default',{month:'long'})}</option>
          ))}
        </select>
        <select style={S.input} value={year} onChange={e=>setYear(e.target.value)}>
          {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {logs.length===0
        ? <div style={{textAlign:'center',padding:40,color:'#aaa',fontSize:12}}>No logs found</div>
        : <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Date</th><th style={S.th}>Trainer</th><th style={S.th}>Batch</th>
              <th style={S.th}>Description</th><th style={S.th}>Hours</th><th style={S.th}>⭐ Points</th>
            </tr></thead>
            <tbody>
              {logs.map(l=>(
                <tr key={l.id}>
                  <td style={S.td}>{l.log_date?.split('T')[0]}</td>
                  <td style={{...S.td,fontWeight:500}}>{l.trainer_name}</td>
                  <td style={S.td}>{l.batch_name||'—'}</td>
                  <td style={{...S.td,maxWidth:260}}>
                    <div style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',fontSize:11}}>{l.work_description}</div>
                  </td>
                  <td style={S.td}>{l.progressive_working_hours||'—'}h</td>
                  <td style={{...S.td,color:G,fontWeight:600}}>{l.star_points||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );
}