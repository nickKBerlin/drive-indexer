import React, { useState } from 'react';
import './SearchPanel.css';
import DriveLetterModal from './DriveLetterModal';
import FilterTree from './FilterTree';

function SearchPanel({ drives, onSearch, results }) {
  const [query, setQuery] = useState('');
  const [selectedDrives, setSelectedDrives] = useState(new Set(drives.map(d => d.id)));
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('fileName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [actionedId, setActionedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Collapsible state - both collapsed by default
  const [fileTypesExpanded, setFileTypesExpanded] = useState(false);
  const [drivesExpanded, setDrivesExpanded] = useState(false);

  // Update selected drives when drives list changes
  React.useEffect(() => {
    setSelectedDrives(new Set(drives.map(d => d.id)));
  }, [drives]);

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
    onSearch(query, {
      driveIds: selectedDrives.size > 0 ? Array.from(selectedDrives) : null,
      categories: selectedCategories.length > 0 ? selectedCategories : null,
    });
    
    // Keep filter dropdowns open after search so users can adjust filters easily
  };

  // Callback when FilterTree changes
  const handleFilterChange = (categories) => {
    setSelectedCategories(categories);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  // Extract file extension from filename
  const getFileExtension = (fileName) => {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) return '-';
    return fileName.substring(lastDot).toUpperCase();
  };

  const showInFolder = async (file) => {
    try {
      console.log('[SearchPanel] Show in folder clicked');
      console.log('[SearchPanel] File:', file.fileName);
      console.log('[SearchPanel] Scan path from DB:', file.driveScanPath);
      
      // Smart detection: Check if we have scanPath and if it still exists
      if (file.driveScanPath) {
        console.log('[SearchPanel] Checking if path exists:', file.driveScanPath);
        const pathExists = await window.api.checkPathExists(file.driveScanPath);
        
        if (pathExists) {
          console.log('[SearchPanel] Path exists! Opening directly...');
          
          // Normalize paths: convert both to forward slashes first, then to backslashes
          const normalizedDrivePath = file.driveScanPath.replace(/\\/g, '/');
          const normalizedFilePath = file.filePath.replace(/\\/g, '/');
          
          // Remove trailing slash from drive path if present
          const cleanDrivePath = normalizedDrivePath.endsWith('/') 
            ? normalizedDrivePath.slice(0, -1) 
            : normalizedDrivePath;
          
          // Join paths and convert to Windows backslashes
          const fullPath = `${cleanDrivePath}/${normalizedFilePath}`.replace(/\//g, '\\');
          console.log('[SearchPanel] Full path:', fullPath);
          
          await window.api.showInFolder(fullPath);
          
          setActionedId(file.id);
          setTimeout(() => setActionedId(null), 2000);
          return;
        } else {
          console.log('[SearchPanel] Path no longer exists, showing modal...');
        }
      }
      
      // Fallback: Show modal
      console.log('[SearchPanel] Opening modal for manual input');
      setSelectedFile(file);
      setShowModal(true);
    } catch (err) {
      console.error('[SearchPanel] Error showing in folder:', err);
      alert('Could not open folder: ' + err.message);
    }
  };

  const handleConfirmDriveLetter = async (driveLetter) => {
    try {
      console.log('[SearchPanel] Drive letter entered:', driveLetter);
      console.log('[SearchPanel] File path:', selectedFile.filePath);
      
      const cleanLetter = driveLetter.trim().toUpperCase().replace(':', '');
      // Normalize file path to forward slashes first, then convert to backslashes
      const normalizedFilePath = selectedFile.filePath.replace(/\\/g, '/');
      const fullPath = `${cleanLetter}:/${normalizedFilePath}`.replace(/\//g, '\\');
      
      console.log('[SearchPanel] Full path constructed:', fullPath);
      
      await window.api.showInFolder(fullPath);
      
      setActionedId(selectedFile.id);
      setTimeout(() => setActionedId(null), 2000);
      setShowModal(false);
      setSelectedFile(null);
    } catch (err) {
      console.error('[SearchPanel] Error showing in folder:', err);
      alert('Could not open folder: ' + err.message);
      setShowModal(false);
      setSelectedFile(null);
    }
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setSelectedFile(null);
  };

  const toggleDrive = (driveId) => {
    const newSelected = new Set(selectedDrives);
    if (newSelected.has(driveId)) {
      newSelected.delete(driveId);
    } else {
      newSelected.add(driveId);
    }
    setSelectedDrives(newSelected);
  };

  const toggleAllDrives = () => {
    if (selectedDrives.size === drives.length) {
      setSelectedDrives(new Set());
    } else {
      setSelectedDrives(new Set(drives.map(d => d.id)));
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    let aVal, bVal;
    
    switch(sortBy) {
      case 'fileName':
        aVal = a.fileName.toLowerCase();
        bVal = b.fileName.toLowerCase();
        break;
      case 'fileSize':
        aVal = a.fileSize;
        bVal = b.fileSize;
        break;
      case 'modifiedAt':
        aVal = new Date(a.modifiedAt).getTime();
        bVal = new Date(b.modifiedAt).getTime();
        break;
      case 'category':
        aVal = a.category;
        bVal = b.category;
        break;
      case 'driveName':
        aVal = a.driveName;
        bVal = b.driveName;
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <div className="search-panel">
      <form className="search-form" onSubmit={handleSearch}>
        {/* Top: Search Input */}
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for files... (e.g., 'project', '.psd', 'motion')"
            className="search-input"
          />
          <button type="submit" className="button primary">
            Search
          </button>
        </div>

        {/* Collapsible Filter Sections */}
        <div className="filter-container-collapsible">
          {/* Search Scope Info - Compact Horizontal Layout */}
          <div className="search-scope-compact">
            <span className="scope-item">
              {selectedCategories.length === 0 
                ? 'All file types selected' 
                : `${selectedCategories.length} file type${selectedCategories.length !== 1 ? 's' : ''} selected`}
            </span>
            <span className="scope-separator">•</span>
            <span className="scope-item">
              {selectedDrives.size === 0 
                ? 'No drives selected'
                : selectedDrives.size === drives.length 
                  ? `Searching all ${drives.length} drive${drives.length !== 1 ? 's' : ''}` 
                  : `Searching ${selectedDrives.size} of ${drives.length} drive${drives.length !== 1 ? 's' : ''}`}
            </span>
            {results.length > 0 && (
              <>
                <span className="scope-separator">•</span>
                <span className="scope-item scope-results">
                  ✓ {results.length} file{results.length !== 1 ? 's' : ''} found
                </span>
              </>
            )}
          </div>

          {/* File Types - Collapsible */}
          <div className="filter-section-collapsible">
            <div 
              className="collapsible-header clickable"
              onClick={() => setFileTypesExpanded(!fileTypesExpanded)}
            >
              <span className={`expand-arrow ${fileTypesExpanded ? 'expanded' : ''}`}>▶</span>
              <h4>File Types</h4>
              <span className="filter-summary">
                {selectedCategories.length === 0 ? 'All' : `${selectedCategories.length} selected`}
              </span>
            </div>
            <div className={`collapsible-content ${fileTypesExpanded ? 'expanded' : ''}`}>
              <FilterTree onFilterChange={handleFilterChange} />
            </div>
          </div>

          {/* Drives - Collapsible */}
          <div className="filter-section-collapsible">
            <div 
              className="collapsible-header clickable"
              onClick={() => setDrivesExpanded(!drivesExpanded)}
            >
              <span className={`expand-arrow ${drivesExpanded ? 'expanded' : ''}`}>▶</span>
              <h4>Drives</h4>
              <span className="filter-summary">
                {selectedDrives.size === drives.length ? 'All' : `${selectedDrives.size}/${drives.length}`}
              </span>
            </div>
            <div className={`collapsible-content ${drivesExpanded ? 'expanded' : ''}`}>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedDrives.size === drives.length}
                    onChange={toggleAllDrives}
                  />
                  <strong>All Drives</strong>
                </label>
                <hr className="filter-divider" />
                {drives.map((drive) => (
                  <label key={drive.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedDrives.has(drive.id)}
                      onChange={() => toggleDrive(drive.id)}
                    />
                    {drive.name}
                    <span className="file-count">({drive.fileCount || 0})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="results-section">
          <h3>Search Results</h3>
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('fileName')} className="sortable">
                    File Name {sortBy === 'fileName' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('driveName')} className="sortable">
                    Drive {sortBy === 'driveName' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('fileSize')} className="sortable">
                    Size {sortBy === 'fileSize' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('category')} className="sortable">
                    Type {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('modifiedAt')} className="sortable">
                    Modified {sortBy === 'modifiedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Path</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((file) => (
                  <tr key={file.id}>
                    <td className="file-name">{file.fileName}</td>
                    <td className="drive-name">{file.driveName}</td>
                    <td className="file-size">{formatSize(file.fileSize)}</td>
                    <td className="file-type">{getFileExtension(file.fileName)}</td>
                    <td className="file-date">{formatDate(file.modifiedAt)}</td>
                    <td className="file-path" title={file.filePath}>{file.filePath}</td>
                    <td className="actions-cell">
                      <button
                        className="action-button"
                        onClick={() => showInFolder(file)}
                        title="Show file in Explorer"
                      >
                        {actionedId === file.id ? '✅' : '📂'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results Message - Only show after search is performed */}
      {hasSearched && results.length === 0 && (
        <div className="no-results">No files found matching your search.</div>
      )}

      {/* Drive Letter Modal */}
      {showModal && selectedFile && (
        <DriveLetterModal
          file={selectedFile}
          onConfirm={handleConfirmDriveLetter}
          onCancel={handleCancelModal}
        />
      )}
    </div>
  );
}

export default SearchPanel;
