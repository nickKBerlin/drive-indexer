import React, { useState, useRef, useEffect } from 'react';
import './SearchPanel.css';
import DriveLetterModal from './DriveLetterModal';
import FilterTree from './FilterTree';
import FolderIcon from './FolderIcon';
import FolderFileIcon from './FolderFileIcon';

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
  const [activeFilterChips, setActiveFilterChips] = useState([]);
  const [allFiltersChecked, setAllFiltersChecked] = useState(true);
  const [someFiltersChecked, setSomeFiltersChecked] = useState(false);
  
  // Collapsible state
  const [drivesExpanded, setDrivesExpanded] = useState(false);

  // Refs
  const searchInputRef = useRef(null);
  const filterTreeRef = useRef(null);

  // Auto-focus search input when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, []);

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
  };

  // Callback when FilterTree changes
  const handleFilterChange = (categories, chips) => {
    setSelectedCategories(categories);
    setActiveFilterChips(chips || []);
    
    // Update master checkbox state
    if (filterTreeRef.current) {
      setAllFiltersChecked(filterTreeRef.current.isAllSelected());
      setSomeFiltersChecked(filterTreeRef.current.isSomeSelected());
    }
  };

  // Handle master checkbox toggle
  const handleMasterCheckboxToggle = () => {
    if (filterTreeRef.current) {
      filterTreeRef.current.toggleMasterCheckbox();
    }
  };

  // Handle clear all filters
  const handleClearAllFilters = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (filterTreeRef.current) {
      filterTreeRef.current.clearAllFilters();
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0 || bytes === null) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getFileExtension = (fileName) => {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) return '-';
    return fileName.substring(lastDot).toUpperCase();
  };

  const showInFolder = async (file) => {
    try {
      console.log('[SearchPanel] ========== Show in folder clicked ==========');
      console.log('[SearchPanel] File:', file.fileName);
      console.log('[SearchPanel] Drive:', file.driveName);
      console.log('[SearchPanel] Scan path from DB:', file.driveScanPath);
      
      if (!file.fileName || !file.driveName || !file.filePath) {
        console.error('[SearchPanel] ERROR: Missing required file fields!');
        alert('Error: File information is incomplete. Please try rescanning the drive.');
        return;
      }
      
      if (file.driveScanPath) {
        const normalizedDrivePath = file.driveScanPath.replace(/\\/g, '/');
        const normalizedFilePath = file.filePath.replace(/\\/g, '/');
        
        const cleanDrivePath = normalizedDrivePath.endsWith('/') 
          ? normalizedDrivePath.slice(0, -1) 
          : normalizedDrivePath;
        
        const fullPath = `${cleanDrivePath}/${normalizedFilePath}`.replace(/\//g, '\\');
        console.log('[SearchPanel] Constructed full path:', fullPath);
        
        try {
          console.log('[SearchPanel] Checking if full file path exists...');
          const fileExists = await window.api.checkPathExists(fullPath);
          console.log('[SearchPanel] File exists result:', fileExists);
          
          if (fileExists) {
            console.log('[SearchPanel] File exists! Opening directly...');
            
            try {
              await window.api.showInFolder(fullPath);
              console.log('[SearchPanel] Successfully opened file location');
              
              setActionedId(file.id);
              setTimeout(() => setActionedId(null), 2000);
              return;
            } catch (openError) {
              console.error('[SearchPanel] Error opening file location:', openError);
            }
          } else {
            console.log('[SearchPanel] File no longer exists at original path, showing modal...');
          }
        } catch (pathCheckError) {
          console.error('[SearchPanel] Error checking file path:', pathCheckError);
        }
      } else {
        console.log('[SearchPanel] No driveScanPath in file object');
      }
      
      console.log('[SearchPanel] Opening modal for manual drive selection');
      setSelectedFile(file);
      setShowModal(true);
    } catch (err) {
      console.error('[SearchPanel] ERROR in showInFolder:', err);
      alert('Could not open folder: ' + err.message);
    }
  };

  const handleConfirmDriveLetter = async (driveLetter) => {
    try {
      console.log('[SearchPanel] Drive letter selected:', driveLetter);
      console.log('[SearchPanel] File path:', selectedFile.filePath);
      
      const cleanLetter = driveLetter.trim().toUpperCase().replace(':', '');
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
        aVal = new Date(a.modifiedAt || 0).getTime();
        bVal = new Date(b.modifiedAt || 0).getTime();
        break;
      case 'category':
        aVal = a.category || '';
        bVal = b.category || '';
        break;
      case 'driveName':
        aVal = a.driveName || '';
        bVal = b.driveName || '';
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
        {/* FIXED HEADER - Search, Scope, Filter Header */}
        <div className="search-header">
          <div className="search-input-group">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for files... (e.g., 'project', '.psd', 'motion')"
              className="search-input"
            />
            <label className="folder-checkbox-label">
              <input
                type="checkbox"
                checked={includeFolders}
                onChange={(e) => setIncludeFolders(e.target.checked)}
                className="folder-checkbox"
              />
              Include folders in search results
            </label>
            <button type="submit" className="button primary">
              Search
            </button>
          </div>

          {/* Search Scope Info */}
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
                  ✓ {results.length} result{results.length !== 1 ? 's' : ''} found
                </span>
              </>
            )}
          </div>

          {/* Filter Controls Header */}
          <div className="filter-controls-header">
            <div className="filter-controls-left">
              <h4 className="filter-controls-title">File Types</h4>
              <label className="filter-master-checkbox">
                <input
                  type="checkbox"
                  className={`checkbox ${someFiltersChecked && !allFiltersChecked ? 'indeterminate' : ''}`}
                  checked={allFiltersChecked}
                  onChange={handleMasterCheckboxToggle}
                />
                <span>All Filters</span>
              </label>
            </div>
            <button 
              type="button" 
              className="clear-filters-btn"
              onClick={handleClearAllFilters}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* SCROLLABLE MIDDLE - Only Filter Groups */}
        <div className="filters-scrollable-area">
          <FilterTree 
            ref={filterTreeRef}
            onFilterChange={handleFilterChange} 
            showHeader={false}
          />
        </div>

        {/* FIXED FOOTER - Active Filters + Drives */}
        <div className="filters-footer">
          {/* Active Filters Chips */}
          {activeFilterChips.length > 0 && (
            <div className="active-filters-section">
              <div className="active-filters-title">Active Filters</div>
              <div className="chips-container">
                {activeFilterChips.map((chip, index) => (
                  <div key={`${chip.group}-${chip.item}-${index}`} className="chip">
                    <span>{chip.group}: {chip.item}</span>
                    <span 
                      className="chip-remove" 
                      onClick={() => chip.onRemove && chip.onRemove()}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drives Section - Collapsible */}
          <div className="drives-section">
            <div 
              className="drives-header"
              onClick={() => setDrivesExpanded(!drivesExpanded)}
            >
              <span className={`expand-arrow ${drivesExpanded ? 'expanded' : ''}`}>▶</span>
              <h4>Drives</h4>
              <span className="filter-summary">
                {selectedDrives.size === drives.length ? 'All' : `${selectedDrives.size}/${drives.length}`}
              </span>
            </div>
            <div className={`drives-content ${drivesExpanded ? 'expanded' : ''}`}>
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
                {sortedResults.map((file) => (
                  <tr key={file.id}>
                    <td className="file-name">
                      {file.resultType === 'folder' && (
                        <FolderIcon size={16} color="#c9a962" />
                      )}
                      {file.resultType === 'folder' ? ' ' : ''}
                      {file.fileName}
                    </td>
                    <td className="drive-name">{file.driveName}</td>
                    <td className="file-size">{formatSize(file.fileSize)}</td>
                    <td className="file-type">
                      {file.category === 'Folder' ? 'FOLDER' : getFileExtension(file.fileName)}
                    </td>
                    <td className="file-date">{formatDate(file.modifiedAt)}</td>
                    <td className="file-path" title={file.filePath}>{file.filePath}</td>
                    <td className="actions-cell">
                      <button
                        className="action-button"
                        onClick={() => showInFolder(file)}
                        title={file.resultType === 'folder' ? 'Open folder in Explorer' : 'Show file in Explorer'}
                      >
                        {actionedId === file.id ? '✅' : (
                          file.resultType === 'folder' ? 
                            <FolderIcon size={18} color="#c9a962" /> : 
                            <FolderFileIcon size={18} color="#2dd4bf" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {hasSearched && results.length === 0 && (
        <div className="no-results">No results found matching your search.</div>
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
