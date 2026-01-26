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
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🗂️ Show File in Folder</h3>
          <button className="modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-info">
            <strong>Drive:</strong> {file.driveName}
          </p>
          <p className="modal-info">
            <strong>File:</strong> {file.fileName}
          </p>
          <p className="modal-info file-path">
            <strong>Path:</strong> {file.filePath}
          </p>
          
          <div className="drive-letter-input-group">
            <label htmlFor="driveLetter">
              Enter current drive letter:
            </label>
            <div className="input-with-suffix">
              <input
                ref={inputRef}
                id="driveLetter"
                type="text"
                value={driveLetter}
                onChange={(e) => setDriveLetter(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                maxLength="2"
                placeholder="G"
                className="drive-letter-input"
              />
              <span className="input-suffix">:/</span>
            </div>
            <p className="input-hint">
              Example: Enter "G" for G:/ or "E" for E:/
            </p>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="button secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="button primary" onClick={handleSubmit}>
            📂 Open Folder
          </button>
        </div>
      </div>
    </div>
  );
}

export default DriveLetterModal;
