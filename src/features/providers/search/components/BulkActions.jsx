import React from 'react';
import Button from '../../../../components/Buttons/Button';
import styles from './BulkActions.module.css';

export const BulkActions = ({
  selectedCount,
  onSaveAsTeamProviders,
  onClearSelection,
  loading = false
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className={styles.bulkActionsContainer}>
      <div className={styles.bulkActionsHeader}>
        <h3>Bulk Actions</h3>
        <span className={styles.selectedCount}>
          {selectedCount} provider{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className={styles.bulkActionsContent}>
        <div className={styles.actionButtons}>
          <Button
            onClick={onSaveAsTeamProviders}
            disabled={loading}
            className={styles.saveButton}
          >
            {loading ? 'Saving...' : `Save as Team Providers`}
          </Button>

          <button
            onClick={onClearSelection}
            className={styles.clearButton}
            disabled={loading}
          >
            Clear Selection
          </button>
        </div>

        <div className={styles.bulkActionsInfo}>
          <p>
            Selected providers will be added to your team's provider list and 
            will be automatically tagged as "Me" in markets.
          </p>
        </div>
      </div>
    </div>
  );
}; 