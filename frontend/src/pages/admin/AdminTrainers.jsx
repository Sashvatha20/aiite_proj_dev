import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const S = {
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 12,
    outline: 'none',
    background: '#fff'
  },
  inputFull: {
    width: '100%',
    padding: '8px 11px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box'
  },
  label: {
    fontSize: 11,
    color: '#666',
    display: 'block',
    marginBottom: 4,
    fontWeight: 500
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 12
  },
  field: {
    marginBottom: 12
  },
  btnP: {
    padding: '9px 20px',
    borderRadius: 9,
    border: 'none',
    background: G,
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer'
  },
  btnS: {
    padding: '9px 16px',
    borderRadius: 9,
    border: '1px solid #ddd',
    background: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    color: '#333'
  },
  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalBox: {
    background: '#fff',
    borderRadius: 16,
    padding: 28,
    width: 520,
    maxWidth: '95vw',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
  },
  panel: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1000
  },
  panelBox: {
    background: '#fff',
    width: 480,
    maxWidth: '95vw',
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
    padding: 28
  }
};

const COLORS = ['#1D9E75', '#185FA5', '#7C3AED', '#D97706', '#0891B2', '#DC2626', '#059669', '#6B7280'];

const BLANK_ADD = {
  name: '',
  phone: '',
  username: '',
  password: ''
};

const BLANK_EDIT = {
  id: '',
  name: '',
  phone: '',
  username: '',
  password: '',
  is_active: 1
};

export default function AdminTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [escalationFilter, setEscalationFilter] = useState('all');

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_ADD);
  const [saving, setSaving] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(BLANK_EDIT);
  const [updating, setUpdating] = useState(false);

  const [detail, setDetail] = useState(null);
  const [logs, setLogs] = useState([]);
  const [escals, setEscals] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const setAdd = (k, v) => setAddForm(prev => ({ ...prev, [k]: v }));
  const setEdit = (k, v) => setEditForm(prev => ({ ...prev, [k]: v }));

  const normalizeTrainer = (trainer) => ({
    ...trainer,
    work_logs: Number(trainer.work_logs || 0),
    total_hours: Number(trainer.total_hours || 0),
    star_points: Number(trainer.star_points || 0),
    open_escalations: Number(trainer.open_escalations || 0),
    is_active: Number(trainer.is_active) ? 1 : 0
  });

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/trainers', { params: { month, year } });
      const next = (r.data.trainers || []).map(normalizeTrainer);
      setTrainers(next);

      if (detail?.id) {
        const fresh = next.find(t => t.id === detail.id);
        if (fresh) setDetail(fresh);
      }
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Failed to load trainers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month, year]);

  const loadTrainerDetailData = async (trainer) => {
    setDetailLoading(true);
    setLogs([]);
    setEscals([]);

    try {
      const [l, e] = await Promise.all([
        api.get('/worklog', { params: { trainer_id: trainer.id, month, year } }),
        api.get('/escalations', { params: { trainer_id: trainer.id, month, year } })
      ]);

      setLogs(l.data.logs || []);
      setEscals(e.data.escalations || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load trainer details');
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = async (trainer) => {
    setDetail(trainer);
    await loadTrainerDetailData(trainer);
  };

  useEffect(() => {
    if (detail?.id) {
      loadTrainerDetailData(detail);
    }
  }, [month, year]);

  const handleCreate = async () => {
    if (!addForm.name.trim()) return toast.error('Name is required');
    if (!addForm.phone.trim()) return toast.error('Phone is required');
    if (!addForm.username.trim()) return toast.error('Username is required');
    if (!addForm.password.trim()) return toast.error('Password is required');

    setSaving(true);
    try {
      await api.post('/trainers', addForm);
      toast.success(`${addForm.name} added as trainer`);
      setShowAdd(false);
      setAddForm(BLANK_ADD);
      await load();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Failed to add trainer');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    if (!detail) return;
    setEditForm({
      id: detail.id,
      name: detail.name || '',
      phone: detail.phone || '',
      username: detail.username || '',
      password: '',
      is_active: Number(detail.is_active) ? 1 : 0
    });
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    if (!editForm.name.trim()) return toast.error('Name is required');
    if (!editForm.phone.trim()) return toast.error('Phone is required');
    if (!editForm.username.trim()) return toast.error('Username is required');

    setUpdating(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        username: editForm.username.trim(),
        is_active: Number(editForm.is_active) ? 1 : 0
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const r = await api.put(`/trainers/${editForm.id}`, payload);
      const updatedTrainer = normalizeTrainer(r.data.trainer || { ...detail, ...payload });

      setTrainers(prev => prev.map(t => (t.id === updatedTrainer.id ? { ...t, ...updatedTrainer } : t)));
      setDetail(prev => (prev && prev.id === updatedTrainer.id ? { ...prev, ...updatedTrainer } : prev));
      setShowEdit(false);
      setEditForm(BLANK_EDIT);
      toast.success('Trainer updated successfully');
      await load();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Failed to update trainer');
    } finally {
      setUpdating(false);
    }
  };

  const toggleActive = async (trainer) => {
    const nextStatus = Number(trainer.is_active) ? 0 : 1;
    setTogglingId(trainer.id);

    try {
      await api.put(`/trainers/${trainer.id}`, { is_active: nextStatus });

      setTrainers(prev =>
        prev.map(item => (
          item.id === trainer.id
            ? { ...item, is_active: nextStatus }
            : item
        ))
      );

      setDetail(prev =>
        prev && prev.id === trainer.id
          ? { ...prev, is_active: nextStatus }
          : prev
      );

      if (showEdit && editForm.id === trainer.id) {
        setEditForm(prev => ({ ...prev, is_active: nextStatus }));
      }

      toast.success(`${trainer.name} ${nextStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Failed to update trainer status');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = useMemo(() => {
    return trainers.filter(t => {
      const matchesSearch =
        !search ||
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.phone?.includes(search) ||
        t.username?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && Number(t.is_active) === 1) ||
        (statusFilter === 'inactive' && Number(t.is_active) === 0);

      const matchesEscalation =
        escalationFilter === 'all' ||
        (escalationFilter === 'with_open' && Number(t.open_escalations) > 0) ||
        (escalationFilter === 'without_open' && Number(t.open_escalations) === 0);

      return matchesSearch && matchesStatus && matchesEscalation;
    });
  }, [trainers, search, statusFilter, escalationFilter]);

  const maxPoints = Math.max(...trainers.map(t => Number(t.star_points || 0)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>Trainers</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {filtered.length} of {trainers.length} trainers · {MONTHS[month - 1]} {year}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select style={S.input} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>

            <select style={S.input} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setShowAdd(true);
                setAddForm(BLANK_ADD);
              }}
              style={S.btnP}
            >
              Add Trainer
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <input
            style={{ ...S.input, minWidth: 220 }}
            placeholder="Search trainer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select style={S.input} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select style={S.input} value={escalationFilter} onChange={e => setEscalationFilter(e.target.value)}>
            <option value="all">All Escalations</option>
            <option value="with_open">With Open Escalation</option>
            <option value="without_open">Without Open Escalation</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#aaa' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 12 }}>
            No trainers found
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
            {filtered.map((t, i) => {
              const color = COLORS[i % COLORS.length];
              const points = Number(t.star_points || 0);
              const hours = Number(t.total_hours || 0);
              const pct = Math.max(0, Math.min(100, Math.round((points / maxPoints) * 100)));

              return (
                <div
                  key={t.id}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    border: '1.5px solid #f0f0f0',
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.boxShadow = `0 4px 20px ${color}22`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#f0f0f0';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  }}
                  onClick={() => openDetail(t)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: `linear-gradient(135deg,${color},${color}aa)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 16,
                          fontWeight: 800
                        }}
                      >
                        {t.name?.[0]?.toUpperCase() || 'T'}
                      </div>

                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{t.name}</div>
                        <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>{t.phone}</div>
                        <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>@{t.username}</div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 9,
                        padding: '2px 8px',
                        borderRadius: 20,
                        fontWeight: 700,
                        background: Number(t.is_active) ? '#E1F5EE' : '#f0f0f0',
                        color: Number(t.is_active) ? G : '#888'
                      }}
                    >
                      {Number(t.is_active) ? '● Active' : '○ Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Logs', value: t.work_logs || 0, color: '#111' },
                      { label: 'Hours', value: `${hours.toFixed(1)}h`, color: '#185FA5' },
                      { label: 'Pts', value: points.toFixed(1), color: '#D97706' }
                    ].map((s, j) => (
                      <div
                        key={j}
                        style={{
                          background: '#f9f9f9',
                          borderRadius: 8,
                          padding: '7px 8px',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 9, color: '#aaa', marginTop: 1 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#aaa', marginBottom: 4 }}>
                      <span>Performance</span>
                      <span>{pct}%</span>
                    </div>
                    <div style={{ height: 5, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: 4,
                          background: `linear-gradient(90deg,${color},${color}99)`,
                          transition: 'width 0.5s'
                        }}
                      />
                    </div>
                  </div>

                  {Number(t.open_escalations) > 0 && (
                    <div
                      style={{
                        marginTop: 10,
                        background: '#FCEBEB',
                        borderRadius: 8,
                        padding: '5px 8px',
                        fontSize: 10,
                        color: '#DC2626',
                        fontWeight: 600,
                        textAlign: 'center'
                      }}
                    >
                      {t.open_escalations} open escalation{Number(t.open_escalations) > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={S.modalBox}>
            <div style={{ fontSize: 15, fontWeight: 800, color: G, marginBottom: 4 }}>Add New Trainer</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>Create trainer account</div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Full Name *</label>
                <input
                  style={S.inputFull}
                  value={addForm.name}
                  onChange={e => setAdd('name', e.target.value)}
                  autoFocus
                  placeholder="Trainer name"
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Phone *</label>
                <input
                  style={S.inputFull}
                  value={addForm.phone}
                  onChange={e => setAdd('phone', e.target.value)}
                  placeholder="Mobile number"
                />
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Username *</label>
                <input
                  style={S.inputFull}
                  value={addForm.username}
                  onChange={e => setAdd('username', e.target.value)}
                  placeholder="Login username"
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Password *</label>
                <input
                  style={S.inputFull}
                  type="password"
                  value={addForm.password}
                  onChange={e => setAdd('password', e.target.value)}
                  placeholder="Initial password"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={S.btnP} onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Add Trainer'}
              </button>
              <button style={S.btnS} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
          <div style={S.modalBox}>
            <div style={{ fontSize: 15, fontWeight: 800, color: G, marginBottom: 4 }}>Edit Trainer</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>Update trainer details</div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Full Name *</label>
                <input
                  style={S.inputFull}
                  value={editForm.name}
                  onChange={e => setEdit('name', e.target.value)}
                  placeholder="Trainer name"
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Phone *</label>
                <input
                  style={S.inputFull}
                  value={editForm.phone}
                  onChange={e => setEdit('phone', e.target.value)}
                  placeholder="Mobile number"
                />
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Username *</label>
                <input
                  style={S.inputFull}
                  value={editForm.username}
                  onChange={e => setEdit('username', e.target.value)}
                  placeholder="Login username"
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>New Password</label>
                <input
                  style={S.inputFull}
                  type="password"
                  value={editForm.password}
                  onChange={e => setEdit('password', e.target.value)}
                  placeholder="Leave blank to keep same password"
                />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Status</label>
              <select
                style={S.inputFull}
                value={String(editForm.is_active)}
                onChange={e => setEdit('is_active', Number(e.target.value))}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={S.btnP} onClick={handleUpdate} disabled={updating}>
                {updating ? 'Updating...' : 'Save Changes'}
              </button>
              <button style={S.btnS} onClick={() => setShowEdit(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div style={S.panel} onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div style={S.panelBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg,${G},#15c78a)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 800,
                    flexShrink: 0
                  }}
                >
                  {detail.name?.[0]?.toUpperCase() || 'T'}
                </div>

                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{detail.name}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                    {detail.phone} · @{detail.username}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDetail(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Work Logs', value: detail.work_logs || 0, bg: '#E1F5EE', color: G },
                { label: 'Hours', value: `${Number(detail.total_hours || 0).toFixed(1)}h`, bg: '#EFF6FF', color: '#185FA5' },
                { label: 'Points', value: Number(detail.star_points || 0).toFixed(1), bg: '#FEF3C7', color: '#D97706' }
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <button
                onClick={openEditModal}
                style={{ ...S.btnS, fontSize: 11 }}
              >
                Edit
              </button>

              <button
                onClick={() => toggleActive(detail)}
                disabled={togglingId === detail.id}
                style={{
                  ...S.btnS,
                  fontSize: 11,
                  color: Number(detail.is_active) ? '#DC2626' : G,
                  borderColor: Number(detail.is_active) ? '#fecaca' : '#bbf7d0',
                  opacity: togglingId === detail.id ? 0.6 : 1
                }}
              >
                {togglingId === detail.id
                  ? 'Updating...'
                  : Number(detail.is_active)
                    ? 'Deactivate'
                    : 'Activate'}
              </button>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#111', marginBottom: 10 }}>
              Work Logs — {MONTHS[month - 1]} {year} ({logs.length})
            </div>

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#bbb', fontSize: 12, marginBottom: 16 }}>
                Loading details...
              </div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#bbb', fontSize: 12, marginBottom: 16 }}>
                No logs this month
              </div>
            ) : (
              <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}>
                {logs.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid #f5f5f5',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 8
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#444',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {l.work_description}
                      </div>
                      <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                        {l.log_date?.split('T')[0]} · {l.batch_name || 'No batch'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: '#185FA5', fontWeight: 600 }}>
                        {Number(l.progressive_working_hours || 0).toFixed(1)}h
                      </div>
                      <div style={{ fontSize: 10, color: '#D97706', fontWeight: 700 }}>
                        {Number(l.star_points || 0).toFixed(1)} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, color: '#111', marginBottom: 10 }}>
              Escalations — {MONTHS[month - 1]} {year} ({escals.length})
            </div>

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: 16, color: '#bbb', fontSize: 12 }}>
                Loading escalations...
              </div>
            ) : escals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 16, color: '#bbb', fontSize: 12 }}>
                No escalations
              </div>
            ) : (
              escals.map((e) => (
                <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#555' }}>{e.description}</span>
                    <span
                      style={{
                        fontSize: 9,
                        padding: '2px 7px',
                        borderRadius: 20,
                        fontWeight: 600,
                        flexShrink: 0,
                        background: e.status === 'open' ? '#FCEBEB' : e.status === 'acknowledged' ? '#FEF3C7' : '#E1F5EE',
                        color: e.status === 'open' ? '#A32D2D' : e.status === 'acknowledged' ? '#92400E' : G
                      }}
                    >
                      {e.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>
                    {e.escalation_date?.split('T')[0]}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}