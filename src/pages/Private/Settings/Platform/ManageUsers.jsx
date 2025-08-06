import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../../app/supabaseClient";
import styles from "./ManageUsers.module.css";
import Button from "../../../../components/Buttons/Button";
import { useNavigate } from "react-router-dom";
import TeamColorManager from "../../../../components/TeamColorManager";

export default function ManageUsers() {
  const navigate = useNavigate();
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [licensesMaxedOut, setLicensesMaxedOut] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [savingTeamName, setSavingTeamName] = useState(false);

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

  const fetchTeamData = async () => {
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.team_id) {
        setError("You are not part of a team.");
        setLoading(false);
        return;
      }

      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("name, tier, max_users, created_at")
        .eq("id", profile.team_id)
        .single();

      if (teamError || !team) {
        setError("Failed to load team info.");
        setLoading(false);
        return;
      }

      setTeamInfo({
        id: profile.team_id,
        name: team.name,
        tier: team.tier,
        max_users: team.max_users,
        created_at: team.created_at,
      });

      setNewTeamName(team.name);

      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select(
          "id, started_at, renewed_at, expires_at, status, billing_interval, discount_percent, plan_id, plans(name)"
        )
        .eq("team_id", profile.team_id)
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
    } catch (err) {
      console.error("💥 Unexpected error:", err);
      setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

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
        fetchTeamData();
        if (inviteInputRef.current) inviteInputRef.current.focus();
      }
    } catch (err) {
      console.error("💥 Invite failed:", err);
      setMessage("❌ Failed to send invite. Try again.");
    }
  };

  const onDelete = async (member) => {
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
      await fetchTeamData();
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

  return (
    <div className={styles.page}>
      <div className={styles.backButtonRow}>
        <Button
          variant="gray"
          size="sm"
          onClick={() => navigate("/app/profile")}
        >
          ← Back to Profile
        </Button>
      </div>

      <div className={styles.teamNameTopBar}>
        <h1 className={styles.header}>Admin Dashboard</h1>
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
      </div>

      <div className={styles.underline} />

      <div className={styles.topInfoBar}>
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

        {subscription?.status === "canceled" && subscription?.expires_at && (
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Expires</div>
            <div className={styles.infoValue}>
              {formatDate(subscription.expires_at)}
            </div>
          </div>
        )}
      </div>

      <section className={styles.sectionWide}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Manage Team Members</h2>
          <div className={styles.inviteInline}>
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
            <p className={styles.subtleWarning}>
              You have reached the maximum number of licenses.
            </p>
          )}
          {message && (
            <p
              className={styles.inviteMessage}
              aria-live="polite"
              role="status"
            >
              {message}
            </p>
          )}
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Email</th>
              <th className={styles.actionsHeader}>Actions</th>
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
                <td>
                  {member.id !== currentUserId && (
                    <Button
                      size="md"
                      variant="red"
                      ghost
                      onClick={() => onDelete(member)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.sectionWide}>
        <h2 className={styles.sectionTitle}>Team Color Palette</h2>
        <p>Customize colors for your team's charts and visualizations.</p>
        <TeamColorManager />
      </section>

      <section className={styles.sectionWide}>
        <h2 className={styles.sectionTitle}>Subscription Management</h2>
        <p>Manage your subscription, billing history, and account settings.</p>

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
          <Button variant="teal" size="md" disabled className={styles.purchaseButton}>
            Purchase Licenses (Coming Soon)
          </Button>
          <Button
            variant="red"
            size="md"
            ghost
            disabled
            className={styles.deleteAccountButton}
          >
            Delete Account (Coming Soon)
          </Button>
        </div>
      </section>
    </div>
  );
}
