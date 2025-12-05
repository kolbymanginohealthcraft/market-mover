import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import Dropdown from './Dropdown';
import standaloneStyles from '../../pages/Private/Investigation/StandaloneStoryteller.module.css';

export default function ExportButton({ 
  onExport, 
  disabled = false, 
  className = '',
  children = 'Export'
}) {
  const [isOpen, setIsOpen] = useState(false);

  const exportFormats = [
    { key: 'png', label: 'PNG: Chart Image' },
    { key: 'csv', label: 'CSV: My Results' }
  ];

  const handleExport = (format) => {
    console.log('ExportButton: Export requested for format:', format);
    if (onExport && !disabled) {
      onExport(format);
    }
    setIsOpen(false);
  };

  return (
    <Dropdown
      trigger={
        <button 
          type="button" 
          className="sectionHeaderButton"
          disabled={disabled}
          title="Export chart"
        >
          <Download size={14} />
          <span>{children}</span>
          <ChevronDown size={14} />
        </button>
      }
      isOpen={isOpen}
      onToggle={setIsOpen}
      className={standaloneStyles.dropdownMenu}
    >
      {exportFormats.map((format) => (
        <button
          key={format.key}
          type="button"
          className={standaloneStyles.dropdownItem}
          onClick={() => handleExport(format.key)}
        >
          {format.label}
        </button>
      ))}
    </Dropdown>
  );
}
