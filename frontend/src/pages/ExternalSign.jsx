import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import CenteredPage from '../components/CenteredPage';
import SignatureCanvas from 'react-signature-canvas';
import { Document as PdfDoc, Page as PdfPage, pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const SIGNATURE_TYPES = {
  TEXT: 'Text',
  DRAW: 'Draw',
  UPLOAD: 'Upload',
};

const backendUrl = 'http://localhost:5000';

const ExternalSign = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [document, setDocument] = useState(null);
  const [signerEmail, setSignerEmail] = useState('');
  const [signatureType, setSignatureType] = useState('');
  const [signature, setSignature] = useState(''); // For text
  const [drawnSignature, setDrawnSignature] = useState(null); // For drawn
  const [uploadedSignature, setUploadedSignature] = useState(null); // For upload
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const sigCanvasRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [renderedHeight, setRenderedHeight] = useState(0);
  const pdfAreaRef = useRef(null);

  useEffect(() => {
    const validateTokenAndFetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.post('/api/signatures/validate-token', { token });
        setDocument(res.data.document);
        setSignerEmail(res.data.email);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired link');
      } finally {
        setLoading(false);
      }
    };
    if (token) validateTokenAndFetch();
    else setError('No token provided');
  }, [token]);

  const handleDraw = () => {
    if (sigCanvasRef.current) {
      setDrawnSignature(sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png'));
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedSignature(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleClearDraw = () => {
    if (sigCanvasRef.current) sigCanvasRef.current.clear();
    setDrawnSignature(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus('');
    // Prepare signature data
    let sigData = null;
    if (signatureType === SIGNATURE_TYPES.TEXT && signature) {
      sigData = { type: 'text', value: signature };
    } else if (signatureType === SIGNATURE_TYPES.DRAW && drawnSignature) {
      sigData = { type: 'draw', value: drawnSignature };
    } else if (signatureType === SIGNATURE_TYPES.UPLOAD && uploadedSignature) {
      sigData = { type: 'upload', value: uploadedSignature };
    }
    if (!sigData) {
      setSubmitStatus('Please provide a signature.');
      setSubmitting(false);
      return;
    }
    try {
      await axios.post('/api/signatures/public-sign', {
        token,
        signatureContent: sigData.value,
        signatureType: sigData.type,
        position
      });
      setSubmitStatus('Signature submitted successfully!');
    } catch (err) {
      setSubmitStatus('Failed to submit: ' + (err.response?.data?.message || 'Error'));
    }
    setSubmitting(false);
  };

  return (
    loading ? (
      <CenteredPage bg="#f1f5f9"><div style={{textAlign:'center',marginTop:'4rem',fontSize:'1.25rem',color:'#6366f1'}}>Loading...</div></CenteredPage>)
    : error ? (
      <CenteredPage bg="#f1f5f9"><div style={{textAlign:'center',marginTop:'4rem',fontSize:'1.25rem',color:'#f43f5e'}}>{error}</div></CenteredPage>)
    : (
    <CenteredPage bg="#f1f5f9">
      {/* Centered document title and email above both columns */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
        <div style={{ color: '#334155', textAlign: 'center' }}>
          <div><b>Document:</b> {document.title}</div>
          <div><b>For:</b> {signerEmail}</div>
        </div>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '2rem',
        padding: '2rem 0',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* PDF Preview Column */}
        <div style={{ flex: 1, maxWidth: 520 }}>
          {/* Centered navigation buttons above the PDF */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', width: 500, margin: '0 auto 1rem auto' }}>
            <button type="button" style={{ background: '#e5e7eb', color: '#374151', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', fontWeight: 600, cursor: 'pointer' }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>Previous</button>
            <span style={{ fontWeight: 600 }}>Page {currentPage} of {numPages}</span>
            <button type="button" style={{ background: '#e5e7eb', color: '#374151', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', fontWeight: 600, cursor: 'pointer' }} onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages}>Next</button>
          </div>
          {/* Page navigation - now above the PDF */}
          <div style={{ width: 500, background: '#fff', borderRadius: '0.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', marginBottom: 8 }}>
            <div ref={pdfAreaRef} style={{ position: 'relative', width: 500 }}>
              <PdfDoc file={document.filePath.startsWith('http') ? document.filePath : `${backendUrl}/uploads/${document.fileName || document.filePath.split(/[/\\]/).pop()}`}
                onLoadSuccess={({ numPages }) => { setNumPages(numPages); setCurrentPage(1); }}
                onLoadError={err => console.error('PDF load error:', err)}
              >
                <PdfPage pageNumber={currentPage} width={500} renderTextLayer={false} renderAnnotationLayer={false} onRenderSuccess={page => setRenderedHeight(page.height)} />
              </PdfDoc>
              {(signatureType && (signature || drawnSignature || uploadedSignature)) && (
                <div
                  style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    background: '#fff',
                    border: '1px solid #3b82f6',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    fontSize: '1.125rem',
                    minWidth: 80,
                    minHeight: 40,
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'move',
                  }}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setDragImage(new window.Image(), 0, 0);
                    e.dataTransfer.setData('text/plain', '');
                  }}
                  onDragEnd={e => {
                    const rect = pdfAreaRef.current.getBoundingClientRect();
                    let x = e.clientX - rect.left;
                    let y = e.clientY - rect.top;
                    x = Math.max(0, Math.min(x, rect.width - 80));
                    y = Math.max(0, Math.min(y, rect.height - 40));
                    setPosition({ x, y });
                  }}
                >
                  {signature && signatureType === SIGNATURE_TYPES.TEXT && <span>{signature}</span>}
                  {drawnSignature && signatureType === SIGNATURE_TYPES.DRAW && <img src={drawnSignature} alt="Drawn signature" style={{ maxWidth: 120, maxHeight: 60 }} />}
                  {uploadedSignature && signatureType === SIGNATURE_TYPES.UPLOAD && <img src={uploadedSignature} alt="Uploaded signature" style={{ maxWidth: 120, maxHeight: 60 }} />}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Signature Tools Column */}
        <div style={{ flex: 1, maxWidth: 520, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 520 }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>Signature Type</label>
              <select
                value={signatureType}
                onChange={e => { setSignatureType(e.target.value); setSignature(''); setDrawnSignature(null); setUploadedSignature(null); }}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1.5px solid #3b82f6', fontSize: '1rem', marginBottom: '0.5rem', background: '#fff', color: '#18181b' }}
              >
                <option value="" disabled>Select type</option>
                <option value={SIGNATURE_TYPES.TEXT}>Text</option>
                <option value={SIGNATURE_TYPES.DRAW}>Draw</option>
                <option value={SIGNATURE_TYPES.UPLOAD}>Upload</option>
              </select>
            </div>
            {/* Signature input */}
            {signatureType === SIGNATURE_TYPES.TEXT && (
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={signature}
                  onChange={e => setSignature(e.target.value)}
                  placeholder="Type your name"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #18181b', fontSize: '1rem', color: '#18181b', background: '#fff', textAlign: 'center' }}
                />
                {signature && (
                  <div style={{ marginTop: '0.5rem', fontSize: '2rem', color: '#3b82f6', fontWeight: 600, border: '2px solid #18181b', borderRadius: '0.75rem', background: '#f1f5f9', width: '100%', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{signature}</div>
                )}
              </div>
            )}
            {signatureType === SIGNATURE_TYPES.DRAW && (
              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="black"
                  backgroundColor="#fff"
                  canvasProps={{ width: 300, height: 100, style: { border: '1.5px solid #cbd5e1', borderRadius: '0.375rem', display: 'block', margin: '0 auto', background: '#fff' } }}
                  onEnd={handleDraw}
                />
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: '1rem' }}>
                  {drawnSignature && (
                    <img src={drawnSignature} alt="Drawn signature" style={{ maxWidth: 120, maxHeight: 60, border: '1px solid #888' }} />
                  )}
                  <button type="button" onClick={handleClearDraw} style={{ background: '#e5e7eb', color: '#374151', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', alignSelf: 'center' }}>Clear Drawing</button>
                </div>
              </div>
            )}
            {signatureType === SIGNATURE_TYPES.UPLOAD && (
              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <input type="file" accept="image/*" onChange={handleUpload} style={{ marginBottom: '0.5rem' }} />
                {uploadedSignature && (
                  <img src={uploadedSignature} alt="Uploaded signature" style={{ display: 'block', margin: '0 auto', maxHeight: 96 }} />
                )}
              </div>
            )}
            {/* Coordinates */}
            <div style={{ width: '100%', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', background: '#fff', borderTop: '1px solid #e5e7eb', marginTop: '1rem', color: '#334155' }}>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Enter coordinates:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                X:
                <input
                  type="number"
                  min={0}
                  max={400}
                  value={position.x}
                  onChange={e => setPosition(pos => ({ ...pos, x: Number(e.target.value) }))}
                  style={{ width: 50, marginLeft: 2 }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Y:
                <input
                  type="number"
                  min={0}
                  max={400}
                  value={position.y}
                  onChange={e => setPosition(pos => ({ ...pos, y: Number(e.target.value) }))}
                  style={{ width: 50, marginLeft: 2 }}
                />
              </label>
            </div>
            <button
              type="submit"
              style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1rem', marginTop: '1.5rem', transition: 'background 0.2s' }}
              disabled={submitting}
            >
              {submitting ? 'Signing...' : 'Sign Document'}
            </button>
            {submitStatus && <div style={{ color: submitStatus.startsWith('Signature submitted') ? '#3b82f6' : '#f43f5e', fontWeight: 500, marginTop: 12, textAlign: 'center' }}>{submitStatus}</div>}
          </form>
        </div>
      </div>
    </CenteredPage>
    )
  );
};

export default ExternalSign; 