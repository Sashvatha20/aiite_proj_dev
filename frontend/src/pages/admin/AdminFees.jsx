import { useState, useEffect } from 'react';
import { getStudents } from '../../api/students';
import { getBatches } from '../../api/batches';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const PAGE_SIZE = 15;

const formatCurrency = v => {
  const n = parseFloat(v || 0);
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`;
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
};

const feeStatus = (total, paid) => {
  const t = parseFloat(total||0), p = parseFloat(paid||0);
  if (t === 0)  return { label:'N/A',     bg:'#f0f0f0', color:'#888' };
  if (p >= t)   return { label:'Paid ✓',  bg:'#E1F5EE', color:'#0F6E56' };
  if (p > 0)    return { label:'Partial', bg:'#FEF3C7', color:'#92400E' };
  return              { label:'Pending',  bg:'#FCEBEB', color:'#A32D2D' };
};

const S = {
  card:      { background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  table:     { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:        { textAlign:'left', padding:'9px 12px', borderBottom:'2px solid #f0f0f0', fontSize:11, color:'#888', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' },
  td:        { padding:'10px 12px', borderBottom:'1px solid #f5f5f5', color:'#333', verticalAlign:'middle' },
  input:     { padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:12, outline:'none', background:'#fff' },
  modal:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modalBox:  { background:'#fff', borderRadius:16, padding:28, width:520, maxWidth:'94vw', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  label:     { fontSize:11, color:'#666', display:'block', marginBottom:4, fontWeight:500 },
  inputFull: { width:'100%', padding:'8px 11px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box' },
  select:    { width:'100%', padding:'8px 11px', border:'1px solid #ddd', borderRadius:8, fontSize:12, outline:'none', background:'#fff', boxSizing:'border-box' },
  row2:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 },
  field:     { marginBottom:12 },
  btnP:      { padding:'9px 20px', borderRadius:9, border:'none', background:G, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' },
  btnS:      { padding:'9px 16px', borderRadius:9, border:'1px solid #ddd', background:'#fff', fontSize:12, cursor:'pointer' },
};

export default function AdminFees() {
  const [students,    setStudents]    = useState([]);
  const [batches,     setBatches]     = useState([]);
  const [search,      setSearch]      = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterFee,   setFilterFee]   = useState('');
  const [page,        setPage]        = useState(1);
  const [saving,      setSaving]      = useState(false);

  // ── Record Payment modal ──────────────────────────────────────────
  const [showPayment,  setShowPayment]  = useState(null);
  const [payForm,      setPayForm]      = useState({ amount:'', payment_mode:'cash', reference_no:'', notes:'', payment_date: new Date().toISOString().split('T')[0] });

  // ── Fee History modal ─────────────────────────────────────────────
  const [showHistory,  setShowHistory]  = useState(null);
  const [history,      setHistory]      = useState([]);
  const [loadingHist,  setLoadingHist]  = useState(false);

  useEffect(() => {
    getStudents().then(r => setStudents(r.data.students || []));
    getBatches().then(r => setBatches(r.data.batches || []));
  }, []);

  const setPay = (k, v) => setPayForm(f => ({ ...f, [k]: v }));

  // ── Record payment ─────────────────────────────────────────────────
  const handleRecordPayment = async () => {
    if (!payForm.amount || parseFloat(payForm.amount) <= 0)
      return toast.error('Enter a valid payment amount');
    setSaving(true);
    try {
      await api.post(`/students/${showPayment.id}/payments`, payForm);
      toast.success(`Payment of ${formatCurrency(payForm.amount)} recorded! 💰`);
      setShowPayment(null);
      setPayForm({ amount:'', payment_mode:'cash', reference_no:'', notes:'', payment_date: new Date().toISOString().split('T')[0] });
      const r = await getStudents();
      setStudents(r.data.students || []);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to record payment');
    } finally { setSaving(false); }
  };

  // ── Load fee history ───────────────────────────────────────────────
  const openHistory = async (student) => {
    setShowHistory(student);
    setHistory([]);
    setLoadingHist(true);
    try {
      const r = await api.get(`/students/${student.id}/payments`);
      setHistory(r.data.payments || []);
    } catch {
      setHistory([]);
    } finally { setLoadingHist(false); }
  };

  // ── Summary KPIs ───────────────────────────────────────────────────
  const totalFee     = students.reduce((s, x) => s + parseFloat(x.total_fee   || 0), 0);
  const totalPaid    = students.reduce((s, x) => s + parseFloat(x.paid_amount || 0), 0);
  const totalPending = totalFee - totalPaid;
  const countPaid    = students.filter(s => parseFloat(s.paid_amount||0) >= parseFloat(s.total_fee||1) && parseFloat(s.total_fee||0) > 0).length;
  const countPartial = students.filter(s => parseFloat(s.paid_amount||0) > 0 && parseFloat(s.paid_amount||0) < parseFloat(s.total_fee||0)).length;
  const countPending = students.filter(s => parseFloat(s.paid_amount||0) === 0 && parseFloat(s.total_fee||0) > 0).length;

  // ── Filter ─────────────────────────────────────────────────────────
  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search || s.candidate_name?.toLowerCase().includes(q) || s.phone?.includes(search);
    const matchBatch  = !filterBatch || String(s.batch_id) === String(filterBatch);
    const fs = feeStatus(s.total_fee, s.paid_amount);
    const matchFee = !filterFee || fs.label.toLowerCase().startsWith(filterFee.toLowerCase());
    return matchSearch && matchBatch && matchFee;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const balance = parseFloat(payForm.amount || 0);
  const remaining = showPayment
    ? parseFloat(showPayment.total_fee||0) - parseFloat(showPayment.paid_amount||0) - balance
    : 0;

  return (
    <div style={S.card}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'#111' }}>Fee Management</div>
          <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{students.length} students</div>
        </div>
      </div>

      {/* ── Summary KPIs ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Fees',     value: formatCurrency(totalFee),     color:'#111',    bg:'#f9f9f9', sub:'' },
          { label:'Total Collected',value: formatCurrency(totalPaid),    color:G,         bg:'#E1F5EE', sub:`${((totalPaid/totalFee)*100||0).toFixed(0)}% collected` },
          { label:'Pending Amount', value: formatCurrency(totalPending), color:'#DC2626', bg:'#FCEBEB', sub:`${countPending + countPartial} students` },
          { label:'Fully Paid',     value: countPaid,                    color:'#0F6E56', bg:'#E1F5EE', sub:'students' },
          { label:'Partial',        value: countPartial,                 color:'#D97706', bg:'#FEF3C7', sub:'students' },
          { label:'Not Paid',       value: countPending,                 color:'#A32D2D', bg:'#FCEBEB', sub:'students' },
        ].map((k, i) => (
          <div key={i} style={{ background:k.bg, borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:18, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:10, color:'#888', marginTop:3 }}>{k.label}</div>
            {k.sub && <div style={{ fontSize:10, color:k.color, marginTop:1, opacity:0.7 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Collection Progress Bar ── */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#888', marginBottom:5 }}>
          <span>Collection Progress</span>
          <span style={{ fontWeight:600, color:G }}>{formatCurrency(totalPaid)} / {formatCurrency(totalFee)}</span>
        </div>
        <div style={{ height:8, background:'#f0f0f0', borderRadius:8, overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:8, transition:'width 0.8s ease',
            background:`linear-gradient(90deg,${G},#15c78a)`,
            width:`${Math.min(100,(totalFee>0 ? (totalPaid/totalFee)*100 : 0))}%`
          }} />
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <input
          style={{ ...S.input, minWidth:200 }}
          placeholder="🔍 Search name / phone..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select style={S.input} value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(1); }}>
          <option value="">All Batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
        </select>
        <select style={S.input} value={filterFee} onChange={e => { setFilterFee(e.target.value); setPage(1); }}>
          <option value="">All Fee Status</option>
          <option value="paid">✅ Paid</option>
          <option value="partial">🟡 Partial</option>
          <option value="pending">🔴 Pending</option>
        </select>
        {(search || filterBatch || filterFee) && (
          <button onClick={() => { setSearch(''); setFilterBatch(''); setFilterFee(''); setPage(1); }}
            style={{ ...S.btnS, color:'#DC2626', borderColor:'#fecaca', fontSize:11 }}>✕ Clear</button>
        )}
        <span style={{ fontSize:11, color:'#aaa', alignSelf:'center', marginLeft:'auto' }}>
          {filtered.length} students
        </span>
      </div>

      {/* ── Table ── */}
      {paginated.length === 0
        ? <div style={{ textAlign:'center', padding:50, color:'#bbb', fontSize:13 }}>
            {students.length === 0 ? '📭 No students yet' : '🔍 No students match your filters'}
          </div>
        : <>
            <div style={{ overflowX:'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>#</th>
                    <th style={S.th}>Student</th>
                    <th style={S.th}>Batch</th>
                    <th style={S.th}>Total Fee</th>
                    <th style={S.th}>Paid</th>
                    <th style={S.th}>Balance</th>
                    <th style={S.th}>Progress</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s, i) => {
                    const total   = parseFloat(s.total_fee   || 0);
                    const paid    = parseFloat(s.paid_amount || 0);
                    const bal     = total - paid;
                    const pct     = total > 0 ? Math.min(100,(paid/total)*100) : 0;
                    const fs      = feeStatus(total, paid);
                    return (
                      <tr key={s.id}
                        onMouseEnter={e => e.currentTarget.style.background='#fafff9'}
                        onMouseLeave={e => e.currentTarget.style.background=''}>
                        <td style={{ ...S.td, color:'#bbb', fontSize:11 }}>{(page-1)*PAGE_SIZE+i+1}</td>
                        <td style={S.td}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{
                              width:30, height:30, borderRadius:'50%', flexShrink:0,
                              background:`linear-gradient(135deg,${G},#15c78a)`,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color:'#fff', fontSize:11, fontWeight:700,
                            }}>
                              {s.candidate_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:600, color:'#111', fontSize:12 }}>{s.candidate_name}</div>
                              <div style={{ fontSize:10, color:'#aaa' }}>{s.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td style={S.td}>
                          {s.batch_name
                            ? <span style={{ background:'#EFF6FF', color:'#185FA5', padding:'2px 8px', borderRadius:8, fontSize:11 }}>{s.batch_name}</span>
                            : <span style={{ color:'#ccc' }}>—</span>}
                        </td>
                        <td style={{ ...S.td, fontWeight:600 }}>{formatCurrency(total)}</td>
                        <td style={{ ...S.td, color:'#059669', fontWeight:600 }}>{formatCurrency(paid)}</td>
                        <td style={{ ...S.td, color: bal > 0 ? '#DC2626' : '#059669', fontWeight:700 }}>
                          {bal > 0 ? formatCurrency(bal) : '—'}
                        </td>
                        <td style={{ ...S.td, minWidth:120 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ flex:1, height:6, background:'#f0f0f0', borderRadius:4, overflow:'hidden' }}>
                              <div style={{ width:`${pct}%`, height:'100%', background: pct>=100 ? G : pct>0 ? '#D97706' : '#f0f0f0', borderRadius:4, transition:'width 0.5s' }} />
                            </div>
                            <span style={{ fontSize:10, color:'#aaa', minWidth:28 }}>{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={S.td}>
                          <span style={{ background:fs.bg, color:fs.color, fontSize:10, padding:'3px 9px', borderRadius:20, fontWeight:600 }}>
                            {fs.label}
                          </span>
                        </td>
                        <td style={S.td}>
                          <div style={{ display:'flex', gap:5 }}>
                            {bal > 0 && (
                              <button
                                onClick={() => { setShowPayment(s); setPayForm({ amount:'', payment_mode:'cash', reference_no:'', notes:'', payment_date: new Date().toISOString().split('T')[0] }); }}
                                style={{ fontSize:10, padding:'4px 9px', borderRadius:6, border:'none', background:G, color:'#fff', cursor:'pointer', fontWeight:600 }}>
                                💰 Record
                              </button>
                            )}
                            <button
                              onClick={() => openHistory(s)}
                              style={{ fontSize:10, padding:'4px 9px', borderRadius:6, border:'1px solid #bfdbfe', background:'#EFF6FF', color:'#185FA5', cursor:'pointer' }}>
                              📋 History
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:14 }}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  style={{ ...S.btnS, padding:'5px 12px', opacity:page===1?0.4:1 }}>‹</button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                  <button key={p} onClick={()=>setPage(p)}
                    style={{ ...S.btnS, padding:'5px 10px', minWidth:32,
                      background:p===page?G:'#fff', color:p===page?'#fff':'#333',
                      border:`1px solid ${p===page?G:'#ddd'}`, fontWeight:p===page?700:400 }}>{p}</button>
                ))}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  style={{ ...S.btnS, padding:'5px 12px', opacity:page===totalPages?0.4:1 }}>›</button>
              </div>
            )}
          </>
      }

      {/* ════════════════════════════════════════════════════
          RECORD PAYMENT MODAL
      ════════════════════════════════════════════════════ */}
      {showPayment && (
        <div style={S.modal} onClick={e => e.target===e.currentTarget && setShowPayment(null)}>
          <div style={S.modalBox}>
            <div style={{ fontSize:15, fontWeight:800, color:G, marginBottom:4 }}>💰 Record Payment</div>
            <div style={{ fontSize:11, color:'#888', marginBottom:18 }}>
              {showPayment.candidate_name} · {showPayment.phone}
            </div>

            {/* Student fee summary */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
              {[
                { label:'Total Fee',   value: formatCurrency(showPayment.total_fee),   color:'#111',    bg:'#f9f9f9' },
                { label:'Paid So Far', value: formatCurrency(showPayment.paid_amount), color:G,         bg:'#E1F5EE' },
                { label:'Balance Due', value: formatCurrency(parseFloat(showPayment.total_fee||0) - parseFloat(showPayment.paid_amount||0)), color:'#DC2626', bg:'#FCEBEB' },
              ].map((k, i) => (
                <div key={i} style={{ background:k.bg, borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                  <div style={{ fontSize:15, fontWeight:800, color:k.color }}>{k.value}</div>
                  <div style={{ fontSize:10, color:'#888', marginTop:2 }}>{k.label}</div>
                </div>
              ))}
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Amount (₹) *</label>
                <input style={S.inputFull} type="number" min="1"
                  value={payForm.amount} onChange={e=>setPay('amount',e.target.value)}
                  placeholder="Enter amount" autoFocus />
              </div>
              <div style={S.field}>
                <label style={S.label}>Payment Date</label>
                <input style={S.inputFull} type="date" value={payForm.payment_date} onChange={e=>setPay('payment_date',e.target.value)} />
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Payment Mode</label>
                <select style={S.select} value={payForm.payment_mode} onChange={e=>setPay('payment_mode',e.target.value)}>
                  {['cash','upi','bank_transfer','cheque','other'].map(m=>(
                    <option key={m} value={m}>{m.replace('_',' ')}</option>
                  ))}
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Reference No.</label>
                <input style={S.inputFull} value={payForm.reference_no} onChange={e=>setPay('reference_no',e.target.value)} placeholder="UPI ref / cheque no" />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Notes</label>
              <input style={S.inputFull} value={payForm.notes} onChange={e=>setPay('notes',e.target.value)} placeholder="Optional notes..." />
            </div>

            {payForm.amount && (
              <div style={{ background: remaining < 0 ? '#FCEBEB' : '#f0faf5',
                border:`1px solid ${remaining < 0 ? '#fecaca' : '#c3e6d8'}`,
                borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:12 }}>
                {remaining < 0
                  ? <span style={{ color:'#DC2626', fontWeight:600 }}>⚠️ Amount exceeds balance by {formatCurrency(Math.abs(remaining))}</span>
                  : <>
                      <span style={{ color:G, fontWeight:700 }}>After this payment: </span>
                      Balance will be <span style={{ fontWeight:700, color: remaining===0 ? G : '#D97706' }}>
                        {remaining === 0 ? '✅ Fully Paid!' : formatCurrency(remaining)}
                      </span>
                    </>
                }
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button style={{ ...S.btnP, opacity: remaining < 0 ? 0.5 : 1 }}
                onClick={handleRecordPayment} disabled={saving || remaining < 0}>
                {saving ? 'Saving…' : '✅ Confirm Payment'}
              </button>
              <button style={S.btnS} onClick={() => setShowPayment(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          FEE HISTORY MODAL
      ════════════════════════════════════════════════════ */}
      {showHistory && (
        <div style={S.modal} onClick={e => e.target===e.currentTarget && setShowHistory(null)}>
          <div style={{ ...S.modalBox, width:560 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:'#111' }}>📋 Payment History</div>
                <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{showHistory.candidate_name} · {showHistory.phone}</div>
              </div>
              <button onClick={() => setShowHistory(null)}
                style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#aaa' }}>✕</button>
            </div>

            {/* Fee summary */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
              {[
                { label:'Total Fee',   value: formatCurrency(showHistory.total_fee),   color:'#111',    bg:'#f9f9f9' },
                { label:'Total Paid',  value: formatCurrency(showHistory.paid_amount), color:G,         bg:'#E1F5EE' },
                { label:'Balance',     value: formatCurrency(parseFloat(showHistory.total_fee||0) - parseFloat(showHistory.paid_amount||0)), color:'#DC2626', bg:'#FCEBEB' },
              ].map((k, i) => (
                <div key={i} style={{ background:k.bg, borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                  <div style={{ fontSize:15, fontWeight:800, color:k.color }}>{k.value}</div>
                  <div style={{ fontSize:10, color:'#888', marginTop:2 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {loadingHist
              ? <div style={{ textAlign:'center', padding:30, color:'#aaa', fontSize:12 }}>Loading history…</div>
              : history.length === 0
                ? <div style={{ textAlign:'center', padding:30, color:'#bbb', fontSize:12 }}>No payments recorded yet</div>
                : <table style={{ ...S.table, fontSize:12 }}>
                    <thead>
                      <tr>
                        <th style={S.th}>#</th>
                        <th style={S.th}>Date</th>
                        <th style={S.th}>Amount</th>
                        <th style={S.th}>Mode</th>
                        <th style={S.th}>Reference</th>
                        <th style={S.th}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((p, i) => (
                        <tr key={i}>
                          <td style={{ ...S.td, color:'#bbb' }}>{i+1}</td>
                          <td style={S.td}>{p.payment_date?.split('T')[0] || '—'}</td>
                          <td style={{ ...S.td, color:G, fontWeight:700 }}>{formatCurrency(p.amount)}</td>
                          <td style={S.td}>
                            <span style={{ background:'#EFF6FF', color:'#185FA5', fontSize:10, padding:'2px 8px', borderRadius:8, fontWeight:500 }}>
                              {p.payment_mode?.replace('_',' ')}
                            </span>
                          </td>
                          <td style={{ ...S.td, fontSize:11 }}>{p.reference_no || '—'}</td>
                          <td style={{ ...S.td, fontSize:11, color:'#888' }}>{p.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            }
          </div>
        </div>
      )}
    </div>
  );
}