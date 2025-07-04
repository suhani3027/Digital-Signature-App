import React, { useState, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import SignatureCanvas from 'react-signature-canvas';
import { useDropzone } from 'react-dropzone';
import { pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useDrag, useDrop, useDragLayer } from 'react-dnd';
import axios from 'axios';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const backendUrl = 'http://localhost:5000';

const SIGNATURE_TYPES = {
  TEXT: 'Text',
  DRAW: 'Draw',
  UPLOAD: 'Upload',
};

const SIGNATURE_DND_TYPE = 'SIGNATURE_OVERLAY';

const gridSize = 10;
const snapToGrid = (x, y) => [Math.round(x / gridSize) * gridSize, Math.round(y / gridSize) * gridSize];

const fontOptions = [
  { label: 'Default', value: 'inherit', pdfFont: StandardFonts.Helvetica },
  { label: 'Cursive', value: 'cursive', pdfFont: StandardFonts.Courier },
  { label: 'Serif', value: 'serif', pdfFont: StandardFonts.TimesRoman },
  { label: 'Sans-serif', value: 'sans-serif', pdfFont: StandardFonts.Helvetica },
];

const SignatureModal = ({ open, onClose, document: doc, onSave, saving }) => {
  const [signatureType, setSignatureType] = useState("");
  const [signature, setSignature] = useState(''); // For text
  const [drawnSignature, setDrawnSignature] = useState(null); // For drawn
  const [uploadedSignature, setUploadedSignature] = useState(null); // For upload
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [showSignature, setShowSignature] = useState(false);
  const nodeRef = useRef(null);
  const sigCanvasRef = useRef(null);
  const [isDrawn, setIsDrawn] = useState(false); // Track if user has drawn
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingShowDrawn, setPendingShowDrawn] = useState(false);
  const [renderedHeight, setRenderedHeight] = useState(0);
  const [coordError, setCoordError] = useState("");
  const pdfAreaRef = useRef(null);
  const [fontFamily, setFontFamily] = useState('inherit');
  const [fontSize, setFontSize] = useState(24); // New state for font size

  const [{ isDragging }, drag] = useDrag(() => ({
    type: SIGNATURE_DND_TYPE,
    item: { x: position.x, y: position.y },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: SIGNATURE_DND_TYPE,
    drop: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const dropArea = pdfAreaRef.current;
      if (clientOffset && dropArea) {
        const rect = dropArea.getBoundingClientRect();
        let x = clientOffset.x - rect.left;
        let y = clientOffset.y - rect.top;
        // Clamp to bounds
        x = Math.max(0, Math.min(x, rect.width - 80));
        y = Math.max(0, Math.min(y, rect.height - 40));
        setPosition({ x, y });
      }
    },
  }));

  // Custom drag layer for preview
  const { isDragging: isLayerDragging, currentOffset } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset(),
  }));

  // Dropzone for image upload
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedSignature(e.target.result);
      reader.readAsDataURL(acceptedFiles[0]);
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  if (!open || !doc) return null;

  const handleDrag = (e, data) => {
    setPosition({ x: data.x, y: data.y });
  };

  const handleClear = () => {
    setSignature('');
    setDrawnSignature(null);
    setUploadedSignature(null);
    setShowSignature(false);
    setPosition({ x: 100, y: 100 });
    setIsDrawn(false);
    if (sigCanvasRef.current) sigCanvasRef.current.clear();
  };

  const handleDraw = () => {
    setIsDrawn(true);
  };

  const handleDownload = async () => {
    let sigData = null;
    if (signatureType === SIGNATURE_TYPES.TEXT && signature) {
      sigData = { type: 'text', value: signature };
    } else if (signatureType === SIGNATURE_TYPES.DRAW && drawnSignature) {
      sigData = { type: 'draw', value: drawnSignature };
    } else if (signatureType === SIGNATURE_TYPES.UPLOAD && uploadedSignature) {
      sigData = { type: 'upload', value: uploadedSignature };
    }
    if (!sigData) return;

    try {
      // 1. Fetch the original PDF as ArrayBuffer
      const pdfUrl = doc.filePath.startsWith('http') ? doc.filePath : `${backendUrl}/uploads/${doc.fileName || doc.filePath.split(/[/\\]/).pop()}`;
      const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const page = pdfDoc.getPage(currentPage - 1);
      
      // Scale coordinates from preview box to actual PDF page size
      const renderWidth = 500; // Match the preview width
      const renderHeight = renderedHeight || 600; // fallback if not set
      const scaleX = page.getWidth() / renderWidth;
      const scaleY = page.getHeight() / renderHeight;
      // Use direct scaling for Y coordinate to match browser top-left to PDF bottom-left
      const pdfX = position.x * scaleX;
      const pdfY = (renderHeight - position.y) * scaleY;

      // 2. Draw the signature on the PDF
      if (sigData.type === 'text') {
        const pdfFontName = getPdfFont();
        console.log('Selected fontFamily:', fontFamily, 'Mapped PDF font:', pdfFontName);
        const font = await pdfDoc.embedFont(pdfFontName);
        page.drawText(sigData.value, {
          x: pdfX,
          y: pdfY,
          size: fontSize, // Use fontSize state
          color: rgb(0, 0, 0),
          font,
        });
      } else if (sigData.type === 'draw' || sigData.type === 'upload') {
        if (!sigData.value.startsWith('data:image/')) {
          alert('Invalid image data for signature!');
          return;
        }
        const imgBytes = await fetch(sigData.value).then(res => res.arrayBuffer());
        let img;
        if (sigData.value.startsWith('data:image/png')) {
          img = await pdfDoc.embedPng(imgBytes);
        } else {
          img = await pdfDoc.embedJpg(imgBytes);
        }
        page.drawImage(img, {
          x: pdfX,
          y: pdfY,
          width: 120 * scaleX,
          height: 60 * scaleY,
        });
      }

      // 3. Save the new PDF and trigger download
      const signedPdfBytes = await pdfDoc.save();
      const signedPdfBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(signedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed-${doc.fileName || 'document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      handleClear();
    } catch (err) {
      alert('Failed to generate signed PDF.');
      console.error(err);
    }
  };

  const handlePlaceSignature = () => {
    if (signatureType === SIGNATURE_TYPES.TEXT && signature) {
      setShowSignature(true);
    } else if (signatureType === SIGNATURE_TYPES.DRAW && sigCanvasRef.current && isDrawn) {
      const canvas = sigCanvasRef.current.getCanvas();
      setDrawnSignature(canvas.toDataURL('image/png'));
      setPendingShowDrawn(true);
    } else if (signatureType === SIGNATURE_TYPES.UPLOAD && uploadedSignature) {
      setShowSignature(true);
    }
  };

  useEffect(() => {
    if (pendingShowDrawn && drawnSignature) {
      setShowSignature(true);
      setPendingShowDrawn(false);
    }
  }, [pendingShowDrawn, drawnSignature]);

  // Hardcoded approach for testing:
  // const hardcodedPdfUrl = 'http://localhost:5000/uploads/sample.pdf';
  // Restore original pdfUrl logic
  let pdfUrl = '';
  if (doc && doc.filePath) {
    let fileName = doc.filePath.split(/[/\\]/).pop();
    pdfUrl = `${backendUrl}/uploads/${fileName}`;
  }

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  // Validate coordinates
  useEffect(() => {
    const minX = 0;
    const minY = 0;
    const maxX = 600; // match renderWidth
    const maxY = renderedHeight || 600; // match renderHeight
    if (position.x < minX || position.x > maxX || position.y < minY || position.y > maxY) {
      setCoordError(`Coordinates must be between X: ${minX}-${maxX}, Y: ${minY}-${maxY}`);
    } else {
      setCoordError("");
    }
  }, [position.x, position.y, renderedHeight]);

  const getPdfFont = () => {
    const found = fontOptions.find(opt => opt.value === fontFamily);
    return found ? found.pdfFont : StandardFonts.Helvetica;
  };

  return (
    <div style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: 'calc(100vh - 56px)', background: 'transparent', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%', height: '100%', textAlign: 'center', marginTop: 0, marginBottom: 0, paddingTop: '6.5rem', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%', maxWidth: '90vw', gap: '6rem', margin: '0', height: 'calc(100vh - 10px)', overflow: 'hidden' }}>
          {/* PDF Preview on the left */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', minWidth: 0, height: '100%', paddingTop: '0px', paddingBottom: '4px', paddingLeft: '8px' }}>
            <div style={{
              background: '#fff',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              width: 450,
              height: 'auto',
              
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              position: 'relative',
              margin: 0,
              padding: '8px 0 0 0',
            }}>
              <div ref={node => { drop(node); pdfAreaRef.current = node; }} style={{ width: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Document file={pdfUrl} onLoadError={err => console.error('PDF load error:', err)} onLoadSuccess={page => {
                  // Calculate preview height based on PDF aspect ratio and preview width (500px)
                  const aspectRatio = page.height / page.width;
                  const previewWidth = 500;
                  const previewHeight = aspectRatio * previewWidth;
                  setRenderedHeight(previewHeight);
                  onDocumentLoadSuccess(page);
                }}>
                  <Page pageNumber={currentPage} width={500} renderTextLayer={false} renderAnnotationLayer={false} />
                </Document>
                {showSignature && !isDragging && (
                  <div
                    ref={drag}
                    style={{ position: 'absolute', left: position.x, top: position.y, cursor: 'move', background: '#fff', border: '1px light blue', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '1.125rem', minWidth: 80, minHeight: 40, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', }}
                  >
                    {signature && (
                      <span>{signature}</span>
                    )}
                    {drawnSignature && (
                      <img src={drawnSignature} alt="Drawn signature" style={{ display: 'block', margin: '0 auto', maxWidth: 120, maxHeight: 60 }} />
                    )}
                    {uploadedSignature && (
                      <img src={uploadedSignature} alt="Uploaded signature" style={{ display: 'block', margin: '0 auto', maxWidth: 120, maxHeight: 60 }} />
                    )}
                  </div>
                )}
                {/* Custom drag preview */}
                {isLayerDragging && currentOffset && (
                  <div style={{
                    position: 'fixed',
                    pointerEvents: 'none',
                    left: currentOffset.x,
                    top: currentOffset.y,
                    zIndex: 9999,
                    transform: 'translate(-50%, -50%)',
                    border: '1px solid #fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    fontSize: '1.125rem',
                    minWidth: 80,
                    minHeight: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    
                  }}>
                    {signature && <span>{signature}</span>}
                    {drawnSignature && <img src={drawnSignature} alt="Drawn signature" style={{ display: 'block', margin: '0 auto', maxWidth: 120, maxHeight: 60 }} />}
                    {uploadedSignature && <img src={uploadedSignature} alt="Uploaded signature" style={{ display: 'block', margin: '0 auto', maxWidth: 120, maxHeight: 60 }} />}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Signature tools on the right */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, height: '100%', paddingTop: '1px', paddingBottom: '2px' }}>
            <form style={{ width: '90%', maxWidth: 420, background: '#fff', border: '2px solid #3b82f6', borderRadius: '0.75rem', padding: '2rem 1.5rem', margin: '0 auto', color: '#18181b', boxShadow: '0 2px 12px rgba(59,130,246,0.10)', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', maxHeight: '80vh' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.1rem', marginBottom: '1rem', textAlign: 'center', color: '#18181b' }}>Sign PDF: {doc.title}</h3>
              <label style={{ fontWeight: 600, marginBottom: 4, fontSize: '1rem', color: '#334155' }}></label>
              <select
                value={signatureType}
                onChange={e => { setSignatureType(e.target.value); handleClear(); }}
                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '2px solid #3b82f6', fontSize: '1rem', marginBottom: '0.5rem', background: '#fff', color: '#18181b', boxSizing: 'border-box' }}
              >
                <option value="" disabled>Signature Type</option>
                <option value={SIGNATURE_TYPES.TEXT}>Text</option>
                <option value={SIGNATURE_TYPES.DRAW}>Draw</option>
                <option value={SIGNATURE_TYPES.UPLOAD}>Upload</option>
              </select>
              {/* Signature input based on type */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 0 }}>
                {signatureType === SIGNATURE_TYPES.TEXT && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '1rem', gap: '0.5rem', justifyContent: 'center' }}>
                    <label style={{ fontWeight: 600, width: 'auto', whiteSpace: 'nowrap', marginBottom: 0 }}>
                      Signature (type your name):
                    </label>
                    <input
                      type="text"
                      style={{
                        width: '100%',
                        maxWidth: 520,
                        height: 40,
                        border: '2px solid #3b82f6',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        padding: '0.75rem 1rem',
                        color: '#18181b',
                        background: '#fff',
                        fontFamily,
                        marginBottom: 0,
                        boxSizing: 'border-box',
                        textAlign: 'center',
                      }}
                      value={signature}
                      onChange={e => setSignature(e.target.value)}
                      placeholder="Enter your signature"
                    />
                    {/* Font size slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', width: '100%', maxWidth: 520 }}>
                      <label htmlFor="font-size-slider" style={{ fontWeight: 500, color: '#334155', fontSize: '1.1rem', minWidth: 70 }}>Font Size:</label>
                      <input
                        id="font-size-slider"
                        type="range"
                        min={12}
                        max={64}
                        value={fontSize}
                        onChange={e => setFontSize(Number(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{ minWidth: 32, textAlign: 'right', color: '#334155', fontWeight: 500 }}>{fontSize}px</span>
                    </div>
                    {/* Font label and dropdown below input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', width: '100%', maxWidth: 520 }}>
                      <label htmlFor="font-select" style={{ fontWeight: 500, color: '#334155', fontSize: '1.1rem', minWidth: 48 }}>Font:</label>
                      <select
                        id="font-select"
                        value={fontFamily}
                        onChange={e => setFontFamily(e.target.value)}
                        style={{
                          width: '100%',
                          maxWidth: 520,
                          height: 40,
                          border: '2px solid #3b82f6',
                          borderRadius: '0.5rem',
                          fontSize: '1.2rem',
                          padding: '0.4rem 0.5rem',
                          color: '#18181b',
                          background: '#fff',
                          fontFamily,
                          boxSizing: 'border-box',
                        }}
                      >
                        {fontOptions.map(opt => (
                          <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Live preview */}
                    {signature && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: fontSize,
                        fontFamily,
                        color: '#3b82f6',
                        fontWeight: 600,
                        border: '2px solid #3b82f6',
                        borderRadius: '0.75rem',
                        background: '#f1f5f9',
                        width: '100%',
                        maxWidth: 520,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                      }}>
                        {signature}
                      </div>
                    )}
                  </div>
                )}
                {signatureType === SIGNATURE_TYPES.DRAW && (
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1rem', gap: '1rem', justifyContent: 'center' }}>
                    <label style={{ fontWeight: 600, width: 'auto', whiteSpace: 'nowrap', marginBottom: 0 }}>
                      Draw your signature:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <SignatureCanvas
                        ref={sigCanvasRef}
                        penColor="black"
                        backgroundColor="#fff"
                        canvasProps={{ width: 300, height: 100, style: { border: '1.5px solid #cbd5e1', borderRadius: '0.375rem', display: 'block', margin: '0 auto', background: '#fff' } }}
                        onEnd={handleDraw}
                      />
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: '1rem' }}>
                        {drawnSignature && (
                          <img src={drawnSignature} alt="Debug drawn signature" style={{ maxWidth: 120, maxHeight: 60, border: '1px solid #888' }} />
                        )}
                        <button
                          style={{ background: '#e5e7eb', color: '#374151', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', alignSelf: 'center' }}
                          onClick={() => { sigCanvasRef.current && sigCanvasRef.current.clear(); setIsDrawn(false); }}
                        >
                          Clear Drawing
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {signatureType === SIGNATURE_TYPES.UPLOAD && (
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1rem', gap: '1rem', justifyContent: 'center' }}>
                    <label style={{ fontWeight: 600, width: 'auto', whiteSpace: 'nowrap', marginBottom: 0 }}>
                      Upload your signature image:
                    </label>
                    <div {...getRootProps()} style={{ border: '2px dashed #3b82f6', borderRadius: '0.375rem', padding: '1rem', width: '66%', textAlign: 'center', cursor: 'pointer', background: isDragActive ? '#e0edff' : '#fff', borderColor: isDragActive ? '#2563eb' : '#3b82f6', color: '#18181b' }}>
                      <input {...getInputProps()} />
                      {uploadedSignature ? (
                        <img src={uploadedSignature} alt="Uploaded signature" style={{ display: 'block', margin: '0 auto', maxHeight: 96 }} />
                      ) : (
                        <span>{isDragActive ? 'Drop the image here...' : 'Drag & drop or click to upload'}</span>
                      )}
                    </div>
                  </div>
                )}
                {/* Coordinates section */}
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
                      max={renderedHeight || 400}
                      value={position.y}
                      onChange={e => setPosition(pos => ({ ...pos, y: Number(e.target.value) }))}
                      style={{ width: 50, marginLeft: 2 }}
                    />
                  </label>
                </div>
                {coordError && (
                  <div style={{ color: 'red', fontWeight: 600, marginTop: 4, marginBottom: 4, textAlign: 'center' }}>{coordError}</div>
                )}
                <button
                  style={{ background: '#3b82f6', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' }}
                  onClick={e => { e.preventDefault(); handlePlaceSignature(); }}
                >
                  Place Signature
                </button>
                {/* Download and Clear buttons side by side, now below Place Signature */}
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
                  <button
                    style={{ background: '#3b82f6', color: '#fff', padding: '0.75rem 2rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer' }}
                    onClick={e => { e.preventDefault(); handleDownload(); }}
                  >
                    Download Signed PDF
                  </button>
                  <button
                    style={{ background: '#e5e7eb', color: '#334155', padding: '0.75rem 2rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer' }}
                    onClick={e => { e.preventDefault(); handleClear(); }}
                  >
                    Clear
                  </button>
                </div>
                {/* Conditional rendering based on signMode */}
                {/* Removed user dropdown and email input */}
              </div>
            </form>
          </div>
        </div>
        {/* Navigation buttons above the PDF box and below the navbar */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', maxWidth: 500, width: '100%', margin: '2rem auto 1rem auto' }}>
          <button
            style={{ background: '#e5e7eb', color: '#374151', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </button>
          <span style={{ fontWeight: 600 }}>Page {currentPage} of {numPages}</span>
          <button
            style={{ background: '#e5e7eb', color: '#374151', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal; 