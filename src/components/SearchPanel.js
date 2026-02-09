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

  // Update selected drives when drives list changes
  React.useEffect(() => {
    setSelectedDrives(new Set(drives.map(d => d.id)));
  }, [drives]);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query, {
      driveIds: selectedDrives.size > 0 ? Array.from(selectedDrives) : null,
      categories: selectedCategories.length > 0 ? selectedCategories : null,
    });
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
          // Direct open - no modal needed!
          const fullPath = `${file.driveScanPath}/${file.filePath}`.replace(/\//g, '\\');
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
      const fullPath = `${cleanLetter}:\\${selectedFile.filePath.replace(/\//g, '\\')}`;
      
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
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for files... (e.g., 'project', '.psd', 'motion')"
            className="search-input"
          />
          <button type="submit" className="button primary">
            🔍 Search
          </button>
        </div>

        <div className="filter-container">
          <div className="filter-section">
            <h4>Search Drives:</h4>
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
                  <span className="file-count">({drive.fileCount || 0} files)</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4>Categories:</h4>
            <FilterTree onFilterChange={handleFilterChange} />
          </div>
        </div>
      </form>

      {results.length > 0 && (
        <div className="results-section">
          <h3>Found {results.length} files</h3>
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
                    <td className="file-name">
                      <span className="file-icon">📄</span>
                      {file.fileName}
                    </td>
                    <td className="drive-name">
                      <span className="drive-icon">📀</span>
                      {file.driveName}
                    </td>
                    <td className="file-size">{formatSize(file.fileSize)}</td>
                    <td className="file-type">
                      <span className="category-badge">{file.category}</span>
                    </td>
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

      {query && results.length === 0 && (
        <div className="no-results">No files found matching your search.</div>
      )}

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
