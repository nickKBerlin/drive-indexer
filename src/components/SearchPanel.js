import React, { useState } from 'react';
import './SearchPanel.css';

function SearchPanel({ drives, onSearch, results }) {
  const [query, setQuery] = useState('');
  const [selectedDrive, setSelectedDrive] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
          <div className="results-list">
            {results.map((file) => (
              <div key={file.id} className="result-item">
                <div className="result-info">
                  <div className="result-name">{file.fileName}</div>
                  <div className="result-meta">
                    <span className="meta-item">📀 {file.driveName}</span>
                    <span className="meta-item">📂 {file.filePath}</span>
                    <span className="meta-item">{formatSize(file.fileSize)}</span>
                    <span className="meta-item tag">{file.category}</span>
                  </div>
                </div>
              </div>
            ))}
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
