import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../../../app/supabaseClient";
import Button from "../../../../components/Buttons/Button";
import Spinner from "../../../../components/Buttons/Spinner";
import RightDrawer from "../../../../components/Overlays/RightDrawer";
import SectionHeader from "../../../../components/Layouts/SectionHeader";
import Dropdown from "../../../../components/Buttons/Dropdown";
import { isTeamAdmin, isPlatformAdmin, getRoleDisplayName } from "../../../../utils/roleHelpers";
import styles from "./UsersTab.module.css";

export default function UsersTab() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    title: "",
    role: null,
    team_id: null,
  });
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [licensesMaxedOut, setLicensesMaxedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState(null); // Track which user is being removed
  const [editingRole, setEditingRole] = useState(null); // Track which user's role is being edited
  const [updatingRole, setUpdatingRole] = useState(null); // Track which user's role is being updated

  const inviteInputRef = useRef(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  // Auto-focus input when sidebar opens
  useEffect(() => {
    if (showInvitePanel && inviteInputRef.current) {
      // Small delay to ensure the sidebar is fully rendered
      setTimeout(() => {
        inviteInputRef.current?.focus();
      }, 100);
    }
  }, [showInvitePanel]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setMessage("Authentication failed.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

              // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, title, role, team_id")
          .eq("id", user.id)
          .single();

      if (profileError || !profileData) {
        setMessage("Failed to load profile.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch team data if user is part of a team
      if (profileData.team_id) {
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("name, created_at")
          .eq("id", profileData.team_id)
          .single();

        if (teamError || !team) {
          setMessage("Failed to load team info.");
          setMessageType("error");
          setLoading(false);
          return;
        }

        // Fetch current active subscription
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("team_id", profileData.team_id)
          .eq("status", "active")
          .is("expires_at", null)
          .order("started_at", { ascending: false })
          .limit(1)
          .single();

        if (subError || !subData) {
          setMessage("No active subscription found for this team.");
          setMessageType("error");
          setLoading(false);
          return;
        }

        setTeamInfo({
          id: profileData.team_id,
          name: team.name,
          max_users: subData.license_quantity,
          created_at: team.created_at,
        });

        setSubscription({
          ...subData,
          plan_name: "Active Plan", // Simplified for now
        });

        // Fetch team members directly from profiles table
        const { data: members, error: membersError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, title, email, role")
          .eq("team_id", profileData.team_id)
          .order("last_name")
          .order("first_name");

        if (membersError) {
          setMessage("Failed to load team members.");
          setMessageType("error");
          setLoading(false);
          return;
        }

        const sortedMembers = [...members].sort((a, b) => {
          if (a.id === user.id) return -1;
          if (b.id === user.id) return 1;
          if (a.last_name && b.last_name) {
            const lastNameCompare = a.last_name.localeCompare(b.last_name);
            if (lastNameCompare !== 0) return lastNameCompare;
          }
          if (a.first_name && b.first_name) {
            return a.first_name.localeCompare(b.first_name);
          }
          return 0;
        });

        setTeamMembers(sortedMembers);
        setLicensesMaxedOut(members.length >= subData.license_quantity);
      }
    } catch (err) {
      console.error("💥 Unexpected error:", err);
      setMessage("Unexpected error occurred.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const sendInviteEmail = async () => {
    setMessage("");
    if (!inviteEmail.includes("@")) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      return;
    }

    setInviting(true);

    const payload = {
      email: inviteEmail,
      team_id: teamInfo.id,
      team_name: teamInfo.name,
      inviter_id: currentUserId,
    };

    try {
      // Debug: Log what we're sending
      console.log("🔍 TIMESTAMP:", new Date().toISOString());
      console.log("🔍 Sending invite request with secret:", import.meta.env.VITE_EDGE_INVITE_SECRET);
      console.log("🔍 Secret length:", import.meta.env.VITE_EDGE_INVITE_SECRET?.length);
      console.log("🔍 All env vars:", import.meta.env);
      
      console.log("🔍 Full headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        "x-invite-secret": import.meta.env.VITE_EDGE_INVITE_SECRET,
      });
      
      const res = await fetch(
        "https://ukuxibhujcozcwozljzf.functions.supabase.co/invite_user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "x-invite-secret": import.meta.env.VITE_EDGE_INVITE_SECRET,
          },
          body: JSON.stringify(payload),
        }
      );

      const raw = await res.text();
      console.log("📥 Raw response:", raw);
      const result = JSON.parse(raw);

      if (!res.ok) {
        setMessage(result.error || result.message || "Unknown error");
        setMessageType("error");
      } else {
        setMessage("Invite sent successfully!");
        setMessageType("success");
        setInviteEmail("");
        setShowInvitePanel(false); // Close the sidebar
        fetchTeamData(); // Refresh data
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMessage("");
          setMessageType("");
        }, 5000);
      }
    } catch (err) {
      console.error("💥 Invite failed:", err);
      setMessage("Failed to send invite. Try again.");
      setMessageType("error");
    } finally {
      setInviting(false);
    }
  };

  const onDeleteMember = async (member) => {
    if (member.id === currentUserId) {
      alert("You cannot remove yourself from the team.");
      return;
    }

    if (
      !window.confirm(
        `Remove ${member.first_name} ${member.last_name} from the team?`
      )
    ) {
      return;
    }

    setRemoving(member.id);

    try {
      const res = await fetch(
        "https://ukuxibhujcozcwozljzf.functions.supabase.co/remove_user_from_team",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "x-admin-secret": import.meta.env.VITE_EDGE_ADMIN_SECRET,
          },
          body: JSON.stringify({
            user_id: member.id,
            team_id: teamInfo.id,
          }),
        }
      );

      const raw = await res.text();
      console.log("📥 Raw response:", raw);
      const result = JSON.parse(raw);

      if (!res.ok) {
        setMessage(result.error || result.message || "Unknown error");
        setMessageType("error");
      } else {
        setMessage("Member removed successfully!");
        setMessageType("success");
        fetchTeamData(); // Refresh data
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMessage("");
          setMessageType("");
        }, 5000);
      }
    } catch (err) {
      console.error("💥 Remove failed:", err);
      setMessage("Failed to remove member. Try again.");
      setMessageType("error");
    } finally {
      setRemoving(null);
    }
  };

  const handleInviteKeyDown = (e) => {
    if (e.key === "Enter" && !inviting && inviteEmail.trim()) {
      sendInviteEmail();
    }
  };

  const handleRoleUpdate = async (member, newRole) => {
    if (newRole === member.role) {
      setEditingRole(null);
      return;
    }

    setUpdatingRole(member.id);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", member.id);

      if (error) {
        setMessage("Failed to update role. Try again.");
        setMessageType("error");
      } else {
        setMessage("Role updated successfully!");
        setMessageType("success");
        fetchTeamData(); // Refresh data
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMessage("");
          setMessageType("");
        }, 5000);
      }
    } catch (err) {
      console.error("💥 Role update failed:", err);
      setMessage("Failed to update role. Try again.");
      setMessageType("error");
    } finally {
      setUpdatingRole(null);
      setEditingRole(null);
    }
  };

  const handleRoleKeyDown = (e, member, newRole) => {
    if (e.key === "Enter") {
      handleRoleUpdate(member, newRole);
    } else if (e.key === "Escape") {
      setEditingRole(null);
    }
  };

  const userIsTeamAdmin = isTeamAdmin(profile.role);
  const hasTeam = !!profile.team_id;

  if (loading) return <Spinner message="Loading team information..." />;

  if (!hasTeam) {
    return (
      <div className={styles.section}>
        <div className={styles.noTeam}>
          <p>You are not part of a team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <SectionHeader 
        title="Team Management" 
        icon={Users} 
        showEditButton={false}
      />
      
      <div className={styles.content}>
                 {message && (
           <div className={`${styles.message} ${styles[messageType]}`}>
             {message}
           </div>
         )}

        {/* Team Members Table */}
        <div className={styles.membersSection}>
          <div className={styles.membersHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.teamNameDisplay}>
                <span className={styles.teamName}>User Management</span>
                <span className={styles.memberCount}>
                  {teamMembers.length} / {teamInfo?.max_users} licenses used
                </span>
              </div>
            </div>
            <div className={styles.headerRight}>
              {userIsTeamAdmin && (
                <button
                                      className="sectionHeaderButton"
                  onClick={() => setShowInvitePanel(true)}
                  disabled={licensesMaxedOut}
                >
                  <Plus size={14} />
                  <span>Invite Users</span>
                </button>
              )}
            </div>
          </div>
        <table className={styles.membersTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Role</th>
              <th>Email</th>
              {userIsTeamAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr key={member.id}>
                <td>
                  {member.first_name || "-"} {member.last_name || ""}
                </td>
                <td>{member.title || "-"}</td>
                <td>
                  {updatingRole === member.id ? (
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Updating...</span>
                  ) : (
                                         <Dropdown
                       trigger={
                         <span 
                           className={`${styles.roleBadge} ${
                             member.role === 'Platform Admin' ? styles.platformAdmin :
                             member.role === 'Platform Support' ? styles.platformSupport :
                             member.role === 'Team Admin' ? styles.admin : styles.member
                           } ${userIsTeamAdmin && member.id !== currentUserId ? styles.editableRoleBadge : ''}`}
                           title={userIsTeamAdmin && member.id !== currentUserId ? "Click to edit role" : ""}
                         >
                           {getRoleDisplayName(member.role)}
                         </span>
                       }
                       isOpen={editingRole === member.id}
                       onToggle={(isOpen) => {
                         if (userIsTeamAdmin && member.id !== currentUserId) {
                           setEditingRole(isOpen ? member.id : null);
                         }
                       }}
                       className="dropdown-menu"
                     >
                       {isPlatformAdmin(profile.role) && (
                         <button
                           className="dropdown-item"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleRoleUpdate(member, 'Platform Admin');
                           }}
                         >
                           Platform Admin
                         </button>
                       )}
                       {isPlatformAdmin(profile.role) && (
                         <button
                           className="dropdown-item"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleRoleUpdate(member, 'Platform Support');
                           }}
                         >
                           Platform Support
                         </button>
                       )}
                       <button
                         className="dropdown-item"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleRoleUpdate(member, 'Team Admin');
                         }}
                       >
                         Team Admin
                       </button>
                       <button
                         className="dropdown-item"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleRoleUpdate(member, 'Team Member');
                         }}
                       >
                         Team Member
                       </button>
                     </Dropdown>
                  )}
                </td>
                <td>{member.email || "-"}</td>
                {userIsTeamAdmin && (
                  <td>
                    {member.id !== currentUserId && (
                      <button
                        className="actionButton"
                        onClick={() => onDeleteMember(member)}
                        disabled={removing === member.id}
                      >
                        <Trash2 size={14} />
                        {removing === member.id ? 'Removing...' : 'Remove'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

             {/* Invite Team Members Right Drawer */}
       <RightDrawer 
         isOpen={showInvitePanel} 
         onClose={() => setShowInvitePanel(false)}
         title="Invite Team Members"
       >
        <div>
          <p>Send an invitation to join your team. The recipient will receive an email with instructions to join.</p>
          
          {inviting && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: 'rgba(53, 153, 184, 0.1)', 
              border: '1px solid rgba(53, 153, 184, 0.2)', 
              borderRadius: '6px',
              color: '#265947',
              textAlign: 'center'
            }}>
              <p>📧 Sending invitation email...</p>
            </div>
          )}
          
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Email Address
            </label>
            <input
              ref={inviteInputRef}
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={handleInviteKeyDown}
              disabled={licensesMaxedOut || inviting}
              className="form-input"
            />
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <Button
                variant="green"
                size="md"
                onClick={sendInviteEmail}
                disabled={!inviteEmail || licensesMaxedOut || inviting}
              >
                {inviting ? 'Sending Invite...' : 'Send Invite'}
              </Button>
              <Button 
                variant="gray" 
                size="md" 
                outline 
                onClick={() => setShowInvitePanel(false)}
                disabled={inviting}
              >
                Cancel
              </Button>
            </div>
          </div>
          
          {licensesMaxedOut && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '6px',
              color: '#dc2626'
            }}>
              <p>⚠️ You have reached the maximum number of licenses for your current plan.</p>
              <p>Please upgrade your subscription to invite more team members.</p>
            </div>
          )}
                 </div>
       </RightDrawer>
    </div>
  );
} 