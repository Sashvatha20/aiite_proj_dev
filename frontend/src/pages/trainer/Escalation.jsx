import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';

const getEscalations = (params) => api.get('/escalations', { params });
const createEscalation = (data) => api.post('/escalations', data);
const updateEscalation = (id, data) => api.put(`/escalations/${id}`, data);
const getTrainers = () => api.get('/trainers');

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
  },
  tag: { fontSize: 9, background: '#E6F1FB', color: '#185FA5', padding: '2px 6px', borderRadius: 4 },
  tabs: { display: 'flex', borderBottom: '1px solid #eee', marginBottom: 14, gap: 8, flexWrap: 'wrap' },
  tab: { padding: '7px 14px', fontSize: 12, cursor: 'pointer', borderBottom: '2px solid transparent', color: '#888', background: 'transparent', border: 'none' },
  tabA: { borderBottomColor: G, color: G, fontWeight: 500 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 },
  field: { marginBottom: 10 },
  label: { fontSize: 11, color: '#666', display: 'block', marginBottom: 3 },
  input: { width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', fontFamily: 'inherit' },
  btnRow: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btn: { padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer' },
  btnP: { padding: '8px 16px', borderRadius: 8, border: 'none', background: G, color: '#fff', fontSize: 12, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #eee', fontSize: 11, color: '#888', fontWeight: 500 },
  td: { padding: '8px 10px', borderBottom: '1px solid #f5f5f5', color: '#333', verticalAlign: 'top' },
  actBtn: { fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', marginRight: 4 },
  badge: (c) => ({
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 10,
    background: c === 'green' ? '#E1F5EE' : c === 'orange' ? '#FEF3C7' : c === 'red' ? '#FCEBEB' : '#f0f0f0',
    color: c === 'green' ? '#0F6E56' : c === 'orange' ? '#92400E' : c === 'red' ? '#A32D2D' : '#666',
  }),
  waBox: { background: '#E1F5EE', border: '1px solid #9FE1CB', borderRadius: 8, padding: '12px 14px', fontSize: 11, color: '#0F6E56', marginTop: 10 },
  waBtn: { marginTop: 10, padding: '7px 16px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 12, marginBottom: 16 },
  kpi: { background: '#f9f9f9', borderRadius: 10, padding: '12px 14px', border: '1px solid #eee' },
  kpiNum: { fontSize: 22, fontWeight: 700, color: '#222', lineHeight: 1 },
  kpiLabel: { fontSize: 10, color: '#888', marginTop: 3 },
  warnBox: { background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#92400E', marginBottom: 12 },
  autoTag: { fontSize: 10, background: '#E1F5EE', color: '#0F6E56', padding: '4px 10px', borderRadius: 6, display: 'inline-block', marginTop: 2 },
};

const today = () => new Date().toISOString().split('T')[0];
const STATUSES = ['open', 'acknowledged', 'resolved'];
const statusColor = (s) => (s === 'resolved' ? 'green' : s === 'acknowledged' ? 'orange' : 'red');

export default function Escalation() {
  const [tab, setTab] = useState(0);
  const [escalations, setEscalations] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const currentUser = useMemo(() => {
    try {
      const token = localStorage.getItem('aiite_token') || '';
      if (!token || token.split('.').length < 2) return { name: 'You', trainerId: null };
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { name: payload.name || 'You', trainerId: payload.trainerId || null };
    } catch {
      return { name: 'You', trainerId: null };
    }
  }, []);

  const blank = {
    trainer_id: '',
    escalation_date: today(),
    description: '',
    no_of_count: 1,
    status: 'open',
  };

  const [form, setForm] = useState(blank);

  const loadEscalations = async () => {
    try {
      const r = await getEscalations();
      setEscalations(r.data.escalations || []);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to load escalations');
    }
  };

  useEffect(() => {
    loadEscalations();
    getTrainers()
      .then((r) => {
        const all = r.data.trainers || r.data || [];
        setTrainers(all.filter((t) => String(t.id) !== String(currentUser.trainerId)));
      })
      .catch(() => {});
  }, [currentUser.trainerId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedTrainer = trainers.find((t) => String(t.id) === String(form.trainer_id));

  const buildWA = () =>
    `⚠️ Escalation Report (${form.escalation_date})

Reported by: ${currentUser.name}
Reported against: ${selectedTrainer?.name || selectedTrainer?.trainer_name || '—'}
No. of incidents: ${form.no_of_count || 1}

Description:
${form.description || '—'}`.trim();

  const openWA = () => {
    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(buildWA())}`, '_blank');
    toast.success('WhatsApp opened — select contact manually');
  };

  const resetForm = () => {
    setForm(blank);
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.trainer_id) return toast.error('Please select who you are reporting against');
    if (!form.description.trim()) return toast.error('Please describe the escalation');

    setLoading(true);
    try {
      const payload = {
        trainer_id: form.trainer_id,
        escalation_date: form.escalation_date,
        description: form.description,
        no_of_count: Number(form.no_of_count) || 1,
        status: form.status,
      };

      if (editId) {
        await updateEscalation(editId, payload);
        toast.success('Escalation updated!');
      } else {
        await createEscalation(payload);
        toast.success('Escalation reported!');
      }

      resetForm();
      await loadEscalations();
      setTab(1);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setForm({
      trainer_id: row.trainer_id || '',
      escalation_date: row.escalation_date ? row.escalation_date.split('T')[0] : today(),
      description: row.description || '',
      no_of_count: row.no_of_count ?? 1,
      status: row.status || 'open',
    });
    setEditId(row.id);
    setTab(0);
  };

  const kpis = {
    total: escalations.length,
    open: escalations.filter((e) => e.status === 'open').length,
    acknowledged: escalations.filter((e) => e.status === 'acknowledged').length,
    resolved: escalations.filter((e) => e.status === 'resolved').length,
  };

  const filtered = escalations.filter((e) => (filterStatus ? e.status === filterStatus : true));

  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>
          <span>Escalations</span>
          <span style={S.tag}>→ Escalation Log</span>
        </div>

        <div style={S.tabs}>
          {['Report escalation', 'View all'].map((t, i) => (
            <button key={t} type="button" style={{ ...S.tab, ...(tab === i ? S.tabA : {}) }} onClick={() => setTab(i)}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            <div style={S.warnBox}>
              ⚠️ Use this to log any complaint, misconduct, or issue reported against a trainer or staff member. All records are visible to admin.
            </div>

            {editId && (
              <div style={{ background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#854F0B', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>✏️ Editing escalation record</span>
                <button type="button" style={S.actBtn} onClick={resetForm}>
                  ✕ Cancel
                </button>
              </div>
            )}

            <div style={{ background: '#f0faf6', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#0F6E56', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>👤 Reporting as:</span>
              <span style={S.autoTag}>{currentUser.name}</span>
              <span style={{ color: '#888', fontSize: 10 }}>(auto-filled from your login)</span>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Escalation date</label>
                <input style={S.input} type="date" value={form.escalation_date} onChange={(e) => set('escalation_date', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Reported against *</label>
                <select style={S.select} value={form.trainer_id} onChange={(e) => set('trainer_id', e.target.value)}>
                  <option value="">Select trainer / staff</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.trainer_name || `Trainer ${t.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>No. of incidents / count</label>
                <input style={S.input} type="number" min="1" value={form.no_of_count} onChange={(e) => set('no_of_count', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Current status</label>
                <select style={S.select} value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Description of escalation *</label>
              <textarea
                style={S.textarea}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe the issue clearly — what happened, when, who was involved, what action was taken..."
              />
            </div>

            {(form.description || form.trainer_id) && (
              <div style={S.waBox}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>📱 WhatsApp message preview:</div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontFamily: 'monospace', fontSize: 11 }}>{buildWA()}</div>
                <button type="button" style={S.waBtn} onClick={openWA}>
                  Open WhatsApp Web
                </button>
              </div>
            )}

            <div style={S.btnRow}>
              <button type="button" style={S.btnP} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editId ? '💾 Update escalation' : '⚠️ Submit escalation'}
              </button>
              <button type="button" style={S.btn} onClick={resetForm}>
                Clear
              </button>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={S.kpiGrid}>
              {[
                ['Total', kpis.total, ''],
                ['Open', kpis.open, 'red'],
                ['Acknowledged', kpis.acknowledged, 'orange'],
                ['Resolved', kpis.resolved, 'green'],
              ].map(([label, val, col]) => (
                <div key={label} style={S.kpi}>
                  <div style={{ ...S.kpiNum, color: col === 'red' ? '#A32D2D' : col === 'orange' ? '#92400E' : col === 'green' ? '#0F6E56' : '#222' }}>
                    {val}
                  </div>
                  <div style={S.kpiLabel}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ ...S.label, marginBottom: 0 }}>Filter:</label>
              <select style={{ ...S.select, maxWidth: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#aaa', fontSize: 12 }}>No escalations found</div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Reported by</th>
                    <th style={S.th}>Reported against</th>
                    <th style={S.th}>Incidents</th>
                    <th style={S.th}>Description</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id}>
                      <td style={S.td}>{e.escalation_date ? e.escalation_date.split('T')[0] : '—'}</td>
                      <td style={S.td}>{e.reported_by || '—'}</td>
                      <td style={S.td}>{e.trainer_name || '—'}</td>
                      <td style={S.td}>{e.no_of_count ?? '—'}</td>
                      <td style={{ ...S.td, maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                          {e.description || '—'}
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={S.badge(statusColor(e.status))}>{e.status}</span>
                      </td>
                      <td style={S.td}>
                        <button type="button" style={S.actBtn} onClick={() => handleEdit(e)}>
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