import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

import WorkLog        from './WorkLog';
import EnquiryFollowup from './EnquiryFollowup';
import BatchProgress  from './BatchProgress';
import Students       from './Students';
import Assessment     from './Assessment';
import MentorFeedback from './MentorFeedback';
import StudentFollowup from './StudentFollowup';
import Placement      from './Placement';
import Escalation     from './Escalation';
import WaterCan       from './WaterCan';

const navItems = [
  { section: 'Daily',     items: [
    { path: '/trainer',            label: 'Work log' },
    { path: '/trainer/enquiry',    label: 'Enquiry followup' },
  ]},
  { section: 'Batch',     items: [
    { path: '/trainer/batch-progress', label: 'Batch progress' },
    { path: '/trainer/students',       label: 'Students' },
    { path: '/trainer/assessment',     label: 'Assessment' },
    { path: '/trainer/mentor-feedback',label: 'Mentor feedback' },
  ]},
  { section: 'Placement', items: [
    { path: '/trainer/followup',   label: 'Student followup' },
    { path: '/trainer/placement',  label: 'Log placement' },
  ]},
  { section: 'Other',     items: [
    { path: '/trainer/escalation', label: 'Report escalation' },
    { path: '/trainer/watercan',   label: 'Water can log' },
  ]},
];

export default function TrainerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/trainer') return location.pathname === '/trainer';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={styles.app}>
      <div style={styles.topbar}>
        <div>
          <div style={styles.topTitle}>AiiTE Academy</div>
          <div style={styles.topSub}>Trainer portal</div>
        </div>
        <div style={styles.topRight}>
          <span style={styles.topUser}>{user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.sidebar}>
          {navItems.map(group => (
            <div key={group.section}>
              <div style={styles.navSection}>{group.section}</div>
              {group.items.map(item => (
                <div
                  key={item.path}
                  style={{...styles.navItem, ...(isActive(item.path) ? styles.navActive : {})}}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={styles.content}>
          <Routes>
            <Route index              element={<WorkLog />} />
            <Route path="enquiry"     element={<EnquiryFollowup />} />
            <Route path="batch-progress" element={<BatchProgress />} />
            <Route path="students"    element={<Students />} />
            <Route path="assessment"  element={<Assessment />} />
            <Route path="mentor-feedback" element={<MentorFeedback />} />
            <Route path="followup"    element={<StudentFollowup />} />
            <Route path="placement"   element={<Placement />} />
            <Route path="escalation"  element={<Escalation />} />
            <Route path="watercan"    element={<WaterCan />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

const G = '#1D9E75';
const styles = {
  app:      { minHeight:'100vh', display:'flex', flexDirection:'column' },
  topbar:   { background:G, padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  topTitle: { color:'#fff', fontSize:14, fontWeight:600 },
  topSub:   { color:'#9FE1CB', fontSize:11 },
  topRight: { display:'flex', alignItems:'center', gap:10 },
  topUser:  { color:'#fff', fontSize:12 },
  logoutBtn:{ background:'rgba(255,255,255,0.2)', color:'#fff', border:'none', padding:'4px 12px', borderRadius:20, fontSize:11, cursor:'pointer' },
  body:     { display:'flex', flex:1 },
  sidebar:  { width:160, background:'#fafafa', borderRight:'1px solid #eee', padding:'12px 0', flexShrink:0 },
  navSection:{ padding:'8px 16px 3px', fontSize:10, color:'#aaa', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' },
  navItem:  { padding:'8px 16px', fontSize:12, color:'#555', cursor:'pointer', borderLeft:'3px solid transparent' },
  navActive:{ color:G, background:'#E1F5EE', borderLeftColor:G, fontWeight:500 },
  content:  { flex:1, padding:20, background:'#f5f5f5', overflowY:'auto' },
};