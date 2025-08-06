import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from './components/AdminHeader';
import { AdminTabs } from './components/AdminTabs';
import { TeamManagementTab } from './components/TeamManagementTab';
import { TeamColorsTab } from './components/TeamColorsTab';
import { SubscriptionTab } from './components/SubscriptionTab';
import { AccessDenied } from './components/AccessDenied';
import { useAdminData } from './hooks/useAdminData';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAdminUI } from './hooks/useAdminUI';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  const {
    profile,
    teamInfo,
    teamMembers,
    subscription,
    currentUserId,
    licensesMaxedOut,
    loading,
    error,
    message,
    fetchData
  } = useAdminData();

  const {
    isTeamAdmin,
    hasTeam
  } = useAdminAuth(profile);

  const {
    activeTab,
    setActiveTab,
    inviteEmail,
    setInviteEmail,
    editingTeamName,
    setEditingTeamName,
    newTeamName,
    setNewTeamName,
    savingTeamName,
    setSavingTeamName,
    saving,
    setSaving,
    setMessage,
    setError
  } = useAdminUI();

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  // Redirect non-team-admins to user settings
  if (!isTeamAdmin) {
    return <AccessDenied onNavigate={() => navigate("/app/user-settings")} />;
  }

  return (
    <div className={styles.page}>
      <AdminHeader />

      {message && <div className={styles.toast}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tabContainer}>
        <AdminTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className={styles.tabContent}>
          {activeTab === "team" && hasTeam && (
            <TeamManagementTab 
              profile={profile}
              teamInfo={teamInfo}
              teamMembers={teamMembers}
              currentUserId={currentUserId}
              isTeamAdmin={isTeamAdmin}
              inviteEmail={inviteEmail}
              setInviteEmail={setInviteEmail}
              editingTeamName={editingTeamName}
              setEditingTeamName={setEditingTeamName}
              newTeamName={newTeamName}
              setNewTeamName={setNewTeamName}
              savingTeamName={savingTeamName}
              setSavingTeamName={setSavingTeamName}
              licensesMaxedOut={licensesMaxedOut}
              saving={saving}
              setSaving={setSaving}
              setMessage={setMessage}
              setError={setError}
              fetchData={fetchData}
            />
          )}

          {activeTab === "colors" && isTeamAdmin && (
            <TeamColorsTab />
          )}

          {activeTab === "subscription" && (
            <SubscriptionTab 
              hasTeam={hasTeam}
              teamInfo={teamInfo}
              subscription={subscription}
              profile={profile}
              onNavigate={navigate}
            />
          )}
        </div>
      </div>
    </div>
  );
} 