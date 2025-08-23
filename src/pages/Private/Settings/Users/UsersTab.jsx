import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { supabase } from "../../../../app/supabaseClient";
import Button from "../../../../components/Buttons/Button";
import Spinner from "../../../../components/Buttons/Spinner";
import SidePanel from "../../../../components/Overlays/SidePanel";
import SectionHeader from "../../../../components/Layouts/SectionHeader";
import { isTeamAdmin, getRoleDisplayName } from "../../../../utils/roleHelpers";
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

  const inviteInputRef = useRef(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

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
          .select("name, tier, max_users, created_at")
          .eq("id", profileData.team_id)
          .single();

        if (teamError || !team) {
          setMessage("Failed to load team info.");
          setMessageType("error");
          setLoading(false);
          return;
        }

        setTeamInfo({
          id: profileData.team_id,
          name: team.name,
          tier: team.tier,
          max_users: team.max_users,
          created_at: team.created_at,
        });

        // Fetch subscription data
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select(
            "id, started_at, renewed_at, expires_at, status, billing_interval, discount_percent, plan_id, plans(name)"
          )
          .eq("team_id", profileData.team_id)
          .in("status", ["active", "trialing"])
          .order("renewed_at", { ascending: false })
          .limit(1)
          .single();

        if (!subError && subData) {
          setSubscription({
            ...subData,
            plan_name: subData.plans?.name || "–",
          });
        }

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
        setLicensesMaxedOut(members.length >= team.max_users);
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

    const payload = {
      email: inviteEmail,
      team_id: teamInfo.id,
      team_name: teamInfo.name,
      inviter_id: currentUserId,
    };

    try {
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
        fetchTeamData(); // Refresh data
        if (inviteInputRef.current) inviteInputRef.current.focus();
      }
    } catch (err) {
      console.error("💥 Invite failed:", err);
      setMessage("Failed to send invite. Try again.");
      setMessageType("error");
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

    try {
      const res = await fetch(
        "https://ukuxibhujcozcwozljzf.functions.supabase.co/remove_user_from_team",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "x-invite-secret": import.meta.env.VITE_EDGE_INVITE_SECRET,
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
      }
    } catch (err) {
      console.error("💥 Remove failed:", err);
      setMessage("Failed to remove member. Try again.");
      setMessageType("error");
    }
  };

  const handleInviteKeyDown = (e) => {
    if (e.key === "Enter") {
      sendInviteEmail();
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
            {messageType === "success" && "✅"}
            {messageType === "error" && "❌"}
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
                <Button
                  variant="green"
                  size="sm"
                  onClick={() => setShowInvitePanel(true)}
                  disabled={licensesMaxedOut}
                >
                  + Invite Users
                </Button>
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
                <td>{getRoleDisplayName(member.role)}</td>
                <td>{member.email || "-"}</td>
                {userIsTeamAdmin && (
                  <td>
                    {member.id !== currentUserId && (
                      <Button
                        size="sm"
                        variant="red"
                        ghost
                        onClick={() => onDeleteMember(member)}
                      >
                        Remove
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {/* Invite Team Members Sidebar */}
      <SidePanel 
        isOpen={showInvitePanel} 
        onClose={() => setShowInvitePanel(false)}
        title="Invite Team Members"
      >
        <div>
          <p>Send an invitation to join your team. The recipient will receive an email with instructions to join.</p>
          
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
              disabled={licensesMaxedOut}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <Button
                variant="green"
                size="md"
                onClick={sendInviteEmail}
                disabled={!inviteEmail || licensesMaxedOut}
              >
                Send Invite
              </Button>
              <Button 
                variant="gray" 
                size="md" 
                outline 
                onClick={() => setShowInvitePanel(false)}
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
      </SidePanel>
    </div>
  );
} 