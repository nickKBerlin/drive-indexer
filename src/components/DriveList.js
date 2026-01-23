import React, { useState } from 'react';
import './DriveList.css';
import AddDriveModal from './AddDriveModal';

function DriveList({ drives, selectedDrive, onSelectDrive, onAddDrive, onDeleteDrive, scanningDrives, scanProgress }) {
  const [showModal, setShowModal] = useState(false);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="drive-list-container">
      <div className="drive-list-header">
        <h2>Your Drives</h2>
        <button className="button primary" onClick={() => setShowModal(true)}>
          + Add Drive
        </button>
      </div>

      {showModal && (
        <AddDriveModal
          onAdd={(driveData) => {
            onAddDrive(driveData);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
          existingNames={drives.map(d => d.name)}
        />
      )}

      <div className="drives-grid">
        {drives.length === 0 ? (
          <div className="empty-state">
            <p>No drives registered yet. Click "Add Drive" to get started!</p>
          </div>
        ) : (
          drives.map((drive) => {
            const isScanning = scanningDrives && scanningDrives.has(drive.id);
            const progress = scanProgress && scanProgress[drive.id];
            
            return (
              <div
                key={drive.id}
                className={`drive-card ${selectedDrive?.id === drive.id ? 'selected' : ''} ${isScanning ? 'scanning' : ''}`}
                onClick={() => onSelectDrive(drive)}
              >
                <div className="drive-card-header">
                  <h3>📀 {drive.name}</h3>
                  <button
                    className="button danger small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDrive(drive.id);
                    }}
                    disabled={isScanning}
                  >
                    Delete
                  </button>
                </div>
                {drive.description && <p className="drive-description">{drive.description}</p>}
                {isScanning && progress && (
                  <div className="scanning-badge">
                    🔄 Scanning... {progress.fileCount || 0} files
                  </div>
                )}
                <div className="drive-stats">
                  <div className="stat">
                    <span className="stat-label">Files:</span>
                    <span className="stat-value">{drive.fileCount || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Size:</span>
                    <span className="stat-value">{formatSize(drive.totalSize || 0)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Last Scanned:</span>
                    <span className="stat-value">{formatDate(drive.lastScanned)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default DriveList;
