import React, { useEffect } from 'react';
import styles from './RightDrawer.module.css';

const RightDrawer = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  width = '400px',
  className = ''
}) => {
  // Close drawer on ESC key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} />
      <div 
        className={`${styles.rightDrawer} ${styles.drawerOpen} ${className}`}
        style={{ width }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <div className={styles.drawerHeader}>
          <h3>{title}</h3>
          <button 
            className={styles.drawerCloseButton}
            onClick={onClose}
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>
        <div className={styles.drawerContent}>
          {children}
        </div>
      </div>
    </>
  );
};

export default RightDrawer;
