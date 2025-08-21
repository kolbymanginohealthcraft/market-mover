import React from 'react';
import styles from './ControlsRow.module.css';

const ControlsRow = ({ 
  children, 
  leftContent, 
  rightContent,
  className = '',
  ...props 
}) => {
  return (
    <div className={`${styles.controlsRow} ${className}`} {...props}>
      {leftContent && (
        <div className={styles.leftSection}>
          {leftContent}
        </div>
      )}
      {children && (
        <div className={styles.centerSection}>
          {children}
        </div>
      )}
      {rightContent && (
        <div className={styles.rightSection}>
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default ControlsRow;
