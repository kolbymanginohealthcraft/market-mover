import React from 'react';
import { TeamHeader } from './TeamHeader';
import { TeamInfoCards } from './TeamInfoCards';
import { TeamInviteSection } from './TeamInviteSection';
import { TeamMembersTable } from './TeamMembersTable';
import { useTeamManagement } from '../hooks/useTeamManagement';
import styles from './TeamManagementTab.module.css';

export const TeamManagementTab = ({
  profile,
  teamInfo,
  teamMembers,
  currentUserId,
  isTeamAdmin,
  inviteEmail,
  setInviteEmail,
  editingTeamName,
  setEditingTeamName,
  newTeamName,
  setNewTeamName,
  savingTeamName,
  setSavingTeamName,
  licensesMaxedOut,
  saving,
  setSaving,
  setMessage,
  setError,
  fetchData
}) => {
  const {
    handleSaveProfile,
    sendInviteEmail,
    onDeleteMember,
    onSaveTeamName,
    handleInviteKeyDown,
    handleTeamNameKeyDown
  } = useTeamManagement({
    profile,
    teamInfo,
    teamMembers,
    currentUserId,
    inviteEmail,
    setInviteEmail,
    editingTeamName,
    setEditingTeamName,
    newTeamName,
    setNewTeamName,
    savingTeamName,
    setSavingTeamName,
    licensesMaxedOut,
    saving,
    setSaving,
    setMessage,
    setError,
    fetchData
  });

  return (
    <div className={styles.section}>
      <TeamHeader 
        teamInfo={teamInfo}
        isTeamAdmin={isTeamAdmin}
        editingTeamName={editingTeamName}
        setEditingTeamName={setEditingTeamName}
        newTeamName={newTeamName}
        setNewTeamName={setNewTeamName}
        savingTeamName={savingTeamName}
        onSaveTeamName={onSaveTeamName}
        handleTeamNameKeyDown={handleTeamNameKeyDown}
      />

      <TeamInfoCards 
        teamInfo={teamInfo}
        teamMembers={teamMembers}
      />

      <TeamInviteSection 
        isTeamAdmin={isTeamAdmin}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        licensesMaxedOut={licensesMaxedOut}
        sendInviteEmail={sendInviteEmail}
        handleInviteKeyDown={handleInviteKeyDown}
      />

      <TeamMembersTable 
        teamMembers={teamMembers}
        currentUserId={currentUserId}
        isTeamAdmin={isTeamAdmin}
        onDeleteMember={onDeleteMember}
      />
    </div>
  );
}; 