import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const G = '#1D9E75';
const PAGE_SIZE = 15;
const STATUSES = ['open', 'acknowledged', 'resolved'];

const statusStyle = s => ({
  open: { bg: '#FCEBEB', color: '#A32D2D' },
  acknowledged: { bg: '#FEF3C7', color: '#92400E' },
  resolved: { bg: '#E1F5EE', color: '#0F6E56' },
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
  inputFull: { width: '100%', padding: '8px 11px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 11px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', boxSizing: 'border-box' },
  label: { fontSize: 11, color: '#666', display: 'block', marginBottom: 4, fontWeight: 500 },
  field: { marginBottom: 12 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  btnP: { padding: '9px 20px', borderRadius: 9, border: 'none', background: G, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnS: { padding: '9px 16px', borderRadius: 9, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: 16, padding: 28, width: 520, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
};

export default function AdminEscalations() {
  const [escalations, setEscalations] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [resolution, setResolution] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/escalations');
      setEscalations(r.data.escalations || []);
    } catch {
      toast.error('Failed to load escalations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get('/trainers')
      .then(r => setTrainers(r.data.trainers || []))
      .catch(() => {});
  }, []);

  const openManageModal = (e) => {
    setDetail(e);
    setResolution(e.resolution_note || '');
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/escalations/${id}/status`, {
        status,
        resolution_note: resolution,
      });

      toast.success(`Escalation marked as ${status}`);
      setDetail(null);
      setResolution('');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update');
    }
  };

  const filtered = escalations.filter(e => {
    const q = search.toLowerCase();
    const mQ =
      !search ||
      e.trainer_name?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.reported_by?.toLowerCase().includes(q) ||
      e.resolution_note?.toLowerCase().includes(q);

    const mS = !filterStatus || e.status === filterStatus;
    const mT = !filterTrainer || e.trainer_id === filterTrainer;
    return mQ && mS && mT;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = STATUSES.reduce(
    (a, s) => ({ ...a, [s]: escalations.filter(e => e.status === s).length }),
    {}
  );

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>Escalations</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            {filtered.length} of {escalations.length} total
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {STATUSES.map(s => {
          const ss = statusStyle(s);
          return (
            <div
              key={s}
              onClick={() => {
                setFilterStatus(filterStatus === s ? '' : s);
                setPage(1);
              }}
              style={{
                background: ss.bg,
                borderRadius: 10,
                padding: '12px 14px',
                cursor: 'pointer',
                border: filterStatus === s ? `2px solid ${ss.color}` : '2px solid transparent',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: ss.color, lineHeight: 1 }}>
                {counts[s] || 0}
              </div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 3, textTransform: 'capitalize' }}>
                {s}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          style={{ ...S.input, minWidth: 220 }}
          placeholder="🔍 Search trainer / description / note..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          style={S.input}
          value={filterTrainer}
          onChange={e => {
            setFilterTrainer(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Trainers</option>
          {trainers.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          style={S.input}
          value={filterStatus}
          onChange={e => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: 50, color: '#aaa' }}>⏳ Loading…</div>
      ) : paginated.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50, color: '#bbb', fontSize: 13 }}>
          {escalations.length === 0 ? '✅ No escalations!' : '🔍 No match'}
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  <th style={S.th}>Trainer</th>
                  <th style={S.th}>Reported By</th>
                  <th style={S.th}>Description</th>
                  <th style={S.th}>Count</th>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((e, i) => {
                  const ss = statusStyle(e.status);
                  return (
                    <tr
                      key={e.id}
                      onMouseEnter={r => (r.currentTarget.style.background = '#fff8f8')}
                      onMouseLeave={r => (r.currentTarget.style.background = '')}
                    >
                      <td style={{ ...S.td, color: '#ccc', fontSize: 11 }}>
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              flexShrink: 0,
                              background: 'linear-gradient(135deg,#EF4444,#b91c1c)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {e.trainer_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontWeight: 600 }}>{e.trainer_name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, fontSize: 11 }}>{e.reported_by || '—'}</td>
                      <td style={{ ...S.td, maxWidth: 260 }}>
                        <div
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: 11,
                          }}
                        >
                          {e.description}
                        </div>
                        {e.resolution_note && (
                          <div style={{ marginTop: 6, fontSize: 10, color: '#0F6E56' }}>
                            Note: {e.resolution_note}
                          </div>
                        )}
                      </td>
                      <td style={S.td}>
                        <span
                          style={{
                            background: '#FCEBEB',
                            color: '#A32D2D',
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 20,
                            fontWeight: 700,
                          }}
                        >
                          ×{e.no_of_count || 1}
                        </span>
                      </td>
                      <td style={{ ...S.td, whiteSpace: 'nowrap', fontSize: 11, color: '#888' }}>
                        {e.escalation_date?.split('T')[0]}
                      </td>
                      <td style={S.td}>
                        <span
                          style={{
                            background: ss.bg,
                            color: ss.color,
                            fontSize: 10,
                            padding: '3px 9px',
                            borderRadius: 20,
                            fontWeight: 600,
                          }}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td style={S.td}>
                        <button
                          onClick={() => openManageModal(e)}
                          style={{
                            fontSize: 10,
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: '1px solid #ddd',
                            background: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ Manage
                        </button>
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ ...S.btnS, padding: '5px 12px', opacity: page === 1 ? 0.4 : 1 }}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ ...S.btnS, padding: '5px 12px', opacity: page === totalPages ? 0.4 : 1 }}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}

      {detail && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div style={S.modalBox}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#DC2626', marginBottom: 4 }}>
              ⚠️ Manage Escalation
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>
              Review and update escalation status
            </div>

            <div
              style={{
                background: '#FEF2F2',
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
                border: '1px solid #fecaca',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                {[
                  { label: 'Trainer', value: detail.trainer_name },
                  { label: 'Reported By', value: detail.reported_by || '—' },
                  { label: 'Date', value: detail.escalation_date?.split('T')[0] },
                  { label: 'Count', value: `×${detail.no_of_count || 1}` },
                ].map((r, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{r.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>{detail.description}</div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Resolution Notes (optional)</label>
              <textarea
                style={{ ...S.inputFull, resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="What action was taken?"
              />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {detail.status !== 'acknowledged' && (
                <button
                  onClick={() => updateStatus(detail.id, 'acknowledged')}
                  style={{
                    ...S.btnS,
                    background: '#FEF3C7',
                    color: '#92400E',
                    borderColor: '#fcd34d',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  👁 Acknowledge
                </button>
              )}

              {detail.status !== 'resolved' && (
                <button
                  onClick={() => updateStatus(detail.id, 'resolved')}
                  style={{ ...S.btnP, fontSize: 11 }}
                >
                  ✅ Mark Resolved
                </button>
              )}

              {detail.status !== 'open' && (
                <button
                  onClick={() => updateStatus(detail.id, 'open')}
                  style={{ ...S.btnS, color: '#DC2626', borderColor: '#fecaca', fontSize: 11 }}
                >
                  🔄 Reopen
                </button>
              )}

              <button
                style={S.btnS}
                onClick={() => {
                  setDetail(null);
                  setResolution('');
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