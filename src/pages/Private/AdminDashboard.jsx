import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import styles from "./AdminDashboard.module.css";
import Button from "../../components/Buttons/Button";
import TeamColorManager from "../../components/TeamColorManager";
import { trackActivity } from "../../utils/activityTracker";

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // User profile state
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    company: "",
    title: "",
    role: null,
    team_id: null,
  });

  // Team management state
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [licensesMaxedOut, setLicensesMaxedOut] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [savingTeamName, setSavingTeamName] = useState(false);
  const [activeTab, setActiveTab] = useState("team");

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

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Authentication failed.");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, company, title, role, team_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        setError("Failed to load profile.");
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
          setError("Failed to load team info.");
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

        setNewTeamName(team.name);

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

        // Fetch team members
        const { data: members, error: membersError } = await supabase.rpc(
          "get_team_members",
          { current_user_id: user.id }
        );

        if (membersError) {
          setError("Failed to load team members.");
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
      setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Profile management
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        company: profile.company,
        title: profile.title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (!error) {
      await trackActivity('profile_completion', null, 'Profile Updated');
      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setError("Failed to update profile.");
    }
    setSaving(false);
  };

  // Team management
  const sendInviteEmail = async () => {
    setMessage("");
    if (!inviteEmail.includes("@")) {
      setMessage("❌ Please enter a valid email address.");
      return;
    }

    const payload = {
      email: inviteEmail,
      team_id: teamInfo.id,
      team_name: teamInfo.name,
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
        setMessage("❌ " + (result.error || result.message || "Unknown error"));
      } else {
        setMessage("✅ Invite sent!");
        setInviteEmail("");
        fetchData();
        if (inviteInputRef.current) inviteInputRef.current.focus();
      }
    } catch (err) {
      console.error("💥 Invite failed:", err);
      setMessage("❌ Failed to send invite. Try again.");
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
      setLoading(true);

      const res = await fetch(
        "https://ukuxibhujcozcwozljzf.functions.supabase.co/remove_user_from_team",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "x-admin-secret": import.meta.env.VITE_EDGE_ADMIN_SECRET,
          },
          body: JSON.stringify({ user_id: member.id }),
        }
      );

      const raw = await res.text();
      console.log("🧾 Raw response from remove_user_from_team:", raw);

      const result = JSON.parse(raw);

      if (!res.ok) {
        alert(`Failed to remove user: ${result.error || "Unknown error"}`);
        setLoading(false);
        return;
      }

      setMessage(
        `✅ Removed ${member.first_name} ${member.last_name} from the team.`
      );
      await fetchData();
    } catch (err) {
      alert("Unexpected error: " + err.message);
      setLoading(false);
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
        setTeamInfo((t) => ({ ...t, name: newTeamName.trim() }));
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

  const hasTeam = !!profile.team_id;
  const isTeamAdmin = profile.role === "Team Admin" || profile.role === "Platform Admin" || profile.role === "Platform Support";

  if (loading) return <div className={styles.page}>Loading...</div>;

  // Redirect non-team-admins to user settings
  if (!isTeamAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.accessDenied}>
          <h1>🔒 Access Denied</h1>
          <p>You need team admin privileges to access this dashboard.</p>
          <Button variant="blue" onClick={() => navigate("/app/user-settings")}>
            Go to User Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>
          Manage your team, colors, and subscription settings
        </p>
      </div>

      {message && <div className={styles.toast}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "team" ? styles.active : ""}`}
            onClick={() => setActiveTab("team")}
          >
            👥 Team Management
          </button>
          <button
            className={`${styles.tab} ${activeTab === "colors" ? styles.active : ""}`}
            onClick={() => setActiveTab("colors")}
          >
            🎨 Team Colors
          </button>
          <button
            className={`${styles.tab} ${activeTab === "subscription" ? styles.active : ""}`}
            onClick={() => setActiveTab("subscription")}
          >
            💳 Subscription
          </button>
        </div>

        <div className={styles.tabContent}>
          {/* Team Management Tab */}
          {activeTab === "team" && hasTeam && (
            <div className={styles.section}>
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
                          ref={teamNameInputRef}
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

              {/* Team Info Cards */}
              <div className={styles.infoCards}>
                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>Plan</div>
                  <div className={styles.infoValue}>
                    {subscription?.plan_name || "-"}
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>Licenses Used</div>
                  <div className={styles.infoValue}>
                    {teamMembers.length} / {teamInfo?.max_users}
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>Subscription Status</div>
                  <div className={styles.infoValue}>{subscription?.status || "-"}</div>
                </div>
                {subscription?.status === "active" && subscription?.renewed_at && (
                  <div className={styles.infoCard}>
                    <div className={styles.infoLabel}>Renewal Date</div>
                    <div className={styles.infoValue}>
                      {formatDate(subscription.renewed_at)}
                    </div>
                  </div>
                )}
              </div>

              {/* Invite Section */}
              {isTeamAdmin && (
                <div className={styles.inviteSection}>
                  <h3 className={styles.subsectionTitle}>Invite Team Members</h3>
                  <div className={styles.inviteForm}>
                    <input
                      ref={inviteInputRef}
                      type="email"
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={handleInviteKeyDown}
                      className={styles.emailInput}
                      disabled={licensesMaxedOut}
                    />
                    <Button
                      variant="green"
                      size="sm"
                      onClick={sendInviteEmail}
                      disabled={!inviteEmail || licensesMaxedOut}
                    >
                      Send Invite
                    </Button>
                  </div>
                  {licensesMaxedOut && (
                    <p className={styles.warning}>
                      You have reached the maximum number of licenses.
                    </p>
                  )}
                </div>
              )}

              {/* Team Members Table */}
              <div className={styles.membersSection}>
                <h3 className={styles.subsectionTitle}>Team Members</h3>
                <table className={styles.membersTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Email</th>
                      {isTeamAdmin && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr key={member.id}>
                        <td>
                          {member.first_name || "-"} {member.last_name || ""}
                        </td>
                        <td>{member.title || "-"}</td>
                        <td>{member.email || "-"}</td>
                        {isTeamAdmin && (
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
          )}

          {/* Team Colors Tab */}
          {activeTab === "colors" && isTeamAdmin && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Team Color Palette</h2>
              <TeamColorManager />
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === "subscription" && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Subscription Management</h2>
              
              {hasTeam ? (
                <div className={styles.subscriptionDetails}>
                  <div className={styles.planInfo}>
                    <h3>Current Plan: {subscription?.plan_name || "Free"}</h3>
                    <p>Team: {teamInfo?.name}</p>
                    <p>Role: {profile.role}</p>
                  </div>
                  
                  <div className={styles.subscriptionActions}>
                    <Button
                      variant="blue"
                      size="md"
                      onClick={() => navigate("/app/billing-history")}
                    >
                      View Billing History
                    </Button>
                    <Button variant="gold" size="md" disabled>
                      Upgrade / Downgrade (Coming Soon)
                    </Button>
                    <Button variant="teal" size="md" disabled>
                      Purchase Licenses (Coming Soon)
                    </Button>
                    <Button
                      variant="red"
                      size="md"
                      ghost
                      disabled
                    >
                      Delete Account (Coming Soon)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.noTeamMessage}>
                  <h3>No Active Subscription</h3>
                  <p>You need to join or create a team to access subscription features.</p>
                  <div className={styles.teamActions}>
                    <Button variant="blue" size="md" onClick={() => navigate("/pricing")}>
                      View Plans
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 