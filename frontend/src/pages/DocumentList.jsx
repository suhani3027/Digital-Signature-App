import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {pdfjs } from 'react-pdf';
//import SignatureModal from '../components/SignatureModal';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import CenteredPage from '../components/CenteredPage';
import { useNavigate } from 'react-router-dom';
import { FaFileAlt, FaFileSignature, FaFileUpload, FaTrash } from 'react-icons/fa';

// Set the workerSrc to the recommended CDN for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;


const CARD_TYPES = [
  { key: 'total', label: 'Total Documents', icon: <FaFileAlt size={28} color="#3b82f6" />, color: '#e0edff' },
  { key: 'signed', label: 'Signed Documents', icon: <FaFileSignature size={28} color="#10b981" />, color: '#e6fbe8' },
  { key: 'draft', label: 'Draft Documents', icon: <FaFileUpload size={28} color="#f59e42" />, color: '#fff7e6' },
];

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('total');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Remove the document from the local state
      setDocuments(documents.filter(doc => (doc.id || doc._id) !== documentId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);


  const totalDocs = documents.length;
  const signedDocs = documents.filter(doc => doc.status === 'signed').length;
  const draftDocs = documents.filter(doc => doc.status === 'draft').length;

  let filteredDocs = documents;
  if (selectedType === 'signed') filteredDocs = documents.filter(doc => doc.status === 'signed');
  if (selectedType === 'draft') filteredDocs = documents.filter(doc => doc.status === 'draft');
  // Filter by search query (case-insensitive, by title)
  if (searchQuery.trim() !== '') {
    filteredDocs = filteredDocs.filter(doc =>
      doc.title && doc.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }

  return (
    <CenteredPage bg="#f1f5f9">
      {/* Responsive styles for this page */}
      <style>{`
        @media (max-width: 1100px) {
          .dl-main-container { max-width: 95vw !important; }
        }
        @media (max-width: 900px) {
          .dl-main-container { max-width: 99vw !important; padding: 1rem 0.5rem !important; }
          .dl-search-bar { max-width: 99vw !important; }
        }
        @media (max-width: 600px) {
          .dl-main-container { padding: 0.5rem 0.25rem !important; }
          .dl-summary-cards { flex-direction: column !important; gap: 1rem !important; }
          .dl-search-bar { max-width: 100vw !important; }
          .dl-doc-card { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 1rem 0.75rem !important; }
          .dl-doc-card .dl-buttons { width: 100% !important; justify-content: flex-start !important; }
        }
      `}</style>
      <div className="dl-main-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center', color: '#18181b' }}>Your Documents</h2>
        {/* Summary Cards */}
        <div className="dl-summary-cards" style={{ display: 'flex', flexDirection: 'row', gap: '2rem', marginBottom: 32, flexWrap: 'nowrap', justifyContent: 'center', width: '100%' }}>
          <div
            onClick={() => setSelectedType('total')}
            style={{ flex: '1 1 0', minWidth: 220, maxWidth: 340, background: selectedType === 'total' ? '#fff' : '#e0edff', borderRadius: '1rem', boxShadow: selectedType === 'total' ? '0 2px 8px rgba(59,130,246,0.12)' : 'none', padding: '2rem', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', border: selectedType === 'total' ? '2px solid #3b82f6' : 'none', fontWeight: selectedType === 'total' ? 700 : 500 }}>
            <div style={{ background: '#e0edff', borderRadius: '0.75rem', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaFileAlt size={28} color="#3b82f6" />
            </div>
            <div>
              <div style={{ color: '#334155', fontWeight: 600 }}>Total Documents</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#18181b' }}>{totalDocs}</div>
            </div>
          </div>
          <div
            onClick={() => setSelectedType('signed')}
            style={{ flex: '1 1 0', minWidth: 220, maxWidth: 340, background: selectedType === 'signed' ? '#fff' : '#e6fbe8', borderRadius: '1rem', boxShadow: selectedType === 'signed' ? '0 2px 8px rgba(16,185,129,0.12)' : 'none', padding: '2rem', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', border: selectedType === 'signed' ? '2px solid #10b981' : 'none', fontWeight: selectedType === 'signed' ? 700 : 500 }}>
            <div style={{ background: '#e6fbe8', borderRadius: '0.75rem', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaFileSignature size={28} color="#10b981" />
            </div>
            <div>
              <div style={{ color: '#334155', fontWeight: 600 }}>Signed Documents</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#18181b' }}>{signedDocs}</div>
            </div>
          </div>
          <div
            onClick={() => setSelectedType('draft')}
            style={{ flex: '1 1 0', minWidth: 220, maxWidth: 340, background: selectedType === 'draft' ? '#fff' : '#fff7e6', borderRadius: '1rem', boxShadow: selectedType === 'draft' ? '0 2px 8px rgba(245,158,66,0.12)' : 'none', padding: '2rem', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', border: selectedType === 'draft' ? '2px solid #f59e42' : 'none', fontWeight: selectedType === 'draft' ? 700 : 500 }}>
            <div style={{ background: '#fff7e6', borderRadius: '0.75rem', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaFileUpload size={28} color="#f59e42" />
            </div>
            <div>
              <div style={{ color: '#334155', fontWeight: 600 }}>Draft Documents</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#18181b' }}>{draftDocs}</div>
            </div>
          </div>
        </div>
        {/* Search Bar */}
        <div className="dl-search-bar" style={{ width: '100%', maxWidth: 700, margin: '2rem auto 2.5rem auto', display: 'flex', justifyContent: 'center' }}>
          <input
            type="text"
            placeholder="Search documents by title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '1.25rem 1.5rem',
              borderRadius: '0.75rem',
              border: '1.5px solid #cbd5e1',
              fontSize: '1.25rem',
              color: '#18181b',
              background: '#fff',
              boxShadow: '0 2px 8px rgba(59,130,246,0.07)',
              outline: 'none',
              marginBottom: 0
            }}
          />
        </div>
        {/* Document Cards */}
        {loading && <div style={{ color: '#3b82f6' }}>Loading...</div>}
        {error && <div style={{ color: '#f43f5e' }}>{error}</div>}
        {!loading && !error && filteredDocs.length === 0 && (
          <div style={{ color: '#334155', marginTop: 32 }}>No documents found.</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: 700, margin: '0 auto' }}>
          {filteredDocs.map(doc => (
            <div key={doc.id || doc._id} className="dl-doc-card" style={{ background: '#fff', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(59,130,246,0.08)', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#18181b', fontSize: '1.1rem' }}>{doc.title}</div>
                <div style={{ color: '#334155', fontWeight: 500, marginTop: 4 }}>Status: <span style={{ color: '#3b82f6', fontWeight: 600 }}>{doc.status}</span></div>
                <div style={{ color: '#334155', fontSize: '0.95rem', marginTop: 2 }}>Uploaded: {new Date(doc.createdAt).toLocaleString()}</div>
              </div>
              <div className="dl-buttons" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  style={{ background: '#3b82f6', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
                  onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
                  onClick={() => navigate(`/sign/${doc.id || doc._id}`)}
                >
                  Sign
                </button>
                <button
                  style={{ background: '#ef4444', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                  onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
                  onClick={() => handleDelete(doc.id || doc._id)}
                >
                  <FaTrash size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
                        </div>
      </div>
    </CenteredPage>
  );
};

export default DocumentList;