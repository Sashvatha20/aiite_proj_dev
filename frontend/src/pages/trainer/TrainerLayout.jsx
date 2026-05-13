import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  ClipboardList,
  PhoneCall,
  FolderKanban,
  TrendingUp,
  GraduationCap,
  FileText,
  MessageSquareQuote,
  Target,
  Trophy,
  TriangleAlert,
  Droplets,
  UserCircle2,
  LogOut,
} from 'lucide-react';

import TrainerDashboard from './Dashboard';
import WorkLog from './WorkLog';
import EnquiryFollowup from './EnquiryFollowup';
import BatchManagement from './BatchManagement';
import BatchProgress from './BatchProgress';
import Students from './Students';
import Assessment from './Assessment';
import MentorFeedback from './MentorFeedback';
import StudentFollowup from './StudentFollowup';
import Placement from './Placement';
import Escalation from './Escalation';
import WaterCan from './WaterCan';

const navItems = [
  {
    section: 'Main',
    items: [
      { path: '/trainer', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/trainer/worklog', label: 'Work Log', icon: ClipboardList },
      { path: '/trainer/enquiry', label: 'Enquiry Followup', icon: PhoneCall },
    ],
  },
  {
    section: 'Batch',
    items: [
      { path: '/trainer/batch-management', label: 'Batch Management', icon: FolderKanban },
      { path: '/trainer/batch-progress', label: 'Batch Progress', icon: TrendingUp },
      { path: '/trainer/students', label: 'Students', icon: GraduationCap },
      { path: '/trainer/assessment', label: 'Assessment', icon: FileText },
      { path: '/trainer/mentor-feedback', label: 'Mentor Feedback', icon: MessageSquareQuote },
    ],
  },
  {
    section: 'Placement',
    items: [
      { path: '/trainer/followup', label: 'Student Followup', icon: Target },
      { path: '/trainer/placement', label: 'Log Placement', icon: Trophy },
    ],
  },
  {
    section: 'Other',
    items: [
      { path: '/trainer/escalation', label: 'Report Escalation', icon: TriangleAlert },
      { path: '/trainer/watercan', label: 'Water Can Log', icon: Droplets },
    ],
  },
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
          <div style={styles.topSub}>Trainer Portal</div>
        </div>

        <div style={styles.topRight}>
          <span style={styles.topUser}>
            <UserCircle2 size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {user?.name}
          </span>

          <button style={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} style={{ marginRight: 6 }} />
            Logout
          </button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.sidebar}>
          {navItems.map((group) => (
            <div key={group.section}>
              <div style={styles.navSection}>{group.section}</div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <div
                    key={item.path}
                    style={{
                      ...styles.navItem,
                      ...(active ? styles.navActive : {}),
                    }}
                    onClick={() => navigate(item.path)}
                  >
                    <span style={styles.navIconWrap}>
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={styles.content}>
          <Routes>
            <Route index element={<TrainerDashboard />} />
            <Route path="worklog" element={<WorkLog />} />
            <Route path="enquiry" element={<EnquiryFollowup />} />
            <Route path="batch-management" element={<BatchManagement />} />
            <Route path="batch-progress" element={<BatchProgress />} />
            <Route path="students" element={<Students />} />
            <Route path="assessment" element={<Assessment />} />
            <Route path="mentor-feedback" element={<MentorFeedback />} />
            <Route path="followup" element={<StudentFollowup />} />
            <Route path="placement" element={<Placement />} />
            <Route path="escalation" element={<Escalation />} />
            <Route path="watercan" element={<WaterCan />} />
            <Route path="*" element={<Navigate to="/trainer/students" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

const G = '#1D9E75';

const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  topbar: {
    background: G,
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  topTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
  },

  topSub: {
    color: '#9FE1CB',
    fontSize: 11,
  },

  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  topUser: {
    color: '#fff',
    fontSize: 12,
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 500,
  },

  logoutBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 11,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 600,
  },

  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  sidebar: {
    width: 220,
    background: '#FAFAFA',
    borderRight: '1px solid #eee',
    padding: '12px 0',
    flexShrink: 0,
    overflowY: 'auto',
  },

  navSection: {
    padding: '12px 16px 6px',
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },

  navItem: {
    padding: '10px 16px',
    fontSize: 12,
    color: '#475569',
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontWeight: 500,
  },

  navIconWrap: {
    width: 18,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  navActive: {
    color: G,
    background: '#E1F5EE',
    borderLeftColor: G,
    fontWeight: 700,
  },

  content: {
    flex: 1,
    overflowY: 'auto',
    background: '#f5f5f5',
  },
};