import React, { useState } from 'react';
import './DeleteDriveModal.css';

function DeleteDriveModal({ drive, onConfirm, onCancel }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    if (dontShowAgain) {
      // Store preference in localStorage
      localStorage.setItem('skipDeleteDriveWarning', 'true');
    }
    onConfirm();
  };

  return (
    <div className="delete-drive-modal-overlay" onClick={onCancel}>
      <div className="delete-drive-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-drive-modal-header">
          <h3>Delete Drive</h3>
        </div>
        
        <div className="delete-drive-modal-body">
          <p className="delete-drive-warning">
            Are you sure you want to remove <strong>{drive.name}</strong> from the database?
          </p>
          <p className="delete-drive-subtext">
            This will delete all indexed files for this drive. This action cannot be undone.
          </p>
          
          <label className="delete-drive-checkbox-label">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>Do not show this warning again</span>
          </label>
        </div>
        
        <div className="delete-drive-modal-footer">
          <button className="delete-drive-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="delete-drive-btn confirm" onClick={handleConfirm}>
            Delete Drive
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteDriveModal;
