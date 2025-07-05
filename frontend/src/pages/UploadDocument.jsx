import React, { useState } from 'react';
import axios from 'axios';
import { pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import CenteredPage from '../components/CenteredPage';
import { getApiUrl } from '../utils/env.js';

// Set the workerSrc to the recommended CDN for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// Helper to get robust PDF URL
// const getPdfUrl = (filePath) => {
//   if (!filePath) return '';
//   const fileName = filePath.split(/[/\\]/).pop();
//   return `${backendUrl}/uploads/${fileName}`;
// };
// Hardcoded approach for testing:
// const hardcodedPdfUrl = 'http://localhost:5000/uploads/sample.pdf';
// Restore original getPdfUrl logic
const getPdfUrl = (filePath) => {
  if (!filePath) return '';
  const fileName = filePath.split(/[/\\]/).pop();
  return getApiUrl(`uploads/${fileName}`);
};

const UploadDocument = () => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!file) {
      setError('Please select a PDF file to upload.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('document', file);
      const token = localStorage.getItem('token');
      await axios.post(getApiUrl('api/documents/upload'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('Document uploaded successfully!');
      setTitle('');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
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
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center', color: '#18181b' }}>Upload Document</h2>
          {message && <div style={{ marginBottom: '0.5rem', color: '#16a34a', textAlign: 'center' }}>{message}</div>}
          {error && <div style={{ marginBottom: '0.5rem', color: '#dc2626', textAlign: 'center' }}>{error}</div>}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#18181b' }}>Title</label>
            <input
              type="text"
              style={{ width: '100%', border: '1px solid #d1d5db', padding: '0.5rem', borderRadius: '0.375rem' }}
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#18181b' }}>PDF File</label>
            <input
              type="file"
              accept="application/pdf"
              style={{ width: '100%' }}
              onChange={handleFileChange}
              required
            />
          </div>
          <button
            type="submit"
            style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.2s' }}
            disabled={uploading}
            onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
            onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>
    </CenteredPage>
  );
};

export default UploadDocument;