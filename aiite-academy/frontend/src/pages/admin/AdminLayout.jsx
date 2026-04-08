import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <div style={{background:'#1D9E75',padding:'10px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{color:'#fff',fontSize:14,fontWeight:600}}>AiiTE Academy — Admin</div>
          <div style={{color:'#9FE1CB',fontSize:11}}>Management dashboard</div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <span style={{color:'#fff',fontSize:12}}>{user?.name}</span>
          <button onClick={handleLogout} style={{background:'rgba(255,255,255,0.2)',color:'#fff',border:'none',padding:'4px 12px',borderRadius:20,fontSize:11,cursor:'pointer'}}>Logout</button>
        </div>
      </div>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#888'}}>
        Admin dashboard — coming soon
      </div>
    </div>
  );
}