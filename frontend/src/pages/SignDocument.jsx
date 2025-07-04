import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SignatureModal from '../components/SignatureModal';
import axios from 'axios';
import CenteredPage from '../components/CenteredPage';

const backendUrl = 'http://localhost:5000';

const SignDocument = () => {
  const { documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/documents/${documentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocument(res.data.document);
      } catch (err) {
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [documentId]);

  const handleSaveSignature = async () => {
    setSaving(true);
    navigate('/documents');
    setSaving(false);
  };

  return (
    <CenteredPage bg="#f1f5f9">
      {loading && <div className="text-center mt-8" style={{ color: '#3b82f6' }}>Loading...</div>}
      {error && <div className="text-center mt-8" style={{ color: '#f43f5e' }}>{error}</div>}
      {document && (
        <SignatureModal
          open={true}
          onClose={() => navigate('/documents')}
          document={document}
          onSave={handleSaveSignature}
          saving={saving}
        />
      )}
    </CenteredPage>
  );
};

export default SignDocument; 