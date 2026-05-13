import { useState, useEffect } from 'react';
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  syncBatchesSheet,
  syncBatchProgressSheet,
  getBatchProgress,
  addProgress,
  updateProgress,
} from '../../api/batches';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const PAGE_SIZE = 15;
const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];
const WEEKDAY_WEEKEND = ['weekday', 'weekend', 'both'];
const SESSION_TYPES = ['regular', 'crash', 'recorded'];
const PHASES = ['phase_1', 'phase_2', 'phase_3', 'project', 'completed'];

const statusStyle = (s) =>
  ({
    ongoing: { bg: '#E1F5EE', color: '#0F6E56' },
    completed: { bg: '#EFF6FF', color: '#185FA5' },
    upcoming: { bg: '#FEF3C7', color: '#92400E' },
    cancelled: { bg: '#FCEBEB', color: '#A32D2D' },
  }[s] || { bg: '#f0f0f0', color: '#888' });

const S = {
  card: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: {
    textAlign: 'left',
    padding: '9px 12px',
    borderBottom: '2px solid #f0f0f0',
    fontSize: 11,
    color: '#888',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  td: { padding: '10px 12px', borderBottom: '1px solid #f5f5f5', color: '#333', verticalAlign: 'middle' },
  input: { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' },

  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
  },
  modalBox: {
    background: '#fff',
    borderRadius: 16,
    padding: 28,
    width: 640,
    maxWidth: '94vw',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    position: 'relative',
    zIndex: 3001,
  },

  label: { fontSize: 11, color: '#666', display: 'block', marginBottom: 4, fontWeight: 500 },
  inputFull: { width: '100%', padding: '8px 11px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 11px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', boxSizing: 'border-box' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 },
  field: { marginBottom: 12 },
  btnP: { padding: '9px 20px', borderRadius: 9, border: 'none', background: G, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnS: { padding: '9px 16px', borderRadius: 9, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer' },
  btnDanger: { padding: '9px 16px', borderRadius: 9, border: '1px solid #fecaca', background: '#fff', color: '#DC2626', fontSize: 12, cursor: 'pointer' },

  detailBox: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 2000,
  },
  detailPanel: {
    background: '#fff',
    width: 520,
    maxWidth: '95vw',
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
    padding: 28,
    position: 'relative',
    zIndex: 2001,
  },
};

const BLANK = {
  batch_name: '',
  course_id: '',
  batch_start_date: '',
  batch_end_date: '',
  weekday_weekend: 'weekday',
  session_type: 'regular',
  timing: '',
  status: 'upcoming',
  trainer_ids: [],
};

const BLANK_PROGRESS = {
  progress_date: '',
  last_topic_covered: '',
  session_hours: '',
  phase: 'phase_1',
  phase_completion_date: '',
  next_phase_start_date: '',
  remarks: '',
};

export default function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filterTrainer, setFilterTrainer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [syncingProgressSheet, setSyncingProgressSheet] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);

  const [detail, setDetail] = useState(null);
  const [detailStudents, setDetailStudents] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [progressList, setProgressList] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressForm, setProgressForm] = useState(BLANK_PROGRESS);
  const [savingProgress, setSavingProgress] = useState(false);
  const [editingProgressId, setEditingProgressId] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setProgress = (k, v) => setProgressForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    load();
    api.get('/trainers/active').then((r) => setTrainers(r.data.trainers || []));
    api.get('/trainers/courses').then((r) => setCourses(r.data.courses || []));
  }, []);

  const load = () => getBatches().then((r) => setBatches(r.data.batches || []));

  const loadProgress = async (batchId) => {
    try {
      setLoadingProgress(true);
      const r = await getBatchProgress(batchId);
      setProgressList(r.data.progress || []);
    } catch {
      setProgressList([]);
      toast.error('Failed to load batch progress');
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleSyncBatchesSheet = async () => {
    try {
      setSyncingSheet(true);
      const res = await syncBatchesSheet();
      if (res?.data?.success) {
        toast.success(res?.data?.message || `Batches sheet synced (${res?.data?.count || 0} rows)`);
      } else {
        toast.error(res?.data?.error || 'Batches sheet sync failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to sync Batches sheet');
    } finally {
      setSyncingSheet(false);
    }
  };

  const handleSyncBatchProgressSheet = async () => {
    try {
      setSyncingProgressSheet(true);
      const res = await syncBatchProgressSheet();

      if (res?.data?.success) {
        toast.success(res?.data?.message || `Batch Progress sheet synced (${res?.data?.count || 0} rows)`);
        if (detail?.id) {
          await loadProgress(detail.id);
        }
        await load();
      } else {
        toast.error(res?.data?.error || 'Batch Progress sheet sync failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to sync Batch Progress sheet');
    } finally {
      setSyncingProgressSheet(false);
    }
  };

  const openAdd = () => {
    setEditingBatchId(null);
    setForm(BLANK);
    setShowAdd(true);
  };

  const openEdit = (batch) => {
    const matchedTrainerIds = trainers
      .filter((t) => (batch.trainers || '').toLowerCase().includes((t.name || '').toLowerCase()))
      .map((t) => String(t.id));

    setEditingBatchId(batch.id);
    setForm({
      batch_name: batch.batch_name || '',
      course_id: batch.course_id || '',
      batch_start_date: batch.batch_start_date?.split('T')[0] || '',
      batch_end_date: batch.batch_end_date?.split('T')[0] || '',
      weekday_weekend: batch.weekday_weekend || 'weekday',
      session_type: batch.session_type || 'regular',
      timing: batch.timing || '',
      status: batch.status || 'upcoming',
      trainer_ids: matchedTrainerIds,
    });
    setShowAdd(true);
  };

  const openDetail = async (batch) => {
    setDetail(batch);
    setDetailStudents([]);
    setProgressList([]);
    setLoadingDetail(true);
    setLoadingProgress(true);

    try {
      const [studentsRes, progressRes, batchRes] = await Promise.all([
        api.get(`/students?batch_id=${batch.id}`),
        getBatchProgress(batch.id),
        api.get(`/batches/${batch.id}`),
      ]);

      setDetailStudents(studentsRes.data.students || []);
      setProgressList(progressRes.data.progress || []);
      setDetail(batchRes.data.batch || batch);
    } catch {
      setDetailStudents([]);
      setProgressList([]);
    } finally {
      setLoadingDetail(false);
      setLoadingProgress(false);
    }
  };

  const updateStatus = async (batch, newStatus) => {
    try {
      await api.put(`/batches/${batch.id}`, { status: newStatus });
      toast.success(`Batch marked as ${newStatus}`);
      await load();

      if (detail?.id === batch.id) {
        const refreshed = await api.get(`/batches/${batch.id}`);
        setDetail(refreshed.data.batch || { ...detail, status: newStatus });
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleTrainerMultiChange = (e) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    set('trainer_ids', values);
  };

  const handleSave = async () => {
    if (!form.batch_name.trim()) return toast.error('Batch name is required');
    if (!form.course_id) return toast.error('Please select a course');

    setSaving(true);
    try {
      const payload = {
        ...form,
        trainer_ids: Array.isArray(form.trainer_ids) ? form.trainer_ids : [],
      };

      if (editingBatchId) {
        await updateBatch(editingBatchId, payload);
        toast.success('Batch updated successfully');
      } else {
        await createBatch(payload);
        toast.success(`${form.batch_name} created! 📚`);
      }

      setShowAdd(false);
      setEditingBatchId(null);
      setForm(BLANK);
      await load();

      if (detail && editingBatchId === detail.id) {
        const refreshed = await api.get(`/batches/${detail.id}`);
        setDetail(refreshed.data.batch || detail);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save batch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (batch) => {
    const ok = window.confirm(`Delete batch "${batch.batch_name}"?`);
    if (!ok) return;

    try {
      await deleteBatch(batch.id);
      toast.success('Batch deleted successfully');
      if (detail?.id === batch.id) setDetail(null);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete batch');
    }
  };

  const openAddProgress = () => {
    setEditingProgressId(null);
    setProgressForm({
      ...BLANK_PROGRESS,
      progress_date: new Date().toISOString().split('T')[0],
    });
    setShowProgressModal(true);
  };

  const openEditProgress = (row) => {
    setEditingProgressId(row.id);
    setProgressForm({
      progress_date: row.progress_date?.split('T')[0] || '',
      last_topic_covered: row.last_topic_covered || '',
      session_hours: row.session_hours || '',
      phase: row.phase || 'phase_1',
      phase_completion_date: row.phase_completion_date?.split('T')[0] || '',
      next_phase_start_date: row.next_phase_start_date?.split('T')[0] || '',
      remarks: row.remarks || '',
    });
    setShowProgressModal(true);
  };

  const handleSaveProgress = async () => {
    if (!detail?.id) return toast.error('No batch selected');
    if (!progressForm.last_topic_covered?.trim()) return toast.error('Topic covered is required');

    try {
      setSavingProgress(true);

      if (editingProgressId) {
        await updateProgress(detail.id, editingProgressId, progressForm);
        toast.success('Batch progress updated');
      } else {
        await addProgress(detail.id, progressForm);
        toast.success('Batch progress added');
      }

      setShowProgressModal(false);
      setEditingProgressId(null);
      setProgressForm(BLANK_PROGRESS);

      await loadProgress(detail.id);
      await load();

      const refreshed = await api.get(`/batches/${detail.id}`);
      setDetail(refreshed.data.batch || detail);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save progress');
    } finally {
      setSavingProgress(false);
    }
  };

  const filtered = batches.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      b.batch_name?.toLowerCase().includes(q) ||
      b.course_name?.toLowerCase().includes(q);

    const selectedTrainer = trainers.find((t) => String(t.id) === String(filterTrainer));
    const matchTrainer =
      !filterTrainer ||
      (b.trainers || '').toLowerCase().includes((selectedTrainer?.name || '').toLowerCase());

    const matchStatus = !filterStatus || b.status === filterStatus;
    return matchSearch && matchTrainer && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kpis = STATUSES.map((s) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    num: batches.filter((b) => b.status === s).length,
    ...statusStyle(s),
  }));

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>Batches</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            {filtered.length} of {batches.length} batches
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSyncBatchesSheet}
            disabled={syncingSheet}
            style={{ ...S.btnP, opacity: syncingSheet ? 0.7 : 1, cursor: syncingSheet ? 'not-allowed' : 'pointer' }}
          >
            {syncingSheet ? 'Syncing...' : 'Sync Batches Sheet'}
          </button>

          <button
            type="button"
            onClick={handleSyncBatchProgressSheet}
            disabled={syncingProgressSheet}
            style={{
              ...S.btnS,
              background: '#EFF6FF',
              border: '1px solid #bfdbfe',
              color: '#185FA5',
              opacity: syncingProgressSheet ? 0.7 : 1,
              cursor: syncingProgressSheet ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {syncingProgressSheet ? 'Syncing...' : 'Sync Batch Progress Sheet'}
          </button>

          <button onClick={openAdd} style={S.btnP}>
            ➕ Add Batch
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {kpis.map((k, i) => (
          <div
            key={i}
            onClick={() => {
              setFilterStatus(filterStatus === STATUSES[i] ? '' : STATUSES[i]);
              setPage(1);
            }}
            style={{
              background: k.bg,
              borderRadius: 10,
              padding: '12px 14px',
              cursor: 'pointer',
              border: filterStatus === STATUSES[i] ? `2px solid ${k.color}` : '2px solid transparent',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.num}</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          style={{ ...S.input, minWidth: 200 }}
          placeholder="🔍 Search batch / course..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <select
          style={S.input}
          value={filterTrainer}
          onChange={(e) => {
            setFilterTrainer(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Trainers</option>
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          style={S.input}
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {(search || filterTrainer || filterStatus) && (
          <button
            onClick={() => {
              setSearch('');
              setFilterTrainer('');
              setFilterStatus('');
              setPage(1);
            }}
            style={{ ...S.btnS, color: '#DC2626', borderColor: '#fecaca', fontSize: 11 }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {paginated.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50, color: '#bbb', fontSize: 13 }}>
          {batches.length === 0 ? '📭 No batches yet' : '🔍 No batches match your filters'}
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  <th style={S.th}>Batch Name</th>
                  <th style={S.th}>Course</th>
                  <th style={S.th}>Trainer</th>
                  <th style={S.th}>Students</th>
                  <th style={S.th}>Type</th>
                  <th style={S.th}>Timing</th>
                  <th style={S.th}>Start</th>
                  <th style={S.th}>End</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((b, i) => {
                  const ss = statusStyle(b.status);
                  return (
                    <tr
                      key={b.id}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0faf5')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ ...S.td, color: '#ccc', fontSize: 11 }}>{(page - 1) * PAGE_SIZE + i + 1}</td>

                      <td style={S.td}>
                        <div
                          style={{ fontWeight: 700, color: '#111', cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}
                          onClick={() => openDetail(b)}
                        >
                          {b.batch_name}
                        </div>
                        <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>{b.session_type}</div>
                      </td>

                      <td style={S.td}>{b.course_name || '—'}</td>

                      <td style={S.td}>
                        {b.trainers ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg,${G},#15c78a)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 9,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {b.trainers[0]?.toUpperCase()}
                            </div>
                            <span>{b.trainers}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td style={S.td}>
                        <span style={{ background: '#E1F5EE', color: G, fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
                          {b.student_count || 0}
                        </span>
                      </td>

                      <td style={S.td}>
                        <span style={{ fontSize: 10, background: '#F5F3FF', color: '#7C3AED', padding: '2px 8px', borderRadius: 8 }}>
                          {b.weekday_weekend}
                        </span>
                      </td>

                      <td style={S.td}>{b.timing || '—'}</td>
                      <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{b.batch_start_date?.split('T')[0] || '—'}</td>
                      <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{b.batch_end_date?.split('T')[0] || '—'}</td>

                      <td style={S.td}>
                        <span style={{ background: ss.bg, color: ss.color, fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 600 }}>
                          {b.status}
                        </span>
                      </td>

                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => openDetail(b)}
                            style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                          >
                            👁 View
                          </button>

                          <button
                            onClick={() => openEdit(b)}
                            style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                          >
                            ✏ Edit
                          </button>

                          <button
                            onClick={() => handleDelete(b)}
                            style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#DC2626', cursor: 'pointer' }}
                          >
                            🗑 Delete
                          </button>

                          {b.status === 'upcoming' && (
                            <button
                              onClick={() => updateStatus(b, 'ongoing')}
                              style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: 'none', background: '#E1F5EE', color: G, cursor: 'pointer', fontWeight: 600 }}
                            >
                              ▶ Start
                            </button>
                          )}

                          {b.status === 'ongoing' && (
                            <button
                              onClick={() => updateStatus(b, 'completed')}
                              style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: 'none', background: '#EFF6FF', color: '#185FA5', cursor: 'pointer', fontWeight: 600 }}
                            >
                              ✓ Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ ...S.btnS, padding: '5px 12px', opacity: page === 1 ? 0.4 : 1 }}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    ...S.btnS,
                    padding: '5px 10px',
                    minWidth: 32,
                    background: p === page ? G : '#fff',
                    color: p === page ? '#fff' : '#333',
                    border: `1px solid ${p === page ? G : '#ddd'}`,
                    fontWeight: p === page ? 700 : 400,
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ ...S.btnS, padding: '5px 12px', opacity: page === totalPages ? 0.4 : 1 }}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}

      {showAdd && (
        <div
          style={S.modal}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAdd(false);
              setEditingBatchId(null);
              setForm(BLANK);
            }
          }}
        >
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 800, color: G, marginBottom: 4 }}>
              {editingBatchId ? '✏ Edit Batch' : '📚 Add New Batch'}
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>
              {editingBatchId ? 'Update batch details and trainers' : 'Create a new training batch'}
            </div>

            <div style={S.row2}>
              <div style={{ ...S.field, gridColumn: '1/-1' }}>
                <label style={S.label}>Batch Name *</label>
                <input
                  style={S.inputFull}
                  value={form.batch_name}
                  onChange={(e) => set('batch_name', e.target.value)}
                  placeholder="e.g. Python Batch Apr 2026"
                  autoFocus
                />
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Course *</label>
                <select style={S.select} value={form.course_id} onChange={(e) => set('course_id', e.target.value)}>
                  <option value="">Select course</option>
                  {courses.length === 0 ? (
                    <option disabled>Loading courses…</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Status</label>
                <select style={S.select} value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Start Date</label>
                <input style={S.inputFull} type="date" value={form.batch_start_date} onChange={(e) => set('batch_start_date', e.target.value)} />
              </div>

              <div style={S.field}>
                <label style={S.label}>End Date</label>
                <input style={S.inputFull} type="date" value={form.batch_end_date} onChange={(e) => set('batch_end_date', e.target.value)} />
              </div>
            </div>

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>Session Type</label>
                <select style={S.select} value={form.session_type} onChange={(e) => set('session_type', e.target.value)}>
                  {SESSION_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Weekday / Weekend</label>
                <select style={S.select} value={form.weekday_weekend} onChange={(e) => set('weekday_weekend', e.target.value)}>
                  {WEEKDAY_WEEKEND.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Timing</label>
                <input
                  style={S.inputFull}
                  value={form.timing}
                  onChange={(e) => set('timing', e.target.value)}
                  placeholder="e.g. 10:00 AM – 12:00 PM"
                />
              </div>
            </div>

            <div style={{ ...S.field, marginBottom: 18 }}>
              <label style={S.label}>Assign Trainers</label>
              <select
                multiple
                value={form.trainer_ids}
                onChange={handleTrainerMultiChange}
                style={{ ...S.select, minHeight: 120 }}
              >
                {trainers.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>
                Hold Ctrl/Cmd to select multiple trainers. First selected trainer becomes primary in backend order.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button style={S.btnP} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editingBatchId ? '💾 Update Batch' : '✅ Create Batch'}
              </button>

              <button
                style={S.btnS}
                onClick={() => {
                  setShowAdd(false);
                  setEditingBatchId(null);
                  setForm(BLANK);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div
          style={S.detailBox}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <div style={S.detailPanel} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{detail.batch_name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{detail.course_name}</div>
              </div>
              <button
                onClick={() => setDetail(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                {
                  label: 'Status',
                  value: (
                    <span
                      style={{
                        background: statusStyle(detail.status).bg,
                        color: statusStyle(detail.status).color,
                        padding: '2px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {detail.status}
                    </span>
                  ),
                },
                { label: 'Trainer', value: detail.trainers || '—' },
                { label: 'Start', value: detail.batch_start_date?.split('T')[0] || '—' },
                { label: 'End', value: detail.batch_end_date?.split('T')[0] || '—' },
                { label: 'Type', value: detail.session_type || '—' },
                { label: 'Schedule', value: detail.weekday_weekend || '—' },
                { label: 'Timing', value: detail.timing || '—' },
                { label: 'Students', value: <span style={{ fontWeight: 700, color: G }}>{detail.student_count || 0}</span> },
              ].map((row, i) => (
                <div key={i} style={{ background: '#f9f9f9', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                    {row.label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{row.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <button onClick={() => openEdit(detail)} style={{ ...S.btnS, fontSize: 12 }}>
                ✏ Edit Batch
              </button>

              <button onClick={openAddProgress} style={{ ...S.btnS, fontSize: 12 }}>
                ➕ Add Progress
              </button>

              {detail.status === 'upcoming' && (
                <button onClick={() => updateStatus(detail, 'ongoing')} style={{ ...S.btnP, fontSize: 12 }}>
                  ▶ Mark Ongoing
                </button>
              )}

              {detail.status === 'ongoing' && (
                <button onClick={() => updateStatus(detail, 'completed')} style={{ ...S.btnP, background: '#185FA5', fontSize: 12 }}>
                  ✓ Mark Completed
                </button>
              )}

              {detail.status !== 'cancelled' && detail.status !== 'completed' && (
                <button onClick={() => updateStatus(detail, 'cancelled')} style={{ ...S.btnS, color: '#DC2626', borderColor: '#fecaca', fontSize: 12 }}>
                  ✕ Cancel Batch
                </button>
              )}
            </div>

            <div style={{ marginTop: 22, marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>
                  📘 Batch Progress ({progressList.length})
                </div>

                <button onClick={openAddProgress} style={{ ...S.btnS, fontSize: 11 }}>
                  + Add Progress
                </button>
              </div>

              {loadingProgress ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#aaa', fontSize: 12 }}>
                  Loading progress…
                </div>
              ) : progressList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#bbb', fontSize: 12 }}>
                  No progress entries yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {progressList.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        border: '1px solid #eee',
                        borderRadius: 10,
                        padding: 12,
                        background: '#fcfcfc',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 10,
                          marginBottom: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>
                            {p.last_topic_covered || '—'}
                          </div>
                          <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>
                            {p.progress_date?.split('T')[0] || '—'} • {p.phase || '—'}
                          </div>
                        </div>

                        <button
                          onClick={() => openEditProgress(p)}
                          style={{
                            fontSize: 10,
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid #ddd',
                            background: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          ✏ Edit
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ fontSize: 11, color: '#555' }}>
                          <strong>Session Hours:</strong> {p.session_hours || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#555' }}>
                          <strong>Next Phase Start:</strong> {p.next_phase_start_date?.split('T')[0] || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#555' }}>
                          <strong>Phase Completion:</strong> {p.phase_completion_date?.split('T')[0] || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#555' }}>
                          <strong>Updated:</strong> {p.updated_at?.split('T')[0] || p.created_at?.split('T')[0] || '—'}
                        </div>
                      </div>

                      {p.remarks && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 11,
                            color: '#444',
                            background: '#f7f7f7',
                            borderRadius: 8,
                            padding: '8px 10px',
                          }}
                        >
                          {p.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#111', marginBottom: 10 }}>
              🎓 Students ({detailStudents.length})
            </div>

            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#aaa', fontSize: 12 }}>Loading…</div>
            ) : detailStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#bbb', fontSize: 12 }}>No students enrolled yet</div>
            ) : (
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {detailStudents.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 0',
                      borderBottom: '1px solid #f5f5f5',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: `linear-gradient(135deg,${G},#15c78a)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {s.candidate_name?.[0]?.toUpperCase()}
                      </div>

                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{s.candidate_name}</div>
                        <div style={{ fontSize: 10, color: '#aaa' }}>{s.phone}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: G, fontWeight: 600 }}>
                        ₹{parseFloat(s.paid_amount || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, color: '#aaa' }}>
                        of ₹{parseFloat(s.total_fee || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showProgressModal && detail && (
        <div
          style={S.modal}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowProgressModal(false);
              setEditingProgressId(null);
              setProgressForm(BLANK_PROGRESS);
            }
          }}
        >
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 800, color: G, marginBottom: 4 }}>
              {editingProgressId ? '✏ Edit Batch Progress' : '📘 Add Batch Progress'}
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>{detail.batch_name}</div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Progress Date</label>
                <input
                  style={S.inputFull}
                  type="date"
                  value={progressForm.progress_date}
                  onChange={(e) => setProgress('progress_date', e.target.value)}
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Phase</label>
                <select
                  style={S.select}
                  value={progressForm.phase}
                  onChange={(e) => setProgress('phase', e.target.value)}
                >
                  {PHASES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Last Topic Covered *</label>
              <input
                style={S.inputFull}
                value={progressForm.last_topic_covered}
                onChange={(e) => setProgress('last_topic_covered', e.target.value)}
                placeholder="e.g. Arrays, Functions, React Routing"
              />
            </div>

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>Session Hours</label>
                <input
                  style={S.inputFull}
                  type="number"
                  min="0"
                  step="0.5"
                  value={progressForm.session_hours}
                  onChange={(e) => setProgress('session_hours', e.target.value)}
                  placeholder="e.g. 2"
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Phase Completion Date</label>
                <input
                  style={S.inputFull}
                  type="date"
                  value={progressForm.phase_completion_date}
                  onChange={(e) => setProgress('phase_completion_date', e.target.value)}
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Next Phase Start Date</label>
                <input
                  style={S.inputFull}
                  type="date"
                  value={progressForm.next_phase_start_date}
                  onChange={(e) => setProgress('next_phase_start_date', e.target.value)}
                />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Remarks</label>
              <textarea
                style={{ ...S.inputFull, minHeight: 90, resize: 'vertical' }}
                value={progressForm.remarks}
                onChange={(e) => setProgress('remarks', e.target.value)}
                placeholder="Optional notes about progress, blockers, pace, revisions..."
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button style={S.btnP} onClick={handleSaveProgress} disabled={savingProgress}>
                {savingProgress ? 'Saving…' : editingProgressId ? '💾 Update Progress' : '✅ Save Progress'}
              </button>

              <button
                style={S.btnS}
                onClick={() => {
                  setShowProgressModal(false);
                  setEditingProgressId(null);
                  setProgressForm(BLANK_PROGRESS);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}