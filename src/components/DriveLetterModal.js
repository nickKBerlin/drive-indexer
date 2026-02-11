import React, { useState, useEffect } from 'react';
import './DriveLetterModal.css';

function DriveLetterModal({ file, onConfirm, onCancel }) {
  const [availableDrives, setAvailableDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch available drive letters
    const fetchDrives = async () => {
      try {
        const drives = await window.api.getAvailableDrives();
        setAvailableDrives(drives);
        // Set first drive as default selection
        if (drives.length > 0) {
          setSelectedDrive(drives[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching available drives:', err);
        setLoading(false);
      }
    };

    fetchDrives();
  }, []);

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
              Select the drive letter where your external drive is currently mounted
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
