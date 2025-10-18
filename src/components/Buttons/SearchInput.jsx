import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchInput.module.css';

const SearchInput = ({ 
  placeholder = "Search...",
  value,
  onChange,
  className = '',
  onClear,
  ...props 
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [escapeCount, setEscapeCount] = useState(0);
  const escapeTimeoutRef = useRef(null);
  
  // Use controlled or uncontrolled value
  const searchValue = value !== undefined ? value : internalValue;

  const handleChange = (e) => {
    const newValue = e.target.value;
    if (value !== undefined) {
      // Controlled component - call onChange with event
      if (onChange) onChange(e);
    } else {
      // Uncontrolled component - update internal state
      setInternalValue(newValue);
      if (onChange) onChange(e);
    }
    // Reset escape count when user types
    setEscapeCount(0);
  };

  const handleClear = () => {
    if (value !== undefined) {
      // Controlled component - call onChange with empty value
      if (onChange) {
        const event = { target: { value: '' } };
        onChange(event);
      }
    } else {
      // Uncontrolled component - clear internal state
      setInternalValue('');
    }
    if (onClear) onClear();
    setEscapeCount(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      // Clear any existing timeout
      if (escapeTimeoutRef.current) {
        clearTimeout(escapeTimeoutRef.current);
      }

      if (searchValue && escapeCount === 0) {
        // First escape: clear the search
        handleClear();
        setEscapeCount(1);
        
        // Reset escape count after 1 second
        escapeTimeoutRef.current = setTimeout(() => {
          setEscapeCount(0);
        }, 1000);
      } else {
        // Second escape (or no search value): blur the input
        e.target.blur();
        setEscapeCount(0);
      }
    }
    if (props.onKeyDown) props.onKeyDown(e);
  };

  return (
    <div className={`${styles.searchContainer} ${className}`}>
      <Search size={14} className={styles.searchIcon} />
      <input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={styles.searchInput}
        {...props}
      />
      {searchValue && (
        <button
          className={styles.clearButton}
          onClick={handleClear}
          type="button"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
