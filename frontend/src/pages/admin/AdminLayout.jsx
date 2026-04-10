import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import AdminDashboard   from './AdminDashboard';
import AdminTrainers    from './AdminTrainers';
import AdminBatches     from './AdminBatches';
import AdminStudents    from './AdminStudents';
import AdminWorkLog     from './AdminWorkLog';
import AdminPlacements  from './AdminPlacements';
import AdminEscalations from './AdminEscalations';
import AdminFollowups   from './AdminFollowups';
import AdminEnquiries   from './AdminEnquiries';

const G = '#1D9E75';
const MENU = [
  { key:'dashboard',   label:'Dashboard',    icon:'📊' },
  { key:'trainers',    label:'Trainers',      icon:'👨‍🏫' },
  { key:'batches',     label:'Batches',       icon:'📚' },
  { key:'students',    label:'Students',      icon:'🎓' },
  { key:'worklog',     label:'Work Logs',     icon:'📝' },
  { key:'placements',  label:'Placements',    icon:'🎯' },
  { key:'escalations', label:'Escalations',   icon:'⚠️' },
  { key:'followups',   label:'Followups',     icon:'📞' },
  { key:'enquiries',   label:'Enquiries',     icon:'📋' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/'); };

  const renderPage = () => {
    switch(active) {
      case 'dashboard':   return <AdminDashboard />;
      case 'trainers':    return <AdminTrainers />;
      case 'batches':     return <AdminBatches />;
      case 'students':    return <AdminStudents />;
      case 'worklog':     return <AdminWorkLog />;
      case 'placements':  return <AdminPlacements />;
      case 'escalations': return <AdminEscalations />;
      case 'followups':   return <AdminFollowups />;
      case 'enquiries':   return <AdminEnquiries />;
      default:            return <AdminDashboard />;
    }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',background:'#f5f5f3'}}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 210 : 56, transition:'width .2s',
        background:'#fff', borderRight:'1px solid #eee',
        display:'flex', flexDirection:'column', flexShrink:0,
        position:'sticky', top:0, height:'100vh', overflow:'hidden'
      }}>
        {/* Logo */}
        <div style={{padding:'14px 12px', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:8}}>
          <div style={{width:30,height:30,background:G,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:700,flexShrink:0}}>Ai</div>
          {sidebarOpen && <div><div style={{fontSize:12,fontWeight:700,color:'#222'}}>AiiTE Admin</div><div style={{fontSize:9,color:'#888'}}>Management</div></div>}
        </div>

        {/* Nav */}
        <nav style={{flex:1, padding:'8px 0', overflowY:'auto'}}>
          {MENU.map(m => (
            <div key={m.key}
              onClick={() => setActive(m.key)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 14px', cursor:'pointer', fontSize:12,
                background: active===m.key ? '#E1F5EE' : 'transparent',
                color: active===m.key ? G : '#555',
                fontWeight: active===m.key ? 600 : 400,
                borderLeft: active===m.key ? `3px solid ${G}` : '3px solid transparent',
                whiteSpace:'nowrap'
              }}>
              <span style={{fontSize:15, flexShrink:0}}>{m.icon}</span>
              {sidebarOpen && m.label}
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{padding:'10px 12px', borderTop:'1px solid #eee'}}>
          {sidebarOpen && <div style={{fontSize:11,color:'#888',marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>👤 {user?.name || user?.username}</div>}
          <button onClick={handleLogout} style={{
            width:'100%', padding:'6px 0', background:'#fef2f2',
            color:'#dc2626', border:'1px solid #fecaca', borderRadius:6,
            fontSize:11, cursor:'pointer', whiteSpace:'nowrap'
          }}>{sidebarOpen ? '🚪 Logout' : '🚪'}</button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        {/* Topbar */}
        <div style={{
          background:'#fff', borderBottom:'1px solid #eee',
          padding:'10px 20px', display:'flex', justifyContent:'space-between',
          alignItems:'center', position:'sticky', top:0, zIndex:10
        }}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#555'}}>☰</button>
            <span style={{fontSize:13, fontWeight:600, color:'#222'}}>
              {MENU.find(m=>m.key===active)?.icon} {MENU.find(m=>m.key===active)?.label}
            </span>
          </div>
          <span style={{fontSize:11, color:'#888'}}>
            {new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
          </span>
        </div>

        {/* Page content */}
        <div style={{flex:1, padding:20, overflowY:'auto'}}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}