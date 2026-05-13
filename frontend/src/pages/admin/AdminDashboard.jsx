import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, BookOpen, UserSquare2, ClipboardList,
  CircleDollarSign, Hourglass, Briefcase, ShieldAlert,
  CalendarDays, FileText, PhoneCall, TrendingUp, Activity,
  AlertTriangle, CheckCircle2, LayoutDashboard, GraduationCap,
} from 'lucide-react';
import { getDashboard } from '../../api/admin';

const PRIMARY      = '#1D9E75';
const PRIMARY_SOFT = '#EAF7F1';
const BG           = '#F0F2F5';
const CARD         = '#FFFFFF';
const TEXT         = '#111827';
const MUTED        = '#6B7280';
const SOFT_TEXT    = '#9CA3AF';
const BORDER       = '#E5E7EB';

const QUICK_ACTIONS = [
  { key: 'students',    label: 'Students',    icon: Users },
  { key: 'enquiries',   label: 'Enquiries',   icon: ClipboardList },
  { key: 'batches',     label: 'Batches',     icon: BookOpen },
  { key: 'trainers',    label: 'Trainers',    icon: UserSquare2 },
  { key: 'placements',  label: 'Placements',  icon: Briefcase },
  { key: 'escalations', label: 'Escalations', icon: ShieldAlert },
  { key: 'followups',   label: 'Followups',   icon: PhoneCall },
  { key: 'worklog',     label: 'Work Logs',   icon: FileText },
];

const KPI_CARDS = [
  { key: 'total_students',   label: 'Total Students',    icon: GraduationCap,    tone: 'green' },
  { key: 'active_batches',   label: 'Active Batches',    icon: BookOpen,         tone: 'blue' },
  { key: 'total_trainers',   label: 'Total Trainers',    icon: UserSquare2,      tone: 'violet' },
  { key: 'enquiries_month',  label: 'Monthly Enquiries', icon: ClipboardList,    tone: 'amber' },
  { key: 'fee_collected',    label: 'Fee Collected',     icon: CircleDollarSign, tone: 'green',  isCurrency: true },
  { key: 'fee_pending',      label: 'Fee Pending',       icon: Hourglass,        tone: 'red',    isCurrency: true },
  { key: 'total_placed',     label: 'Students Placed',   icon: Briefcase,        tone: 'cyan' },
  { key: 'open_escalations', label: 'Open Escalations',  icon: ShieldAlert,      tone: 'red' },
];

const toneMap = {
  green:  { iconBg: '#E7F7F0', iconColor: '#0F6E56', chipBg: '#E7F7F0', chipColor: '#0F6E56' },
  blue:   { iconBg: '#EDF4FF', iconColor: '#185FA5', chipBg: '#EDF4FF', chipColor: '#185FA5' },
  violet: { iconBg: '#F3EEFF', iconColor: '#6D3DCC', chipBg: '#F3EEFF', chipColor: '#6D3DCC' },
  amber:  { iconBg: '#FFF5E8', iconColor: '#B76A07', chipBg: '#FFF5E8', chipColor: '#B76A07' },
  red:    { iconBg: '#FDEEEE', iconColor: '#B42318', chipBg: '#FDEEEE', chipColor: '#B42318' },
  cyan:   { iconBg: '#EAF8FB', iconColor: '#0E7490', chipBg: '#EAF8FB', chipColor: '#0E7490' },
  gray:   { iconBg: '#F3F4F6', iconColor: '#4B5563', chipBg: '#F3F4F6', chipColor: '#4B5563' },
};

function formatCurrency(val) {
  const n = Number(val || 0);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}
function formatNumber(val) { return Number(val || 0).toLocaleString('en-IN'); }

function card(extra = {}) {
  return {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
    ...extra,
  };
}

function SectionHeading({ icon: Icon, title, subtitle, right }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{
          width:28, height:28, borderRadius:8,
          background:PRIMARY_SOFT, color:PRIMARY,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <Icon size={14} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:TEXT }}>{title}</div>
          {subtitle && <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{subtitle}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

function StatusBadge({ children, tone = 'gray' }) {
  const t = toneMap[tone] || toneMap.gray;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 8px', borderRadius:999,
      background:t.chipBg, color:t.chipColor,
      fontSize:11, fontWeight:700, lineHeight:1, whiteSpace:'nowrap',
    }}>
      {children}
    </span>
  );
}

function KpiCard({ item, value }) {
  const tone = toneMap[item.tone] || toneMap.gray;
  const Icon = item.icon;
  const display = item.isCurrency ? formatCurrency(value) : formatNumber(value);
  return (
    <div style={{ ...card(), padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{
          width:34, height:34, borderRadius:9,
          background:tone.iconBg, color:tone.iconColor,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon size={16} strokeWidth={2.2} />
        </div>
        <span style={{ fontSize:10, color:SOFT_TEXT, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>
          Overview
        </span>
      </div>
      <div>
        <div style={{ fontSize:11, color:MUTED, fontWeight:500 }}>{item.label}</div>
        <div style={{ fontSize:22, fontWeight:800, color:TEXT, lineHeight:1.1, letterSpacing:'-0.03em', marginTop:4 }}>
          {display}
        </div>
      </div>
    </div>
  );
}

function TopActionButton({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onNavigate?.(item.key)}
      style={{
        height:32, padding:'0 10px', borderRadius:8,
        border:`1px solid ${BORDER}`, background:'#fff', color:TEXT,
        display:'inline-flex', alignItems:'center', gap:6,
        fontSize:12, fontWeight:600, cursor:'pointer',
        transition:'all 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#CFEADC'; e.currentTarget.style.background='#F7FDFB'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.background='#fff'; }}
    >
      <Icon size={13} strokeWidth={2.2} />
      <span>{item.label}</span>
    </button>
  );
}

function SummaryTile({ icon: Icon, label, value }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.09)',
      border:'1px solid rgba(255,255,255,0.12)',
      borderRadius:10, padding:'10px 12px',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.75)', fontSize:11, fontWeight:600 }}>
        <Icon size={12} strokeWidth={2.2} />
        <span>{label}</span>
      </div>
      <div style={{ marginTop:6, fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
        {value}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, children }) {
  return (
    <div style={{ ...card(), padding:14 }}>
      <SectionHeading icon={Icon} title={title} subtitle={subtitle} />
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label, isCurrency }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'#fff', border:`1px solid ${BORDER}`,
      borderRadius:10, padding:'8px 10px',
      boxShadow:'0 8px 24px rgba(15,23,42,0.1)', fontSize:12,
    }}>
      <div style={{ fontWeight:700, color:TEXT, marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:12, marginBottom:3 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:p.color, display:'inline-block' }} />
            <span style={{ color:MUTED }}>{p.name}</span>
          </div>
          <span style={{ color:TEXT, fontWeight:700 }}>
            {isCurrency ? formatCurrency(p.value) : formatNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AlertPanel({ icon: Icon, title, subtitle, tone = 'gray', items, emptyText, renderItem }) {
  const hasItems = items?.length > 0;
  return (
    <div style={{ ...card(), padding:14 }}>
      <SectionHeading
        icon={Icon} title={title} subtitle={subtitle}
        right={
          hasItems
            ? <StatusBadge tone={tone}>{items.length} items</StatusBadge>
            : <StatusBadge tone="green"><CheckCircle2 size={10} strokeWidth={2.5} /> Clear</StatusBadge>
        }
      />
      {!hasItems ? (
        <div style={{
          border:`1px dashed ${BORDER}`, borderRadius:8,
          padding:16, textAlign:'center', color:SOFT_TEXT, fontSize:12,
        }}>{emptyText}</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ border:`1px solid ${BORDER}`, borderRadius:8, padding:10, background:'#FCFDFE' }}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricTile({ label, value, tone = 'gray' }) {
  return (
    <div style={{ border:`1px solid ${BORDER}`, background:'#FCFDFE', borderRadius:8, padding:10 }}>
      <div style={{ fontSize:11, color:MUTED, fontWeight:500 }}>{label}</div>
      <div style={{ marginTop:4, fontSize:18, fontWeight:800, color:TEXT, letterSpacing:'-0.02em' }}>
        {formatNumber(value)}
      </div>
      <div style={{ marginTop:6 }}>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign:'left', padding:'8px 10px',
  borderBottom:`1px solid ${BORDER}`,
  fontSize:11, color:MUTED, fontWeight:700,
  textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap',
};
const tdStyle = {
  padding:'9px 10px',
  borderBottom:'1px solid #F1F5F9',
  color:TEXT, fontSize:13,
};

export default function AdminDashboard({ onNavigate }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
      <div style={{
        width:32, height:32, border:'3px solid #E5E7EB',
        borderTopColor:PRIMARY, borderRadius:'50%',
        animation:'spin 0.7s linear infinite',
      }} />
      <div style={{ fontSize:12, color:MUTED }}>Loading dashboard…</div>
    </div>
  );

  if (!data) return (
    <div style={{ ...card(), margin:16, padding:24, textAlign:'center', color:MUTED, fontSize:13 }}>
      Failed to load dashboard data.
    </div>
  );

  const {
    metrics={}, trainer_performance=[], enquiry_funnel=[],
    recent_escalations=[], charts={}, alerts={}, today={},
  } = data;

  const funnelMap = {};
  enquiry_funnel.forEach(r => { funnelMap[r.status] = parseInt(r.count,10)||0; });

  const totalAlerts =
    (alerts?.overdue_fees?.length ?? 0) +
    (alerts?.stale_enquiries?.length ?? 0) +
    (alerts?.inactive_batches?.length ?? 0);

  const todayStats = [
    { icon:FileText,        label:'Work Logs',      value:formatNumber(today?.work_logs ?? 0) },
    { icon:Users,           label:'Active Trainers', value:formatNumber(today?.active_trainers ?? 0) },
    { icon:ClipboardList,   label:'Enquiries',       value:formatNumber(today?.enquiries ?? 0) },
    { icon:CircleDollarSign,label:'Fee Collected',   value:formatCurrency(today?.fee_collected ?? 0) },
    { icon:GraduationCap,   label:'Enrolled',        value:formatNumber(today?.students_joined ?? 0) },
    { icon:Briefcase,       label:'Placements',      value:formatNumber(today?.placements ?? 0) },
  ];

  return (
    <div style={{ background:BG, width:'100%', padding:16, display:'flex', flexDirection:'column', gap:14 }}>

      {/* Header */}
      <div style={{ ...card(), padding:'12px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34, borderRadius:10,
              background:PRIMARY_SOFT, color:PRIMARY,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <LayoutDashboard size={17} strokeWidth={2.3} />
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:TEXT, letterSpacing:'-0.02em' }}>Dashboard</div>
              <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>
                {new Date().toLocaleDateString('en-IN',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'flex-end' }}>
            {QUICK_ACTIONS.map(item => (
              <TopActionButton key={item.key} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
        <div style={{ marginTop:10, display:'flex', gap:8, flexWrap:'wrap' }}>
          <StatusBadge tone={totalAlerts > 0 ? 'red' : 'green'}>
            {totalAlerts > 0
              ? <><AlertTriangle size={10} strokeWidth={2.4} /> {totalAlerts} alerts need attention</>
              : <><CheckCircle2 size={10} strokeWidth={2.4} /> Everything looks good</>}
          </StatusBadge>
          <StatusBadge tone="blue">
            <CalendarDays size={10} strokeWidth={2.4} /> Live admin overview
          </StatusBadge>
        </div>
      </div>

      {/* Today's Snapshot */}
      <div style={{
        ...card({
          background:`linear-gradient(135deg, #0F172A 0%, #143E33 45%, ${PRIMARY} 100%)`,
          border:'none',
        }),
        padding:'12px 16px',
      }}>
        <div style={{ fontSize:10, opacity:0.7, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#fff', marginBottom:10 }}>
          Today's Snapshot
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0,1fr))', gap:10 }}>
          {todayStats.map((item,i) => (
            <SummaryTile key={i} icon={item.icon} label={item.label} value={item.value} />
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:12 }}>
        {KPI_CARDS.map(item => (
          <KpiCard key={item.key} item={item} value={metrics?.[item.key] ?? 0} />
        ))}
      </div>

      {/* Alert Panels */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        <AlertPanel
          icon={Hourglass} title="Overdue Fees" subtitle="Students with pending dues"
          tone="red" items={alerts?.overdue_fees||[]} emptyText="No overdue students."
          renderItem={item => (
            <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:TEXT }}>{item.candidate_name}</div>
                <div style={{ fontSize:11, color:MUTED, marginTop:3 }}>{item.phone}</div>
                <div style={{ fontSize:11, color:SOFT_TEXT, marginTop:4 }}>
                  Last paid: {item.last_payment_date ? `${item.days_since_payment}d ago` : 'Never'}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#B42318' }}>{formatCurrency(item.pending_amount)}</div>
                <div style={{ fontSize:10, color:SOFT_TEXT, marginTop:3 }}>pending</div>
              </div>
            </div>
          )}
        />
        <AlertPanel
          icon={PhoneCall} title="Stale Enquiries" subtitle="Need follow-up attention"
          tone="amber" items={alerts?.stale_enquiries||[]} emptyText="All enquiries followed up."
          renderItem={item => (
            <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:TEXT }}>{item.name}</div>
                <div style={{ fontSize:11, color:MUTED, marginTop:3 }}>{item.contact}</div>
                <div style={{ fontSize:11, color:SOFT_TEXT, marginTop:4 }}>{item.course_enquired_for||'No course'}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', gap:5 }}>
                <StatusBadge tone="amber">{item.last_followup ? `${item.days_since_followup}d ago` : 'No follow-up'}</StatusBadge>
                <StatusBadge tone="gray">{item.status}</StatusBadge>
              </div>
            </div>
          )}
        />
        <AlertPanel
          icon={BookOpen} title="Inactive Batches" subtitle="No recent batch activity"
          tone="violet" items={alerts?.inactive_batches||[]} emptyText="All batches are active."
          renderItem={item => (
            <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:TEXT }}>{item.batch_name}</div>
                <div style={{ fontSize:11, color:MUTED, marginTop:3 }}>Started: {item.batch_start_date}</div>
                <div style={{ fontSize:11, color:SOFT_TEXT, marginTop:4 }}>{item.timing}</div>
              </div>
              <StatusBadge tone="violet">
                {item.last_log_date ? `${item.days_since_log}d no log` : 'No logs yet'}
              </StatusBadge>
            </div>
          )}
        />
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        <ChartCard icon={ClipboardList} title="Enquiries vs Enrollments" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.enquiry_trend??[]} barGap={4} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize:10, fill:'#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize:10, fill:'#94A3B8' }} axisLine={false} tickLine={false} width={26} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="enquiries"   name="Enquiries"   fill="#D99A3D" radius={[4,4,0,0]} />
              <Bar dataKey="enrollments" name="Enrollments" fill={PRIMARY}  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={TrendingUp} title="Fee Collection Trend" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={charts?.fee_trend??[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize:10, fill:'#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#94A3B8' }} axisLine={false} tickLine={false} width={38}
                tickFormatter={v => v>=1000 ? `${Math.round(v/1000)}K` : v} />
              <Tooltip content={<CustomTooltip isCurrency />} />
              <Line type="monotone" dataKey="collected" name="Collected" stroke={PRIMARY}
                strokeWidth={2.5} dot={{ r:3, fill:PRIMARY }} activeDot={{ r:5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Briefcase} title="Placements" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.placement_trend??[]} barCategoryGap="36%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize:10, fill:'#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize:10, fill:'#94A3B8' }} axisLine={false} tickLine={false} width={26} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="placements" name="Placements" fill="#0E7490" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:12 }}>

        {/* Trainer Performance */}
        <div style={{ ...card(), padding:14 }}>
          <SectionHeading icon={Activity} title="Trainer Performance" subtitle="Monthly work logs, hours, and points" />
          {!trainer_performance?.length ? (
            <div style={{ border:`1px dashed ${BORDER}`, borderRadius:8, padding:20, textAlign:'center', color:SOFT_TEXT, fontSize:12 }}>
              No trainer performance data yet.
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Trainer</th>
                    <th style={{ ...thStyle, textAlign:'center' }}>Work Logs</th>
                    <th style={{ ...thStyle, textAlign:'center' }}>Hours</th>
                    <th style={{ ...thStyle, textAlign:'center' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {trainer_performance.map((t,i) => (
                    <tr key={i}>
                      <td style={tdStyle}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{
                            width:28, height:28, borderRadius:'50%',
                            background:PRIMARY_SOFT, color:PRIMARY,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:11, fontWeight:800, flexShrink:0,
                          }}>
                            {t.trainer_name?.[0]?.toUpperCase()||'?'}
                          </div>
                          <span style={{ fontWeight:600, fontSize:12 }}>{t.trainer_name}</span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign:'center' }}><StatusBadge tone="green">{t.work_logs}</StatusBadge></td>
                      <td style={{ ...tdStyle, textAlign:'center' }}><StatusBadge tone="blue">{parseFloat(t.total_hours||0).toFixed(1)}h</StatusBadge></td>
                      <td style={{ ...tdStyle, textAlign:'center' }}><StatusBadge tone="amber">{t.star_points}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Funnel + Escalations */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          <div style={{ ...card(), padding:14 }}>
            <SectionHeading icon={PhoneCall} title="Enquiry Funnel" subtitle="Current month conversion flow" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <MetricTile label="New"            value={funnelMap.new??0}             tone="amber" />
              <MetricTile label="Follow-up"      value={funnelMap.followup??0}        tone="blue" />
              <MetricTile label="Converted"      value={funnelMap.converted??0}       tone="green" />
              <MetricTile label="Not Interested" value={funnelMap.not_interested??0}  tone="gray" />
              <MetricTile label="Closed"         value={funnelMap.closed??0}          tone="gray" />
              <MetricTile label="Daily Follow-up" value={funnelMap.daily_followup??0} tone="violet" />
            </div>
          </div>

          <div style={{ ...card(), padding:14 }}>
            <SectionHeading
              icon={ShieldAlert} title="Open Escalations" subtitle="Latest unresolved"
              right={
                recent_escalations?.length
                  ? <StatusBadge tone="red">{recent_escalations.length} open</StatusBadge>
                  : <StatusBadge tone="green">No open issues</StatusBadge>
              }
            />
            {!recent_escalations?.length ? (
              <div style={{ border:`1px dashed ${BORDER}`, borderRadius:8, padding:16, textAlign:'center', color:SOFT_TEXT, fontSize:12 }}>
                No open escalations.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {recent_escalations.map((e,i) => (
                  <div key={i} style={{ border:`1px solid ${BORDER}`, borderRadius:8, padding:10, background:'#FCFCFD' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'flex-start' }}>
                      <div style={{ display:'flex', gap:8, minWidth:0 }}>
                        <div style={{
                          width:26, height:26, borderRadius:'50%',
                          background:'#FDEEEE', color:'#B42318',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:11, fontWeight:800, flexShrink:0,
                        }}>
                          {e.trainer_name?.[0]?.toUpperCase()||'!'}
                        </div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:TEXT }}>{e.trainer_name}</div>
                          <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{e.escalation_date?.split('T')[0]}</div>
                        </div>
                      </div>
                      <StatusBadge tone={e.status==='open'?'red':'amber'}>{e.status}</StatusBadge>
                    </div>
                    <div style={{ marginTop:8, fontSize:11, color:'#4B5563', lineHeight:1.5 }}>{e.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}