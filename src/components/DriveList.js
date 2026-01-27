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
    if (!dateString) return 'Never scanned';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getConnectedStatus = (drive) => {
    // You can implement drive connection detection here
    // For now, we'll show connected if it has been scanned
    return drive.lastScanned ? 'connected' : 'offline';
  };

  const calculateFreeSpace = (drive) => {
    // If we don't have free space info, calculate from total
    if (!drive.freeSpace && drive.totalSize) {
      return drive.totalSize * 0.3; // Assume 30% free for demo
    }
    return drive.freeSpace || 0;
  };

  const calculateFreeSpacePercentage = (drive) => {
    if (!drive.totalSize) return 0;
    const freeSpace = calculateFreeSpace(drive);
    return Math.round((freeSpace / drive.totalSize) * 100);
  };

  const getUsedSpacePercentage = (drive) => {
    return 100 - calculateFreeSpacePercentage(drive);
  };

  return (
    <div className="drive-list-container">
      <div className="drive-list-header">
        <h2>📁 Your Drives</h2>
        <button className="button primary" onClick={() => setShowModal(true)}>
          ➕ Add Drive
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

      {drives.length === 0 ? (
        <div className="empty-state">
          <p>📭 No drives registered yet</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Click "Add Drive" to get started!</p>
        </div>
      ) : (
        <table className="drives-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Drive Name</th>
              <th style={{ width: '12%' }}>Scan</th>
              <th style={{ width: '10%' }}>Status</th>
              <th style={{ width: '12%' }}>Size</th>
              <th style={{ width: '20%' }}>Free Space</th>
              <th style={{ width: '15%' }}>Last Scanned</th>
              <th style={{ width: '6%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {drives.map((drive) => {
              const isScanning = scanningDrives && scanningDrives.has(drive.id);
              const progress = scanProgress && scanProgress[drive.id];
              const connectedStatus = getConnectedStatus(drive);
              const usedPercentage = getUsedSpacePercentage(drive);
              const fileCount = drive.fileCount || 0;

              return (
                <tr key={drive.id} className={isScanning ? 'scanning' : ''}>
                  {/* Drive Name Column */}
                  <td>
                    <div className="drive-name-cell">
                      <div className="drive-icon">💾</div>
                      <div className="drive-info-group">
                        <div className="drive-name">{drive.name}</div>
                        {drive.description && (
                          <div className="drive-description">{drive.description}</div>
                        )}
                        {isScanning && progress && (
                          <div className="scanning-badge">
                            🔄 {progress.fileCount || 0} files
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Scan Button Column */}
                  <td>
                    <button
                      className={`button ${fileCount > 0 ? 'rescan' : 'scan'} small`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDrive(drive);
                      }}
                      disabled={isScanning}
                      title={fileCount > 0 ? 'Re-scan this drive' : 'Scan this drive'}
                    >
                      {isScanning ? '🔄 Scanning' : (fileCount > 0 ? '♻️ Re-Scan' : '📊 Scan')}
                    </button>
                  </td>

                  {/* Status Column */}
                  <td>
                    <div className={`status-indicator ${connectedStatus}`}>
                      <span className={`status-dot ${connectedStatus}`}></span>
                      {connectedStatus === 'connected' ? '🟢 Connected' : '⚫ Offline'}
                    </div>
                  </td>

                  {/* Size Column */}
                  <td>
                    <div className="size-cell">{formatSize(drive.totalSize || 0)}</div>
                  </td>

                  {/* Free Space Column with Progress Bar */}
                  <td>
                    <div className="free-space-cell">
                      <div className="progress-bar-container">
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${usedPercentage}%` }}
                          ></div>
                        </div>
                        <div className="progress-bar-label">
                          <span>{formatSize(calculateFreeSpace(drive))}</span>
                          <span>{calculateFreeSpacePercentage(drive)}% free</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Last Scanned Column */}
                  <td>
                    <div className={`date-cell ${!drive.lastScanned ? 'never-scanned' : ''}`}>
                      {fileCount > 0 ? formatDate(drive.lastScanned) : 'Never'}
                    </div>
                  </td>

                  {/* Delete Button Column */}
                  <td>
                    <div className="actions-cell">
                      <button
                        className="button danger small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDrive(drive.id);
                        }}
                        disabled={isScanning}
                        title="Delete this drive from database"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DriveList;
