import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';

const ZxingScanner = ({ onScan }) => {
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front camera

  const handleScan = (result, error) => {
    if (!!result) {
      onScan(result?.text);
    }

    if (!!error) {
      // console.info(error);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prevMode => (prevMode === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="scanner-container">
      <QrReader
        key={facingMode} // Add key to force re-mount on facingMode change
        onResult={handleScan}
        constraints={{
          facingMode: facingMode
        }}
        scanDelay={300}
        videoStyle={{ width: '100%', height: 'auto' }}
        containerStyle={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
      />
      <button onClick={toggleCamera} className="btn btn-secondary mt-2">Toggle Camera</button>
      <p className="scanner-hint">Point your camera at a barcode.</p>
    </div>
  );
};

export default ZxingScanner;
