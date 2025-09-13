import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const ZxingScanner = ({ onScan }) => {
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front camera
  const videoRef = useRef(null);
  const codeReader = useRef(null);

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
      if (codeReader.current) {
        codeReader.current.reset();
      }

      // Create new scanner
      codeReader.current = new BrowserMultiFormatReader();
      
      const constraints = {
        video: {
          facingMode: facingMode
        }
      };

      codeReader.current.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          handleScan(result.getText());
        }
        if (err && !(err instanceof Error)) {
          handleError(err);
        }
      }, constraints);

      return () => {
        if (codeReader.current) {
          codeReader.current.reset();
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
