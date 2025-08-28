import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import styles from './ExportButton.module.css';

export default function ExportButton({ 
  onExport, 
  disabled = false, 
  className = '',
  children = 'Export'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const exportFormats = [
    { key: 'png', label: 'PNG Image' },
    { key: 'svg', label: 'SVG Vector' },
    { key: 'pdf', label: 'PDF Document' },
    { key: 'csv', label: 'CSV Data' }
  ];

  const handleExport = (format) => {
    console.log('ExportButton: Export requested for format:', format);
    if (onExport) {
      onExport(format);
    }
    setIsOpen(false);
  };

  return (
    <div className={`${styles.exportButtonContainer} ${className}`} ref={dropdownRef}>
      <button
        className={`${styles.exportButton} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        title="Export chart"
      >
        <Download size={16} />
        <span>{children}</span>
        <ChevronDown size={14} className={styles.chevron} />
      </button>
      
      {isOpen && (
                     <div className={styles.dropdown}>
               {exportFormats.map((format) => (
                 <button
                   key={format.key}
                   className={styles.dropdownItem}
                   onClick={() => handleExport(format.key)}
                 >
                   <span>{format.label}</span>
                 </button>
               ))}
             </div>
      )}
    </div>
  );
}
