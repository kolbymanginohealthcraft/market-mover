import { useState } from 'react';

export const useAdminUI = () => {
  const [activeTab, setActiveTab] = useState("team");
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [savingTeamName, setSavingTeamName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return {
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
    message,
    setMessage,
    error,
    setError
  };
}; 