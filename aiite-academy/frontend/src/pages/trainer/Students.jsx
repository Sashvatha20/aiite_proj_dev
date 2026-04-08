import { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../api/students';
import { getBatches } from '../../api/batches';
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
  badge:   (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='green'?'#E1F5EE':c==='blue'?'#E6F1FB':'#f0f0f0',
    color: c==='green'?'#0F6E56':c==='blue'?'#185FA5':'#666' }),
  avatar:  { width:28, height:28, borderRadius:'50%', background:G, color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, marginRight:6, flexShrink:0, verticalAlign:'middle' },
  waBox:   { background:'#E1F5EE', border:'1px solid #9FE1CB', borderRadius:8, padding:'12px 14px', fontSize:11, color:'#0F6E56', marginTop:10 },
  waBtn:   { marginTop:10, padding:'7px 16px', background:'#25D366', color:'#fff', border:'none', borderRadius:8, fontSize:12, cursor:'pointer' },
};

export default function Students() {
  const [tab, setTab]           = useState(0);
  const [students, setStudents] = useState([]);
  const [batches, setBatches]   = useState([]);
  const [search, setSearch]     = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [loading, setLoading]   = useState(false);
  const [editId, setEditId]     = useState(null);

  const blank = { batch_id:'', candidate_name:'', phone:'', email:'', whatsapp_number:'', certificate_no:'', wa_sent: false };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    loadAll();
    getBatches().then(r => setBatches(r.data.batches || []));
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const r = await getStudents();
      setStudents(r.data.students || []);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // WhatsApp message builder
  const buildWA = () => {
    const batch = batches.find(b => String(b.id) === String(form.batch_id));
    return `🎓 Student Enrollment Update

Name: ${form.candidate_name}
Phone: ${form.phone || '—'}
${form.email ? 'Email: ' + form.email : ''}
Batch: ${batch?.batch_name || '—'} (${batch?.course_name || '—'})
${form.certificate_no ? 'Certificate No: ' + form.certificate_no : 'Certificate No: Auto-generated'}
${form.whatsapp_number ? 'WhatsApp: ' + form.whatsapp_number : ''}`.trim();
  };

  const openWA = () => {
    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(buildWA())}`, '_blank');
    set('wa_sent', true);
    toast.success('WhatsApp opened — select contact manually');
  };

  const showWAPreview = form.candidate_name && form.batch_id;

  const handleSubmit = async () => {
    if (!form.batch_id || !form.candidate_name) return toast.error('Batch and name are required');
    setLoading(true);
    try {
      if (editId) {
        await updateStudent(editId, form);
        toast.success('Student updated!');
      } else {
        await createStudent(form);
        toast.success('Student enrolled!');
      }
      setForm(blank); setEditId(null); setTab(1); loadAll();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  const handleEdit = (s) => {
    setForm({ batch_id: s.batch_id||'', candidate_name: s.candidate_name||'', phone: s.phone||'', email: s.email||'', whatsapp_number: s.whatsapp_number||'', certificate_no: s.certificate_no||'', wa_sent: s.wa_sent||false });
    setEditId(s.id); setTab(0);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this student?')) return;
    try { await deleteStudent(id); toast.success('Student removed'); loadAll(); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = students.filter(s => {
    const bm = filterBatch ? String(s.batch_id) === filterBatch : true;
    const sm = search ? s.candidate_name?.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search) : true;
    return bm && sm;
  });

  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>Students <span style={S.tag}>→ Batch Details sheet</span></div>

        <div style={S.tabs}>
          {['Enroll student','All students'].map((t,i)=>(
            <div key={i} style={{...S.tab,...(tab===i?S.tabA:{})}} onClick={()=>setTab(i)}>{t}</div>
          ))}
        </div>

        {/* ── Tab 0: Enroll ── */}
        {tab===0 && (
          <div>
            {editId && (
              <div style={{background:'#FAEEDA',border:'1px solid #FAC775',borderRadius:8,padding:'8px 12px',fontSize:11,color:'#854F0B',marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>✏️ Editing: {form.candidate_name}</span>
                <button style={S.actBtn} onClick={()=>{setForm(blank);setEditId(null);}}>✕ Cancel edit</button>
              </div>
            )}

            <div style={S.field}>
              <label style={S.label}>Batch *</label>
              <select style={S.select} value={form.batch_id} onChange={e=>set('batch_id',e.target.value)}>
                <option value="">Select batch</option>
                {batches.map(b=><option key={b.id} value={b.id}>{b.batch_name} — {b.course_name}</option>)}
              </select>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Candidate name *</label>
                <input style={S.input} value={form.candidate_name} onChange={e=>set('candidate_name',e.target.value)} placeholder="Full name"/>
              </div>
              <div style={S.field}>
                <label style={S.label}>Phone number</label>
                <input style={S.input} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="Mobile number"/>
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Email</label>
                <input style={S.input} type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="email@example.com"/>
              </div>
              <div style={S.field}>
                <label style={S.label}>WhatsApp number (if different from phone)</label>
                <input style={S.input} value={form.whatsapp_number} onChange={e=>set('whatsapp_number',e.target.value)} placeholder="Leave blank if same as phone"/>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Certificate number (auto-generated if blank)</label>
              <input style={S.input} value={form.certificate_no} onChange={e=>set('certificate_no',e.target.value)} placeholder="e.g. AiiTENCS0001"/>
            </div>

            {/* WhatsApp Preview — appears when name + batch selected */}
            {showWAPreview && (
              <div style={S.waBox}>
                <div style={{fontWeight:600,marginBottom:6}}>📱 WhatsApp message preview:</div>
                <div style={{whiteSpace:'pre-wrap',lineHeight:1.8,fontFamily:'monospace',fontSize:11}}>{buildWA()}</div>
                <button style={S.waBtn} onClick={openWA}>
                  Open WhatsApp Web → select contact manually
                </button>
                {form.wa_sent && <span style={{marginLeft:10,fontSize:10,color:'#0F6E56',fontWeight:500}}>✓ Sent</span>}
              </div>
            )}

            <div style={S.btnRow}>
              <button style={S.btnP} onClick={handleSubmit} disabled={loading}>
                {loading?'Saving...':editId?'Update student':'Enroll student'}
              </button>
              <button style={S.btn} onClick={()=>{setForm(blank);setEditId(null);}}>Clear</button>
            </div>
          </div>
        )}

        {/* ── Tab 1: All Students ── */}
        {tab===1 && (
          <div>
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
              <input style={{...S.input,maxWidth:200}} placeholder="Search name / phone" value={search} onChange={e=>setSearch(e.target.value)}/>
              <select style={{...S.select,maxWidth:240}} value={filterBatch} onChange={e=>setFilterBatch(e.target.value)}>
                <option value="">All batches</option>
                {batches.map(b=><option key={b.id} value={String(b.id)}>{b.batch_name}</option>)}
              </select>
              <span style={{fontSize:11,color:'#888',alignSelf:'center'}}>{filtered.length} student{filtered.length!==1?'s':''}</span>
            </div>

            {loading
              ? <div style={{textAlign:'center',padding:'30px',color:'#aaa',fontSize:12}}>Loading…</div>
              : filtered.length===0
              ? <div style={{textAlign:'center',padding:'40px 20px',color:'#aaa',fontSize:12}}><div style={{fontSize:28,marginBottom:8}}>🎓</div>No students found</div>
              : (
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Name</th><th style={S.th}>Phone</th><th style={S.th}>Batch</th>
                    <th style={S.th}>Course</th><th style={S.th}>Cert. no.</th><th style={S.th}>WA</th><th style={S.th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(s=>(
                      <tr key={s.id}>
                        <td style={S.td}>
                          <div style={{display:'flex',alignItems:'center'}}>
                            <div style={S.avatar}>{s.candidate_name?.[0]?.toUpperCase()}</div>
                            <div>
                              <div style={{fontWeight:500}}>{s.candidate_name}</div>
                              {s.email && <div style={{fontSize:10,color:'#888'}}>{s.email}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={S.td}>
                          <div>{s.phone||'—'}</div>
                          {s.whatsapp_number && s.whatsapp_number!==s.phone && (
                            <div style={{fontSize:10,color:'#25D366'}}>WA: {s.whatsapp_number}</div>
                          )}
                        </td>
                        <td style={S.td}>{s.batch_name||'—'}</td>
                        <td style={S.td}>{s.course_name||'—'}</td>
                        <td style={S.td}><span style={{fontFamily:'monospace',fontSize:11,background:'#f5f5f5',padding:'2px 6px',borderRadius:4}}>{s.certificate_no||'—'}</span></td>
                        <td style={S.td}><span style={S.badge(s.wa_sent?'green':'')}>{s.wa_sent?'Sent':'—'}</span></td>
                        <td style={S.td}>
                          <button style={S.actBtn} onClick={()=>handleEdit(s)}>✎ Edit</button>
                          <button style={{...S.actBtn,color:'#E53E3E'}} onClick={()=>handleDelete(s.id)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}