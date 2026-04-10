import { useState, useEffect } from 'react';
import { getDashboard } from '../../api/admin';

const G = '#1D9E75';
const S = {
  card:   { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:  { fontSize:14, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0' },
  kpiGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12, marginBottom:16 },
  kpi:    { background:'#fff', borderRadius:12, padding:'16px 18px', border:'1px solid #eee' },
  kpiNum: { fontSize:28, fontWeight:700, lineHeight:1 },
  kpiLbl: { fontSize:11, color:'#888', marginTop:4 },
  table:  { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:     { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:     { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  badge:  (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='red'?'#FCEBEB': c==='orange'?'#FEF3C7': c==='green'?'#E1F5EE':'#f0f0f0',
    color:      c==='red'?'#A32D2D': c==='orange'?'#92400E': c==='green'?'#0F6E56':'#666' }),
};

export default function AdminDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center',padding:60,color:'#aaa'}}>Loading dashboard...</div>;
  if (!data)   return <div style={{textAlign:'center',padding:60,color:'#aaa'}}>Failed to load data</div>;

  const { metrics, trainer_performance, enquiry_funnel, recent_escalations } = data;

  const kpis = [
    { num: metrics.active_batches,   label:'Active batches',    color:G,        icon:'📚' },
    { num: metrics.total_students,   label:'Total students',    color:'#185FA5', icon:'🎓' },
    { num: metrics.enquiries_month,  label:'Enquiries (month)', color:'#D97706', icon:'📋' },
    { num: metrics.total_placed,     label:'Students placed',   color:G,        icon:'🎯' },
    { num: metrics.open_escalations, label:'Open escalations',  color: metrics.open_escalations > 0 ? '#A32D2D':'#888', icon:'⚠️' },
  ];

  return (
    <div>
      {/* KPIs */}
      <div style={S.kpiGrid}>
        {kpis.map((k,i) => (
          <div key={i} style={S.kpi}>
            <div style={{fontSize:20, marginBottom:4}}>{k.icon}</div>
            <div style={{...S.kpiNum, color:k.color}}>{k.num}</div>
            <div style={S.kpiLbl}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        {/* Trainer performance */}
        <div style={S.card}>
          <div style={S.title}>🏆 Trainer performance — this month</div>
          {trainer_performance?.length === 0
            ? <div style={{textAlign:'center',padding:20,color:'#aaa',fontSize:12}}>No data yet</div>
            : <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Trainer</th>
                  <th style={S.th}>⭐ Points</th>
                  <th style={S.th}>Hours</th>
                  <th style={S.th}>Days</th>
                  <th style={S.th}>Escalations</th>
                </tr></thead>
                <tbody>
                  {trainer_performance?.map((t,i) => (
                    <tr key={i}>
                      <td style={S.td}><strong>{t.name}</strong></td>
                      <td style={{...S.td, color:G, fontWeight:600}}>{parseFloat(t.total_star_points).toFixed(1)}</td>
                      <td style={S.td}>{parseFloat(t.total_hours).toFixed(1)}h</td>
                      <td style={S.td}>{t.days_logged}</td>
                      <td style={S.td}>
                        {parseInt(t.escalation_count) > 0
                          ? <span style={S.badge('red')}>{t.escalation_count} open</span>
                          : <span style={S.badge('green')}>None</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        {/* Right column */}
        <div>
          {/* Enquiry funnel */}
          <div style={{...S.card, marginBottom:16}}>
            <div style={S.title}>📋 Enquiry funnel — this month</div>
            {enquiry_funnel?.length === 0
              ? <div style={{textAlign:'center',padding:20,color:'#aaa',fontSize:12}}>No enquiries this month</div>
              : <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                  {enquiry_funnel?.map((f,i) => (
                    <div key={i} style={{background:'#f9f9f9',borderRadius:8,padding:'10px 14px',border:'1px solid #eee',minWidth:90}}>
                      <div style={{fontSize:18,fontWeight:700,color:'#222'}}>{f.count}</div>
                      <div style={{fontSize:10,color:'#888',marginTop:2,textTransform:'capitalize'}}>{f.status?.replace(/_/g,' ')}</div>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Recent escalations */}
          <div style={S.card}>
            <div style={S.title}>⚠️ Recent open escalations</div>
            {recent_escalations?.length === 0
              ? <div style={{textAlign:'center',padding:20,color:'#aaa',fontSize:12}}>✅ No open escalations!</div>
              : recent_escalations?.map((e,i) => (
                  <div key={i} style={{padding:'8px 0', borderBottom:'1px solid #f5f5f5', fontSize:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                      <strong>{e.trainer_name}</strong>
                      <span style={{fontSize:10,color:'#888'}}>{e.escalation_date?.split('T')[0]}</span>
                    </div>
                    <div style={{color:'#555',fontSize:11,
                      display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                      {e.description}
                    </div>
                    <span style={{...S.badge(e.status==='open'?'red':'orange'),marginTop:4,display:'inline-block'}}>
                      {e.status}
                    </span>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}