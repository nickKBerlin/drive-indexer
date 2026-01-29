import React, { useState, useEffect } from 'react';
import './Scanner.css';

function Scanner({ drive, onScan, scanning }) {
  const [drivePath, setDrivePath] = useState('');
  const [scanProgress, setScanProgress] = useState('');

  // Log when drive prop changes
  useEffect(() => {
    console.log('[Scanner] Drive prop changed:', drive);
  }, [drive]);

  const handleBrowsePath = async () => {
    try {
      console.log('[Scanner] Browsing for path...');
      if (window.api && window.api.selectFolder) {
        const selectedPath = await window.api.selectFolder();
        if (selectedPath) {
          console.log('[Scanner] Selected path:', selectedPath);
          setDrivePath(selectedPath);
        }
      } else {
        alert('Folder browser not available. Please enter path manually.');
      }
    } catch (err) {
      console.error('[Scanner] Error browsing:', err);
      alert('Error opening folder browser: ' + err.message);
    }
  };

  const handleScan = () => {
    console.log('[Scanner] handleScan called');
    console.log('[Scanner] drivePath:', drivePath);
    console.log('[Scanner] drive:', drive);
    console.log('[Scanner] drive?.id:', drive?.id);

    if (!drivePath) {
      alert('Please select or enter a drive path');
      return;
    }
    if (!drive || !drive.id) {
      console.error('[Scanner] Drive validation failed:', { drive, driveId: drive?.id });
      alert('Error: Drive not properly selected. Please select the drive again.');
      return;
    }
    console.log('[Scanner] Starting scan with drive ID:', drive.id, 'path:', drivePath);
    onScan(drive.id, drivePath);
  };

  useEffect(() => {
    const handleProgress = (data) => {
      setScanProgress(data.status);
    };
    
    if (window.api?.onScanProgress) {
      window.api.onScanProgress(handleProgress);
    }
    
    return () => {};
  }, []);

  return (
    <div className="scanner-panel">
      <h3>🔍 Scan {drive?.name || 'Drive'}</h3>
      <div className="scanner-form">
        <div className="form-group">
          <label>Drive Path</label>
          <div className="path-input-group">
            <input
              type="text"
              value={drivePath}
              onChange={(e) => setDrivePath(e.target.value)}
              placeholder="e.g., D:/ or G:/ or \\\\SERVER\\Share"
              disabled={scanning}
              className="path-input"
            />
            <button
              type="button"
              className="button secondary"
              onClick={handleBrowsePath}
              disabled={scanning}
              title="Click to browse for a folder"
            >
              📁 Browse
            </button>
          </div>
          <small>Enter the path (e.g., D:/ or \\\\WDMYCLOUDMIRROR\\Public) or click Browse</small>
        </div>

        {scanProgress && (
          <div className="scan-progress">
            <span className="progress-text">{scanProgress}</span>
          </div>
        )}

        <button
          type="button"
          className="button primary"
          onClick={handleScan}
          disabled={scanning || !drivePath}
        >
          {scanning ? '🔄 Scanning...' : '▶ Start Scan'}
        </button>
      </div>
    </div>
  );
}

export default Scanner;
