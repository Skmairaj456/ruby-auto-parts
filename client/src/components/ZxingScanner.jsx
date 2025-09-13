import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';

const ZxingScanner = ({ onScan }) => {
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front camera
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  const handleScan = (result) => {
    if (result) {
      onScan(result);
    }
  };

  const handleError = (error) => {
    // console.info(error);
  };

  const toggleCamera = () => {
    setFacingMode(prevMode => (prevMode === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    if (videoRef.current) {
      // Clean up previous scanner
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }

      // Create new scanner
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => handleScan(result.data),
        {
          onDecodeError: (error) => handleError(error),
          preferredCamera: facingMode,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current = qrScanner;
      qrScanner.start();

      return () => {
        if (qrScannerRef.current) {
          qrScannerRef.current.destroy();
        }
      };
    }
  }, [facingMode]);

  return (
    <div className="scanner-container">
      <video
        ref={videoRef}
        style={{ width: '100%', height: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}
      />
      <button onClick={toggleCamera} className="btn btn-secondary mt-2">Toggle Camera</button>
      <p className="scanner-hint">Point your camera at a barcode.</p>
    </div>
  );
};

export default ZxingScanner;
