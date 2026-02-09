import React, { useState, useEffect, useRef } from 'react';
import './AddDriveModal.css';

function AddDriveModal({ onAdd, onClose, existingNames }) {
  const [driveName, setDriveName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Auto-focus the input when modal opens
  useEffect(() => {
    if (inputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!driveName.trim()) {
      setError('Drive name is required');
      return;
    }

    if (existingNames.includes(driveName.trim())) {
      setError('A drive with this name already exists');
      return;
    }

    onAdd({
      name: driveName.trim(),
      description: description.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Drive</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="drive-name">DRIVE NAME *</label>
            <input
              id="drive-name"
              ref={inputRef}
              type="text"
              value={driveName}
              onChange={(e) => setDriveName(e.target.value)}
              placeholder="e.g., Red External 4TB - Projects"
              maxLength="50"
              autoComplete="off"
            />
            <small>Must be unique. This helps identify which physical drive you need.</small>
          </div>

          <div className="form-group">
            <label htmlFor="drive-description">DESCRIPTION (OPTIONAL)</label>
            <textarea
              id="drive-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Contains all After Effects projects from 2024-2025"
              rows="3"
            />
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          <div className="modal-actions">
            <button type="submit" className="button primary">
              Add Drive
            </button>
            <button type="button" className="button secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddDriveModal;
