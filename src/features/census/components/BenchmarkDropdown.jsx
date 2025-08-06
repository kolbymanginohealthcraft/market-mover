import React, { useState, useEffect, useRef } from 'react';
import styles from './BenchmarkDropdown.module.css';

export const BenchmarkDropdown = ({ 
  selectedBenchmark, 
  setSelectedBenchmark, 
  options 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (value) => {
    setSelectedBenchmark(value);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === selectedBenchmark) || options[0];

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button
        className={styles.dropdownButton}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{selectedOption?.label || 'Select Benchmark'}</span>
        <span className={styles.dropdownArrow}>▼</span>
      </button>
      
      {isOpen && (
        <div className={styles.dropdownMenu}>
          {options.map((option) => (
            <button
              key={option.value}
              className={`${styles.dropdownItem} ${
                selectedBenchmark === option.value ? styles.selected : ''
              }`}
              onClick={() => handleSelect(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 