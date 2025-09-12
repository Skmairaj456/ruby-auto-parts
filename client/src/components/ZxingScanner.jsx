import React, { useState } from 'react';
import QrScanner from 'react-qr-barcode-scanner';

const ZxingScanner = ({ onScan }) => {
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front camera

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

  return (
    <div className="scanner-container">
      <QrScanner
        key={facingMode} // Add key to force re-mount on facingMode change
        onUpdate={(err, result) => {
          if (result) {
            handleScan(result.getText());
          } else if (err) {
            handleError(err);
          }
        }}
        constraints={{
          facingMode: facingMode
        }}
        delay={300}
        style={{ width: '100%', height: 'auto' }}
      />
      <button onClick={toggleCamera} className="btn btn-secondary mt-2">Toggle Camera</button>
      <p className="scanner-hint">Point your camera at a barcode.</p>
    </div>
  );
};

export default ZxingScanner;
