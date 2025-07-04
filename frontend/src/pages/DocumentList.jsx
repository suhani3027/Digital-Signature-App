import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import SignatureModal from '../components/SignatureModal';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import CenteredPage from '../components/CenteredPage';
import { useNavigate } from 'react-router-dom';
import { FaFileAlt, FaFileSignature, FaFileUpload } from 'react-icons/fa';

// Set the workerSrc to the recommended CDN for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const statusColors = {
  draft: '#fef3c7', // yellow-100
  signed: '#d1fae5', // green-100
  pending: '#fef3c7',
  completed: '#dbeafe',
  expired: '#fee2e2',
};

const backendUrl = 'http://localhost:5000';

// Hardcoded approach for testing:
// const hardcodedPdfUrl = 'http://localhost:5000/uploads/sample.pdf';
// Restore original getPdfUrl logic
const getPdfUrl = (filePath) => {
  if (!filePath) return '';
  const fileName = filePath.split(/[/\\]/).pop();
  return `${backendUrl}/uploads/${fileName}`;
};

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
  const [previewDocId, setPreviewDocId] = useState(null);
  const [signModalDoc, setSignModalDoc] = useState(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewNumPages, setPreviewNumPages] = useState(1);
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

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSaveSignature = async ({ documentId, signature, position, page }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/signatures', {
        documentId,
        email: '', // You can fill this with the user's email if needed
        name: signature,
        position: { x: position.x, y: position.y, page },
        signatureContent: signature,
        signatureType: 'text',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Refresh the document list after signing
      await fetchDocuments();
    } catch (err) {
      alert('Failed to save signature.');
    }
  };

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
                      <button
                style={{ background: '#3b82f6', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                        onClick={() => navigate(`/sign/${doc.id || doc._id}`)}
                      >
                        Sign
                      </button>
                          </div>
          ))}
                        </div>
      </div>
    </CenteredPage>
  );
};

export default DocumentList; 