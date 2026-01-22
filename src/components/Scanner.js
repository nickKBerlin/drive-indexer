import React, { useState } from 'react';
import './Scanner.css';

function Scanner({ drive, onScan, scanning }) {
  const [drivePath, setDrivePath] = useState('');
  const [scanProgress, setScanProgress] = useState('');

  const handleBrowsePath = async () => {
    try {
      // For development: use a test path
      // In production, use electron's dialog
      const testPath = 'D:/'; // Change this to test
      setDrivePath(testPath);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleScan = () => {
    if (!drivePath) {
      alert('Please select a drive path');
      return;
    }
    onScan(drive.id, drivePath);
  };

  React.useEffect(() => {
    const unsubscribe = window.api?.onScanProgress?.((data) => {
      setScanProgress(data.status);
    });
    return () => unsubscribe?.();
  }, []);

  return (
    <div className="scanner-panel">
      <h3>Scan {drive.name}</h3>
      <div className="scanner-form">
        <div className="form-group">
          <label>Drive Path</label>
          <div className="path-input-group">
            <input
              type="text"
              value={drivePath}
              onChange={(e) => setDrivePath(e.target.value)}
              placeholder="e.g., E:/ or /Volumes/ExternalDrive"
              disabled={scanning}
            />
            <button
              type="button"
              className="button secondary"
              onClick={handleBrowsePath}
              disabled={scanning}
            >
              Browse
            </button>
          </div>
          <small>Enter the root path of the drive you want to scan</small>
        </div>

        {scanProgress && <div className="scan-progress">{scanProgress}</div>}

        <button
          type="button"
          className="button primary"
          onClick={handleScan}
          disabled={scanning || !drivePath}
        >
          {scanning ? '🔄 Scanning...' : '🔍 Start Scan'}
        </button>
      </div>
    </div>
  );
}

export default Scanner;
