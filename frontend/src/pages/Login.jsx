import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import CenteredPage from '../components/CenteredPage';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.user.id);
      localStorage.setItem('userName', res.data.user.name);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <CenteredPage bg="#f1f5f9">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <form
          onSubmit={handleSubmit}
          style={{ background: '#fff', border: '2px solid #3b82f6', borderRadius: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: '2.5rem', width: '100%', maxWidth: '400px', transition: 'box-shadow 0.3s, border-color 0.3s' }}
          onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(59,130,246,0.25)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
          onMouseOut={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center', color: '#18181b' }}>Login</h2>
          {error && <div style={{ marginBottom: '0.5rem', color: '#dc2626', textAlign: 'center' }}>{error}</div>}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#18181b' }}>Email</label>
            <input
              type="email"
              style={{ width: '100%', border: '1px solid #d1d5db', padding: '0.5rem', borderRadius: '0.375rem' }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#18181b' }}>Password</label>
            <input
              type="password"
              style={{ width: '100%', border: '1px solid #d1d5db', padding: '0.5rem', borderRadius: '0.375rem' }}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
            onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
          >
            Login
          </button>
          <div style={{ marginTop: '1rem', textAlign: 'center', width: '100%' }}>
            <span style={{ color: '#334155' }}>Don't have an account? </span>
            <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: 600 }}>Register</Link>
          </div>
        </form>
      </div>
    </CenteredPage>
  );
};

export default Login;
