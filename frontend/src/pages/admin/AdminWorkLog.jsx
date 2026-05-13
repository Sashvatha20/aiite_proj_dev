import { useState, useEffect } from 'react';
import { getAllLogs } from '../../api/worklog';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const PAGE_SIZE = 20;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const S = {
  card: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '9px 12px', borderBottom: '2px solid #f0f0f0', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f5f5f5', color: '#333', verticalAlign: 'middle' },
  input: { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' },
  inputFull: { width: '100%', padding: '8px 11px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 11px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', boxSizing: 'border-box' },
  label: { fontSize: 11, color: '#666', display: 'block', marginBottom: 4, fontWeight: 500 },
  field: { marginBottom: 12 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  btnP: { padding: '9px 20px', borderRadius: 9, border: 'none', background: G, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnS: { padding: '9px 16px', borderRadius: 9, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#333' },
  panel: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1000 },
  panelBox: { background: '#fff', width: 480, maxWidth: '95vw', height: '100vh', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', padding: 28 }
};

function getSafeErrorMessage(err, fallback) {
  if (err && err.response && err.response.data && err.response.data.error) {
    return err.response.data.error;
  }
  return fallback;
}

function toDateOnly(value) {
  if (!value) return '';
  return String(value).split('T')[0];
}

export default function AdminWorkLogs() {
  const [logs, setLogs] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [filterTrainer, setFilterTrainer] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expanding, setExpanding] = useState(null);

  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(function () {
    api.get('/trainers')
      .then(function (r) {
        setTrainers(r.data.trainers || []);
      })
      .catch(function () {
        setTrainers([]);
      });

    api.get('/batches')
      .then(function (r) {
        setBatches(r.data.batches || []);
      })
      .catch(function () {
        setBatches([]);
      });
  }, []);

  function setEditField(key, value) {
    setEditForm(function (prev) {
      return { ...prev, [key]: value };
    });
  }

  function normalizeLog(log) {
    return {
      id: log.id,
      trainer_id: log.trainer_id || '',
      batch_id: log.batch_id || '',
      log_date: toDateOnly(log.log_date),
      work_description: log.work_description || '',
      progressive_working_hours:
        log.progressive_working_hours !== undefined && log.progressive_working_hours !== null
          ? String(log.progressive_working_hours)
          : '',
      star_points:
        log.star_points !== undefined && log.star_points !== null
          ? String(log.star_points)
          : '',
      whatsapp_sent_to: log.whatsapp_sent_to || '',
      wa_sent: log.wa_sent === true
    };
  }

  function loadLogs() {
    setLoading(true);
    getAllLogs({
      trainer_id: filterTrainer || undefined,
      month: month,
      year: year
    })
      .then(function (r) {
        setLogs(r.data.logs || []);
        setPage(1);
      })
      .catch(function () {
        setLogs([]);
      })
      .finally(function () {
        setLoading(false);
      });
  }

  useEffect(function () {
    loadLogs();
  }, [filterTrainer, month, year]);

  async function handleSync() {
    try {
      setSyncing(true);
      await api.post('/worklog/sync');
      toast.success('Work log synced successfully');
      loadLogs();
    } catch (err) {
      toast.error(getSafeErrorMessage(err, 'Failed to sync work log'));
    } finally {
      setSyncing(false);
    }
  }

  function openView(log, editMode) {
    setDetail(log);
    setEditing(!!editMode);
    setEditForm(normalizeLog(log));
  }

  async function handleSave() {
    if (!detail || !detail.id) return;

    if (!editForm.trainer_id) return toast.error('Trainer is required');
    if (!editForm.log_date) return toast.error('Log date is required');
    if (!editForm.work_description || !String(editForm.work_description).trim()) {
      return toast.error('Description is required');
    }

    try {
      setSaving(true);

      const payload = {
        trainer_id: editForm.trainer_id,
        batch_id: editForm.batch_id || null,
        log_date: editForm.log_date,
        work_description: String(editForm.work_description).trim(),
        progressive_working_hours:
          editForm.progressive_working_hours !== ''
            ? parseFloat(editForm.progressive_working_hours)
            : 0,
        star_points:
          editForm.star_points !== ''
            ? parseFloat(editForm.star_points)
            : 0,
        whatsapp_sent_to: editForm.whatsapp_sent_to || null,
        wa_sent: editForm.wa_sent === true
      };

      const res = await api.put('/worklog/' + detail.id, payload);
      const updated = res && res.data && res.data.log ? res.data.log : null;

      toast.success('Work log updated');
      setEditing(false);
      loadLogs();

      if (updated) {
        setDetail(updated);
        setEditForm(normalizeLog(updated));
      }
    } catch (err) {
      toast.error(getSafeErrorMessage(err, 'Failed to update work log'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!detail || !detail.id) return;
    if (!window.confirm('Delete this work log?')) return;

    try {
      setDeleting(true);
      await api.delete('/worklog/' + detail.id);
      toast.success('Work log deleted');
      setDetail(null);
      setEditing(false);
      loadLogs();
    } catch (err) {
      toast.error(getSafeErrorMessage(err, 'Failed to delete work log'));
    } finally {
      setDeleting(false);
    }
  }

  const totalHours = logs.reduce(function (s, l) {
    return s + parseFloat(l.progressive_working_hours || 0);
  }, 0);

  const totalPoints = logs.reduce(function (s, l) {
    return s + parseFloat(l.star_points || 0);
  }, 0);

  const uniqueDays = new Set(
    logs.map(function (l) {
      return l.log_date ? l.log_date.split('T')[0] : '';
    }).filter(Boolean)
  ).size;

  const filtered = logs.filter(function (l) {
    const q = search.toLowerCase();
    return !search
      || ((l.trainer_name || '').toLowerCase().indexOf(q) !== -1)
      || ((l.batch_name || '').toLowerCase().indexOf(q) !== -1)
      || ((l.work_description || '').toLowerCase().indexOf(q) !== -1);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const trainerSummary = Object.values(
    logs.reduce(function (acc, l) {
      const id = l.trainer_id || 'unknown';
      if (!acc[id]) {
        acc[id] = {
          name: l.trainer_name || 'Unknown',
          logs: 0,
          hours: 0,
          points: 0
        };
      }
      acc[id].logs += 1;
      acc[id].hours += parseFloat(l.progressive_working_hours || 0);
      acc[id].points += parseFloat(l.star_points || 0);
      return acc;
    }, {})
  ).sort(function (a, b) {
    return b.points - a.points;
  });

  const maxHours = Math.max.apply(null, trainerSummary.map(function (t) { return t.hours; }).concat([1]));
  const maxPoints = Math.max.apply(null, trainerSummary.map(function (t) { return t.points; }).concat([1]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>Work Logs</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {MONTHS[month - 1]} {year} — {logs.length} entries
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleSync} disabled={syncing} style={S.btnS}>
              {syncing ? 'Syncing…' : '🔄 Sync'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total Logs', value: logs.length, color: '#111', bg: '#f9f9f9' },
            { label: 'Total Hours', value: totalHours.toFixed(1) + 'h', color: '#185FA5', bg: '#EFF6FF' },
            { label: '⭐ Points', value: totalPoints.toFixed(1), color: '#D97706', bg: '#FEF3C7' },
            { label: 'Days Active', value: uniqueDays, color: G, bg: '#E1F5EE' }
          ].map(function (k, i) {
            return (
              <div key={i} style={{ background: k.bg, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{k.label}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            style={{ ...S.input, minWidth: 200 }}
            placeholder="🔍 Search trainer / batch / description..."
            value={search}
            onChange={function (e) {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            style={S.input}
            value={filterTrainer}
            onChange={function (e) {
              setFilterTrainer(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Trainers</option>
            {trainers.map(function (t) {
              return <option key={t.id} value={t.id}>{t.name}</option>;
            })}
          </select>

          <select
            style={S.input}
            value={month}
            onChange={function (e) {
              setMonth(Number(e.target.value));
              setPage(1);
            }}
          >
            {MONTHS.map(function (m, i) {
              return <option key={i + 1} value={i + 1}>{m}</option>;
            })}
          </select>

          <select
            style={S.input}
            value={year}
            onChange={function (e) {
              setYear(Number(e.target.value));
              setPage(1);
            }}
          >
            {[2024, 2025, 2026].map(function (y) {
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>

          {(search || filterTrainer) && (
            <button
              onClick={function () {
                setSearch('');
                setFilterTrainer('');
                setPage(1);
              }}
              style={{ ...S.btnS, color: '#DC2626', borderColor: '#fecaca', fontSize: 11 }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#aaa', fontSize: 13 }}>⏳ Loading logs…</div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#bbb', fontSize: 13 }}>
            {logs.length === 0 ? '📭 No work logs for this period' : '🔍 No logs match your search'}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>#</th>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Trainer</th>
                    <th style={S.th}>Batch</th>
                    <th style={S.th}>Description</th>
                    <th style={S.th}>Hours</th>
                    <th style={S.th}>⭐ Points</th>
                    <th style={S.th}>WA</th>
                    <th style={S.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(function (l, i) {
                    const isExpanded = expanding === l.id;
                    const longText = (l.work_description || '').length > 80;

                    return (
                      <tr
                        key={l.id}
                        onMouseEnter={function (e) { e.currentTarget.style.background = '#f0faf5'; }}
                        onMouseLeave={function (e) { e.currentTarget.style.background = ''; }}
                      >
                        <td style={{ ...S.td, color: '#ccc', fontSize: 11 }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                        <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                          {l.log_date ? l.log_date.split('T')[0] : '—'}
                        </td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background: 'linear-gradient(135deg,' + G + ',#15c78a)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 10,
                                fontWeight: 700
                              }}
                            >
                              {l.trainer_name && l.trainer_name[0] ? l.trainer_name[0].toUpperCase() : '?'}
                            </div>
                            <span style={{ fontWeight: 600 }}>{l.trainer_name || '—'}</span>
                          </div>
                        </td>
                        <td style={S.td}>
                          {l.batch_name ? (
                            <span style={{ background: '#EFF6FF', color: '#185FA5', fontSize: 10, padding: '2px 8px', borderRadius: 8 }}>
                              {l.batch_name}
                            </span>
                          ) : (
                            <span style={{ color: '#ccc' }}>—</span>
                          )}
                        </td>
                        <td style={{ ...S.td, maxWidth: 280 }}>
                          <div
                            onClick={function () {
                              if (longText) setExpanding(isExpanded ? null : l.id);
                            }}
                            style={{ cursor: longText ? 'pointer' : 'default' }}
                          >
                            <div
                              style={isExpanded ? { fontSize: 11, color: '#444' } : {
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                fontSize: 11,
                                color: '#444'
                              }}
                            >
                              {l.work_description || '—'}
                            </div>
                            {longText && (
                              <span style={{ fontSize: 10, color: '#185FA5', marginTop: 2, display: 'block' }}>
                                {isExpanded ? '▲ less' : '▼ more'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={S.td}>
                          <span
                            style={{
                              background: '#EFF6FF',
                              color: '#185FA5',
                              fontSize: 11,
                              padding: '2px 10px',
                              borderRadius: 20,
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {parseFloat(l.progressive_working_hours || 0).toFixed(1)}h
                          </span>
                        </td>
                        <td style={S.td}>
                          <span
                            style={{
                              background: '#FEF3C7',
                              color: '#D97706',
                              fontSize: 11,
                              padding: '2px 10px',
                              borderRadius: 20,
                              fontWeight: 700
                            }}
                          >
                            ⭐ {parseFloat(l.star_points || 0).toFixed(1)}
                          </span>
                        </td>
                        <td style={S.td}>
                          <span style={{ fontSize: 13 }}>{l.wa_sent ? '✅' : '⬜'}</span>
                        </td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={function () { openView(l, false); }}
                              style={{ fontSize: 10, padding: '5px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                            >
                              👁 View
                            </button>
                            <button
                              onClick={function () { openView(l, true); }}
                              style={{ fontSize: 10, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#FEF3C7', color: '#92400E', cursor: 'pointer', fontWeight: 600 }}
                            >
                              ✏️
                            </button>
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
                  onClick={function () {
                    setPage(function (p) { return Math.max(1, p - 1); });
                  }}
                  disabled={page === 1}
                  style={{ ...S.btnS, padding: '5px 12px', opacity: page === 1 ? 0.4 : 1 }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, function (_, i) { return i + 1; }).map(function (p) {
                  return (
                    <button
                      key={p}
                      onClick={function () { setPage(p); }}
                      style={{
                        ...S.btnS,
                        padding: '5px 10px',
                        minWidth: 32,
                        background: p === page ? G : '#fff',
                        color: p === page ? '#fff' : '#333',
                        border: '1px solid ' + (p === page ? G : '#ddd'),
                        fontWeight: p === page ? 700 : 400
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={function () {
                    setPage(function (p) { return Math.min(totalPages, p + 1); });
                  }}
                  disabled={page === totalPages}
                  style={{ ...S.btnS, padding: '5px 12px', opacity: page === totalPages ? 0.4 : 1 }}
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {trainerSummary.length > 0 && (
        <div style={S.card}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#111',
              marginBottom: 16,
              paddingBottom: 10,
              borderBottom: '1px solid #f0f0f0'
            }}
          >
            🏆 Trainer Summary — {MONTHS[month - 1]} {year}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Rank</th>
                  <th style={S.th}>Trainer</th>
                  <th style={S.th}>Logs</th>
                  <th style={S.th}>Hours</th>
                  <th style={S.th}>⭐ Points</th>
                </tr>
              </thead>
              <tbody>
                {trainerSummary.map(function (t, i) {
                  return (
                    <tr
                      key={i}
                      onMouseEnter={function (e) { e.currentTarget.style.background = '#f0faf5'; }}
                      onMouseLeave={function (e) { e.currentTarget.style.background = ''; }}
                    >
                      <td style={S.td}>
                        <span style={{ fontSize: 16 }}>
                          {['🥇', '🥈', '🥉'][i] || <span style={{ color: '#ccc', fontWeight: 600 }}>#{i + 1}</span>}
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              flexShrink: 0,
                              background: 'linear-gradient(135deg,' + G + ',#15c78a)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 700
                            }}
                          >
                            {t.name && t.name[0] ? t.name[0].toUpperCase() : '?'}
                          </div>
                          <span style={{ fontWeight: 600 }}>{t.name}</span>
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={{ background: '#E1F5EE', color: G, fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                          {t.logs} logs
                        </span>
                      </td>
                      <td style={{ ...S.td, minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: ((t.hours / maxHours) * 100) + '%',
                                height: '100%',
                                background: '#185FA5',
                                borderRadius: 4
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#185FA5', minWidth: 36 }}>
                            {t.hours.toFixed(1)}h
                          </span>
                        </div>
                      </td>
                      <td style={{ ...S.td, minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: ((t.points / maxPoints) * 100) + '%',
                                height: '100%',
                                background: '#D97706',
                                borderRadius: 4
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', minWidth: 36 }}>
                            ⭐ {t.points.toFixed(1)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detail && (
        <div
          style={S.panel}
          onClick={function (e) {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <div style={S.panelBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>
                  {editing ? '✏️ Edit Work Log' : '👁 Work Log Details'}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  {detail.trainer_name || 'Unknown trainer'} • {toDateOnly(detail.log_date)}
                </div>
              </div>
              <button
                onClick={function () { setDetail(null); }}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                onClick={function () { setEditing(false); }}
                style={{
                  ...S.btnS,
                  fontSize: 11,
                  flex: 1,
                  background: !editing ? '#f0f0f0' : '#fff',
                  fontWeight: !editing ? 700 : 400
                }}
              >
                👁 View
              </button>
              <button
                onClick={function () { setEditing(true); }}
                style={{
                  ...S.btnS,
                  fontSize: 11,
                  flex: 1,
                  background: editing ? '#FEF3C7' : '#fff',
                  color: editing ? '#92400E' : '#333',
                  fontWeight: editing ? 700 : 400
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ ...S.btnS, fontSize: 11, color: '#DC2626', borderColor: '#fecaca' }}
              >
                {deleting ? 'Deleting…' : '🗑 Delete'}
              </button>
            </div>

            {!editing && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Trainer', value: detail.trainer_name || '—' },
                    { label: 'Batch', value: detail.batch_name || '—' },
                    { label: 'Date', value: toDateOnly(detail.log_date) || '—' },
                    { label: 'Hours', value: parseFloat(detail.progressive_working_hours || 0).toFixed(1) + 'h' },
                    { label: 'Points', value: parseFloat(detail.star_points || 0).toFixed(1) },
                    { label: 'WA Sent', value: detail.wa_sent ? 'Yes' : 'No' }
                  ].map(function (r, i) {
                    return (
                      <div key={i} style={{ background: '#f9f9f9', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{r.value}</div>
                      </div>
                    );
                  })}
                </div>

                {detail.work_description && (
                  <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                      Description
                    </div>
                    <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
                      {detail.work_description}
                    </div>
                  </div>
                )}

                {detail.whatsapp_sent_to && (
                  <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                      WhatsApp Sent To
                    </div>
                    <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
                      {detail.whatsapp_sent_to}
                    </div>
                  </div>
                )}
              </>
            )}

            {editing && (
              <>
                <div style={S.row2}>
                  <div style={S.field}>
                    <label style={S.label}>Trainer *</label>
                    <select
                      style={S.select}
                      value={editForm.trainer_id || ''}
                      onChange={function (e) {
                        setEditField('trainer_id', e.target.value);
                      }}
                    >
                      <option value="">Select trainer</option>
                      {trainers.map(function (t) {
                        return <option key={t.id} value={t.id}>{t.name}</option>;
                      })}
                    </select>
                  </div>

                  <div style={S.field}>
                    <label style={S.label}>Batch</label>
                    <select
                      style={S.select}
                      value={editForm.batch_id || ''}
                      onChange={function (e) {
                        setEditField('batch_id', e.target.value);
                      }}
                    >
                      <option value="">Select batch</option>
                      {batches.map(function (b) {
                        return <option key={b.id} value={b.id}>{b.batch_name}</option>;
                      })}
                    </select>
                  </div>
                </div>

                <div style={S.row2}>
                  <div style={S.field}>
                    <label style={S.label}>Log Date *</label>
                    <input
                      style={S.inputFull}
                      type="date"
                      value={editForm.log_date || ''}
                      onChange={function (e) {
                        setEditField('log_date', e.target.value);
                      }}
                    />
                  </div>

                  <div style={S.field}>
                    <label style={S.label}>WhatsApp Sent To</label>
                    <input
                      style={S.inputFull}
                      value={editForm.whatsapp_sent_to || ''}
                      onChange={function (e) {
                        setEditField('whatsapp_sent_to', e.target.value);
                      }}
                      placeholder="Name / group / contact"
                    />
                  </div>
                </div>

                <div style={S.row2}>
                  <div style={S.field}>
                    <label style={S.label}>Hours</label>
                    <input
                      style={S.inputFull}
                      type="number"
                      step="0.1"
                      value={editForm.progressive_working_hours || ''}
                      onChange={function (e) {
                        setEditField('progressive_working_hours', e.target.value);
                      }}
                    />
                  </div>

                  <div style={S.field}>
                    <label style={S.label}>Star Points</label>
                    <input
                      style={S.inputFull}
                      type="number"
                      step="0.1"
                      value={editForm.star_points || ''}
                      onChange={function (e) {
                        setEditField('star_points', e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Description *</label>
                  <textarea
                    style={{ ...S.inputFull, resize: 'vertical', minHeight: 100, fontFamily: 'inherit' }}
                    value={editForm.work_description || ''}
                    onChange={function (e) {
                      setEditField('work_description', e.target.value);
                    }}
                    placeholder="Enter work description"
                  />
                </div>

                <div style={S.field}>
                  <label style={{ ...S.label, marginBottom: 8 }}>WhatsApp Sent</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#444' }}>
                    <input
                      type="checkbox"
                      checked={editForm.wa_sent === true}
                      onChange={function (e) {
                        setEditField('wa_sent', e.target.checked);
                      }}
                    />
                    Mark as sent
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={S.btnP} onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : '💾 Save Changes'}
                  </button>
                  <button style={S.btnS} onClick={function () { setEditing(false); }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}