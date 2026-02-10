import React, { useState, useEffect, useRef } from 'react';
import './FilterTree.css';

// Category Hierarchy (matches your Drive Indexer categories)
const categoryHierarchy = {
  'Images': {
    'JPEG': 'Image (JPEG)',
    'PNG': 'Image (PNG)',
    'TIFF': 'Image (TIFF)',
    'GIF': 'Image (GIF)',
    'WebP': 'Image (WebP)',
    'BMP': 'Image (BMP)',
    'SVG': 'Vector (SVG)',
    'RAW': 'Image (RAW)'
  },
  'Video': {
    'MP4': 'Video (MP4)',
    'MOV': 'Video (MOV)',
    'AVI': 'Video (AVI)',
    'MKV': 'Video (MKV)',
    'ProRes': 'Video (ProRes)',
    'M4V': 'Video (M4V)',
    'Professional': 'Video (Professional)'
  },
  'Adobe Creative': {
    'After Effects': 'After Effects Project',
    'Premiere Pro': 'Premiere Pro Project',
    'Photoshop': 'Photoshop',
    'Illustrator': 'Illustrator',
    'PS Brushes': 'Photoshop Brush',
    'PS Actions': 'Photoshop Action',
    'PS Curves': 'Photoshop Curve',
    'Swatches': 'Adobe Swatch'
  },
  'Audio': {
    'WAV': 'Audio (WAV)',
    'MP3': 'Audio (MP3)',
    'AIFF': 'Audio (AIFF)',
    'FLAC': 'Audio (FLAC)',
    'AAC': 'Audio (AAC)',
    'M4A': 'Audio (M4A)'
  },
  '3D Models': {
    'Blender': '3D Model (Blender)',
    'FBX': '3D Model (FBX)',
    'OBJ': '3D Model (OBJ)',
    'Cinema 4D': '3D Model (Cinema 4D)',
    'Maya': '3D Model (Maya)',
    'glTF': '3D Model (glTF)',
    'STL': '3D Model (STL)',
    '3DS': '3D Model (3DS)'
  },
  'Archives': {
    'ZIP': 'Archive (ZIP)',
    'RAR': 'Archive (RAR)',
    '7-Zip': 'Archive (7-Zip)',
    'TAR': 'Archive (TAR)',
    'GZIP': 'Archive (GZIP)'
  },
  'Documents': {
    'PDF': 'Document (PDF)',
    'Word': 'Document (Word)',
    'Excel': 'Document (Excel)',
    'Text': 'Document (Text)'
  },
  'Fonts': {
    'TrueType': 'Font (TrueType)',
    'OpenType': 'Font (OpenType)'
  }
};

const FilterTree = ({ onFilterChange }) => {
  // State: which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  
  // State: selected filters (all selected by default)
  const [selectedFilters, setSelectedFilters] = useState(() => {
    const initial = {};
    Object.keys(categoryHierarchy).forEach(group => {
      initial[group] = new Set(Object.keys(categoryHierarchy[group]));
    });
    return initial;
  });

  // Convert selected filters to Drive Indexer category format
  const getSelectedCategories = () => {
    const categories = [];
    Object.entries(selectedFilters).forEach(([groupName, items]) => {
      items.forEach(item => {
        // Get the actual database category name from the mapping
        const dbCategoryName = categoryHierarchy[groupName][item];
        if (dbCategoryName) {
          categories.push(dbCategoryName);
        }
      });
    });
    return categories;
  };

  // Notify parent when filters change
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(getSelectedCategories());
    }
  }, [selectedFilters]);

  // Toggle group expansion
  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Toggle entire group selection
  const toggleGroupSelection = (groupName, checked) => {
    setSelectedFilters(prev => ({
      ...prev,
      [groupName]: checked 
        ? new Set(Object.keys(categoryHierarchy[groupName])) 
        : new Set()
    }));
  };

  // Toggle individual item selection
  const toggleItemSelection = (groupName, itemName, checked) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      const groupSet = new Set(newFilters[groupName] || []);
      
      if (checked) {
        groupSet.add(itemName);
      } else {
        groupSet.delete(itemName);
      }
      
      newFilters[groupName] = groupSet;
      return newFilters;
    });
  };

  // Check if all filters are selected
  const isAllSelected = () => {
    return Object.entries(categoryHierarchy).every(([groupName, items]) => {
      const selected = selectedFilters[groupName]?.size || 0;
      return selected === Object.keys(items).length;
    });
  };

  // Check if some (but not all) filters are selected
  const isSomeSelected = () => {
    let hasSelected = false;
    let hasUnselected = false;

    Object.entries(categoryHierarchy).forEach(([groupName, items]) => {
      const selected = selectedFilters[groupName]?.size || 0;
      const total = Object.keys(items).length;

      if (selected > 0) hasSelected = true;
      if (selected < total) hasUnselected = true;
    });

    return hasSelected && hasUnselected;
  };

  // Master checkbox: select/deselect all
  const toggleMasterCheckbox = () => {
    const allSelected = isAllSelected();
    
    if (allSelected) {
      // Deselect all
      const newFilters = {};
      Object.keys(categoryHierarchy).forEach(group => {
        newFilters[group] = new Set();
      });
      setSelectedFilters(newFilters);
    } else {
      // Select all
      const newFilters = {};
      Object.keys(categoryHierarchy).forEach(group => {
        newFilters[group] = new Set(Object.keys(categoryHierarchy[group]));
      });
      setSelectedFilters(newFilters);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    const newFilters = {};
    Object.keys(categoryHierarchy).forEach(group => {
      newFilters[group] = new Set();
    });
    setSelectedFilters(newFilters);
  };

  // Remove individual chip
  const removeChip = (groupName, itemName) => {
    toggleItemSelection(groupName, itemName, false);
  };

  // Get active chips (filters that are partially selected)
  const getActiveChips = () => {
    const chips = [];
    Object.entries(selectedFilters).forEach(([groupName, items]) => {
      const totalItems = Object.keys(categoryHierarchy[groupName]).length;
      if (items.size > 0 && items.size < totalItems) {
        items.forEach(item => {
          chips.push({ group: groupName, item });
        });
      }
    });
    return chips;
  };

  const masterChecked = isAllSelected();
  const masterIndeterminate = !masterChecked && isSomeSelected();
  const activeChips = getActiveChips();

  return (
    <div className="filter-tree">
      {/* Header */}
      <div className="filter-header">
        <div>
          <div className="filter-title">Filters</div>
          <div className="master-checkbox-container">
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                className={`checkbox ${masterIndeterminate ? 'indeterminate' : ''}`}
                checked={masterChecked}
                onChange={toggleMasterCheckbox}
              />
              <span style={{ marginLeft: '8px', fontSize: '13px' }}>All Filters</span>
            </label>
          </div>
        </div>
        <button className="clear-all-btn" onClick={clearAllFilters}>
          Clear All
        </button>
      </div>

      {/* Filter Groups */}
      <div className="filter-groups">
        {Object.entries(categoryHierarchy).map(([groupName, items]) => {
          const isExpanded = expandedGroups.has(groupName);
          const selectedItems = selectedFilters[groupName] || new Set();
          const totalItems = Object.keys(items).length;
          const isAllGroupSelected = selectedItems.size === totalItems;
          const isSomeGroupSelected = selectedItems.size > 0 && selectedItems.size < totalItems;

          return (
            <div key={groupName} className="filter-group">
              {/* Group Header */}
              <div 
                className="group-header"
                onClick={(e) => {
                  if (!e.target.closest('.checkbox-wrapper')) {
                    toggleGroup(groupName);
                  }
                }}
              >
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                  ▶
                </span>
                <label 
                  className="checkbox-wrapper" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className={`checkbox ${isSomeGroupSelected ? 'indeterminate' : ''}`}
                    checked={isAllGroupSelected}
                    onChange={(e) => toggleGroupSelection(groupName, e.target.checked)}
                  />
                </label>
                <div className="group-label">
                  <span>{groupName}</span>
                  <span className="group-count">({totalItems})</span>
                </div>
              </div>

              {/* Filter Items (children) */}
              <div className={`filter-items ${isExpanded ? 'expanded' : ''}`}>
                {Object.entries(items).map(([itemName, dbCategory]) => (
                  <div key={itemName} className="filter-item">
                    <label className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedItems.has(itemName)}
                        onChange={(e) => toggleItemSelection(groupName, itemName, e.target.checked)}
                      />
                    </label>
                    <span className="filter-item-label">{itemName}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Filters Chips */}
      {activeChips.length > 0 && (
        <div className="active-filters">
          <div className="active-filters-title">Active Filters</div>
          <div className="chips-container">
            {activeChips.map(({ group, item }) => (
              <div key={`${group}-${item}`} className="chip">
                <span>{group}: {item}</span>
                <span 
                  className="chip-remove" 
                  onClick={() => removeChip(group, item)}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterTree;
