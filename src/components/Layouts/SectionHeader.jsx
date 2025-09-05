import React from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import styles from './SectionHeader.module.css';

const SectionHeader = ({ 
  title, 
  icon: Icon, 
  actionButton,
  showActionButton = true,
  customElement
}) => {
  // Default icon mapping for common actions
  const getActionIcon = (actionType) => {
    const iconMap = {
      'edit': Edit,
      'delete': Trash2,
      'clear': Trash2,
      'add': Plus,
      'new': Plus
    };
    return iconMap[actionType] || Edit;
  };

  const ActionIcon = actionButton?.icon || getActionIcon(actionButton?.type);
  
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          {Icon && <Icon size={16} className={styles.headerIcon} />}
          <span className={styles.headerTitle}>{title}</span>
        </div>
        {customElement ? (
          customElement
        ) : showActionButton && actionButton ? (
          <button className={styles.actionButton} onClick={actionButton.onClick}>
            <ActionIcon size={14} />
            <span>{actionButton.text}</span>
          </button>
        ) : null}
      </div>
      <div className={styles.separator} />
    </div>
  );
};

export default SectionHeader;
