import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';

const getEscalations   = (params)   => api.get('/escalations', { params });
const createEscalation = (data)     => api.post('/escalations', data);
const updateEscalation = (id, data) => api.put(`/escalations/${id}`, data);

const G = '#1D9E75';
const S = {
  card:     { background:'#fff', borderRadius:12, padding:20, marginBottom:16 },
  title:    { fontSize:15, fontWeight:600, marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  tag:      { fontSize:9, background:'#E6F1FB', color:'#185FA5', padding:'2px 6px', borderRadius:4 },
  tabs:     { display:'flex', borderBottom:'1px solid #eee', marginBottom:14 },
  tab:      { padding:'7px 14px', fontSize:12, cursor:'pointer', borderBottom:'2px solid transparent', color:'#888' },
  tabA:     { borderBottomColor:G, color:G, fontWeight:500 },
  row2:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 },
  row3:     { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 },
  field:    { marginBottom:10 },
  label:    { fontSize:11, color:'#666', display:'block', marginBottom:3 },
  input:    { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box' },
  select:   { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff', boxSizing:'border-box' },
  textarea: { width:'100%', padding:'7px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', resize:'vertical', minHeight:80, boxSizing:'border-box', fontFamily:'inherit' },
  btnRow:   { display:'flex', gap:8, marginTop:12 },
  btn:      { padding:'8px 16px', borderRadius:8, border:'1px solid #ddd', background:'#fff', fontSize:12, cursor:'pointer' },
  btnP:     { padding:'8px 16px', borderRadius:8, border:'none', background:G, color:'#fff', fontSize:12, cursor:'pointer' },
  table:    { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:       { textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #eee', fontSize:11, color:'#888', fontWeight:500 },
  td:       { padding:'8px 10px', borderBottom:'1px solid #f5f5f5', color:'#333', verticalAlign:'top' },
  actBtn:   { fontSize:10, padding:'3px 8px', borderRadius:6, border:'1px solid #ddd', background:'#fff', cursor:'pointer', marginRight:4 },
  badge:    (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:10,
    background: c==='green'?'#E1F5EE': c==='orange'?'#FEF3C7': c==='red'?'#FCEBEB': c==='blue'?'#E6F1FB':'#f0f0f0',
    color:      c==='green'?'#0F6E56': c==='orange'?'#92400E': c==='red'?'#A32D2D': c==='blue'?'#185FA5':'#666' }),
  waBox:    { background:'#E1F5EE', border:'1px solid #9FE1CB', borderRadius:8, padding:'12px 14px', fontSize:11, color:'#0F6E56', marginTop:10 },
  waBtn:    { marginTop:10, padding:'7px 16px', background:'#25D366', color:'#fff', border:'none', borderRadius:8, fontSize:12, cursor:'pointer' },
  kpiGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:12, marginBottom:16 },
  kpi:      { background:'#f9f9f9', borderRadius:10, padding:'12px 14px', border:'1px solid #eee' },
  kpiNum:   { fontSize:22, fontWeight:700, color:'#222', lineHeight:1 },
  kpiLabel: { fontSize:10, color:'#888', marginTop:3 },
  warnBox:  { background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:8, padding:'10px 14px', fontSize:11, color:'#92400E', marginBottom:12 },
};

const today = () => new Date().toISOString().split('T')[0];
const STATUSES = ['open','acknowledged','resolved'];
const statusColor = s => s==='resolved'?'green': s==='acknowledged'?'orange':'red';

export default function Escalation() {
  const [tab, setTab]             = useState(0);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [editId, setEditId]       = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const blank = {
    escalation_date: today(),
    reported_by: '',
    description: '',
    no_of_count: 1,
    status: 'open',
    wa_sent: false
  };
  const [form, setForm] = useState(blank);

  useEffect(() => { loadEscalations(); }, []);

  const loadEscalations = async () => {
    try {
      const r = await getEscalations();
      setEscalations(r.data.escalations || []);
    } catch {}
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // WhatsApp message builder
  const buildWA = () =>
    `⚠️ Escalation Report (${form.escalation_date})

Reported by: ${form.reported_by || '—'}
No. of incidents: ${form.no_of_count || 1}
Status: ${form.status?.charAt(0).toUpperCase() + form.status?.slice(1)}

Description:
${form.description || '—'}`.trim();

  const openWA = () => {
    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(buildWA())}`, '_blank');
    set('wa_sent', true);
    toast.success('WhatsApp opened — select contact manually');
  };

  const showWAPreview = form.reported_by || form.description;

  const handleSubmit = async () => {
    if (!form.description) return toast.error('Please describe the escalation');
    if (!form.reported_by)  return toast.error('Please enter who reported this');
    setLoading(true);
    try {
      const payload = { ...form, no_of_count: parseInt(form.no_of_count) || 1 };
      if (editId) {
        await updateEscalation(editId, payload);
        toast.success('Escalation updated!');
      } else {
        await createEscalation(payload);
        toast.success('Escalation reported!');
      }
      setForm(blank); setEditId(null);
      loadEscalations(); setTab(1);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (e) => {
    setForm({
      escalation_date: e.escalation_date?.split('T')[0] || today(),
      reported_by:     e.reported_by  || '',
      description:     e.description  || '',
      no_of_count:     e.no_of_count  ?? 1,
      status:          e.status       || 'open',
      wa_sent:         e.wa_sent      || false,
    });
    setEditId(e.id); setTab(0);
  };

  // KPIs
  const kpis = {
    total:        escalations.length,
    open:         escalations.filter(e => e.status === 'open').length,
    acknowledged: escalations.filter(e => e.status === 'acknowledged').length,
    resolved:     escalations.filter(e => e.status === 'resolved').length,
  };

  const filtered = escalations.filter(e =>
    filterStatus ? e.status === filterStatus : true
  );

  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>
          Escalations
          <span style={S.tag}>→ Escalation Log</span>
        </div>

        <div style={S.tabs}>
          {['Report escalation','View all'].map((t,i)=>(
            <div key={i} style={{...S.tab,...(tab===i?S.tabA:{})}} onClick={()=>setTab(i)}>{t}</div>
          ))}
        </div>

        {/* ── Tab 0: Report ── */}
        {tab===0 && (
          <div>
            <div style={S.warnBox}>
              ⚠️ Use this to log any complaint, misconduct, or issue reported against a trainer or staff member. All records are visible to admin.
            </div>

            {editId && (
              <div style={{background:'#FAEEDA',border:'1px solid #FAC775',borderRadius:8,padding:'8px 12px',fontSize:11,color:'#854F0B',marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>✏️ Editing escalation record</span>
                <button style={S.actBtn} onClick={()=>{setForm(blank);setEditId(null);}}>✕ Cancel</button>
              </div>
            )}

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Escalation date</label>
                <input style={S.input} type="date" value={form.escalation_date} onChange={e=>set('escalation_date',e.target.value)}/>
              </div>
              <div style={S.field}>
                <label style={S.label}>Reported by *</label>
                <input style={S.input} value={form.reported_by} onChange={e=>set('reported_by',e.target.value)} placeholder="Name of person who reported this"/>
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>No. of incidents / count</label>
                <input style={S.input} type="number" min="1" value={form.no_of_count} onChange={e=>set('no_of_count',e.target.value)}/>
              </div>
              <div style={S.field}>
                <label style={S.label}>Current status</label>
                <select style={S.select} value={form.status} onChange={e=>set('status',e.target.value)}>
                  {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Description of escalation *</label>
              <textarea
                style={S.textarea}
                value={form.description}
                onChange={e=>set('description',e.target.value)}
                placeholder="Describe the issue clearly — what happened, when, who was involved, what action was taken..."
              />
            </div>

            {/* WhatsApp Preview */}
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
                {loading?'Saving...':editId?'Update escalation':'Submit escalation'}
              </button>
              <button style={S.btn} onClick={()=>{setForm(blank);setEditId(null);}}>Clear</button>
            </div>
          </div>
        )}

        {/* ── Tab 1: View All ── */}
        {tab===1 && (
          <div>
            {/* KPIs */}
            <div style={S.kpiGrid}>
              {[
                { num: kpis.total,        label:'Total',        accent:'#222' },
                { num: kpis.open,         label:'🔴 Open',       accent:'#A32D2D' },
                { num: kpis.acknowledged, label:'🟡 Acknowledged',accent:'#92400E' },
                { num: kpis.resolved,     label:'✅ Resolved',   accent:G },
              ].map((k,i)=>(
                <div key={i} style={S.kpi}>
                  <div style={{...S.kpiNum,color:k.accent}}>{k.num}</div>
                  <div style={S.kpiLabel}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Status filter */}
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              <select style={{...S.select,maxWidth:180}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
              <span style={{fontSize:11,color:'#888',alignSelf:'center'}}>{filtered.length} record{filtered.length!==1?'s':''}</span>
            </div>

            {filtered.length===0
              ? <div style={{textAlign:'center',padding:'40px 20px',color:'#aaa',fontSize:12}}>
                  <div style={{fontSize:28,marginBottom:8}}>✅</div>No escalations — all clear!
                </div>
              : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Date</th>
                      <th style={S.th}>Reported by</th>
                      <th style={S.th}>Description</th>
                      <th style={S.th}>Count</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>WA</th>
                      <th style={S.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(e=>(
                      <tr key={e.id}>
                        <td style={S.td}>{e.escalation_date?.split('T')[0]||'—'}</td>
                        <td style={S.td}><strong>{e.reported_by||'—'}</strong></td>
                        <td style={{...S.td, maxWidth:280}}>
                          <div style={{fontSize:11,color:'#444',lineHeight:1.5,
                            display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                            {e.description||'—'}
                          </div>
                        </td>
                        <td style={S.td}>{e.no_of_count||1}</td>
                        <td style={S.td}>
                          <span style={S.badge(statusColor(e.status))}>
                            {e.status?.charAt(0).toUpperCase()+e.status?.slice(1)}
                          </span>
                        </td>
                        <td style={S.td}><span style={S.badge(e.wa_sent?'green':'')}>{e.wa_sent?'Sent':'—'}</span></td>
                        <td style={S.td}>
                          <button style={S.actBtn} onClick={()=>handleEdit(e)}>✎ Edit</button>
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