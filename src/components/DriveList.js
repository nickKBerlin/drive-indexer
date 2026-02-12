import React, { useState, useEffect } from 'react';
import './DriveList.css';
import AddDriveModal from './AddDriveModal';
import DeleteDriveModal from './DeleteDriveModal';

function DriveList({ drives, selectedDrive, onSelectDrive, onAddDrive, onDeleteDrive, scanningDrives, scanProgress, onScanDrive }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [driveConnectivity, setDriveConnectivity] = useState({});
  const [driveLocations, setDriveLocations] = useState({});

  // Smart drive connectivity check with auto-update
  const checkDriveConnectivity = async () => {
    try {
      console.log('========================================');
      console.log('[DriveList] Checking drive connectivity...');
      console.log('[DriveList] Number of registered drives:', drives.length);
      
      const connectivity = {};
      const locations = {};
      const drivesToUpdate = [];
      
      for (const drive of drives) {
        console.log(`\n[DriveList] Checking drive: "${drive.name}"`);
        console.log(`[DriveList]   - ID: ${drive.id}`);
        console.log(`[DriveList]   - Stored scanPath: ${drive.scanPath}`);
        console.log(`[DriveList]   - File count: ${drive.fileCount}`);
        
        if (!drive.scanPath || !drive.fileCount || drive.fileCount === 0) {
          console.log(`[DriveList]   - No scanPath or no files: OFFLINE`);
          connectivity[drive.id] = 'offline';
          locations[drive.id] = null;
          continue;
        }
        
        // Use smart detection to find drive even if letter changed
        const result = await window.api.findDriveLocation(drive.id);
        
        if (result.connected) {
          console.log(`[DriveList]   - ✅ FOUND at: ${result.location}`);
          connectivity[drive.id] = 'connected';
          locations[drive.id] = result.location;
          
          // If location changed, mark for database update
          if (result.location !== drive.scanPath) {
            console.log(`[DriveList]   - 📍 LOCATION CHANGED!`);
            console.log(`[DriveList]      Old: ${drive.scanPath}`);
            console.log(`[DriveList]      New: ${result.location}`);
            drivesToUpdate.push({
              id: drive.id,
              name: drive.name,
              newPath: result.location
            });
          }
        } else {
          console.log(`[DriveList]   - ❌ NOT FOUND: OFFLINE`);
          connectivity[drive.id] = 'offline';
          locations[drive.id] = null;
        }
      }
      
      // Update database for drives with changed paths
      if (drivesToUpdate.length > 0) {
        console.log(`\n[DriveList] Updating ${drivesToUpdate.length} drive(s) with new paths...`);
        for (const driveUpdate of drivesToUpdate) {
          try {
            await window.api.updateDrive(driveUpdate.id, { scanPath: driveUpdate.newPath });
            console.log(`[DriveList] ✅ Updated "${driveUpdate.name}" path in database`);
          } catch (err) {
            console.error(`[DriveList] ❌ Failed to update "${driveUpdate.name}":`, err);
          }
        }
        
        // Reload drives to get updated data
        console.log('[DriveList] Reloading drives from database...');
        const updatedDrives = await window.api.getDrives();
        // Trigger parent component update by calling a callback if available
        // For now, just log - the next polling cycle will show updated data
        console.log('[DriveList] Database updated, changes will reflect on next refresh');
      }
      
      console.log('\n[DriveList] Final connectivity status:', connectivity);
      console.log('[DriveList] Final locations:', locations);
      console.log('========================================\n');
      
      setDriveConnectivity(connectivity);
      setDriveLocations(locations);
    } catch (err) {
      console.error('[DriveList] ERROR checking drive connectivity:', err);
      console.error('[DriveList] Error stack:', err.stack);
      // On error, mark all as offline
      const connectivity = {};
      const locations = {};
      for (const drive of drives) {
        connectivity[drive.id] = 'offline';
        locations[drive.id] = null;
      }
      setDriveConnectivity(connectivity);
      setDriveLocations(locations);
    }
  };

  // Check connectivity on mount and when drives change
  useEffect(() => {
    console.log('[DriveList] useEffect triggered - drives changed, count:', drives.length);
    if (drives.length > 0) {
      checkDriveConnectivity();
    }
  }, [drives]);

  // Periodic polling for real-time connectivity updates (every 5 seconds)
  useEffect(() => {
    if (drives.length === 0) {
      console.log('[DriveList] No drives to poll');
      return;
    }

    console.log('[DriveList] Setting up periodic connectivity polling (every 5 seconds)...');
    const intervalId = setInterval(() => {
      console.log('[DriveList] Polling interval triggered...');
      checkDriveConnectivity();
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      console.log('[DriveList] Cleaning up connectivity polling');
      clearInterval(intervalId);
    };
  }, [drives]);

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
    // Use real-time connectivity status
    return driveConnectivity[drive.id] || 'offline';
  };

  const getCurrentLocation = (drive) => {
    // Get current detected location (may differ from stored scanPath)
    return driveLocations[drive.id] || drive.scanPath;
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

  const handleResetWarnings = () => {
    localStorage.removeItem('skipDeleteDriveWarning');
    alert('Delete drive warnings have been re-enabled.');
  };

  return (
    <div className="di-drive-panel">
      <div className="di-drive-header-row">
        <div>
          <h2 className="di-section-title">Your Drives</h2>
          <p className="di-section-subtitle">Registered storage devices and their index status</p>
        </div>
        <div className="di-header-buttons">
          <button 
            className="di-button di-button-text"
            onClick={handleResetWarnings}
            title="Re-enable all warning dialogs"
          >
            ⟳ Reset Warnings
          </button>
          <button className="di-button di-button-secondary" onClick={() => setShowAddModal(true)}>
            + Add Drive
          </button>
        </div>
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
                  const currentLocation = getCurrentLocation(drive);
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
