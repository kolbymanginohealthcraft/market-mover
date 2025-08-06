import React from 'react';
import Button from '../../../components/Buttons/Button';
import styles from './TeamHeader.module.css';

export const TeamHeader = ({
  teamInfo,
  isTeamAdmin,
  editingTeamName,
  setEditingTeamName,
  newTeamName,
  setNewTeamName,
  savingTeamName,
  onSaveTeamName,
  handleTeamNameKeyDown
}) => {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>Team Management</h2>
      {isTeamAdmin && (
        <div className={styles.teamNameWrapper}>
          {!editingTeamName ? (
            <>
              <span className={styles.teamNameDisplay}>{teamInfo?.name}</span>
              <Button
                size="sm"
                variant="gray"
                onClick={() => setEditingTeamName(true)}
                className={styles.editButton}
              >
                Edit
              </Button>
            </>
          ) : (
            <>
              <input
                className={styles.teamNameInput}
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                maxLength={40}
                autoFocus
                disabled={savingTeamName}
                onKeyDown={handleTeamNameKeyDown}
              />
              <div className={styles.teamNameActions}>
                <Button
                  size="sm"
                  variant="green"
                  onClick={onSaveTeamName}
                  disabled={savingTeamName}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="red"
                  ghost
                  onClick={() => {
                    setEditingTeamName(false);
                    setNewTeamName(teamInfo.name);
                  }}
                  disabled={savingTeamName}
                  className={styles.cancelButton}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}; 