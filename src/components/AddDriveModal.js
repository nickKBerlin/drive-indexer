import React, { useState } from 'react';
import './AddDriveModal.css';
const { dialog } = require('electron').remote || {};

function AddDriveModal({ onAdd, onClose, existingNames }) {
  const [driveName, setDriveName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!driveName.trim()) {
      setError('Drive name is required');
      return;
    }

    if (existingNames.includes(driveName)) {
      setError('A drive with this name already exists');
      return;
    }

    onAdd({
      name: driveName,
      description: description,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Drive</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Drive Name *</label>
            <input
              type="text"
              value={driveName}
              onChange={(e) => setDriveName(e.target.value)}
              placeholder="e.g., Red External 4TB - Projects"
              maxLength="50"
            />
            <small>Must be unique. This helps identify which physical drive you need.</small>
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Contains all After Effects projects from 2024-2025"
              rows="3"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button primary">
              Add Drive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddDriveModal;
