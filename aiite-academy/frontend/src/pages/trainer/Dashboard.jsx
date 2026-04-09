import React, { useEffect, useState } from 'react';
import { getTodayStatus, getMyAttendance, getEscalationsAgainstMe, checkin, checkout } from '../../api/attendance';

const statusColors = {
  present:  '#437a22',
  absent:   '#a12c7b',
  late:     '#da7101',
  half_day: '#006494'
};

export default function TrainerDashboard() {
  const [todayStatus,   setTodayStatus]   = useState(null);
  const [monthRecords,  setMonthRecords]  = useState([]);
  const [escalations,   setEscalations]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');

  const fetchAll = async () => {
  setLoading(true);
  setError('');
  try {
    const [todayRes, monthRes, escRes] = await Promise.all([
      getTodayStatus(),
      getMyAttendance(),
      getEscalationsAgainstMe(),
    ]);
    setTodayStatus(todayRes.data.data);
    setMonthRecords(monthRes.data.data || []);
    setEscalations(escRes.data.data   || []);
  } catch (e) {
    setError('Failed to load dashboard data. Please try again.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const handleCheckIn = async () => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      // Get real public IP from browser side
      const ipRes    = await fetch('https://api.ipify.org?format=json');
      const { ip }   = await ipRes.json();
      await checkin({ clientIP: ip });
      setSuccess('✅ Checked in successfully!');
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Check-in failed. Make sure you are on office WiFi.');
    } finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const ipRes    = await fetch('https://api.ipify.org?format=json');
      const { ip }   = await ipRes.json();
      await checkout({ clientIP: ip });
      setSuccess('👋 Checked out successfully!');
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Check-out failed. Make sure you are on office WiFi.');
    } finally { setActionLoading(false); }
  };

  const presentCount = monthRecords.filter(r => r.status === 'present').length;
  const totalDays    = monthRecords.length;
  const openEsc      = escalations.filter(e => e.status === 'open').length;

  const fmt = (ts) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) return (
    <div style={s.center}>
      <div style={s.spinner} />
      <p style={{ color: '#7a7974', marginTop: 14, fontSize: 14 }}>Loading your dashboard...</p>
    </div>
  );

  return (
    <div style={s.page}>

      {/* ── Page Header ── */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>My Dashboard</h1>
          <p style={s.pageSubtitle}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button style={s.refreshBtn} onClick={fetchAll} title="Refresh">
          🔄 Refresh
        </button>
      </div>

      {/* ── Alerts ── */}
      {error   && <div style={s.alertErr}><span>⚠️</span> {error}</div>}
      {success && <div style={s.alertOk}><span>✅</span> {success}</div>}

      {/* ── KPI Row ── */}
      <div style={s.kpiRow}>
        <KPICard icon="📅" label="Present This Month"
          value={totalDays > 0 ? `${presentCount} / ${totalDays}` : '—'}
          color="#437a22" />
        <KPICard icon="🕐" label="Today's Status"
          value={todayStatus ? todayStatus.status.replace('_', ' ').toUpperCase() : 'NOT MARKED'}
          color={todayStatus ? (statusColors[todayStatus.status] || '#da7101') : '#da7101'} />
        <KPICard icon="⚠️" label="Open Escalations"
          value={openEsc}
          color={openEsc > 0 ? '#a13544' : '#437a22'} />
        <KPICard icon="📊" label="Attendance %"
          value={totalDays > 0 ? `${Math.round((presentCount / totalDays) * 100)}%` : '—'}
          color="#006494" />
      </div>

      {/* ── Attendance Card ── */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>📍 Mark Attendance</h2>
          <span style={s.wifiBadge}>🔒 Office WiFi Only</span>
        </div>
        <p style={s.wifiNote}>
          Only works when connected to office WiFi &nbsp;
          <code style={s.code}>49.206.9.252</code>
        </p>

        {todayStatus ? (
          <div style={s.checkedInBox}>
            <div style={s.checkedInRow}>
              <span style={{ color: '#437a22', fontWeight: 600 }}>🟢 Checked In</span>
              <strong style={{ fontFamily: 'monospace', fontSize: 16 }}>{fmt(todayStatus.check_in)}</strong>
            </div>
            {todayStatus.check_out ? (
              <div style={s.checkedInRow}>
                <span style={{ color: '#a12c7b', fontWeight: 600 }}>🔴 Checked Out</span>
                <strong style={{ fontFamily: 'monospace', fontSize: 16 }}>{fmt(todayStatus.check_out)}</strong>
              </div>
            ) : (
              <>
                <div style={s.checkedInRow}>
                  <span style={{ color: '#da7101' }}>⏳ Still in office</span>
                  <span style={{ color: '#7a7974', fontSize: 13 }}>Check out when leaving</span>
                </div>
                <button
                  style={{ ...s.btn, background: '#a12c7b', marginTop: 14 }}
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                >
                  {actionLoading ? '⏳ Processing...' : '🔴 Mark Check-Out'}
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{ ...s.btn, background: '#01696f' }}
              onClick={handleCheckIn}
              disabled={actionLoading}
            >
              {actionLoading ? '⏳ Processing...' : '✅ Mark Check-In'}
            </button>
            <span style={{ color: '#7a7974', fontSize: 13 }}>Attendance not marked yet today</span>
          </div>
        )}
      </div>

      {/* ── Two Column ── */}
      <div style={s.twoCol}>

        {/* This Month */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>📆 This Month's Attendance</h2>
          {monthRecords.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 32 }}>📭</span>
              <p>No records this month yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr style={{ background: '#f9f8f5' }}>
                    {['Date','Check In','Check Out','Status'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthRecords.map(r => (
                    <tr key={r.id} style={s.tr}>
                      <td style={s.td}>{fmtDate(r.date)}</td>
                      <td style={s.td}>{fmt(r.check_in)}</td>
                      <td style={s.td}>{fmt(r.check_out)}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, background: (statusColors[r.status] || '#7a7974') + '20', color: statusColors[r.status] || '#7a7974' }}>
                          {r.status?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Escalations */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>⚠️ Escalations Against Me</h2>
          {escalations.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 32 }}>🎉</span>
              <p>No escalations. Keep it up!</p>
            </div>
          ) : escalations.map(e => (
            <div key={e.id} style={s.escItem}>
              <div style={s.escHeader}>
                <span style={{ ...s.badge, background: e.status === 'open' ? '#a1354420' : '#437a2220', color: e.status === 'open' ? '#a13544' : '#437a22' }}>
                  {e.status}
                </span>
                <span style={{ fontSize: 12, color: '#bab9b4' }}>{fmtDate(e.escalation_date)}</span>
              </div>
              <p style={s.escDesc}>{e.description || 'No description provided.'}</p>
              <div style={s.escFooter}>
                <span>👤 Reported by: <strong>{e.reported_by || '—'}</strong></span>
                <span style={{ ...s.badge, background: '#da710120', color: '#da7101' }}>
                  Count: {e.no_of_count || 1}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function KPICard({ icon, label, value, color }) {
  return (
    <div style={{ ...s.kpiCard, borderTop: `3px solid ${color}` }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ fontSize: 26, fontWeight: 700, color, margin: '6px 0 2px', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#7a7974', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

const s = {
  page:        { padding: '24px', maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
  pageHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  pageTitle:   { fontSize: 22, fontWeight: 700, color: '#28251d', margin: 0 },
  pageSubtitle:{ fontSize: 13, color: '#7a7974', marginTop: 4 },
  refreshBtn:  { background: '#f3f0ec', border: '1px solid #dcd9d5', borderRadius: 8, padding: '7px 14px', fontSize: 13, color: '#28251d', cursor: 'pointer' },
  kpiRow:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 },
  kpiCard:     { background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  card:        { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle:   { fontSize: 15, fontWeight: 600, color: '#28251d', margin: 0 },
  twoCol:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  wifiBadge:   { background: '#cedcd8', color: '#01696f', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 },
  wifiNote:    { fontSize: 12, color: '#7a7974', marginBottom: 16 },
  code:        { background: '#f3f0ec', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 },
  btn:         { color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  checkedInBox:{ background: '#f9f8f5', borderRadius: 8, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 },
  checkedInRow:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:          { textAlign: 'left', fontSize: 11, color: '#7a7974', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '8px 10px', borderBottom: '2px solid #dcd9d5' },
  tr:          { borderBottom: '1px solid #f0ede9' },
  td:          { padding: '10px 10px', color: '#28251d', fontVariantNumeric: 'tabular-nums' },
  badge:       { borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, display: 'inline-block' },
  escItem:     { borderBottom: '1px solid #f0ede9', paddingBottom: 14, marginBottom: 14 },
  escHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  escDesc:     { fontSize: 13, color: '#28251d', margin: '4px 0 8px', lineHeight: 1.5 },
  escFooter:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#7a7974' },
  emptyState:  { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', color: '#7a7974', gap: 8, fontSize: 13 },
  alertErr:    { background: '#fce8f3', color: '#a12c7b', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' },
  alertOk:     { background: '#d4dfcc', color: '#437a22', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' },
  center:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' },
  spinner:     { width: 36, height: 36, border: '3px solid #dcd9d5', borderTop: '3px solid #01696f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};