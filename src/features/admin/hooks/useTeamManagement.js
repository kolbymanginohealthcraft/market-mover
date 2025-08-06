import { useRef } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { trackActivity } from '../../../utils/activityTracker';

export const useTeamManagement = ({
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
}) => {
  const inviteInputRef = useRef(null);
  const teamNameInputRef = useRef(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", currentUserId);

      if (error) {
        setError("Failed to save profile: " + error.message);
      } else {
        setMessage("Profile saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setError("Unexpected error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const sendInviteEmail = async () => {
    if (!inviteEmail.trim() || licensesMaxedOut) return;

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("send_invite_email", {
        body: {
          email: inviteEmail.trim(),
          teamId: teamInfo.id,
          inviterName: `${profile.first_name} ${profile.last_name}`,
        },
      });

      if (error) {
        setError("Failed to send invite: " + error.message);
      } else {
        setMessage("Invite sent successfully!");
        setInviteEmail("");
        setTimeout(() => setMessage(""), 3000);
        fetchData(); // Refresh data to update member count
      }
    } catch (err) {
      setError("Unexpected error sending invite.");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteMember = async (member) => {
    if (!confirm(`Are you sure you want to remove ${member.first_name} ${member.last_name} from the team?`)) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ team_id: null })
        .eq("id", member.id);

      if (error) {
        setError("Failed to remove member: " + error.message);
      } else {
        setMessage("Member removed successfully!");
        setTimeout(() => setMessage(""), 3000);
        fetchData(); // Refresh data
      }
    } catch (err) {
      setError("Unexpected error removing member.");
    } finally {
      setSaving(false);
    }
  };

  const onSaveTeamName = async () => {
    if (!newTeamName.trim()) return;

    setSavingTeamName(true);
    try {
      const { error } = await supabase
        .from("teams")
        .update({ name: newTeamName.trim() })
        .eq("id", teamInfo.id);

      if (error) {
        alert("Failed to update team name: " + error.message);
      } else {
        setEditingTeamName(false);
      }
    } catch (err) {
      alert("Unexpected error updating team name.");
    } finally {
      setSavingTeamName(false);
    }
  };

  const handleInviteKeyDown = (e) => {
    if (e.key === "Enter" && inviteEmail && !licensesMaxedOut) {
      sendInviteEmail();
    }
  };

  const handleTeamNameKeyDown = (e) => {
    if (e.key === "Enter" && newTeamName.trim()) {
      onSaveTeamName();
    }
  };

  return {
    formatDate,
    handleSaveProfile,
    sendInviteEmail,
    onDeleteMember,
    onSaveTeamName,
    handleInviteKeyDown,
    handleTeamNameKeyDown,
    inviteInputRef,
    teamNameInputRef
  };
}; 