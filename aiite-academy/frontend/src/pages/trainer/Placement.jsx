import { useState, useEffect } from 'react';
import { getPlacements, createPlacement, updatePlacement } from '../../api/placements';
import { getStudents } from '../../api/students';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const S = {
  card:    { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:   { fontSize:15, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  tag:     { fontSize:9, background:'#E6F1FB', color:'#185FA5', padding:'2px 6px', borderRadius:4 },
  tabs:    { display:'flex', borderBottom:'1px solid #eee', marginBottom:14 },
  tab:     { padding:'7px 14px', fontSize:12, cursor:'pointer', borderBottom:'2px solid transparent', color:'#888' },
  tabA:    { borderBottomColor:G, color:G, fontWeight:500 },
  row2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 },
  row3:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 },
  field:   { marginBottom:10 },
  label:   { fontSize:11, color:'#666', display:'block', marginBottom:3 },
  input:   { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box' },
  select:  { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff', boxSizing:'border-box' },
  btnRow:  { display:'flex', gap:8, marginTop:12 },
  btn:     { padding:'8px 16px', borderRadius:8, border:'1px solid #ddd', background:'#fff', fontSize:12, cursor:'pointer' },
  btnP:    { padding:'8px 16px', borderRadius:8, border:'none', background:G, color:'#fff', fontSize:12, cursor:'pointer' },
  table:   { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:      { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:      { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333' },
  actBtn:  { fontSize:10, padding:'3px 8px', borderRadius:6, border:'1px solid #ddd', background:'#fff', cursor:'pointer', marginRight:4 },
  badge:   (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10, background:c==='green'?'#E1F5EE':c==='yellow'?'#FEF9C3':c==='blue'?'#E6F1FB':'#f0f0f0', color:c==='green'?'#0F6E56':c==='yellow'?'#854F0B':c==='blue'?'#185FA5':'#666' }),
};
const today = () => new Date().toISOString().split('T')[0];
const statusColor = { placed:'green', offer_pending:'yellow', in_process:'blue', not_placed:'' };

export default function Placement() {
  const [tab, setTab]             = useState(0);
  const [students, setStudents]   = useState([]);
  const [placements, setPlacements] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading]     = useState(false);
  const [editId, setEditId]       = useState(null);

  const blank = { student_id:'', company_name:'', role:'', placed_status:'in_process', placement_date:today(), package_lpa:'', remarks:'' };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    getStudents().then(r => setStudents(r.data.students || []));
    loadPlacements();
  }, []);

  const loadPlacements = async () => {
    try { const r = await getPlacements(); setPlacements(r.data.placements || []); }
    catch { toast.error('Failed to load'); }
  };

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async () => {
    if (!form.student_id || !form.company_name) return toast.error('Student and company are required');
    setLoading(true);
    try {
      if (editId) { await updatePlacement(editId, form); toast.success('Updated!'); }
      else        { await createPlacement(form);          toast.success('Placement logged!'); }
      setForm(blank); setEditId(null); loadPlacements(); setTab(1);
    } catch(e) { toast.error(e.response?.data?.error||'Failed'); }
    finally { setLoading(false); }
  };

  const handleEdit = (p) => {
    setForm({ student_id:p.student_id||'', company_name:p.company_name||'', role:p.role||'', placed_status:p.placed_status||'in_process', placement_date:p.placement_date?.split('T')[0]||today(), package_lpa:p.package_lpa||'', remarks:p.remarks||'' });
    setEditId(p.id); setTab(0);
  };

  const filtered = filterStatus ? placements.filter(p=>p.placed_status===filterStatus) : placements;
  const placedCount = placements.filter(p=>p.placed_status==='placed').length;

  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>
          Log placement
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:11,color:G,fontWeight:600}}>{placedCount} placed</span>
            <span style={S.tag}>→ Placements table</span>
          </div>
        </div>
        <div style={S.tabs}>
          {['Log placement','All placements'].map((t,i)=>(
            <div key={i} style={{...S.tab,...(tab===i?S.tabA:{})}} onClick={()=>setTab(i)}>{t}</div>
          ))}
        </div>

        {tab===0 && (
          <div>
            {editId && <div style={{background:'#FAEEDA',border:'1px solid #FAC775',borderRadius:8,padding:'8px 12px',fontSize:11,color:'#854F0B',marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span>✏️ Editing placement</span><button style={S.actBtn} onClick={()=>{setForm(blank);setEditId(null);}}>✕ Cancel</button></div>}
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Student *</label>
                <select style={S.select} value={form.student_id} onChange={e=>set('student_id',e.target.value)}>
                  <option value="">Select student</option>
                  {students.map(s=><option key={s.id} value={s.id}>{s.candidate_name} — {s.batch_name}</option>)}
                </select>
              </div>
              <div style={S.field}><label style={S.label}>Placement date</label><input style={S.input} type="date" value={form.placement_date} onChange={e=>set('placement_date',e.target.value)}/></div>
            </div>
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Company name *</label><input style={S.input} value={form.company_name} onChange={e=>set('company_name',e.target.value)} placeholder="e.g. Infosys, TCS"/></div>
              <div style={S.field}><label style={S.label}>Role / designation</label><input style={S.input} value={form.role} onChange={e=>set('role',e.target.value)} placeholder="e.g. QA Engineer"/></div>
            </div>
            <div style={S.row3}>
              <div style={S.field}><label style={S.label}>Status</label>
                <select style={S.select} value={form.placed_status} onChange={e=>set('placed_status',e.target.value)}>
                  {['in_process','offer_pending','placed','not_placed'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div style={S.field}><label style={S.label}>Package (LPA)</label><input style={S.input} type="number" step="0.1" value={form.package_lpa} onChange={e=>set('package_lpa',e.target.value)} placeholder="e.g. 4.5"/></div>
              <div style={S.field}><label style={S.label}>Remarks</label><input style={S.input} value={form.remarks} onChange={e=>set('remarks',e.target.value)} placeholder="Optional"/></div>
            </div>
            <div style={S.btnRow}>
              <button style={S.btnP} onClick={handleSubmit} disabled={loading}>{editId?'Update':'Log placement'}</button>
              <button style={S.btn} onClick={()=>{setForm(blank);setEditId(null);}}>Clear</button>
            </div>
          </div>
        )}

        {tab===1 && (
          <div>
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              <select style={{...S.select,maxWidth:180}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                {['placed','offer_pending','in_process','not_placed'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            {filtered.length===0?<div style={{textAlign:'center',padding:'30px',color:'#aaa',fontSize:12}}>No placements logged yet</div>:(
              <table style={S.table}>
                <thead><tr><th style={S.th}>Student</th><th style={S.th}>Company</th><th style={S.th}>Role</th><th style={S.th}>Status</th><th style={S.th}>Package</th><th style={S.th}>Date</th><th style={S.th}>Actions</th></tr></thead>
                <tbody>{filtered.map(p=>(
                  <tr key={p.id}>
                    <td style={S.td}><strong>{p.candidate_name}</strong><div style={{fontSize:10,color:'#888'}}>{p.batch_name}</div></td>
                    <td style={S.td}>{p.company_name}</td>
                    <td style={S.td}>{p.role||'—'}</td>
                    <td style={S.td}><span style={S.badge(statusColor[p.placed_status]||'')}>{p.placed_status?.replace(/_/g,' ')}</span></td>
                    <td style={S.td}>{p.package_lpa ? `${p.package_lpa} LPA` : '—'}</td>
                    <td style={S.td}>{p.placement_date?.split('T')[0]}</td>
                    <td style={S.td}><button style={S.actBtn} onClick={()=>handleEdit(p)}>✎ Edit</button></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}