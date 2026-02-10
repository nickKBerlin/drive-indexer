import React, { useState } from 'react';
import './DriveList.css';
import AddDriveModal from './AddDriveModal';
import DeleteDriveModal from './DeleteDriveModal';

function DriveList({ drives, selectedDrive, onSelectDrive, onAddDrive, onDeleteDrive, scanningDrives, scanProgress, onScanDrive }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getConnectedStatus = (drive) => {
    return drive.lastScanned ? 'connected' : 'offline';
  };

  const calculateFreeSpace = (drive) => {
    if (drive.freeSpace != null) return drive.freeSpace;
    if (drive.totalSize) {
      // Fallback: assume 30% free when we don't have explicit freeSpace yet
      return drive.totalSize * 0.3;
    }
    return 0;
  };

  const calculateUsedSpace = (drive) => {
    const totalBytes = drive.totalSize || 0;
    const freeBytes = calculateFreeSpace(drive);
    return totalBytes - freeBytes;
  };

  const calculateUsedSpacePercentage = (drive) => {
    const totalBytes = drive.totalSize || 0;
    if (!totalBytes) return 0;
    const usedBytes = calculateUsedSpace(drive);
    return Math.round((usedBytes / totalBytes) * 100);
  };

  const calculateFreeSpacePercentage = (drive) => {
    const totalBytes = drive.totalSize || 0;
    if (!totalBytes) return 0;
    const freeBytes = calculateFreeSpace(drive);
    return Math.round((freeBytes / totalBytes) * 100);
  };

  const handleScanClick = async (e, drive) => {
    e.stopPropagation();
    
    try {
      const selectedPath = await window.api.selectFolder();
      
      if (selectedPath) {
        onScanDrive(drive.id, selectedPath);
      }
    } catch (err) {
      console.error('Error selecting folder:', err);
      alert('Error selecting folder: ' + err.message);
    }
  };

  const handleRemoveDrive = () => {
    if (!selectedDrive) return;
    
    // Check if user has opted to skip the warning
    const skipWarning = localStorage.getItem('skipDeleteDriveWarning') === 'true';
    
    if (skipWarning) {
      // Delete immediately without showing modal
      onDeleteDrive(selectedDrive.id);
    } else {
      // Show confirmation modal
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedDrive) {
      onDeleteDrive(selectedDrive.id);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="di-drive-panel">
      <div className="di-drive-header-row">
        <div>
          <h2 className="di-section-title">Your Drives</h2>
          <p className="di-section-subtitle">Registered storage devices and their index status</p>
        </div>
        <button className="di-button di-button-secondary" onClick={() => setShowAddModal(true)}>
          + Add Drive
        </button>
      </div>

      {showAddModal && (
        <AddDriveModal
          onAdd={(driveData) => {
            onAddDrive(driveData);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
          existingNames={drives.map(d => d.name)}
        />
      )}

      {showDeleteModal && selectedDrive && (
        <DeleteDriveModal
          drive={selectedDrive}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {drives.length === 0 ? (
        <div className="di-empty-state">
          <p className="di-empty-title">No drives registered yet</p>
          <p className="di-empty-subtitle">Click "+ Add Drive" to register your first drive.</p>
        </div>
      ) : (
        <>
          <div className="di-table-wrapper">
            <table className="di-table">
              <thead>
                <tr>
                  <th>Drive Name</th>
                  <th>Scan</th>
                  <th>Status</th>
                  <th>Size</th>
                  <th>Free Space</th>
                  <th>File Count</th>
                  <th>Last Scanned</th>
                </tr>
              </thead>
              <tbody>
                {drives.map((drive) => {
                  const isScanning = scanningDrives && scanningDrives.has(drive.id);
                  const progress = scanProgress && scanProgress[drive.id];
                  const connectedStatus = getConnectedStatus(drive);
                  const fileCount = drive.fileCount || 0;

                  // Calculate used and free space
                  const totalBytes = drive.totalSize || 0;
                  const usedBytes = calculateUsedSpace(drive);
                  const usedPercent = calculateUsedSpacePercentage(drive);
                  const freePercent = calculateFreeSpacePercentage(drive);

                  return (
                    <tr
                      key={drive.id}
                      className={`${selectedDrive?.id === drive.id ? 'selected' : ''}`}
                      onClick={() => onSelectDrive(drive)}
                    >
                      <td>
                        <div className="di-drive-cell">
                          <div className="di-drive-icon" aria-hidden="true" />
                          <div className="di-drive-meta">
                            <div className="di-drive-name">{drive.name}</div>
                            {drive.description && (
                              <div className="di-drive-description">{drive.description}</div>
                            )}
                            {isScanning && progress && (
                              <div className="di-drive-scanning">Scanning {progress.fileCount || 0} files…</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <button
                          className="di-chip action"
                          onClick={(e) => handleScanClick(e, drive)}
                          disabled={isScanning}
                          title={isScanning ? 'Scanning in progress...' : fileCount > 0 ? 'Re-scan this drive' : 'Scan this drive'}
                        >
                          ⟳ {isScanning ? 'Scanning…' : fileCount > 0 ? 'Re-Scan' : 'Scan'}
                        </button>
                      </td>

                      <td>
                        <span className={`di-status-pill ${connectedStatus}`}>
                          {connectedStatus === 'connected' ? 'Connected' : 'Offline'}
                        </span>
                      </td>

                      <td>{formatSize(totalBytes)}</td>

                      <td className="di-space-bar-cell">
                        <div className="di-space-bar">
                          <div className="di-space-bar-track">
                            <div
                              className="di-space-bar-fill"
                              style={{ width: `${usedPercent}%` }}
                            />
                          </div>
                          <div className="di-space-bar-labels">
                            <span>{formatSize(usedBytes)} used • {freePercent}% free</span>
                          </div>
                        </div>
                      </td>

                      <td>{fileCount.toLocaleString()}</td>

                      <td>{fileCount > 0 ? formatDate(drive.lastScanned) : 'Never'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Remove Drive Button - Bottom Right */}
          <div className="di-drive-footer">
            <button 
              className={`di-button di-button-danger ${selectedDrive ? 'active' : ''}`}
              onClick={handleRemoveDrive}
              disabled={!selectedDrive}
              title={selectedDrive ? `Remove ${selectedDrive.name}` : 'Select a drive to remove'}
            >
              Remove Drive
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default DriveList;
