import React, { useState, useEffect } from 'react';
import './App.css';
import DriveList from './components/DriveList';
import Scanner from './components/Scanner';
import SearchPanel from './components/SearchPanel';

function App() {
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('drives'); // 'drives' or 'search'

  useEffect(() => {
    loadDrives();
  }, []);

  const loadDrives = async () => {
    try {
      const drivesData = await window.api.getDrives();
      setDrives(drivesData);
    } catch (err) {
      console.error('Error loading drives:', err);
    }
  };

  const handleAddDrive = async (driveData) => {
    try {
      const newDrive = await window.api.addDrive(driveData);
      setDrives([...drives, newDrive]);
    } catch (err) {
      alert('Error adding drive: ' + err.message);
    }
  };

  const handleDeleteDrive = async (driveId) => {
    if (window.confirm('Are you sure? This will remove the drive and all its indexed files.')) {
      try {
        await window.api.deleteDrive(driveId);
        setDrives(drives.filter(d => d.id !== driveId));
        setSelectedDrive(null);
      } catch (err) {
        alert('Error deleting drive: ' + err.message);
      }
    }
  };

  const handleScanDrive = async (driveId, drivePath) => {
    setScanning(true);
    try {
      const result = await window.api.scanDrive(driveId, drivePath);
      await loadDrives();
      setScanning(false);
      alert(`Scan complete! Indexed ${result.fileCount} files.`);
    } catch (err) {
      setScanning(false);
      alert('Error scanning drive: ' + err.message);
    }
  };

  const handleSearch = async (query, filters) => {
    try {
      const results = await window.api.searchFiles(query, filters);
      setSearchResults(results);
      setActiveTab('results');
    } catch (err) {
      alert('Error searching: ' + err.message);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 Drive Indexer</h1>
        <p>Find your creative assets across all drives</p>
      </header>

      <div className="app-container">
        <nav className="app-nav">
          <button
            className={`nav-button ${activeTab === 'drives' ? 'active' : ''}`}
            onClick={() => setActiveTab('drives')}
          >
            📁 Drives ({drives.length})
          </button>
          <button
            className={`nav-button ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Search
          </button>
        </nav>

        <div className="app-content">
          {activeTab === 'drives' && (
            <div className="tab-content">
              <DriveList
                drives={drives}
                selectedDrive={selectedDrive}
                onSelectDrive={setSelectedDrive}
                onAddDrive={handleAddDrive}
                onDeleteDrive={handleDeleteDrive}
              />
              {selectedDrive && (
                <Scanner
                  drive={selectedDrive}
                  onScan={handleScanDrive}
                  scanning={scanning}
                />
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <SearchPanel
              drives={drives}
              onSearch={handleSearch}
              results={searchResults}
            />
          )}

          {activeTab === 'results' && searchResults.length > 0 && (
            <div className="results-panel">
              <h2>Search Results ({searchResults.length})</h2>
              <div className="results-list">
                {searchResults.map((file) => (
                  <div key={file.id} className="result-item">
                    <div className="result-header">
                      <span className="result-filename">{file.fileName}</span>
                      <span className="result-category">{file.category}</span>
                    </div>
                    <div className="result-details">
                      <span className="result-drive">📀 {file.driveName}</span>
                      <span className="result-path">{file.filePath}</span>
                      <span className="result-size">({(file.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="button secondary"
                onClick={() => setActiveTab('search')}
              >
                ← Back to Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
