import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getEnquiries,
  getEnquiry,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  logFollowup,
  getFollowupHistory,
  saveDailyCount,
  getDailyCounts,
  convertToStudent,
  syncEnquiriesSheet,
  syncEnquiryFollowupsSheet,
  syncEnquiryDailyCountSheet,
} from '../../api/enquiries';
import { getBatches } from '../../api/batches';
import api from '../../api/axiosInstance';

const G = '#1D9E75';
const PAGE_SIZE = 15;

const STATUSES = ['new', 'followup', 'converted', 'closed', 'not_interested', 'daily_followup'];
const UI_STATUS_OPTIONS = ['new', 'followup', 'converted', 'closed', 'not_interested', 'daily_followup'];
const FOLLOWUP_TICKET_STATUSES = ['open', 'pending', 'closed'];
const SOURCES = ['walkin', 'call', 'whatsapp', 'instagram', 'facebook', 'website', 'reference', 'other'];
const COURSE_FALLBACK = ['Python', 'Java', 'MERN', 'Data Science', 'Testing', 'AWS', 'DevOps', 'UI/UX'];

const statusStyle = (s) =>
  ({
    new: { bg: '#E8F0FE', color: '#185FA5' },
    followup: { bg: '#FEF3C7', color: '#92400E' },
    converted: { bg: '#DCFCE7', color: '#166534' },
    closed: { bg: '#F3F4F6', color: '#4B5563' },
    not_interested: { bg: '#FCEBEB', color: '#A32D2D' },
    daily_followup: { bg: '#E1F5EE', color: '#0F6E56' },
  }[String(s || '').toLowerCase()] || { bg: '#f0f0f0', color: '#888' });

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
  textarea: {
    width: '100%',
    padding: '10px 11px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: 84,
    fontFamily: 'inherit',
  },
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
    width: 700,
    maxWidth: '95vw',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    position: 'relative',
    zIndex: 3001,
  },
  panel: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 2000,
  },
  panelBox: {
    background: '#fff',
    width: 560,
    maxWidth: '96vw',
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
    padding: 28,
    position: 'relative',
    zIndex: 2001,
  },
  label: { fontSize: 11, color: '#666', display: 'block', marginBottom: 4, fontWeight: 500 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 },
  field: { marginBottom: 12 },
  btnP: { padding: '9px 20px', borderRadius: 9, border: 'none', background: G, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnS: { padding: '9px 16px', borderRadius: 9, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer' },
  tabWrap: { display: 'flex', gap: 4, marginBottom: 16, background: '#f5f5f5', borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: '7px 6px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#888' },
  tag: (bg, color) => ({
    background: bg,
    color,
    fontSize: 10,
    padding: '3px 9px',
    borderRadius: 20,
    fontWeight: 600,
    display: 'inline-block',
  }),
};

const todayStr = new Date().toISOString().split('T')[0];

const BLANK = {
  candidatename: '',
  phone: '',
  email: '',
  whatsappnumber: '',
  coursename: '',
  source: 'walkin',
  status: 'new',
  enquirydate: todayStr,
  nextfollowupdate: '',
  counselorname: '',
  notes: '',
};

const BLANK_FOLLOWUP = {
  followupdate: todayStr,
  nextfollowupdate: '',
  ticket_status: 'open',
  remarks: '',
};

const BLANK_DAILY = {
  countdate: todayStr,
  totalcount: '',
  notes: '',
};

const BLANK_CONVERT = {
  batchid: '',
  totalfee: '',
  initialpayment: '',
  joineddate: todayStr,
  notes: '',
};

const fmtDate = (v) => (v ? String(v).split('T')[0] : '—');
const safe = (v) => (v === null || v === undefined || v === '' ? '—' : v);

const normalizeEnquiry = (x = {}) => ({
  ...x,
  candidatename: x.candidatename ?? x.candidate_name ?? x.name ?? '',
  phone: x.phone ?? x.contact ?? x.mobile ?? '',
  email: x.email ?? '',
  whatsappnumber: x.whatsappnumber ?? x.whatsapp_number ?? '',
  coursename: x.coursename ?? x.course_enquired_for ?? x.course_suggested ?? '',
  source: x.source ?? 'walkin',
  status: x.status ?? 'new',
  enquirydate: x.enquirydate ?? x.date ?? '',
  nextfollowupdate: x.nextfollowupdate ?? x.next_followup_date ?? '',
  counselorname: x.counselorname ?? x.assigned_trainer_name ?? '',
  notes: x.notes ?? '',
  createdat: x.createdat ?? x.created_at ?? '',
  updatedat: x.updatedat ?? x.updated_at ?? '',
});

const normalizeFollowup = (x = {}) => ({
  ...x,
  followupdate: x.followupdate ?? x.followup_date ?? '',
  nextfollowupdate: x.nextfollowupdate ?? x.next_followup_date ?? '',
  createdat: x.createdat ?? x.created_at ?? '',
  status: x.status ?? x.ticket_status ?? 'followup',
  remarks: x.remarks ?? '',
});

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [page, setPage] = useState(1);

  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK);

  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [followups, setFollowups] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupForm, setFollowupForm] = useState(BLANK_FOLLOWUP);
  const [savingFollowup, setSavingFollowup] = useState(false);

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertForm, setConvertForm] = useState(BLANK_CONVERT);

  const [showDailyModal, setShowDailyModal] = useState(false);
  const [dailyForm, setDailyForm] = useState(BLANK_DAILY);
  const [dailyCounts, setDailyCounts] = useState([]);
  const [savingDaily, setSavingDaily] = useState(false);

  const [syncingEnquiries, setSyncingEnquiries] = useState(false);
  const [syncingFollowups, setSyncingFollowups] = useState(false);
  const [syncingDaily, setSyncingDaily] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setFollow = (k, v) => setFollowupForm((f) => ({ ...f, [k]: v }));
  const setConvert = (k, v) => setConvertForm((f) => ({ ...f, [k]: v }));
  const setDaily = (k, v) => setDailyForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    setLoading(true);
    try {
      const r = await getEnquiries();
      const list = r?.data?.enquiries || r?.data?.data || r?.data || [];
      setEnquiries((Array.isArray(list) ? list : []).map(normalizeEnquiry));
    } catch (e) {
      setEnquiries([]);
      toast.error(e?.response?.data?.error || 'Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyCounts = async () => {
    try {
      const r = await getDailyCounts();
      const list = r?.data?.counts || r?.data?.dailyCounts || r?.data?.data || r?.data || [];
      setDailyCounts(Array.isArray(list) ? list : []);
    } catch {
      setDailyCounts([]);
    }
  };

  useEffect(() => {
    load();
    loadDailyCounts();

    api
      .get('/trainers/courses')
      .then((r) => setCourses(r?.data?.courses || []))
      .catch(() => setCourses([]));

    getBatches()
      .then((r) => setBatches(r?.data?.batches || []))
      .catch(() => setBatches([]));
  }, []);

  const refreshDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const [one, hist] = await Promise.all([getEnquiry(id), getFollowupHistory(id)]);
      const enquiry = normalizeEnquiry(one?.data?.enquiry || one?.data?.data || one?.data || null);
      const followupList = hist?.data?.followups || hist?.data?.history || hist?.data?.data || hist?.data || [];
      setDetail(enquiry);
      setFollowups((Array.isArray(followupList) ? followupList : []).map(normalizeFollowup));
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to load enquiry details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(BLANK);
    setShowAdd(true);
  };

  const openEdit = (row) => {
    const n = normalizeEnquiry(row);
    setEditingId(n.id);
    setForm({
      candidatename: n.candidatename,
      phone: n.phone,
      email: n.email,
      whatsappnumber: n.whatsappnumber,
      coursename: n.coursename,
      source: n.source || 'walkin',
      status: n.status || 'new',
      enquirydate: (n.enquirydate || todayStr)?.split('T')[0],
      nextfollowupdate: n.nextfollowupdate ? String(n.nextfollowupdate).split('T')[0] : '',
      counselorname: n.counselorname || '',
      notes: n.notes || '',
    });
    setShowAdd(true);
  };

  const openDetail = async (row) => {
    setDetail(normalizeEnquiry(row));
    setDetailTab('overview');
    setFollowups([]);
    await refreshDetail(row.id);
  };

  const handleSave = async () => {
    if (!form.candidatename.trim()) return toast.error('Candidate name is required');
    if (!form.phone.trim()) return toast.error('Phone is required');

    setSaving(true);
    try {
      const payload = {
        date: form.enquirydate || todayStr,
        name: form.candidatename.trim(),
        contact: form.phone.trim(),
        email: form.email.trim() || null,
        course_enquired_for: form.coursename.trim() || null,
        course_suggested: null,
        enquiry_mode:
          form.source === 'walkin'
            ? 'walk_in'
            : form.source === 'reference'
              ? 'referral'
              : form.source === 'website' ||
                  form.source === 'instagram' ||
                  form.source === 'facebook' ||
                  form.source === 'whatsapp'
                ? 'online'
                : 'call',
        source: form.source || null,
        referred_by: form.source === 'reference' ? form.counselorname.trim() || null : null,
        list_type: 'daily_followup',
        status: UI_STATUS_OPTIONS.includes(form.status) ? form.status : 'new',
        assigned_trainer_id: null,
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        await updateEnquiry(editingId, payload);
        toast.success('Enquiry updated successfully');
      } else {
        await createEnquiry(payload);
        toast.success('Enquiry created successfully');
      }

      setShowAdd(false);
      setEditingId(null);
      setForm(BLANK);
      await load();

      if (detail && editingId === detail.id) {
        await refreshDetail(detail.id);
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to save enquiry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = window.confirm(`Delete enquiry "${row.candidatename}"?`);
    if (!ok) return;

    try {
      await deleteEnquiry(row.id);
      toast.success('Enquiry deleted successfully');
      if (detail?.id === row.id) setDetail(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to delete enquiry');
    }
  };

  const handleSaveFollowup = async () => {
    if (!detail?.id) return toast.error('No enquiry selected');
    if (!followupForm.remarks.trim()) return toast.error('Follow-up remarks are required');

    setSavingFollowup(true);
    try {
      await logFollowup(detail.id, {
        followup_date: followupForm.followupdate || todayStr,
        remarks: followupForm.remarks.trim(),
        next_followup_date: followupForm.nextfollowupdate || null,
        ticket_status: followupForm.ticket_status || 'open',
        last_response: null,
        call_picked: false,
        details_pitched: false,
        batch_status: null,
      });

      toast.success('Follow-up logged successfully');
      setShowFollowupModal(false);
      setFollowupForm(BLANK_FOLLOWUP);
      await refreshDetail(detail.id);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to save follow-up');
    } finally {
      setSavingFollowup(false);
    }
  };

  const handleSaveDaily = async () => {
    if (!dailyForm.countdate) return toast.error('Date is required');
    if (dailyForm.totalcount === '' || Number(dailyForm.totalcount) < 0) return toast.error('Enter valid total count');

    setSavingDaily(true);
    try {
      await saveDailyCount({
        date: dailyForm.countdate,
        call_enquiries: Number(dailyForm.totalcount) || 0,
        walk_in_enquiries: 0,
        course_suggested_by_us: null,
        remarks: dailyForm.notes.trim() || null,
      });

      toast.success('Daily count saved');
      setShowDailyModal(false);
      setDailyForm(BLANK_DAILY);
      await loadDailyCounts();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to save daily count');
    } finally {
      setSavingDaily(false);
    }
  };

  const handleConvert = async () => {
    if (!detail?.id) return toast.error('No enquiry selected');
    if (!convertForm.batchid) return toast.error('Please select a batch');

    setConverting(true);
    try {
      await convertToStudent(detail.id, {
        candidate_name: detail.candidatename,
        phone: detail.phone,
        email: detail.email || null,
        whatsapp_number: detail.whatsappnumber || null,
        batch_id: convertForm.batchid,
        total_fee: convertForm.totalfee ? Number(convertForm.totalfee) : 0,
        payment_mode: 'cash',
        initial_payment: convertForm.initialpayment ? Number(convertForm.initialpayment) : 0,
        reference_no: null,
        notes: convertForm.notes.trim() || null,
        joined_date: convertForm.joineddate || todayStr,
        status: 'active',
        certificate_no: null,
        resolution_note: null,
      });

      toast.success('Enquiry converted to student');
      setShowConvertModal(false);
      setConvertForm(BLANK_CONVERT);

      await refreshDetail(detail.id);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to convert enquiry');
    } finally {
      setConverting(false);
    }
  };

  const handleSyncEnquiriesSheet = async () => {
    try {
      setSyncingEnquiries(true);
      const res = await syncEnquiriesSheet();
      if (res?.data?.success) {
        toast.success(res?.data?.message || `Enquiries sheet synced (${res?.data?.count || 0} rows)`);
      } else {
        toast.error(res?.data?.error || 'Enquiries sheet sync failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to sync Enquiries sheet');
    } finally {
      setSyncingEnquiries(false);
    }
  };

  const handleSyncEnquiryFollowupsSheet = async () => {
    try {
      setSyncingFollowups(true);
      const res = await syncEnquiryFollowupsSheet();
      if (res?.data?.success) {
        toast.success(res?.data?.message || `Enquiry Followups sheet synced (${res?.data?.count || 0} rows)`);
      } else {
        toast.error(res?.data?.error || 'Enquiry Followups sheet sync failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to sync Enquiry Followups sheet');
    } finally {
      setSyncingFollowups(false);
    }
  };

  const handleSyncEnquiryDailyCountSheet = async () => {
    try {
      setSyncingDaily(true);
      const res = await syncEnquiryDailyCountSheet();
      if (res?.data?.success) {
        toast.success(res?.data?.message || `Enquiry Daily Count sheet synced (${res?.data?.count || 0} rows)`);
      } else {
        toast.error(res?.data?.error || 'Enquiry Daily Count sheet sync failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to sync Enquiry Daily Count sheet');
    } finally {
      setSyncingDaily(false);
    }
  };

  const filtered = useMemo(() => {
    return enquiries.filter((x) => {
      const q = search.toLowerCase();
      const name = String(x.candidatename || '').toLowerCase();
      const phone = String(x.phone || '');
      const email = String(x.email || '').toLowerCase();
      const course = String(x.coursename || '').toLowerCase();
      const source = String(x.source || '').toLowerCase();
      const status = String(x.status || '').toLowerCase();

      const matchSearch = !search || name.includes(q) || phone.includes(q) || email.includes(q) || course.includes(q);
      const matchStatus = !filterStatus || status === filterStatus;
      const matchSource = !filterSource || source === filterSource;

      return matchSearch && matchStatus && matchSource;
    });
  }, [enquiries, search, filterStatus, filterSource]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const kpis = [
    { label: 'Total', value: enquiries.length, bg: '#f9f9f9', color: '#111' },
    { label: 'New', value: enquiries.filter((x) => String(x.status).toLowerCase() === 'new').length, bg: '#E8F0FE', color: '#185FA5' },
    { label: 'Follow-up', value: enquiries.filter((x) => String(x.status).toLowerCase() === 'followup').length, bg: '#FEF3C7', color: '#92400E' },
    { label: 'Converted', value: enquiries.filter((x) => String(x.status).toLowerCase() === 'converted').length, bg: '#DCFCE7', color: '#166534' },
  ];

  const latestDailyCounts = dailyCounts.slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>Enquiries</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {filtered.length} of {enquiries.length} enquiries
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSyncEnquiriesSheet}
              disabled={syncingEnquiries}
              style={{ ...S.btnS, opacity: syncingEnquiries ? 0.7 : 1, cursor: syncingEnquiries ? 'not-allowed' : 'pointer' }}
            >
              {syncingEnquiries ? 'Syncing Enquiries...' : 'Sync Enquiries Sheet'}
            </button>

            <button
              type="button"
              onClick={handleSyncEnquiryFollowupsSheet}
              disabled={syncingFollowups}
              style={{ ...S.btnS, opacity: syncingFollowups ? 0.7 : 1, cursor: syncingFollowups ? 'not-allowed' : 'pointer' }}
            >
              {syncingFollowups ? 'Syncing Followups...' : 'Sync Enquiry Followups Sheet'}
            </button>

            <button
              type="button"
              onClick={handleSyncEnquiryDailyCountSheet}
              disabled={syncingDaily}
              style={{ ...S.btnS, opacity: syncingDaily ? 0.7 : 1, cursor: syncingDaily ? 'not-allowed' : 'pointer' }}
            >
              {syncingDaily ? 'Syncing Daily Count...' : 'Sync Enquiry Daily Count Sheet'}
            </button>

            <button onClick={() => setShowDailyModal(true)} style={S.btnS}>
              Daily Count
            </button>

            <button onClick={openAdd} style={S.btnP}>
              ➕ Add Enquiry
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: k.bg, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr auto', gap: 8, marginBottom: 14 }}>
          <input
            style={{ ...S.input, minWidth: 220 }}
            placeholder="🔍 Search name, phone, email, course..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            style={S.input}
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            {UI_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            style={S.input}
            value={filterSource}
            onChange={(e) => {
              setFilterSource(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {(search || filterStatus || filterSource) && (
            <button
              onClick={() => {
                setSearch('');
                setFilterStatus('');
                setFilterSource('');
                setPage(1);
              }}
              style={{ ...S.btnS, color: '#DC2626', borderColor: '#fecaca', fontSize: 11 }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#aaa', fontSize: 13 }}>Loading enquiries…</div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#bbb', fontSize: 13 }}>
            {enquiries.length === 0 ? '📭 No enquiries yet' : '🔍 No enquiries match your filters'}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>#</th>
                    <th style={S.th}>Candidate</th>
                    <th style={S.th}>Phone</th>
                    <th style={S.th}>Course</th>
                    <th style={S.th}>Source</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Enquiry Date</th>
                    <th style={S.th}>Next Follow-up</th>
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((x, i) => {
                    const ss = statusStyle(x.status);
                    const name = x.candidatename || '—';
                    const courseName = x.coursename || '';

                    return (
                      <tr
                        key={x.id}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0faf5')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        <td style={{ ...S.td, color: '#ccc', fontSize: 11 }}>{(page - 1) * PAGE_SIZE + i + 1}</td>

                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background: `linear-gradient(135deg,${G},#15c78a)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {name?.[0]?.toUpperCase() || '?'}
                            </div>

                            <div>
                              <div
                                style={{ fontWeight: 700, color: '#111', cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}
                                onClick={() => openDetail(x)}
                              >
                                {name}
                              </div>
                              <div style={{ fontSize: 10, color: '#aaa' }}>{x.email || 'No email'}</div>
                            </div>
                          </div>
                        </td>

                        <td style={S.td}>{safe(x.phone)}</td>

                        <td style={S.td}>
                          {courseName ? <span style={S.tag('#EFF6FF', '#185FA5')}>{courseName}</span> : <span style={{ color: '#ccc' }}>—</span>}
                        </td>

                        <td style={S.td}>
                          <span style={S.tag('#F5F3FF', '#7C3AED')}>{safe(x.source)}</span>
                        </td>

                        <td style={S.td}>
                          <span style={S.tag(ss.bg, ss.color)}>{safe(x.status)}</span>
                        </td>

                        <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{fmtDate(x.enquirydate)}</td>
                        <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{fmtDate(x.nextfollowupdate)}</td>

                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => openDetail(x)}
                              style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                            >
                              👁 View
                            </button>

                            <button
                              onClick={() => openEdit(x)}
                              style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                            >
                              ✏ Edit
                            </button>

                            <button
                              onClick={() => handleDelete(x)}
                              style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#DC2626', cursor: 'pointer' }}
                            >
                              🗑 Delete
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
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 12 }}>Recent Daily Enquiry Counts</div>

        {latestDailyCounts.length === 0 ? (
          <div style={{ color: '#bbb', fontSize: 12, padding: '8px 0' }}>No daily counts recorded yet</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {latestDailyCounts.map((d, i) => (
              <div key={d.id || i} style={{ background: '#f9f9f9', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{fmtDate(d.countdate || d.date)}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: G, lineHeight: 1 }}>{d.totalcount ?? d.total_enquiries ?? d.count ?? 0}</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{d.notes || d.remarks || 'Daily enquiry count'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div
          style={S.modal}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAdd(false);
              setEditingId(null);
              setForm(BLANK);
            }
          }}
        >
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 800, color: G, marginBottom: 4 }}>
              {editingId ? '✏ Edit Enquiry' : '📋 Add New Enquiry'}
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>
              {editingId ? 'Update enquiry details' : 'Add a new lead enquiry to the system'}
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Candidate Name *</label>
                <input style={S.inputFull} value={form.candidatename} onChange={(e) => set('candidatename', e.target.value)} placeholder="Full name" autoFocus />
              </div>

              <div style={S.field}>
                <label style={S.label}>Phone *</label>
                <input style={S.inputFull} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="10-digit mobile" />
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Email</label>
                <input style={S.inputFull} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" />
              </div>

              <div style={S.field}>
                <label style={S.label}>WhatsApp Number</label>
                <input style={S.inputFull} value={form.whatsappnumber} onChange={(e) => set('whatsappnumber', e.target.value)} placeholder="Optional WhatsApp number" />
              </div>
            </div>

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>Course Interested</label>
                <input
                  list="enquiry-course-list"
                  style={S.inputFull}
                  value={form.coursename}
                  onChange={(e) => set('coursename', e.target.value)}
                  placeholder="Type or select course"
                />
                <datalist id="enquiry-course-list">
                  {[...new Set([...courses.map((c) => c.coursename || c.course_name).filter(Boolean), ...COURSE_FALLBACK])].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div style={S.field}>
                <label style={S.label}>Source</label>
                <select style={S.select} value={form.source} onChange={(e) => set('source', e.target.value)}>
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Status</label>
                <select style={S.select} value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {UI_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>Enquiry Date</label>
                <input style={S.inputFull} type="date" value={form.enquirydate} onChange={(e) => set('enquirydate', e.target.value)} />
              </div>

              <div style={S.field}>
                <label style={S.label}>Next Follow-up Date</label>
                <input style={S.inputFull} type="date" value={form.nextfollowupdate} onChange={(e) => set('nextfollowupdate', e.target.value)} />
              </div>

              <div style={S.field}>
                <label style={S.label}>Counselor Name</label>
                <input style={S.inputFull} value={form.counselorname} onChange={(e) => set('counselorname', e.target.value)} placeholder="Staff / counselor" />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Notes</label>
              <textarea
                style={S.textarea}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Any remarks about the enquiry, requirement, budget, timing, etc."
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button style={S.btnP} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editingId ? '💾 Update Enquiry' : '✅ Create Enquiry'}
              </button>

              <button
                style={S.btnS}
                onClick={() => {
                  setShowAdd(false);
                  setEditingId(null);
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
          style={S.panel}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <div style={S.panelBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg,${G},#15c78a)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {detail.candidatename?.[0]?.toUpperCase() || '?'}
                </div>

                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{detail.candidatename}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {detail.phone} • {detail.email || 'No email'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDetail(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <div style={S.tabWrap}>
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'followups', label: `Follow-ups ${followups.length ? `(${followups.length})` : ''}` },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setDetailTab(t.key)}
                  style={{
                    ...S.tab,
                    background: detailTab === t.key ? '#fff' : 'transparent',
                    color: detailTab === t.key ? '#111' : '#888',
                    boxShadow: detailTab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              <button onClick={() => openEdit(detail)} style={S.btnS}>
                ✏ Edit
              </button>

              <button
                onClick={() => {
                  setFollowupForm({
                    followupdate: todayStr,
                    nextfollowupdate: detail.nextfollowupdate ? String(detail.nextfollowupdate).split('T')[0] : '',
                    ticket_status: 'open',
                    remarks: '',
                  });
                  setShowFollowupModal(true);
                }}
                style={S.btnS}
              >
                ➕ Log Follow-up
              </button>

              {String(detail.status).toLowerCase() !== 'converted' && (
                <button
                  onClick={() => {
                    setConvertForm(BLANK_CONVERT);
                    setShowConvertModal(true);
                  }}
                  style={S.btnP}
                >
                  🎓 Convert to Student
                </button>
              )}
            </div>

            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 12 }}>Loading details…</div>
            ) : detailTab === 'overview' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Status', value: <span style={S.tag(statusStyle(detail.status).bg, statusStyle(detail.status).color)}>{safe(detail.status)}</span> },
                    { label: 'Source', value: safe(detail.source) },
                    { label: 'Course', value: safe(detail.coursename) },
                    { label: 'Enquiry Date', value: fmtDate(detail.enquirydate) },
                    { label: 'Next Follow-up', value: fmtDate(detail.nextfollowupdate) },
                    { label: 'Counselor', value: safe(detail.counselorname) },
                    { label: 'WhatsApp', value: safe(detail.whatsappnumber) },
                    { label: 'Updated', value: fmtDate(detail.updatedat || detail.createdat) },
                  ].map((row, i) => (
                    <div key={i} style={{ background: '#f9f9f9', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                        {row.label}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{row.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#FCFCFC', border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4, fontWeight: 700 }}>Notes</div>
                  <div style={{ fontSize: 12, color: '#333', lineHeight: 1.6 }}>{detail.notes || 'No notes added yet'}</div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>Follow-up History</div>
                  <button
                    onClick={() => {
                      setFollowupForm({
                        followupdate: todayStr,
                        nextfollowupdate: '',
                        ticket_status: 'open',
                        remarks: '',
                      });
                      setShowFollowupModal(true);
                    }}
                    style={{ ...S.btnS, fontSize: 11 }}
                  >
                    + Add Follow-up
                  </button>
                </div>

                {followups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: '#bbb', fontSize: 12 }}>No follow-ups yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {followups.map((f, i) => {
                      const fs = statusStyle(f.status);

                      return (
                        <div key={f.id || i} style={{ background: '#fafafa', border: '1px solid #efefef', borderRadius: 10, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span style={S.tag(fs.bg, fs.color)}>{safe(f.status)}</span>
                              <span style={S.tag('#EFF6FF', '#185FA5')}>{fmtDate(f.followupdate || f.createdat)}</span>
                              {f.nextfollowupdate && <span style={S.tag('#FEF3C7', '#92400E')}>Next: {fmtDate(f.nextfollowupdate)}</span>}
                            </div>
                            <span style={{ fontSize: 10, color: '#aaa', whiteSpace: 'nowrap' }}>{fmtDate(f.createdat || f.followupdate)}</span>
                          </div>

                          <div style={{ fontSize: 12, color: '#333', lineHeight: 1.6 }}>{f.remarks || '—'}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showFollowupModal && detail && (
        <div
          style={S.modal}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFollowupModal(false);
              setFollowupForm(BLANK_FOLLOWUP);
            }
          }}
        >
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 800, color: G, marginBottom: 4 }}>📞 Log Follow-up</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>{detail.candidatename}</div>

            <div style={S.row3}>
              <div style={S.field}>
                <label style={S.label}>Follow-up Date</label>
                <input style={S.inputFull} type="date" value={followupForm.followupdate} onChange={(e) => setFollow('followupdate', e.target.value)} />
              </div>

              <div style={S.field}>
                <label style={S.label}>Next Follow-up Date</label>
                <input style={S.inputFull} type="date" value={followupForm.nextfollowupdate} onChange={(e) => setFollow('nextfollowupdate', e.target.value)} />
              </div>

              <div style={S.field}>
                <label style={S.label}>Ticket Status</label>
                <select style={S.select} value={followupForm.ticket_status} onChange={(e) => setFollow('ticket_status', e.target.value)}>
                  {FOLLOWUP_TICKET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Remarks *</label>
              <textarea
                style={S.textarea}
                value={followupForm.remarks}
                onChange={(e) => setFollow('remarks', e.target.value)}
                placeholder="What happened in the follow-up call or visit?"
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button style={S.btnP} onClick={handleSaveFollowup} disabled={savingFollowup}>
                {savingFollowup ? 'Saving…' : '✅ Save Follow-up'}
              </button>

              <button
                style={S.btnS}
                onClick={() => {
                  setShowFollowupModal(false);
                  setFollowupForm(BLANK_FOLLOWUP);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showConvertModal && detail && (
        <div
          style={S.modal}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConvertModal(false);
          }}
        >
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 800, color: G, marginBottom: 4 }}>🎓 Convert to Student</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>{detail.candidatename}</div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Assign Batch</label>
                <select style={S.select} value={convertForm.batchid} onChange={(e) => setConvert('batchid', e.target.value)}>
                  <option value="">Select batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_name || b.batchname} {(b.course_name || b.coursename) ? `• ${b.course_name || b.coursename}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Joined Date</label>
                <input style={S.inputFull} type="date" value={convertForm.joineddate} onChange={(e) => setConvert('joineddate', e.target.value)} />
              </div>
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Total Fee</label>
                <input style={S.inputFull} type="number" min="0" value={convertForm.totalfee} onChange={(e) => setConvert('totalfee', e.target.value)} placeholder="e.g. 25000" />
              </div>

              <div style={S.field}>
                <label style={S.label}>Initial Payment</label>
                <input
                  style={S.inputFull}
                  type="number"
                  min="0"
                  value={convertForm.initialpayment}
                  onChange={(e) => setConvert('initialpayment', e.target.value)}
                  placeholder="Amount paid today"
                />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Notes</label>
              <textarea style={S.textarea} value={convertForm.notes} onChange={(e) => setConvert('notes', e.target.value)} placeholder="Optional notes for student conversion" />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button style={S.btnP} onClick={handleConvert} disabled={converting}>
                {converting ? 'Converting…' : '✅ Convert Now'}
              </button>

              <button style={S.btnS} onClick={() => setShowConvertModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDailyModal && (
        <div
          style={S.modal}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDailyModal(false);
          }}
        >
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 800, color: G, marginBottom: 4 }}>📅 Daily Enquiry Count</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>Record the total enquiry count for a day</div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Date</label>
                <input style={S.inputFull} type="date" value={dailyForm.countdate} onChange={(e) => setDaily('countdate', e.target.value)} />
              </div>

              <div style={S.field}>
                <label style={S.label}>Total Count</label>
                <input style={S.inputFull} type="number" min="0" value={dailyForm.totalcount} onChange={(e) => setDaily('totalcount', e.target.value)} placeholder="e.g. 14" />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Notes</label>
              <textarea
                style={S.textarea}
                value={dailyForm.notes}
                onChange={(e) => setDaily('notes', e.target.value)}
                placeholder="Optional note, e.g. campaign day, walk-ins increased, etc."
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
              <button style={S.btnP} onClick={handleSaveDaily} disabled={savingDaily}>
                {savingDaily ? 'Saving…' : '✅ Save Daily Count'}
              </button>

              <button style={S.btnS} onClick={() => setShowDailyModal(false)}>
                Close
              </button>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#111', marginBottom: 10 }}>Recent Entries</div>

            {dailyCounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#bbb', fontSize: 12 }}>No daily counts yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dailyCounts.slice(0, 12).map((d, i) => (
                  <div
                    key={d.id || i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      background: '#fafafa',
                      border: '1px solid #efefef',
                      borderRadius: 10,
                      padding: '10px 12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{fmtDate(d.countdate || d.date)}</div>
                      <div style={{ fontSize: 10, color: '#888' }}>{d.notes || d.remarks || 'No notes'}</div>
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 800, color: G }}>{d.totalcount ?? d.total_enquiries ?? d.count ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}