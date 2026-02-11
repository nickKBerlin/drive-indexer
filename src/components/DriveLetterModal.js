import React, { useState, useEffect, useRef } from 'react';
import './DriveLetterModal.css';

function DriveLetterModal({ file, onConfirm, onCancel }) {
  const [driveLetter, setDriveLetter] = useState('G');
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus input
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 100);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (driveLetter.trim()) {
      onConfirm(driveLetter.trim());
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
              Enter current drive letter:
            </label>
            <input
              ref={inputRef}
              id="driveLetter"
              type="text"
              value={driveLetter}
              onChange={(e) => setDriveLetter(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              maxLength="1"
              placeholder="G"
              className="drive-letter-input"
            />
            <p className="drive-letter-hint">
              Example: Enter "G" for G:/ or "E" for E:/
            </p>
          </div>
        </div>
        
        <div className="drive-letter-modal-footer">
          <button className="drive-letter-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="drive-letter-btn confirm" onClick={handleSubmit}>
            Open Folder
          </button>
        </div>
      </div>
    </div>
  );
}

export default DriveLetterModal;
