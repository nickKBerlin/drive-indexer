import React, { useState } from 'react';
import './SearchPanel.css';

function SearchPanel({ drives, onSearch, results }) {
  const [query, setQuery] = useState('');
  const [selectedDrive, setSelectedDrive] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('fileName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [actionedId, setActionedId] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query, {
      driveId: selectedDrive === 'all' ? null : selectedDrive,
      category: selectedCategory === 'all' ? null : selectedCategory,
    });
  };

  const categories = [
    'After Effects Project',
    'Premiere Pro Project',
    'Photoshop',
    'Photoshop Brush',
    'Photoshop Action',
    'Video',
    'Audio',
    'Image',
    'Font',
    'Document',
    'Other',
  ];

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

  const showInFolder = async (file, fileId) => {
    try {
      console.log('[SearchPanel] Show in folder clicked');
      console.log('[SearchPanel] File:', file.fileName);
      console.log('[SearchPanel] Relative path:', file.filePath);
      console.log('[SearchPanel] Drive name:', file.driveName);
      
      // Always ask for drive letter since we only store relative paths
      const driveLetter = prompt(
        `Enter the current drive letter for "${file.driveName}"\n\n` +
        `File: ${file.fileName}\n` +
        `Path: ${file.filePath}\n\n` +
        `Example: Enter "G" for G:/`,
        'G'
      );
      
      if (!driveLetter) {
        console.log('[SearchPanel] User canceled');
        return;
      }
      
      // Clean up drive letter and construct full path
      const cleanLetter = driveLetter.trim().toUpperCase().replace(':', '');
      const fullPath = `${cleanLetter}:\\${file.filePath.replace(/\//g, '\\')}`;
      
      console.log('[SearchPanel] Full path constructed:', fullPath);
      
      await window.api.showInFolder(fullPath);
      
      setActionedId(fileId);
      setTimeout(() => setActionedId(null), 2000);
    } catch (err) {
      console.error('[SearchPanel] Error showing in folder:', err);
      alert('Could not open folder: ' + err.message);
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

        <div className="filter-group">
          <div className="filter">
            <label>Drive:</label>
            <select value={selectedDrive} onChange={(e) => setSelectedDrive(e.target.value)}>
              <option value="all">All Drives</option>
              {drives.map((drive) => (
                <option key={drive.id} value={drive.id}>
                  {drive.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter">
            <label>Category:</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
                        onClick={() => showInFolder(file, file.id)}
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
    </div>
  );
}

export default SearchPanel;
