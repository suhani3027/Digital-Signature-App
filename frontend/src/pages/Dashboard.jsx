import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CenteredPage from '../components/CenteredPage';
// import Navbar from '../components/Navbar';
import { FaFileAlt, FaFileSignature, FaFileUpload } from 'react-icons/fa';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Placeholder for user email (replace with real data if available)
  const userEmail = localStorage.getItem('userEmail') || 'user@email.com';

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/documents', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocuments(res.data.documents || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const totalDocs = documents.length;
  const signedDocs = documents.filter(doc => doc.status === 'signed').length;
  const draftDocs = documents.filter(doc => doc.status === 'draft').length;

  return (
    <CenteredPage bg="#f1f5f9">
      {/* <Navbar /> */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#18181b', marginBottom: 4 }}>Dashboard</h1>
            <div style={{ color: '#334155', fontSize: '1.1rem' }}>Manage your documents and signatures</div>
          </div>
          <button
            style={{ background: '#3b82f6', color: '#fff', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1.1rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.10)' }}
            onClick={() => navigate('/upload')}
          >
            + Upload Document
          </button>
        </div>
        {/* Summary Cards */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, background: '#fff', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(59,130,246,0.08)', padding: '2rem', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ background: '#e0edff', borderRadius: '0.75rem', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaFileAlt size={32} color="#3b82f6" />
            </div>
            <div>
              <div style={{ color: '#334155', fontWeight: 600 }}>Total Documents</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#18181b' }}>{totalDocs}</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 220, background: '#fff', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(59,130,246,0.08)', padding: '2rem', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ background: '#e6fbe8', borderRadius: '0.75rem', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaFileSignature size={32} color="#10b981" />
            </div>
            <div>
              <div style={{ color: '#334155', fontWeight: 600 }}>Signed Documents</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#18181b' }}>{signedDocs}</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 220, background: '#fff', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(59,130,246,0.08)', padding: '2rem', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ background: '#fff7e6', borderRadius: '0.75rem', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaFileUpload size={32} color="#f59e42" />
            </div>
            <div>
              <div style={{ color: '#334155', fontWeight: 600 }}>Draft Documents</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#18181b' }}>{draftDocs}</div>
            </div>
          </div>
        </div>
        {/* You can add more dashboard content here */}
        {loading && <div style={{ color: '#3b82f6' }}>Loading...</div>}
        {error && <div style={{ color: '#f43f5e' }}>{error}</div>}
      </div>
    </CenteredPage>
  );
};

export default Dashboard;
