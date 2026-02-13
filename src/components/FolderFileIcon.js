import React from 'react';

const FolderFileIcon = ({ size = 18, color = '#2dd4bf' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Folder back */}
      <path
        d="M2 6c0-1.1.9-2 2-2h5.17a2 2 0 0 1 1.41.59L12 6h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Z"
        fill={color}
        fillOpacity="0.25"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Document inside folder */}
      <rect
        x="8"
        y="10"
        width="8"
        height="10"
        rx="1"
        fill={color}
        fillOpacity="0.4"
        stroke={color}
        strokeWidth="1.5"
      />
      
      {/* Document lines */}
      <line
        x1="10"
        y1="13"
        x2="14"
        y2="13"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="15.5"
        x2="14"
        y2="15.5"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="18"
        x2="13"
        y2="18"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default FolderFileIcon;
