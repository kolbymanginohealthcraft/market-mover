import React, { useState } from 'react';
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
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear();
      e.target.blur(); // Remove focus from the input
    }
    if (props.onKeyDown) props.onKeyDown(e);
  };

  return (
    <div className={`${styles.searchContainer} ${className}`}>
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
          ×
        </button>
      )}
    </div>
  );
};

export default SearchInput;
