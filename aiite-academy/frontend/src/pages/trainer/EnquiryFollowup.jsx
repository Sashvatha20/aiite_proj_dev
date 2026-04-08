import { useState, useEffect } from 'react';
import { getEnquiries, createEnquiry, updateEnquiry, deleteEnquiry, logFollowup, saveDailyCount, getDailyCounts } from '../../api/enquiries';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const S = {
  card:    { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:   { fontSize:15, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  tag:     { fontSize:9, background:'#E6F1FB', color:'#185FA5', padding:'2px 6px', borderRadius:4 },
  tabs:    { display:'flex', borderBottom:'1px solid #eee', marginBottom:14, flexWrap:'wrap' },
  tab:     { padding:'7px 14px', fontSize:12, cursor:'pointer', borderBottom:'2px solid transparent', color:'#888' },
  tabA:    { borderBottomColor:G, color:G, fontWeight:500 },
  row2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 },
  row3:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 },
  field:   { marginBottom:10 },
  label:   { fontSize:11, color:'#666', display:'block', marginBottom:3 },
  input:   { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box' },
  select:  { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff', boxSizing:'border-box' },
  textarea:{ width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', resize:'vertical', minHeight:70, boxSizing:'border-box', fontFamily:'inherit' },
  btnRow:  { display:'flex', gap:8, marginTop:12 },
  btn:     { padding:'8px 16px', borderRadius:8, border:'1px solid #ddd', background:'#fff', fontSize:12, cursor:'pointer' },
  btnP:    { padding:'8px 16px', borderRadius:8, border:'none', background:G, color:'#fff', fontSize:12, cursor:'pointer' },
  table:   { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:      { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:      { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333', verticalAlign:'top' },
  badge:   (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='green'?'#E1F5EE':c==='red'?'#FCEBEB':c==='blue'?'#E6F1FB':c==='yellow'?'#FEF9C3':'#f0f0f0',
    color:      c==='green'?'#0F6E56':c==='red'?'#A32D2D':c==='blue'?'#185FA5':c==='yellow'?'#854F0B':'#666' }),
  actBtn:  { fontSize:10, padding:'3px 8px', borderRadius:6, border:'1px solid #ddd', background:'#fff', cursor:'pointer', marginRight:4 },
  modal:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modalBox:{ background:'#fff', borderRadius:14, padding:24, width:480, maxWidth:'92vw', maxHeight:'88vh', overflowY:'auto' },
};

const statusColor = { new:'blue', followup:'yellow', converted:'green', not_interested:'red', lost:'red' };
const today = () => new Date().toISOString().split('T')[0];

export default function EnquiryFollowup() {
  const [tab, setTab]             = useState(0);
  const [enquiries, setEnquiries] = useState([]);
  const [dailyCounts, setDailyCounts] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFollowup, setShowFollowup] = useState(null);
  const [editEnquiry, setEditEnquiry]   = useState(null);

  const blankEnq   = { date:today(), name:'', contact:'', course_enquired_for:'', course_suggested:'', enquiry_mode:'call', source:'', referred_by:'', list_type:'daily_followup', status:'new' };
  const blankFu    = { followup_date:today(), call_picked:'yes', last_response:'', ticket_status:'open', details_pitched:'', remarks:'', batch_status:'' };
  const blankCount = { date:today(), call_enquiries:0, walk_in_enquiries:0, course_suggested_by_us:0, remarks:'' };
  const [enqForm, setEnqForm]     = useState(blankEnq);
  const [fuForm, setFuForm]       = useState(blankFu);
  const [countForm, setCountForm] = useState(blankCount);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [eq, dc] = await Promise.all([getEnquiries(), getDailyCounts()]);
      setEnquiries(eq.data.enquiries || []);
      setDailyCounts(dc.data.counts || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const setE = (k,v) => setEnqForm(f=>({...f,[k]:v}));
  const setF = (k,v) => setFuForm(f=>({...f,[k]:v}));
  const setC = (k,v) => setCountForm(f=>({...f,[k]:v}));

  const submitEnquiry = async () => {
    if (!enqForm.name) return toast.error('Candidate name is required');
    setLoading(true);
    try {
      if (editEnquiry) { await updateEnquiry(editEnquiry.id, enqForm); toast.success('Enquiry updated!'); }
      else             { await createEnquiry(enqForm);                  toast.success('Enquiry added!'); }
      setEditEnquiry(null); setEnqForm(blankEnq); loadAll();
    } catch(e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const submitFollowup = async () => {
    if (!fuForm.last_response) return toast.error('Response details required');
    setLoading(true);
    try {
      await logFollowup(showFollowup.id, fuForm);
      toast.success('Followup logged!');
      setShowFollowup(null); setFuForm(blankFu); loadAll();
    } catch(e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const submitCount = async () => {
    setLoading(true);
    try {
      await saveDailyCount(countForm);
      toast.success('Daily count saved!');
      setCountForm(blankCount); loadAll();
    } catch(e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try { await deleteEnquiry(id); toast.success('Deleted'); loadAll(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleEdit = (enq) => {
    setEnqForm({ date:enq.date?.split('T')[0]||today(), name:enq.name||'', contact:enq.contact||'', course_enquired_for:enq.course_enquired_for||'', course_suggested:enq.course_suggested||'', enquiry_mode:enq.enquiry_mode||'call', source:enq.source||'', referred_by:enq.referred_by||'', list_type:enq.list_type||'daily_followup', status:enq.status||'new' });
    setEditEnquiry(enq); setTab(0);
  };

  const filtered = enquiries.filter(e =>
    (filterStatus ? e.status === filterStatus : true) &&
    (search ? e.name?.toLowerCase().includes(search.toLowerCase()) || e.contact?.includes(search) : true)
  );

  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>Enquiry followup <span style={S.tag}>→ All enquiry sheets</span></div>
        <div style={S.tabs}>
          {['Add new enquiry','Log followup call','All enquiries','Daily count'].map((t,i)=>(
            <div key={i} style={{...S.tab,...(tab===i?S.tabA:{})}} onClick={()=>setTab(i)}>{t}</div>
          ))}
        </div>

        {tab===0 && (
          <div>
            {editEnquiry && (
              <div style={{background:'#FAEEDA',border:'1px solid #FAC775',borderRadius:8,padding:'8px 12px',fontSize:11,color:'#854F0B',marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                ✏️ Editing: {editEnquiry.name}
                <button style={S.actBtn} onClick={()=>{setEditEnquiry(null);setEnqForm(blankEnq);}}>✕ Cancel</button>
              </div>
            )}
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Date</label><input style={S.input} type="date" value={enqForm.date} onChange={e=>setE('date',e.target.value)}/></div>
              <div style={S.field}><label style={S.label}>Source</label>
                <select style={S.select} value={enqForm.source} onChange={e=>setE('source',e.target.value)}>
                  <option value="">Select</option>
                  {['Walk-in','Call','Referral','Online','Social media'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Candidate name *</label><input style={S.input} value={enqForm.name} onChange={e=>setE('name',e.target.value)} placeholder="Full name"/></div>
              <div style={S.field}><label style={S.label}>Contact number</label><input style={S.input} value={enqForm.contact} onChange={e=>setE('contact',e.target.value)} placeholder="Phone"/></div>
            </div>
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Course enquired for</label><input style={S.input} value={enqForm.course_enquired_for} onChange={e=>setE('course_enquired_for',e.target.value)}/></div>
              <div style={S.field}><label style={S.label}>Course suggested</label><input style={S.input} value={enqForm.course_suggested} onChange={e=>setE('course_suggested',e.target.value)}/></div>
            </div>
            <div style={S.row3}>
              <div style={S.field}><label style={S.label}>Mode</label>
                <select style={S.select} value={enqForm.enquiry_mode} onChange={e=>setE('enquiry_mode',e.target.value)}>
                  {['call','walk_in','online'].map(m=><option key={m} value={m}>{m.replace('_',' ')}</option>)}
                </select>
              </div>
              <div style={S.field}><label style={S.label}>List type</label>
                <select style={S.select} value={enqForm.list_type} onChange={e=>setE('list_type',e.target.value)}>
                  {['daily_followup','hot_list','cold_list'].map(m=><option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div style={S.field}><label style={S.label}>Referred by</label><input style={S.input} value={enqForm.referred_by} onChange={e=>setE('referred_by',e.target.value)}/></div>
            </div>
            <div style={S.btnRow}>
              <button style={S.btnP} onClick={submitEnquiry} disabled={loading}>{editEnquiry?'Update enquiry':'Add enquiry'}</button>
              <button style={S.btn} onClick={()=>{setEnqForm(blankEnq);setEditEnquiry(null);}}>Clear</button>
            </div>
          </div>
        )}

        {tab===1 && (
          <div>
            <div style={{fontSize:12,color:'#888',marginBottom:12}}>Pick an enquiry to log a call:</div>
            {enquiries.filter(e=>e.status!=='converted'&&e.status!=='lost').map(enq=>(
              <div key={enq.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:8,border:'1px solid #eee',marginBottom:6,background:'#fafafa'}}>
                <div>
                  <strong style={{fontSize:13}}>{enq.name}</strong>
                  <span style={{fontSize:11,color:'#888',marginLeft:8}}>{enq.contact}</span>
                  <span style={{fontSize:11,color:'#888',marginLeft:8}}>{enq.course_enquired_for||'—'}</span>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={S.badge(statusColor[enq.status]||'')}>{enq.status}</span>
                  <button style={{...S.actBtn,background:G,color:'#fff',border:'none',padding:'4px 10px'}} onClick={()=>{setShowFollowup(enq);setFuForm(blankFu);}}>Log call</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab===2 && (
          <div>
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              <input style={{...S.input,maxWidth:200}} placeholder="Search name / phone" value={search} onChange={e=>setSearch(e.target.value)}/>
              <select style={{...S.select,maxWidth:160}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                {['new','followup','converted','not_interested','lost'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Date</th><th style={S.th}>Name</th><th style={S.th}>Contact</th>
                  <th style={S.th}>Course</th><th style={S.th}>Source</th><th style={S.th}>Status</th><th style={S.th}>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(enq=>(
                    <tr key={enq.id}>
                      <td style={S.td}>{enq.date?.split('T')[0]}</td>
                      <td style={S.td}><strong>{enq.name}</strong></td>
                      <td style={S.td}>{enq.contact||'—'}</td>
                      <td style={S.td}>{enq.course_enquired_for||'—'}</td>
                      <td style={S.td}>{enq.source||'—'}</td>
                      <td style={S.td}><span style={S.badge(statusColor[enq.status]||'')}>{enq.status}</span></td>
                      <td style={S.td}>
                        <button style={S.actBtn} onClick={()=>handleEdit(enq)}>✎ Edit</button>
                        <button style={{...S.actBtn,color:'#E53E3E'}} onClick={()=>handleDelete(enq.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab===3 && (
          <div>
            <div style={{background:'#f9f9f9',borderRadius:10,padding:16,marginBottom:16}}>
              <div style={S.row3}>
                <div style={S.field}><label style={S.label}>Date</label><input style={S.input} type="date" value={countForm.date} onChange={e=>setC('date',e.target.value)}/></div>
                <div style={S.field}><label style={S.label}>Call enquiries</label><input style={S.input} type="number" min="0" value={countForm.call_enquiries} onChange={e=>setC('call_enquiries',parseInt(e.target.value)||0)}/></div>
                <div style={S.field}><label style={S.label}>Walk-in enquiries</label><input style={S.input} type="number" min="0" value={countForm.walk_in_enquiries} onChange={e=>setC('walk_in_enquiries',parseInt(e.target.value)||0)}/></div>
              </div>
              <div style={{fontSize:12,color:G,fontWeight:600,marginBottom:10}}>Total: {(countForm.call_enquiries||0)+(countForm.walk_in_enquiries||0)}</div>
              <button style={S.btnP} onClick={submitCount} disabled={loading}>Save daily count</button>
            </div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Date</th><th style={S.th}>Calls</th><th style={S.th}>Walk-ins</th><th style={S.th}>Total</th><th style={S.th}>Remarks</th></tr></thead>
              <tbody>
                {dailyCounts.map((d,i)=>(
                  <tr key={i}>
                    <td style={S.td}>{d.date?.split('T')[0]}</td>
                    <td style={S.td}>{d.call_enquiries}</td>
                    <td style={S.td}>{d.walk_in_enquiries}</td>
                    <td style={S.td}><strong>{d.total_enquiries}</strong></td>
                    <td style={S.td}>{d.remarks||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showFollowup && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setShowFollowup(null)}>
          <div style={S.modalBox}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{showFollowup.name}</div>
            <div style={{fontSize:11,color:'#888',marginBottom:16}}>{showFollowup.course_enquired_for} · {showFollowup.contact}</div>
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Followup date</label><input style={S.input} type="date" value={fuForm.followup_date} onChange={e=>setF('followup_date',e.target.value)}/></div>
              <div style={S.field}><label style={S.label}>Call picked?</label>
                <select style={S.select} value={fuForm.call_picked} onChange={e=>setF('call_picked',e.target.value)}>
                  <option value="yes">Yes — Picked up</option>
                  <option value="no">No — Not picked</option>
                </select>
              </div>
            </div>
            <div style={S.field}><label style={S.label}>Last response *</label>
              <textarea style={S.textarea} value={fuForm.last_response} onChange={e=>setF('last_response',e.target.value)} placeholder="What they said..."/>
            </div>
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Ticket status</label>
                <select style={S.select} value={fuForm.ticket_status} onChange={e=>setF('ticket_status',e.target.value)}>
                  {['open','follow_again','converted','not_interested','lost'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div style={S.field}><label style={S.label}>Details pitched</label><input style={S.input} value={fuForm.details_pitched} onChange={e=>setF('details_pitched',e.target.value)}/></div>
            </div>
            <div style={S.row2}>
              <div style={S.field}><label style={S.label}>Batch status</label><input style={S.input} value={fuForm.batch_status} onChange={e=>setF('batch_status',e.target.value)} placeholder="Next batch: May 1"/></div>
              <div style={S.field}><label style={S.label}>Remarks</label><input style={S.input} value={fuForm.remarks} onChange={e=>setF('remarks',e.target.value)}/></div>
            </div>
            <div style={S.btnRow}>
              <button style={S.btnP} onClick={submitFollowup} disabled={loading}>Log followup</button>
              <button style={S.btn} onClick={()=>setShowFollowup(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}