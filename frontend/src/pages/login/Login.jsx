import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginApi } from '../../api/auth';
import toast from 'react-hot-toast';

export default function Login() {
  const [role, setRole]         = useState('trainer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      const res = await loginApi({ username, password });
      const { token, user } = res.data;
      if (user.role !== role) {
        toast.error(`This account is not a ${role}`);
        setLoading(false);
        return;
      }
      login(user, token);
      toast.success(`Welcome, ${user.name}!`);
      navigate(role === 'admin' ? '/admin' : '/trainer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoCircle}>Ai</div>
          <div style={styles.logoName}>AiiTE Academy</div>
          <div style={styles.logoSub}>Internal management portal</div>
        </div>

        <div style={styles.roleLabel}>Select your role</div>
        <div style={styles.roleRow}>
          <div
            style={{...styles.roleCard, ...(role==='trainer' ? styles.roleActive : {})}}
            onClick={() => setRole('trainer')}
          >
            <div style={styles.roleIcon}>📋</div>
            <div style={styles.roleName}>Trainer</div>
            <div style={styles.roleSub}>Enter & update data</div>
          </div>
          <div
            style={{...styles.roleCard, ...(role==='admin' ? styles.roleActive : {})}}
            onClick={() => setRole('admin')}
          >
            <div style={styles.roleIcon}>📊</div>
            <div style={styles.roleName}>Admin</div>
            <div style={styles.roleSub}>View & manage all</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : `Sign in as ${role === 'admin' ? 'Admin' : 'Trainer'} →`}
          </button>
        </form>

        <div style={styles.hint}>Default password: password</div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f2f5' },
  card: { background:'#fff', borderRadius:16, padding:28, width:300, boxShadow:'0 2px 16px rgba(0,0,0,0.10)' },
  logo: { textAlign:'center', marginBottom:20 },
  logoCircle: { width:48, height:48, background:'#1D9E75', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', color:'#fff', fontWeight:600, fontSize:16 },
  logoName: { fontSize:15, fontWeight:600, color:'#1a1a1a' },
  logoSub: { fontSize:11, color:'#888', marginTop:2 },
  roleLabel: { fontSize:11, color:'#888', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' },
  roleRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 },
  roleCard: { border:'1px solid #e0e0e0', borderRadius:8, padding:10, textAlign:'center', cursor:'pointer' },
  roleActive: { border:'1.5px solid #1D9E75', background:'#E1F5EE' },
  roleIcon: { fontSize:18, marginBottom:3 },
  roleName: { fontSize:11, fontWeight:600, color:'#1a1a1a' },
  roleSub: { fontSize:9, color:'#888', marginTop:1 },
  field: { marginBottom:10 },
  label: { fontSize:11, color:'#666', display:'block', marginBottom:3 },
  input: { width:'100%', padding:'8px 10px', border:'1px solid #ddd', borderRadius:8, fontSize:13, outline:'none' },
  btn: { width:'100%', padding:'10px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, marginTop:4, cursor:'pointer' },
  hint: { textAlign:'center', fontSize:10, color:'#aaa', marginTop:10 }
};