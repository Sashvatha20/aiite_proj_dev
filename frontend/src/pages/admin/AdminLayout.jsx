import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  LayoutDashboard, UserSquare2, BookOpen, GraduationCap,
  FileText, Briefcase, ShieldAlert, PhoneCall, ClipboardList,
  LogOut, User, Menu, ChevronLeft,
} from 'lucide-react';

import AdminDashboard   from './AdminDashboard';
import AdminTrainers    from './AdminTrainers';
import AdminBatches     from './AdminBatches';
import AdminStudents    from './AdminStudents';
import AdminWorkLog     from './AdminWorkLog';
import AdminPlacements  from './AdminPlacements';
import AdminEscalations from './AdminEscalations';
import AdminFollowups   from './AdminFollowups';
import AdminEnquiries   from './AdminEnquiries';

const G      = '#1D9E75';
const G_SOFT = '#E8F7F1';

const MENU = [
  { key: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { key: 'trainers',    label: 'Trainers',     icon: UserSquare2 },
  { key: 'batches',     label: 'Batches',      icon: BookOpen },
  { key: 'students',    label: 'Students',     icon: GraduationCap },
  { key: 'worklog',     label: 'Work Logs',    icon: FileText },
  { key: 'placements',  label: 'Placements',   icon: Briefcase },
  { key: 'escalations', label: 'Escalations',  icon: ShieldAlert },
  { key: 'followups',   label: 'Followups',    icon: PhoneCall },
  { key: 'enquiries',   label: 'Enquiries',    icon: ClipboardList },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive]       = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/'); };

  const renderPage = () => {
    switch (active) {
      case 'dashboard':   return <AdminDashboard onNavigate={setActive} />;
      case 'trainers':    return <AdminTrainers />;
      case 'batches':     return <AdminBatches />;
      case 'students':    return <AdminStudents />;
      case 'worklog':     return <AdminWorkLog />;
      case 'placements':  return <AdminPlacements />;
      case 'escalations': return <AdminEscalations />;
      case 'followups':   return <AdminFollowups />;
      case 'enquiries':   return <AdminEnquiries />;
      default:            return <AdminDashboard onNavigate={setActive} />;
    }
  };

  const SW = collapsed ? 60 : 220;

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#F6F8FB',
    }}>

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside style={{
        width: SW,
        minWidth: SW,
        maxWidth: SW,
        height: '100vh',
        background: '#fff',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'width 0.22s cubic-bezier(0.16,1,0.3,1), min-width 0.22s, max-width 0.22s',
        zIndex: 20,
      }}>

        {/* Logo */}
        <div style={{
          height: 60, padding: '0 14px', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, background: G, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0,
          }}>Ai</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', whiteSpace: 'nowrap' }}>AiiTE Admin</div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Management</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {MENU.map((m) => {
            const Icon = m.icon;
            const on = active === m.key;
            return (
              <div key={m.key} onClick={() => setActive(m.key)} title={collapsed ? m.label : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: collapsed ? '10px 0' : '9px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
                  background: on ? G_SOFT : 'transparent',
                  color: on ? G : '#6B7280',
                  fontWeight: on ? 700 : 500,
                  borderLeft: on ? `3px solid ${G}` : '3px solid transparent',
                  borderRadius: collapsed ? 0 : '0 10px 10px 0',
                  marginRight: collapsed ? 0 : 8,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!on) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#374151'; }}}
                onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; }}}
              >
                <Icon size={18} strokeWidth={on ? 2.4 : 1.8} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{m.label}</span>}
              </div>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: collapsed ? '12px 0' : '12px 14px', borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
          {!collapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
              padding: '8px 10px', borderRadius: 10,
              background: '#F9FAFB', border: '1px solid #E5E7EB',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: G_SOFT, color: G,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <User size={14} strokeWidth={2} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || user?.username || 'Admin'}
                </div>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>Administrator</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} title="Logout" style={{
            width: '100%', padding: '8px 0', background: '#FEF2F2',
            color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <LogOut size={14} strokeWidth={2.2} />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Right Side: Topbar + Page ─────────────────────── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}>

        {/* Topbar */}
        <header style={{
          height: 60,
          background: '#fff',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setCollapsed(c => !c)} style={{
              width: 36, height: 36, borderRadius: 10,
              border: '1px solid #E5E7EB', background: '#F9FAFB',
              color: '#6B7280', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = G_SOFT; e.currentTarget.style.color = G; e.currentTarget.style.borderColor = '#CFEADC'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
            >
              {collapsed ? <Menu size={16} strokeWidth={2} /> : <ChevronLeft size={16} strokeWidth={2} />}
            </button>
            {(() => {
              const m = MENU.find(m => m.key === active);
              const Icon = m?.icon;
              return Icon ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={17} strokeWidth={2.2} color={G} />
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>{m.label}</span>
                </div>
              ) : null;
            })()}
          </div>
          <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </header>

        {/* ── Page content — FULL WIDTH, FULL HEIGHT, NO PADDING, NO MAX-WIDTH ── */}
        <main style={{
          flex: 1,
          width: '100%',       /* fills ALL remaining horizontal space */
          minWidth: 0,
          overflowY: 'auto',   /* only this scrolls */
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          /* ❌ NO padding here  */
          /* ❌ NO maxWidth here */
          /* ❌ NO margin here   */
          /* Each page controls its own internal spacing */
        }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}