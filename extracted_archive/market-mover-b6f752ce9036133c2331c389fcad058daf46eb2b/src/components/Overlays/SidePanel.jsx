// src/components/Overlays/SidePanel.jsx
import React from 'react';
import styles from './SidePanel.module.css';
import { FaTimes } from 'react-icons/fa';

const SidePanel = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </>
  );
};

export default SidePanel;
