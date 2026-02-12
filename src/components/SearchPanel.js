import React, { useState } from 'react';
import './SearchPanel.css';
import DriveLetterModal from './DriveLetterModal';
import FilterTree from './FilterTree';

function SearchPanel({ drives, onSearch, results }) {
  const [query, setQuery] = useState('');
  const [selectedDrives, setSelectedDrives] = useState(new Set(drives.map(d => d.id)));
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [includeFolders, setIncludeFolders] = useState(false);
  const [sortBy, setSortBy] = useState('fileName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [actionedId, setActionedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Collapsible state - BOTH COLLAPSED BY DEFAULT (matching mockup)
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
      includeFolders: includeFolders,
    });
    
    // Keep filters collapsed after search (matching mockup behavior)
    setFileTypesExpanded(false);
    setDrivesExpanded(false);
  };

  // Callback when FilterTree changes
  const handleFilterChange = (categories) => {
    setSelectedCategories(categories);
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
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

  const showInFolder = async (item) => {
    try {
      console.log('[SearchPanel] ========== Show in folder clicked ==========');
      console.log('[SearchPanel] Item:', item.fileName);
      console.log('[SearchPanel] Type:', item.resultType);
      console.log('[SearchPanel] Drive:', item.driveName);
      console.log('[SearchPanel] Scan path from DB:', item.driveScanPath);
      
      // Check if required fields are present
      if (!item.fileName || !item.driveName || !item.filePath) {
        console.error('[SearchPanel] ERROR: Missing required item fields!');
        alert('Error: Item information is incomplete. Please try rescanning the drive.');
        return;
      }
      
      // Smart detection: Check if we have scanPath and if the FULL PATH still exists
      if (item.driveScanPath) {
        // Normalize paths: convert both to forward slashes first, then to backslashes
        const normalizedDrivePath = item.driveScanPath.replace(/\\/g, '/');
        const normalizedItemPath = item.filePath.replace(/\\/g, '/');
        
        // Remove trailing slash from drive path if present
        const cleanDrivePath = normalizedDrivePath.endsWith('/') 
          ? normalizedDrivePath.slice(0, -1) 
          : normalizedDrivePath;
        
        // Join paths and convert to Windows backslashes
        const fullPath = `${cleanDrivePath}/${normalizedItemPath}`.replace(/\//g, '\\');
        console.log('[SearchPanel] Constructed full path:', fullPath);
        
        try {
          // Check if the FULL PATH exists
          console.log('[SearchPanel] Checking if path exists...');
          const pathExists = await window.api.checkPathExists(fullPath);
          console.log('[SearchPanel] Path exists result:', pathExists);
          
          if (pathExists) {
            console.log('[SearchPanel] Path exists! Opening directly...');
            
            try {
              await window.api.showInFolder(fullPath);
              console.log('[SearchPanel] Successfully opened location');
              
              setActionedId(item.id);
              setTimeout(() => setActionedId(null), 2000);
              return;
            } catch (openError) {
              console.error('[SearchPanel] Error opening location:', openError);
              // Fall through to show modal
            }
          } else {
            console.log('[SearchPanel] Path no longer exists at original location, showing modal...');
          }
        } catch (pathCheckError) {
          console.error('[SearchPanel] Error checking path:', pathCheckError);
          // Continue to show modal
        }
      } else {
        console.log('[SearchPanel] No driveScanPath in item object');
      }
      
      // Fallback: Show modal for manual drive selection
      console.log('[SearchPanel] Opening modal for manual drive selection');
      setSelectedFile(item);
      setShowModal(true);
    } catch (err) {
      console.error('[SearchPanel] ERROR in showInFolder:', err);
      alert('Could not open folder: ' + err.message);
    }
  };

  const handleConfirmDriveLetter = async (driveLetter) => {
    try {
      console.log('[SearchPanel] Drive letter selected:', driveLetter);
      console.log('[SearchPanel] Item path:', selectedFile.filePath);
      
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
    console.log('[SearchPanel] Modal cancelled');
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
        aVal = a.fileSize || 0;
        bVal = b.fileSize || 0;
        break;
      case 'modifiedAt':
        aVal = a.modifiedAt ? new Date(a.modifiedAt).getTime() : 0;
        bVal = b.modifiedAt ? new Date(b.modifiedAt).getTime() : 0;
        break;
      case 'category':
        aVal = a.category || '';
        bVal = b.category || '';
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

  // Count files vs folders in results
  const fileCount = results.filter(r => r.resultType === 'file').length;
  const folderCount = results.filter(r => r.resultType === 'folder').length;

  return (
    <div className="search-panel">
      <form className="search-form" onSubmit={handleSearch}>
        {/* Top Row: Search Input + Checkbox + Button */}
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for files and folders... (e.g., 'project', '.psd', 'motion')"
            className="search-input"
          />
          <label className="checkbox-label-inline">
            <input
              type="checkbox"
              checked={includeFolders}
              onChange={(e) => setIncludeFolders(e.target.checked)}
            />
            Include folders
          </label>
          <button type="submit" className="button primary">
            Search
          </button>
        </div>

        {/* Info Line - Compact */}
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
                ✓ {fileCount} file{fileCount !== 1 ? 's' : ''}
                {folderCount > 0 && ` + ${folderCount} folder${folderCount !== 1 ? 's' : ''}`} found
              </span>
            </>
          )}
        </div>

        {/* Collapsible Filters - COLLAPSED BY DEFAULT */}
        <div className="filter-container-collapsible">
          {/* File Types - Collapsible */}
          <div className="filter-section-collapsible">
            <div 
              className="collapsible-header"
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
              className="collapsible-header"
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
                    Name {sortBy === 'fileName' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                {sortedResults.map((item) => {
                  const isFolder = item.resultType === 'folder';
                  return (
                    <tr key={item.id} className={isFolder ? 'folder-row' : ''}>
                      <td className="file-name">
                        {isFolder && '📁 '}
                        {item.fileName}
                      </td>
                      <td className="drive-name">{item.driveName}</td>
                      <td className="file-size">{isFolder ? '-' : formatSize(item.fileSize)}</td>
                      <td className="file-type">
                        {isFolder ? 'Folder' : getFileExtension(item.fileName)}
                      </td>
                      <td className="file-date">{formatDate(item.modifiedAt)}</td>
                      <td className="file-path" title={item.filePath}>{item.filePath}</td>
                      <td className="actions-cell">
                        <button
                          className="action-button"
                          onClick={() => showInFolder(item)}
                          title={isFolder ? 'Open folder in Explorer' : 'Show file in Explorer'}
                        >
                          {actionedId === item.id ? '✅' : '📂'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results Message - Only show after search is performed */}
      {hasSearched && results.length === 0 && (
        <div className="no-results">No files or folders found matching your search.</div>
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
