import React, { useState } from 'react';
import styles from './Banner.module.css';

const Banner = ({ 
  title, 
  message, 
  icon = "🚀", 
  onClose, 
  className = "",
  children 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`${styles.banner} ${className}`}>
      <button className={styles.closeButton} onClick={handleClose}>
        ×
      </button>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        {children || (
          <>
            <h3>{title}</h3>
            <p>{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Banner; 