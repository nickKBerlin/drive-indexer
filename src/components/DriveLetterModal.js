import React, { useState, useEffect } from 'react';
import './DriveLetterModal.css';

function DriveLetterModal({ file, onConfirm, onCancel }) {
  const [availableDrives, setAvailableDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState('');
  const [loading, setLoading] = useState(true);

  // Function to fetch available drive letters
  const fetchDrives = async () => {
    try {
      console.log('[DriveLetterModal] Fetching available drives...');
      const drives = await window.api.getAvailableDrives();
      console.log('[DriveLetterModal] Available drives:', drives);
      
      setAvailableDrives(drives);
      
      // If we don't have a selected drive yet, or the selected drive is no longer available
      if (!selectedDrive || !drives.includes(selectedDrive)) {
        // Set first drive as default selection
        if (drives.length > 0) {
          setSelectedDrive(drives[0]);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('[DriveLetterModal] Error fetching available drives:', err);
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchDrives();
  }, []);

  // Periodic polling - refresh drive list every 3 seconds
  useEffect(() => {
    console.log('[DriveLetterModal] Setting up periodic polling (every 3 seconds)...');
    const intervalId = setInterval(() => {
      console.log('[DriveLetterModal] Polling for drive updates...');
      fetchDrives();
    }, 3000); // 3 seconds

    // Cleanup interval when modal closes
    return () => {
      console.log('[DriveLetterModal] Cleaning up polling interval');
      clearInterval(intervalId);
    };
  }, [selectedDrive]); // Include selectedDrive in dependencies

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDrive) {
      onConfirm(selectedDrive);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="drive-letter-modal-overlay" onClick={onCancel}>
      <div className="drive-letter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="drive-letter-modal-header">
          <h3>Show File in Folder</h3>
        </div>
        
        <div className="drive-letter-modal-body">
          <p className="drive-letter-info">
            <strong>Drive:</strong> {file.driveName}
          </p>
          <p className="drive-letter-info">
            <strong>File:</strong> {file.fileName}
          </p>
          <p className="drive-letter-info drive-letter-path">
            <strong>Path:</strong> {file.filePath}
          </p>
          
          <div className="drive-letter-input-section">
            <label htmlFor="driveLetter" className="drive-letter-label">
              Select current drive letter:
            </label>
            
            {loading ? (
              <div className="drive-letter-loading">Loading available drives...</div>
            ) : availableDrives.length === 0 ? (
              <div className="drive-letter-error">No drives detected</div>
            ) : (
              <select
                id="driveLetter"
                value={selectedDrive}
                onChange={(e) => setSelectedDrive(e.target.value)}
                onKeyDown={handleKeyDown}
                className="drive-letter-select"
                autoFocus
              >
                {availableDrives.map((drive) => (
                  <option key={drive} value={drive}>
                    {drive}: (Drive {drive}:)
                  </option>
                ))}
              </select>
            )}
            
            <p className="drive-letter-hint">
              {availableDrives.length > 0 
                ? 'Select the drive letter where your external drive is currently mounted. List auto-updates every 3 seconds.' 
                : 'Connect your drive and it will appear here automatically'}
            </p>
          </div>
        </div>
        
        <div className="drive-letter-modal-footer">
          <button className="drive-letter-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="drive-letter-btn confirm" 
            onClick={handleSubmit}
            disabled={loading || !selectedDrive}
          >
            Open Folder
          </button>
        </div>
      </div>
    </div>
  );
}

export default DriveLetterModal;
