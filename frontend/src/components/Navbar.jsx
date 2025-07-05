import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoutImg from '../assets/logout img.png';
import signMeUpLogo from '../assets/sign me up logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 2rem', borderBottom: '2px solid #ccc', background: 'transparent', width: '100%', maxWidth: '100%', boxSizing: 'border-box' , height: '60px'}}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={signMeUpLogo} alt="Sign me up logo" style={{ width: 32, height: 32, marginRight: '0.5rem', objectFit: 'contain' }} />
        <span style={{ color: '#6366f1', fontSize: '1rem', fontWeight: 700, marginRight: '1.5rem', cursor: 'default' }}>Sign me up!!</span>
        <Link to="/dashboard" style={{ textDecoration: 'none', color: '#6366f1', fontSize: '1rem', fontWeight: 500, marginRight: '1rem' }}>Dashboard</Link>
        <Link to="/documents" style={{ textDecoration: 'none', color: '#6366f1', fontSize: '1rem', fontWeight: 500 }}>Document List</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {userName ? (
          <span style={{ color: 'black', fontWeight: 500, marginRight: '1rem', fontSize: '1.1rem' }}>hi, {userName}</span>
        ) : userId ? (
          <span style={{ color: 'black', fontWeight: 500, marginRight: '1rem', fontSize: '1.1rem' }}>hi, User</span>
        ) : null}
        {isAuthenticated && (
          <img
            src={logoutImg}
            alt="Logout"
            onClick={handleLogout}
            style={{ width: 30, height: 30, cursor: 'pointer',}}
            title="Logout"
          />
        )}
      </div>
    </nav>
  );
};

export default Navbar; 