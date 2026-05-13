import { useState, useEffect } from 'react';
import { getStudents } from '../../api/students';
import { getBatches } from '../../api/batches';
import {
  getPlacements,
  createPlacement,
  updatePlacement,
  syncPlacementsSheet,
} from '../../api/placements';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const S = {
  card: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16 },
  title: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  tag: { fontSize: 9, background: '#E6F1FB', color: '#185FA5', padding: '2px 6px', borderRadius: 4 },
  tabs: { display: 'flex', borderBottom: '1px solid #eee', marginBottom: 14, gap: 8, flexWrap: 'wrap' },
  tab: {
    padding: '7px 14px',
    fontSize: 12,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    color: '#888',
    background: 'transparent',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
  },
  tabA: { borderBottomColor: G, color: G, fontWeight: 500 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 },
  field: { marginBottom: 10 },
  label: { fontSize: 11, color: '#666', display: 'block', marginBottom: 3 },
  input: {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 12,
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
  },
  btnRow: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #ddd',
    background: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  btnP: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: G,
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  btnSync: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#185FA5',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: '1px solid #eee',
    fontSize: 11,
    color: '#888',
    fontWeight: 500,
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid #f5f5f5',
    color: '#333',
    verticalAlign: 'top',
  },
  actBtn: {
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 6,
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    marginRight: 4,
  },
  badge: (c) => ({
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 10,
    background:
      c === 'green'
        ? '#E1F5EE'
        : c === 'blue'
        ? '#E6F1FB'
        : c === 'orange'
        ? '#FEF3C7'
        : c === 'red'
        ? '#FCEBEB'
        : c === 'purple'
        ? '#F3E8FF'
        : '#f0f0f0',
    color:
      c === 'green'
        ? '#0F6E56'
        : c === 'blue'
        ? '#185FA5'
        : c === 'orange'
        ? '#92400E'
        : c === 'red'
        ? '#A32D2D'
        : c === 'purple'
        ? '#6D28D9'
        : '#666',
  }),
  toggleRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  toggle: (on) => ({
    width: 36,
    height: 20,
    borderRadius: 10,
    background: on ? G : '#ddd',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background .2s',
    flexShrink: 0,
    border: 'none',
  }),
  thumb: (on) => ({
    position: 'absolute',
    top: 2,
    left: on ? 18 : 2,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#fff',
    transition: 'left .2s',
  }),
  waBox: {
    background: '#E1F5EE',
    border: '1px solid #9FE1CB',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 11,
    color: '#0F6E56',
    marginTop: 10,
  },
  waBtn: {
    marginTop: 10,
    padding: '7px 16px',
    background: '#25D366',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 12,
    cursor: 'pointer',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: G,
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
    marginRight: 6,
    flexShrink: 0,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))',
    gap: 12,
    marginBottom: 16,
  },
  kpi: { background: '#f9f9f9', borderRadius: 10, padding: '12px 14px', border: '1px solid #eee' },
  kpiNum: { fontSize: 22, fontWeight: 700, color: '#222', lineHeight: 1 },
  kpiLabel: { fontSize: 10, color: '#888', marginTop: 3 },
};

const today = () => new Date().toISOString().split('T')[0];
const PLACED_STATUSES = ['in_process', 'offer_pending', 'placed', 'rejected'];
const statusColor = (s) =>
  s === 'placed' ? 'green' : s === 'offer_pending' ? 'orange' : s === 'rejected' ? 'red' : s === 'in_process' ? 'blue' : '';

export default function Placement() {
  const [tab, setTab] = useState(0);
  const [batches, setBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [formStudents, setFormStudents] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [formBatch, setFormBatch] = useState('');

  const blank = {
    student_id: '',
    company_name: '',
    role_offered: '',
    placed_as: '',
    package_lpa: '',
    cooperation_mode: false,
    rounds_cleared: 0,
    placed_status: 'in_process',
    placed_date: '',
    wa_sent: false,
  };

  const [form, setForm] = useState(blank);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (formBatch) {
      getStudents({ batch_id: formBatch }).then((r) => setFormStudents(r.data.students || []));
    } else {
      setFormStudents(allStudents);
    }
  }, [formBatch, allStudents]);

  const loadInitial = async () => {
    try {
      const [bRes, sRes, pRes] = await Promise.all([getBatches(), getStudents(), getPlacements()]);
      setBatches(bRes.data.batches || []);
      setAllStudents(sRes.data.students || []);
      setFormStudents(sRes.data.students || []);
      setPlacements(pRes.data.placements || []);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to load data');
    }
  };

  const loadPlacements = async () => {
    try {
      const r = await getPlacements();
      setPlacements(r.data.placements || []);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to load placements');
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const kpis = {
    total: placements.length,
    placed: placements.filter((p) => p.placed_status === 'placed').length,
    offer_pending: placements.filter((p) => p.placed_status === 'offer_pending').length,
    in_process: placements.filter((p) => p.placed_status === 'in_process').length,
  };

  const buildWA = () => {
    const student = allStudents.find((s) => String(s.id) === String(form.student_id));
    return `🎉 Placement Update (${form.placed_date || today()})

Student: ${student?.candidate_name || '—'}
${student?.phone ? 'Phone: ' + student.phone : ''}
${student?.batch_name ? 'Batch: ' + student.batch_name : ''}

Company: ${form.company_name || '—'}
Role offered: ${form.role_offered || '—'}
Placed as: ${form.placed_as || '—'}
Package: ${form.package_lpa ? form.package_lpa + ' LPA' : '—'}
Rounds cleared: ${form.rounds_cleared || 0}
Cooperation mode: ${form.cooperation_mode ? '✅ Yes' : '❌ No'}
Status: ${form.placed_status?.replace(/_/g, ' ')}`.trim();
  };

  const openWA = () => {
    const student = allStudents.find((s) => String(s.id) === String(form.student_id));
    const phone = (student?.whatsapp_number || student?.phone || '').replace(/\D/g, '');
    const url = phone
      ? `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(buildWA())}`
      : `https://web.whatsapp.com/send?text=${encodeURIComponent(buildWA())}`;
    window.open(url, '_blank');
    set('wa_sent', true);
    toast.success('WhatsApp opened — select contact manually');
  };

  const showWAPreview = form.student_id && (form.company_name || form.role_offered || form.placed_status);

  const handleSubmit = async () => {
    if (!form.student_id) return toast.error('Please select a student');
    if (!form.company_name) return toast.error('Company name is required');

    setLoading(true);
    try {
      const payload = {
        ...form,
        rounds_cleared: parseInt(form.rounds_cleared, 10) || 0,
        package_lpa: form.package_lpa === '' ? null : parseFloat(form.package_lpa),
      };

      if (editId) {
        await updatePlacement(editId, payload);
        toast.success('Placement updated!');
      } else {
        await createPlacement(payload);
        toast.success('Placement logged! 🎉');
      }

      setForm(blank);
      setEditId(null);
      await loadPlacements();
      setTab(1);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setForm({
      student_id: p.student_id || '',
      company_name: p.company_name || '',
      role_offered: p.role_offered || '',
      placed_as: p.placed_as || '',
      package_lpa: p.package_lpa ?? '',
      cooperation_mode: !!p.cooperation_mode,
      rounds_cleared: p.rounds_cleared ?? 0,
      placed_status: p.placed_status || 'in_process',
      placed_date: p.placed_date?.split('T')[0] || '',
      wa_sent: !!p.wa_sent,
    });
    setEditId(p.id);
    setTab(0);
  };

  const handleSyncPlacements = async () => {
    try {
      setSyncing(true);
      const res = await syncPlacementsSheet();
      if (res?.data?.success) {
        toast.success(res?.data?.message || `Synced ${res?.data?.count || 0} rows`);
      } else {
        toast.error(res?.data?.error || 'Placements sheet sync failed');
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to sync placements sheet');
    } finally {
      setSyncing(false);
    }
  };

  const filtered = placements.filter((p) => (filterStatus ? p.placed_status === filterStatus : true));

  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>
          <span>Placement tracker</span>
          <span style={S.tag}>→ Placement Sheet</span>
        </div>

        <div style={S.tabs}>
          {['Log placement', 'View all'].map((t, i) => (
            <button
              key={t}
              type="button"
              style={{ ...S.tab, ...(tab === i ? S.tabA : {}) }}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
          <button type="button" style={S.btnSync} onClick={handleSyncPlacements} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Placements Sheet'}
          </button>
        </div>

        {tab === 0 && (
          <div>
            {editId && (
              <div
                style={{
                  background: '#FAEEDA',
                  border: '1px solid #FAC775',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 11,
                  color: '#854F0B',
                  marginBottom: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>✏️ Editing placement record</span>
                <button
                  type="button"
                  style={S.actBtn}
                  onClick={() => {
                    setForm(blank);
                    setEditId(null);
                  }}
                >
                  ✕ Cancel
                </button>
              </div>
            )}

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Filter by batch (to find student faster)</label>
                <select style={S.select} value={formBatch} onChange={(e) => setFormBatch(e.target.value)}>
                  <option value="">All batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_name} — {b.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Student *</label>
                <select style={S.select} value={form.student_id} onChange={(e) => set('student_id', e.target.value)}>
                  <option value="">Select student</option>
                  {formStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.candidate_name}
                      {s.phone ? ` (${s.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Company name *</label>
                <input
                  style={S.input}
                  value={form.company_name}
                  onChange={(e) => set('company_name', e.target.value)}
                  placeholder="e.g. TCS, Infosys, Zoho..."
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Role offered</label>
                <input
                  style={S.input}
                  value={form.role_offered}
                  onChange={(e) => set('role_offered', e.target.value)}
                  placeholder="e.g. Software Engineer, QA Analyst..."
                />
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Placed as (designation)</label>
                <input
                  style={S.input}
                  value={form.placed_as}
                  onChange={(e) => set('placed_as', e.target.value)}
                  placeholder="e.g. Trainee, Junior Dev..."
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Package (LPA)</label>
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.package_lpa}
                  onChange={(e) => set('package_lpa', e.target.value)}
                  placeholder="e.g. 4.5"
                />
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Rounds cleared</label>
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  value={form.rounds_cleared}
                  onChange={(e) => set('rounds_cleared', e.target.value)}
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Placement status</label>
                <select style={S.select} value={form.placed_status} onChange={(e) => set('placed_status', e.target.value)}>
                  {PLACED_STATUSES.map((p) => (
                    <option key={p} value={p}>
                      {p.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(form.placed_status === 'placed' || form.placed_status === 'offer_pending') && (
              <div style={S.field}>
                <label style={S.label}>{form.placed_status === 'placed' ? 'Placed date' : 'Offer date'}</label>
                <input style={S.input} type="date" value={form.placed_date} onChange={(e) => set('placed_date', e.target.value)} />
              </div>
            )}

            <div style={S.toggleRow}>
              <button
                type="button"
                style={S.toggle(form.cooperation_mode)}
                onClick={() => set('cooperation_mode', !form.cooperation_mode)}
                aria-label="Toggle cooperation mode"
              >
                <div style={S.thumb(form.cooperation_mode)} />
              </button>
              <span style={{ fontSize: 12, color: form.cooperation_mode ? G : '#888' }}>
                {form.cooperation_mode ? '✅ Cooperation mode (company is a tie-up)' : 'Not a cooperation placement'}
              </span>
            </div>

            {showWAPreview && (
              <div style={S.waBox}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>📱 WhatsApp message preview:</div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontFamily: 'monospace', fontSize: 11 }}>
                  {buildWA()}
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: '#0F6E56' }}>
                  {allStudents.find((s) => String(s.id) === String(form.student_id))?.phone
                    ? '📞 Student phone number will be auto-filled in WhatsApp'
                    : '💬 No phone saved — select contact manually'}
                </div>
                <button style={S.waBtn} onClick={openWA}>
                  {form.placed_status === 'placed'
                    ? '🎉 Share placement news on WhatsApp'
                    : 'Open WhatsApp Web → select contact manually'}
                </button>
                {form.wa_sent && (
                  <span style={{ marginLeft: 10, fontSize: 10, color: '#0F6E56', fontWeight: 500 }}>✓ Sent</span>
                )}
              </div>
            )}

            <div style={S.btnRow}>
              <button type="button" style={S.btnP} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editId ? 'Update placement' : 'Log placement'}
              </button>
              <button
                type="button"
                style={S.btn}
                onClick={() => {
                  setForm(blank);
                  setEditId(null);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={S.kpiGrid}>
              {[
                { num: kpis.total, label: 'Total records', accent: '#222' },
                { num: kpis.placed, label: '✅ Placed', accent: G },
                { num: kpis.offer_pending, label: '🟡 Offer pending', accent: '#D97706' },
                { num: kpis.in_process, label: '🔵 In process', accent: '#185FA5' },
              ].map((k, i) => (
                <div key={i} style={S.kpi}>
                  <div style={{ ...S.kpiNum, color: k.accent }}>{k.num}</div>
                  <div style={S.kpiLabel}>{k.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <select style={{ ...S.select, maxWidth: 180 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                {PLACED_STATUSES.map((p) => (
                  <option key={p} value={p}>
                    {p.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 11, color: '#888', alignSelf: 'center' }}>
                {filtered.length} record{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa', fontSize: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
                No placement records found
              </div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Student</th>
                    <th style={S.th}>Company</th>
                    <th style={S.th}>Role</th>
                    <th style={S.th}>Placed as</th>
                    <th style={S.th}>Package</th>
                    <th style={S.th}>Rounds</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Coop</th>
                    <th style={S.th}>WA</th>
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={S.avatar}>{p.candidate_name?.[0]?.toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{p.candidate_name || '—'}</div>
                            <div style={{ fontSize: 10, color: '#888' }}>{p.batch_name || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td style={S.td}>
                        <strong>{p.company_name || '—'}</strong>
                      </td>
                      <td style={S.td}>{p.role_offered || '—'}</td>
                      <td style={S.td}>{p.placed_as || '—'}</td>
                      <td style={S.td}>{p.package_lpa ? `${p.package_lpa} LPA` : '—'}</td>
                      <td style={S.td}>{p.rounds_cleared ?? '—'}</td>
                      <td style={S.td}>
                        <span style={S.badge(statusColor(p.placed_status))}>{p.placed_status?.replace(/_/g, ' ')}</span>
                      </td>
                      <td style={S.td}>{p.placed_date?.split('T')[0] || '—'}</td>
                      <td style={S.td}>
                        <span style={S.badge(p.cooperation_mode ? 'green' : '')}>{p.cooperation_mode ? 'Yes' : 'No'}</span>
                      </td>
                      <td style={S.td}>
                        <span style={S.badge(p.wa_sent ? 'green' : '')}>{p.wa_sent ? 'Sent' : '—'}</span>
                      </td>
                      <td style={S.td}>
                        <button type="button" style={S.actBtn} onClick={() => handleEdit(p)}>
                          ✎ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}