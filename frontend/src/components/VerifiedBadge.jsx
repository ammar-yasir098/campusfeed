import React from 'react';

export default function VerifiedBadge({ size = 18, style = {} }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ verticalAlign: 'middle', flexShrink: 0, display: 'inline-block', ...style }}
      title="Verified Account"
    >
      <circle cx="12" cy="12" r="12" fill="#1d9bf0" />
      <path 
        d="M7 12.5L10.2 15.7L17 8.5" 
        stroke="#ffffff" 
        strokeWidth="2.6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}
