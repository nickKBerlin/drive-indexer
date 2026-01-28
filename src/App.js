import React, { useState, useEffect } from 'react';
import './App.css';
import DriveList from './components/DriveList';
import Scanner from './components/Scanner';
import SearchPanel from './components/SearchPanel';

function App() {
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [scanningDrives, setScanningDrives] = useState(new Set());
  const [scanProgress, setScanProgress] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('drives');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('[App] Initializing...');
    loadDrives();

    // Listen for scan progress updates
    if (window.api?.onScanProgress) {
      window.api.onScanProgress((data) => {
        setScanProgress(prev => ({ ...prev, [data.driveId]: data }));
      });
    }
  }, []);

  const loadDrives = async () => {
    try {
      console.log('[App] Loading drives...');
      const drivesData = await window.api.getDrives();
      console.log('[App] Loaded', drivesData.length, 'drives');
      setDrives(drivesData);
      setError('');
    } catch (err) {
      console.error('[App] Error loading drives:', err);
      setError('Error loading drives: ' + err.message);
    }
  };

  const handleAddDrive = async (driveData) => {
    try {
      console.log('[App] Adding drive:', driveData.name);
      const newDrive = await window.api.addDrive(driveData);
      console.log('[App] Drive added successfully');
      setDrives([...drives, newDrive]);
      setError('');
    } catch (err) {
      console.error('[App] Error adding drive:', err);
      setError('Error adding drive: ' + err.message);
    }
  };

  const handleDeleteDrive = async (driveId) => {
    if (scanningDrives.has(driveId)) {
      alert('Cannot delete a drive while it is being scanned.');
      return;
    }

    if (window.confirm('Are you sure? This will remove the drive and all its indexed files.')) {
      try {
        console.log('[App] Deleting drive:', driveId);
        await window.api.deleteDrive(driveId);
        setDrives(drives.filter(d => d.id !== driveId));
        setSelectedDrive(null);
        setError('');
      } catch (err) {
        console.error('[App] Error deleting drive:', err);
        setError('Error deleting drive: ' + err.message);
      }
    }
  };

  const handleScanDrive = async (driveId, drivePath) => {
    if (scanningDrives.has(driveId)) {
      alert('This drive is already being scanned.');
      return;
    }

    console.log('[App] Starting background scan:', drivePath);
    setScanningDrives(prev => new Set(prev).add(driveId));
    setError('');

    try {
      console.log('[App] Calling API to scan...');
      const result = await window.api.scanDrive(driveId, drivePath);
      console.log('[App] Scan completed, reloading drives...');
      await loadDrives();

      setScanningDrives(prev => {
        const newSet = new Set(prev);
        newSet.delete(driveId);
        return newSet;
      });

      setScanProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[driveId];
        return newProgress;
      });

      alert(`Scan complete! Indexed ${result.fileCount} files.`);
    } catch (err) {
      console.error('[App] Error scanning drive:', err);
      setScanningDrives(prev => {
        const newSet = new Set(prev);
        newSet.delete(driveId);
        return newSet;
      });
      setError('Error scanning drive: ' + err.message);
      alert('Error scanning drive: ' + err.message);
    }
  };

  const handleSearch = async (query, filters) => {
    try {
      console.log('[App] Searching:', query, filters);
      const results = await window.api.searchFiles(query, filters);
      console.log('[App] Found', results.length, 'results');
      setSearchResults(results);
      setError('');
    } catch (err) {
      console.error('[App] Error searching:', err);
      setError('Error searching: ' + err.message);
    }
  };

  const isSelectedDriveScanning = selectedDrive && scanningDrives.has(selectedDrive.id);

  return (
    <div className="app">
      <div className="app-header">
        <h1>Drive Indexer</h1>
        {error && <div className="error-message">{error}</div>}
        
        <div className="app-nav">
          <button
            className={`nav-button ${activeTab === 'drives' ? 'active' : ''}`}
            onClick={() => setActiveTab('drives')}
          >
            Drives
          </button>
          <button
            className={`nav-button ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
        </div>
      </div>

      <div className="app-container">
        <div className="app-content">
          <div className={`tab-content ${activeTab === 'drives' ? 'active' : ''}`}>
            <div className="drives-header">
              <Scanner
                drive={selectedDrive}
                onScan={handleScanDrive}
                scanning={!!isSelectedDriveScanning}
              />
            </div>
            <DriveList
              drives={drives}
              selectedDrive={selectedDrive}
              onSelectDrive={setSelectedDrive}
              scanningDrives={scanningDrives}
              scanProgress={scanProgress}
              onScanDrive={handleScanDrive}
              onDeleteDrive={handleDeleteDrive}
              onAddDrive={handleAddDrive}
            />
          </div>

          <div className={`tab-content ${activeTab === 'search' ? 'active' : ''}`}>
            <SearchPanel
              drives={drives}
              onSearch={handleSearch}
              results={searchResults}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
