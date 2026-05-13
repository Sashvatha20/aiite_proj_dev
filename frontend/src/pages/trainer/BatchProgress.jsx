import { useState, useEffect } from 'react';
import { getBatches, getBatchProgress, addProgress, updateProgress } from '../../api/batches';
import { syncBatchProgressSheet } from '../../api/sheetsSync';
import toast from 'react-hot-toast';

const BRAND = '#1D9E75';

const styles = {
  page: { display: 'grid', gap: 16 },

  card: {
    background: '#fff',
    borderRadius: 18,
    border: '1px solid #e8edf2',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
  },

  section: { padding: 18 },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: 4,
  },

  sub: {
    fontSize: 12,
    color: '#64748b',
  },

  tabs: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  tab: {
    padding: '9px 14px',
    borderRadius: 999,
    border: '1px solid #dbe4ea',
    background: '#fff',
    color: '#475569',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },

  tabActive: {
    background: BRAND,
    color: '#fff',
    borderColor: BRAND,
  },

  field: {
    display: 'grid',
    gap: 5,
  },

  label: {
    fontSize: 11,
    fontWeight: 700,
    color: '#475569',
  },

  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #d8e1e8',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
  },

  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #d8e1e8',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
  },

  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #d8e1e8',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
    minHeight: 90,
    resize: 'vertical',
    fontFamily: 'inherit',
  },

  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },

  summaryStrip: {
    background: '#f0faf6',
    border: '1px solid #d9efe6',
    borderRadius: 14,
    padding: 14,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
    marginBottom: 14,
  },

  summaryItem: {
    minWidth: 0,
  },

  summaryLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },

  summaryValue: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: 1.35,
    wordBreak: 'break-word',
  },

  formBox: {
    border: '1px solid #e8edf2',
    background: '#fbfefd',
    borderRadius: 16,
    padding: 16,
    display: 'grid',
    gap: 14,
  },

  infoBox: {
    background: '#fff8e8',
    border: '1px solid #f5d48c',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 12,
    color: '#854f0b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },

  waBox: {
    background: '#e8f8f1',
    border: '1px solid #bde8d6',
    borderRadius: 14,
    padding: 14,
    fontSize: 12,
    color: '#0f6e56',
  },

  waTitle: {
    fontWeight: 800,
    marginBottom: 8,
    color: '#0f6e56',
  },

  btnRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },

  btnPrimary: {
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    background: BRAND,
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },

  btnSecondary: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #d8e1e8',
    background: '#fff',
    color: '#334155',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },

  historyWrap: {
    border: '1px solid #e8edf2',
    borderRadius: 16,
    overflow: 'hidden',
    background: '#fff',
  },

  tableWrap: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontSize: 13,
  },

  th: {
    textAlign: 'left',
    padding: '12px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    borderBottom: '1px solid #e8edf2',
    background: '#fafcfd',
    whiteSpace: 'nowrap',
  },

  td: {
    padding: '14px 12px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
    color: '#0f172a',
  },

  nameMain: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 2,
  },

  nameSub: {
    fontSize: 11,
    color: '#64748b',
  },

  badge: (bg, color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: bg,
    color,
    whiteSpace: 'nowrap',
  }),

  miniBtn: {
    padding: '8px 12px',
    borderRadius: 9,
    border: '1px solid #d8e1e8',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
  },

  empty: {
    textAlign: 'center',
    padding: '42px 20px',
    fontSize: 13,
    color: '#94a3b8',
  },
};

const today = () => new Date().toISOString().split('T')[0];

const phases = [
  { label: 'Phase 1', value: 'phase_1' },
  { label: 'Phase 2', value: 'phase_2' },
  { label: 'Phase 3', value: 'phase_3' },
  { label: 'Project', value: 'project' },
  { label: 'Completed', value: 'completed' },
];

const phaseBadge = {
  phase_1: { bg: '#E8F2FF', color: '#185FA5', label: 'Phase 1' },
  phase_2: { bg: '#EEF4FF', color: '#4338CA', label: 'Phase 2' },
  phase_3: { bg: '#F3E8FF', color: '#7C3AED', label: 'Phase 3' },
  project: { bg: '#FFF4DD', color: '#B54708', label: 'Project' },
  completed: { bg: '#E7F8EE', color: '#067647', label: 'Completed' },
};

export default function BatchProgress() {
  const [tab, setTab] = useState(0);
  const [batches, setBatches] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selBatch, setSelBatch] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [editId, setEditId] = useState(null);

  const blank = {
    progress_date: today(),
    last_topic_covered: '',
    session_hours: '',
    phase: 'phase_1',
    remarks: '',
  };

  const [form, setForm] = useState(blank);
  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    getBatches({ status: 'ongoing' })
      .then((r) => {
        const list = r.data.batches || [];
        setBatches(list);
        if (list.length > 0) setSelBatch(String(list[0].id));
      })
      .catch(() => toast.error('Failed to load batches'));
  }, []);

  useEffect(() => {
    if (selBatch) loadProgress(selBatch);
  }, [selBatch]);

  const loadProgress = async (id) => {
    try {
      const res = await getBatchProgress(id);
      setProgress(res.data.progress || []);
    } catch {
      toast.error('Failed to load progress');
    }
  };

  const handleSyncBatchProgressSheet = async () => {
    try {
      setSyncingSheet(true);
      const res = await syncBatchProgressSheet();

      if (res?.data?.success) {
        toast.success(
          res?.data?.message || `Batch Progress sheet synced (${res?.data?.count || 0} rows)`
        );
      } else {
        toast.error(res?.data?.error || 'Batch Progress sheet sync failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to sync batch progress sheet');
    } finally {
      setSyncingSheet(false);
    }
  };

  const selectedBatch = batches.find((b) => String(b.id) === selBatch);

  const buildWA = () => {
    const pLabel = phases.find((p) => p.value === form.phase)?.label || form.phase;
    return `Batch Progress Update (${form.progress_date})
Batch: ${selectedBatch?.batch_name || ''}
Course: ${selectedBatch?.course_name || ''}

Topic: ${form.last_topic_covered}
Phase: ${pLabel}
Hours: ${form.session_hours || '—'}${form.remarks ? `\nRemarks: ${form.remarks}` : ''}`;
  };

  const handleSubmit = async () => {
    if (!selBatch || !form.last_topic_covered.trim()) {
      return toast.error('Batch and topic are required');
    }

    setLoading(true);
    try {
      if (editId) {
        await updateProgress(selBatch, editId, form);
        toast.success('Progress updated!');
      } else {
        await addProgress(selBatch, form);
        toast.success('Progress logged!');
      }

      setForm(blank);
      setEditId(null);
      await loadProgress(selBatch);
      setTab(1);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setForm({
      progress_date: p.progress_date?.split('T')[0] || today(),
      last_topic_covered: p.last_topic_covered || '',
      session_hours: p.session_hours || '',
      phase: p.phase || 'phase_1',
      remarks: p.remarks || '',
    });
    setEditId(p.id);
    setTab(0);
  };

  const resetForm = () => {
    setForm(blank);
    setEditId(null);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.section}>
          <div style={styles.header}>
            <div>
              <div style={styles.title}>Batch Progress</div>
              <div style={styles.sub}>
                Log daily batch updates, review history, and sync the Batch Progress sheet.
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncBatchProgressSheet}
              disabled={syncingSheet}
              style={{
                ...styles.btnPrimary,
                opacity: syncingSheet ? 0.7 : 1,
                cursor: syncingSheet ? 'not-allowed' : 'pointer',
              }}
            >
              {syncingSheet ? 'Syncing...' : 'Sync Batch Progress Sheet'}
            </button>
          </div>

          <div style={{ ...styles.field, marginBottom: 14 }}>
            <label style={styles.label}>Select batch</label>
            <select
              style={{ ...styles.select, maxWidth: 420 }}
              value={selBatch}
              onChange={(e) => setSelBatch(e.target.value)}
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_name} — {b.course_name}
                </option>
              ))}
            </select>
          </div>

          {selectedBatch && (
            <div style={styles.summaryStrip}>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Students</div>
                <div style={styles.summaryValue}>{selectedBatch.student_count || 0}</div>
              </div>

              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Started</div>
                <div style={styles.summaryValue}>
                  {selectedBatch.batch_start_date?.split('T')[0] || '—'}
                </div>
              </div>

              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Current phase</div>
                <div style={styles.summaryValue}>
                  {phases.find((p) => p.value === selectedBatch.phase)?.label ||
                    selectedBatch.phase ||
                    '—'}
                </div>
              </div>

              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Last topic</div>
                <div style={styles.summaryValue}>{selectedBatch.last_topic_covered || '—'}</div>
              </div>
            </div>
          )}

          <div style={styles.tabs}>
            {['Add update', 'View history'].map((item, i) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(i)}
                style={{ ...styles.tab, ...(tab === i ? styles.tabActive : {}) }}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === 0 && (
            <div style={styles.formBox}>
              {editId && (
                <div style={styles.infoBox}>
                  <span>✏️ You are editing an existing batch progress entry.</span>
                  <button type="button" style={styles.miniBtn} onClick={resetForm}>
                    Cancel Edit
                  </button>
                </div>
              )}

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Date</label>
                  <input
                    style={styles.input}
                    type="date"
                    value={form.progress_date}
                    onChange={(e) => setField('progress_date', e.target.value)}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Phase</label>
                  <select
                    style={styles.select}
                    value={form.phase}
                    onChange={(e) => setField('phase', e.target.value)}
                  >
                    {phases.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Topic covered *</label>
                <textarea
                  style={styles.textarea}
                  value={form.last_topic_covered}
                  onChange={(e) => setField('last_topic_covered', e.target.value)}
                  placeholder="e.g. Exception Handling, Collections"
                />
              </div>

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Hours covered</label>
                  <input
                    style={styles.input}
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.session_hours}
                    onChange={(e) => setField('session_hours', e.target.value)}
                    placeholder="e.g. 1.5"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Remarks</label>
                  <input
                    style={styles.input}
                    value={form.remarks}
                    onChange={(e) => setField('remarks', e.target.value)}
                    placeholder="Optional remarks"
                  />
                </div>
              </div>

              {form.last_topic_covered && (
                <div style={styles.waBox}>
                  <div style={styles.waTitle}>WhatsApp Preview</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{buildWA()}</div>

                  <div style={{ ...styles.btnRow, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `https://web.whatsapp.com/send?text=${encodeURIComponent(buildWA())}`,
                          '_blank'
                        )
                      }
                      style={{
                        ...styles.btnPrimary,
                        background: '#25D366',
                      }}
                    >
                      Open WhatsApp Web
                    </button>
                  </div>
                </div>
              )}

              <div style={styles.btnRow}>
                <button type="button" style={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Saving...' : editId ? 'Update Progress' : 'Submit Progress'}
                </button>

                <button type="button" style={styles.btnSecondary} onClick={resetForm}>
                  Clear
                </button>
              </div>
            </div>
          )}

          {tab === 1 && (
            <div style={styles.historyWrap}>
              {progress.length === 0 ? (
                <div style={styles.empty}>No progress logged yet</div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Topic</th>
                        <th style={styles.th}>Hours</th>
                        <th style={styles.th}>Phase</th>
                        <th style={styles.th}>Remarks</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progress.map((p) => {
                        const badge = phaseBadge[p.phase] || {
                          bg: '#E8F2FF',
                          color: '#185FA5',
                          label: p.phase || '—',
                        };

                        return (
                          <tr key={p.id}>
                            <td style={styles.td}>
                              <div style={styles.nameMain}>
                                {p.progress_date?.split('T')[0] || '—'}
                              </div>
                            </td>

                            <td style={styles.td}>
                              <div style={styles.nameMain}>{p.last_topic_covered || '—'}</div>
                            </td>

                            <td style={styles.td}>
                              <div style={styles.nameMain}>
                                {p.session_hours ? `${p.session_hours}h` : '—'}
                              </div>
                            </td>

                            <td style={styles.td}>
                              <span style={styles.badge(badge.bg, badge.color)}>
                                {badge.label}
                              </span>
                            </td>

                            <td style={styles.td}>
                              <div style={styles.nameSub}>{p.remarks || '—'}</div>
                            </td>

                            <td style={styles.td}>
                              <button type="button" style={styles.miniBtn} onClick={() => handleEdit(p)}>
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}