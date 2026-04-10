import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const OFFICE_IP = '49.206.9.252';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (t) => t ? new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtHours = (h) => h ? parseFloat(h).toFixed(1) + 'h' : '0.0h';

const STATUS_COLOR = { present: '#437a22', absent: '#a12c7b', late: '#da7101', half_day: '#006494' };
const ESC_COLOR    = { open: '#a13544', in_review: '#da7101', resolved: '#437a22', closed: '#7a7974' };

export default function TrainerDashboard() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [actionMsg, setActionMsg]     = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, todayRes] = await Promise.all([
        axios.get(`${API_BASE}/trainers/dashboard`, { headers }),
        axios.get(`${API_BASE}/attendance/today-status`, { headers }),
      ]);
      setData(dashRes.data.data);
      setTodayAttendance(todayRes.data.data);
    } catch (err) {
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setActionMsg({ type: '', text: '' });
    try {
      await axios.post(`${API_BASE}/attendance/checkin`, {}, { headers });
      setActionMsg({ type: 'ok', text: '✅ Checked in successfully!' });
      fetchDashboard();
    } catch (err) {
      setActionMsg({ type: 'err', text: err.response?.data?.message || 'Check-in failed. Make sure you are on office WiFi.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setActionMsg({ type: '', text: '' });
    try {
      await axios.post(`${API_BASE}/attendance/checkout`, {}, { headers });
      setActionMsg({ type: 'ok', text: '👋 Checked out successfully!' });
      fetchDashboard();
    } catch (err) {
      setActionMsg({ type: 'err', text: err.response?.data?.message || 'Check-out failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div style={S.center}>
      <div style={S.spinner} />
      <p style={{ color: '#7a7974', marginTop: 12 }}>Loading dashboard...</p>
    </div>
  );

  const att      = data?.attendance   || {};
  const wl       = data?.worklog      || {};
  const esc      = data?.esc_counts   || {};
  const batches  = data?.batches      || [];
  const escs     = data?.escalations  || [];
  const recent   = data?.recent_attendance || [];

  const presentDays  = parseInt(att.present)  || 0;
  const totalDays    = parseInt(att.total_days) || 0;
  const totalHours   = parseFloat(wl.total_hours) || 0;
  const starPoints   = parseFloat(wl.total_star_points) || 0;
  const activeBatches = batches.length;
  const openEsc      = parseInt(esc.open) || 0;
  const attendRate   = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>My Dashboard</h1>
          <p style={S.subtitle}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button style={S.refreshBtn} onClick={fetchDashboard}>⟳ Refresh</button>
      </div>

      {/* ── Alerts ── */}
      {error && <div style={S.alertErr}>⚠️ {error}</div>}
      {actionMsg.text && (
        <div style={actionMsg.type === 'ok' ? S.alertOk : S.alertErr}>
          {actionMsg.text}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={S.kpiRow}>
        <KPICard label="Days Present"   value={`${presentDays}/${totalDays}`} color="#437a22"                            icon="📅" />
        <KPICard label="Star Points"    value={starPoints.toFixed(1)}          color="#d19900"                           icon="⭐" />
        <KPICard label="Hours Logged"   value={fmtHours(totalHours)}           color="#006494"                           icon="⏱️" />
        <KPICard label="Active Batches" value={activeBatches}                  color="#01696f"                           icon="📚" />
        <KPICard label="Open Escalations" value={openEsc}                      color={openEsc > 0 ? '#a13544' : '#437a22'} icon="⚠️" />
      </div>

      {/* ── Main Grid ── */}
      <div style={S.mainGrid}>

        {/* LEFT — Attendance */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>📍 Mark Attendance</h2>
          <p style={S.wifiNote}>
            🔒 Only works on office WiFi &nbsp;
            <code style={S.code}>{OFFICE_IP}</code>
          </p>

          {todayAttendance ? (
            <div style={S.checkedBox}>
              <div style={S.checkedRow}>
                <span>🟢 Check-in</span>
                <strong>{fmtTime(todayAttendance.check_in)}</strong>
              </div>
              <div style={S.checkedRow}>
                <span>{todayAttendance.check_out ? '🔴 Check-out' : '⏳ Still in office'}</span>
                <strong>{fmtTime(todayAttendance.check_out)}</strong>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ ...S.badge, background: STATUS_COLOR[todayAttendance.status] + '22', color: STATUS_COLOR[todayAttendance.status] }}>
                  {todayAttendance.status}
                </span>
              </div>
              {!todayAttendance.check_out && (
                <button style={{ ...S.btn, background: '#a12c7b', marginTop: 12, width: '100%' }}
                  onClick={handleCheckOut} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : '🔴 Mark Check-Out'}
                </button>
              )}
            </div>
          ) : (
            <button style={{ ...S.btn, background: '#01696f', width: '100%' }}
              onClick={handleCheckIn} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : '✅ Mark Check-In'}
            </button>
          )}

          <p style={{ ...S.wifiNote, marginTop: 8, textAlign: 'center' }}>
            {todayAttendance ? '' : 'Attendance not marked yet today'}
          </p>
        </div>

        {/* RIGHT — This Month Summary */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>📊 This Month Summary</h2>

          {/* Attendance rate bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={S.barLabel}>
              <span>Attendance rate</span>
              <strong style={{ color: attendRate >= 75 ? '#437a22' : '#a13544' }}>{attendRate}%</strong>
            </div>
            <div style={S.barBg}>
              <div style={{ ...S.barFill, width: `${attendRate}%`, background: attendRate >= 75 ? '#437a22' : '#a13544' }} />
            </div>
          </div>

          <div style={S.summaryList}>
            <SummaryRow icon="🟢" label="Present"     value={`${presentDays} days`}             color="#437a22" />
            <SummaryRow icon="🔴" label="Absent"      value={`${parseInt(att.absent) || 0} days`}  color="#a12c7b" />
            <SummaryRow icon="🟠" label="Late"        value={`${parseInt(att.late) || 0} days`}    color="#da7101" />
            <SummaryRow icon="⭐" label="Star Points" value={starPoints.toFixed(1)}               color="#d19900" />
            <SummaryRow icon="⏱️" label="Total Hours" value={fmtHours(totalHours)}                color="#006494" />
          </div>
        </div>
      </div>

      {/* ── Active Batches ── */}
      {batches.length > 0 && (
        <div style={S.card}>
          <h2 style={S.cardTitle}>📚 Active Batches</h2>
          <table style={S.table}>
            <thead>
              <tr>
                {['Batch Name', 'Start Date', 'End Date', 'Students', 'Status'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id}>
                  <td style={S.td}><strong>{b.batch_name}</strong></td>
                  <td style={S.td}>{fmtDate(b.batch_start_date)}</td>
                  <td style={S.td}>{fmtDate(b.batch_end_date)}</td>
                  <td style={S.td}>{b.student_count}</td>
                  <td style={S.td}>
                    <span style={{ ...S.badge, background: '#01696f22', color: '#01696f' }}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Recent Attendance ── */}
      {recent.length > 0 && (
        <div style={S.card}>
          <h2 style={S.cardTitle}>🗓️ Recent Attendance</h2>
          <table style={S.table}>
            <thead>
              <tr>
                {['Date', 'Check In', 'Check Out', 'Status'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={i}>
                  <td style={S.td}>{fmtDate(r.date)}</td>
                  <td style={S.td}>{fmtTime(r.check_in)}</td>
                  <td style={S.td}>{fmtTime(r.check_out)}</td>
                  <td style={S.td}>
                    <span style={{ ...S.badge, background: (STATUS_COLOR[r.status] || '#7a7974') + '22', color: STATUS_COLOR[r.status] || '#7a7974' }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Escalations ── */}
      {escs.length > 0 && (
        <div style={S.card}>
          <h2 style={S.cardTitle}>⚠️ Recent Escalations</h2>
          {escs.map(e => (
            <div key={e.id} style={S.escItem}>
              <div style={S.escHeader}>
                <span style={{ fontSize: 13, color: '#28251d' }}>{e.description || 'No description'}</span>
                <span style={{ ...S.badge, background: (ESC_COLOR[e.status] || '#7a7974') + '22', color: ESC_COLOR[e.status] || '#7a7974' }}>
                  {e.status}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#bab9b4', marginTop: 4 }}>
                {fmtDate(e.escalation_date)} &nbsp;•&nbsp; Count: {e.no_of_count || 1}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

function KPICard({ label, value, color, icon }) {
  return (
    <div style={{ ...S.kpiCard, borderTop: `3px solid ${color}` }}>
      <span style={S.kpiIcon}>{icon}</span>
      <div style={{ ...S.kpiValue, color }}>{value}</div>
      <div style={S.kpiLabel}>{label}</div>
    </div>
  );
}

function SummaryRow({ icon, label, value, color }) {
  return (
    <div style={S.summaryRow}>
      <span>{icon} {label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

const S = {
  page:       { padding: '24px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, sans-serif' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:      { fontSize: 22, fontWeight: 700, color: '#28251d', margin: 0 },
  subtitle:   { fontSize: 13, color: '#7a7974', marginTop: 4 },
  refreshBtn: { background: '#f3f0ec', border: '1px solid #dcd9d5', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#28251d' },
  kpiRow:     { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 },
  kpiCard:    { background: '#fff', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  kpiIcon:    { fontSize: 20 },
  kpiValue:   { fontSize: 24, fontWeight: 700, margin: '6px 0 2px' },
  kpiLabel:   { fontSize: 11, color: '#7a7974', textTransform: 'uppercase', letterSpacing: '0.05em' },
  mainGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  card:       { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16 },
  cardTitle:  { fontSize: 15, fontWeight: 600, color: '#28251d', marginBottom: 14, marginTop: 0 },
  wifiNote:   { fontSize: 12, color: '#7a7974', marginBottom: 14 },
  code:       { background: '#f3f0ec', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.05em' },
  btn:        { color: '#fff', border: 'none', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  checkedBox: { background: '#f9f8f5', borderRadius: 8, padding: '14px 16px' },
  checkedRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 },
  badge:      { borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 },
  barLabel:   { display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 },
  barBg:      { background: '#f3f0ec', borderRadius: 99, height: 8 },
  barFill:    { height: 8, borderRadius: 99, transition: 'width 0.4s ease' },
  summaryList:{ display: 'flex', flexDirection: 'column', gap: 10 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid #f3f0ec' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { textAlign: 'left', fontSize: 11, color: '#7a7974', textTransform: 'uppercase', padding: '6px 8px', borderBottom: '1px solid #dcd9d5' },
  td:         { fontSize: 13, padding: '9px 8px', borderBottom: '1px solid #f3f0ec', color: '#28251d' },
  escItem:    { paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #f3f0ec' },
  escHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  alertErr:   { background: '#fce8f3', color: '#a12c7b', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  alertOk:    { background: '#d4dfcc', color: '#437a22', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  center:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 },
  spinner:    { width: 36, height: 36, border: '3px solid #dcd9d5', borderTop: '3px solid #01696f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};