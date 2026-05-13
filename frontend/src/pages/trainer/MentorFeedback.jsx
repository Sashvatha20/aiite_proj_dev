import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getBatches } from '../../api/batches';
import {
  getMentorFeedbacks,
  createMentorFeedback,
  updateMentorFeedback,
  syncMentorFeedbackSheet,
} from '../../api/mentorFeedback';

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
  titleLeft: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  titleRight: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tag: { fontSize: 9, background: '#E6F1FB', color: '#185FA5', padding: '2px 6px', borderRadius: 4 },
  tabs: { display: 'flex', borderBottom: '1px solid #eee', marginBottom: 14 },
  tab: { padding: '7px 14px', fontSize: 12, cursor: 'pointer', borderBottom: '2px solid transparent', color: '#888' },
  tabA: { borderBottomColor: G, color: G, fontWeight: 500 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 },
  field: { marginBottom: 10 },
  label: { fontSize: 11, color: '#666', display: 'block', marginBottom: 3 },
  input: { width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, outline: 'none', resize: 'vertical', minHeight: 70, boxSizing: 'border-box', fontFamily: 'inherit' },
  readonly: { width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, background: '#f8f8f8', color: '#555', boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btn: { padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer' },
  btnP: { padding: '8px 16px', borderRadius: 8, border: 'none', background: G, color: '#fff', fontSize: 12, cursor: 'pointer' },
  btnSync: { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 12, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #eee', fontSize: 11, color: '#888', fontWeight: 500 },
  td: { padding: '8px 10px', borderBottom: '1px solid #f5f5f5', color: '#333' },
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
  infoBox: { background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#1E40AF', marginBottom: 12 },
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
};

const today = () => new Date().toISOString().split('T')[0];

export default function MentorFeedback() {
  const [tab, setTab] = useState(0);
  const [batches, setBatches] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [editId, setEditId] = useState(null);

  const blank = {
    batch_id: '',
    total_members: '',
    form_shared: false,
    received_response: '',
    pending: '',
    followup_notes: '',
    google_form_link: '',
    last_updated_date: today(),
    wa_sent: false,
  };

  const [form, setForm] = useState(blank);

  const total = parseInt(form.total_members) || 0;
  const received = parseInt(form.received_response) || 0;
  const pending = total > 0 ? Math.max(0, total - received) : '';
  const responseRate = total > 0 ? Math.round((received / total) * 100) : 0;

  useEffect(() => {
    getBatches().then((r) => setBatches(r.data.batches || []));
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      const r = await getMentorFeedbacks();
      setFeedbacks(r.data.feedbacks || []);
    } catch {
      toast.error('Failed to load mentor feedback records');
    }
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const buildWA = () => {
    const batch = batches.find((b) => String(b.id) === String(form.batch_id));
    const pendingCount = total > 0 ? Math.max(0, total - received) : '—';
    const rate = total > 0 ? Math.round((received / total) * 100) : 0;

    return `📋 Mentor Feedback Update (${form.last_updated_date})

Batch: ${batch?.batch_name || '—'} — ${batch?.course_name || ''}
Total members: ${form.total_members || '—'}
Google Form shared: ${form.form_shared ? '✅ Yes' : '❌ Not yet'}
${form.google_form_link ? 'Form link: ' + form.google_form_link : ''}

Responses received: ${form.received_response || 0}
Pending: ${pendingCount}
Response rate: ${rate}%
${form.followup_notes ? '\nFollowup notes:\n' + form.followup_notes : ''}`.trim();
  };

  const openWA = () => {
    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(buildWA())}`, '_blank');
    set('wa_sent', true);
    toast.success('WhatsApp opened — select contact manually');
  };

  const showWAPreview =
    form.batch_id && (form.total_members || form.received_response || form.followup_notes);

  const handleSubmit = async () => {
    if (!form.batch_id) {
      return toast.error('Please select a batch');
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        total_members: parseInt(form.total_members) || null,
        received_response: parseInt(form.received_response) || 0,
        pending: pending || 0,
      };

      if (editId) {
        await updateMentorFeedback(editId, payload);
        toast.success('Feedback record updated!');
      } else {
        await createMentorFeedback(payload);
        toast.success('Mentor feedback logged!');
      }

      setForm(blank);
      setEditId(null);
      await loadFeedbacks();
      setTab(1);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMentorFeedbackSheet = async () => {
    try {
      setSyncingSheet(true);
      const res = await syncMentorFeedbackSheet();

      if (res?.data?.success) {
        toast.success(
          res?.data?.message || `Mentor feedback sheet synced (${res?.data?.count || 0} rows)`
        );
      } else {
        toast.error(res?.data?.error || 'Mentor feedback sheet sync failed');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to sync mentor feedback sheet');
    } finally {
      setSyncingSheet(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      batch_id: item.batch_id || '',
      total_members: item.total_members ?? '',
      form_shared: item.form_shared || false,
      received_response: item.received_response ?? '',
      pending: item.pending ?? '',
      followup_notes: item.followup_notes || '',
      google_form_link: item.google_form_link || '',
      last_updated_date: item.last_updated_date?.split('T')[0] || today(),
      wa_sent: item.wa_sent || false,
    });
    setEditId(item.id);
    setTab(0);
  };

  const rateColor = (rate) => {
    if (rate >= 75) return 'green';
    if (rate >= 40) return 'orange';
    return 'red';
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>
          <div style={S.titleLeft}>
            <span>Mentor feedback</span>
            <span style={S.tag}>→ Mentor Feedback Tracker</span>
          </div>

          <div style={S.titleRight}>
            <button
              type="button"
              style={{
                ...S.btnSync,
                opacity: syncingSheet ? 0.7 : 1,
                cursor: syncingSheet ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSyncMentorFeedbackSheet}
              disabled={syncingSheet}
            >
              {syncingSheet ? 'Syncing...' : 'Sync Mentor Feedback Sheet'}
            </button>
          </div>
        </div>

        <div style={S.infoBox}>
          📋 Track Google Form sharing status, responses received, and pending follow-ups
          per batch. Pending is auto-calculated from total − received.
        </div>

        <div style={S.tabs}>
          {['Log feedback', 'View records'].map((label, index) => (
            <div
              key={index}
              style={{ ...S.tab, ...(tab === index ? S.tabA : {}) }}
              onClick={() => setTab(index)}
            >
              {label}
            </div>
          ))}
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
                <span>✏️ Editing existing record</span>
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
                <label style={S.label}>Batch *</label>
                <select
                  style={S.select}
                  value={form.batch_id}
                  onChange={(e) => set('batch_id', e.target.value)}
                >
                  <option value="">Select batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_name} — {batch.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Last updated date</label>
                <input
                  style={S.input}
                  type="date"
                  value={form.last_updated_date}
                  onChange={(e) => set('last_updated_date', e.target.value)}
                />
              </div>
            </div>

            <div style={S.toggleRow}>
              <button
                type="button"
                style={S.toggle(form.form_shared)}
                onClick={() => set('form_shared', !form.form_shared)}
                aria-label="Toggle form shared"
              >
                <div style={S.thumb(form.form_shared)} />
              </button>

              <span style={{ fontSize: 12, color: form.form_shared ? G : '#888' }}>
                {form.form_shared
                  ? '✅ Google Form shared with batch'
                  : 'Google Form not shared yet'}
              </span>
            </div>

            {form.form_shared && (
              <div style={S.field}>
                <label style={S.label}>Google Form link</label>
                <input
                  style={S.input}
                  value={form.google_form_link}
                  onChange={(e) => set('google_form_link', e.target.value)}
                  placeholder="https://forms.gle/..."
                />
              </div>
            )}

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>Total batch members</label>
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  placeholder="e.g. 15"
                  value={form.total_members}
                  onChange={(e) => set('total_members', e.target.value)}
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Responses received</label>
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  placeholder="e.g. 10"
                  value={form.received_response}
                  onChange={(e) => set('received_response', e.target.value)}
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Pending (auto-calculated)</label>
                <input style={S.readonly} readOnly value={pending !== '' ? pending : '—'} />
              </div>
            </div>

            {total > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                  Response rate: <strong>{responseRate}%</strong> ({received} of {total})
                </div>
                <div style={{ height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${responseRate}%`,
                      background:
                        responseRate >= 75 ? G : responseRate >= 40 ? '#F59E0B' : '#EF4444',
                      borderRadius: 3,
                      transition: 'width .4s',
                    }}
                  />
                </div>
              </div>
            )}

            <div style={S.field}>
              <label style={S.label}>Followup notes</label>
              <textarea
                style={S.textarea}
                value={form.followup_notes}
                onChange={(e) => set('followup_notes', e.target.value)}
                placeholder="e.g. Reminded 5 students on WhatsApp. Will resend form on Friday..."
              />
            </div>

            {showWAPreview && (
              <div style={S.waBox}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  📱 WhatsApp message preview:
                </div>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.8,
                    fontFamily: 'monospace',
                    fontSize: 11,
                  }}
                >
                  {buildWA()}
                </div>
                <button type="button" style={S.waBtn} onClick={openWA}>
                  Open WhatsApp Web → select contact manually
                </button>
                {form.wa_sent && (
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: 10,
                      color: '#0F6E56',
                      fontWeight: 500,
                    }}
                  >
                    ✓ Sent
                  </span>
                )}
              </div>
            )}

            <div style={S.btnRow}>
              <button type="button" style={S.btnP} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editId ? 'Update record' : 'Save record'}
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
            {feedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa', fontSize: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                No feedback records yet
              </div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Batch</th>
                    <th style={S.th}>Form shared</th>
                    <th style={S.th}>Total</th>
                    <th style={S.th}>Received</th>
                    <th style={S.th}>Pending</th>
                    <th style={S.th}>Rate</th>
                    <th style={S.th}>WA</th>
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((item) => {
                    const totalMembers = item.total_members || 0;
                    const receivedResponses = item.received_response || 0;
                    const rate =
                      totalMembers > 0
                        ? Math.round((receivedResponses / totalMembers) * 100)
                        : 0;

                    return (
                      <tr key={item.id}>
                        <td style={S.td}>{item.last_updated_date?.split('T')[0] || '—'}</td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 500 }}>{item.batch_name || '—'}</div>
                          <div style={{ fontSize: 10, color: '#888' }}>
                            {item.course_name || ''}
                          </div>
                        </td>
                        <td style={S.td}>
                          <span style={S.badge(item.form_shared ? 'green' : 'red')}>
                            {item.form_shared ? 'Shared' : 'Not yet'}
                          </span>
                        </td>
                        <td style={S.td}>{totalMembers || '—'}</td>
                        <td style={S.td}>{receivedResponses}</td>
                        <td style={S.td}>{item.pending ?? '—'}</td>
                        <td style={S.td}>
                          {totalMembers > 0 ? (
                            <span style={S.badge(rateColor(rate))}>{rate}%</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={S.td}>
                          <span style={S.badge(item.wa_sent ? 'green' : '')}>
                            {item.wa_sent ? 'Sent' : '—'}
                          </span>
                        </td>
                        <td style={S.td}>
                          <button
                            type="button"
                            style={S.actBtn}
                            onClick={() => handleEdit(item)}
                          >
                            ✎ Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}