// src/components/Overlays/SidePanel.jsx
import React, { useEffect } from 'react';
import styles from './SidePanel.module.css';
import Button from '../Buttons/Button';

const SidePanel = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  width = '500px',
  className = ''
}) => {
  // Close panel on ESC key
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
      <div className={styles.overlay} onClick={onClose} />
      <div className={`${styles.panel} ${className}`} style={{ width }}>
        <div className={styles.header}>
          <h2>{title}</h2>
          <Button 
            variant="gray" 
            size="sm" 
            outline 
            onClick={onClose}
            className={styles.closeButton}
          >
            ×
          </Button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </>
  );
};

export default SidePanel;
