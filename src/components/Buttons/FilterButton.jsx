// FilterButton.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styles from './FilterButton.module.css';

function FilterButton({ isActive, onClick, children }) {
  return (
    <button
      className={`${styles.filterButton} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

FilterButton.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default FilterButton;
