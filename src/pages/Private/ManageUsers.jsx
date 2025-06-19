import { useEffect, useState } from "react";
import { supabase } from "../../app/supabaseClient";
import styles from "./ManageUsers.module.css";
import Button from "../../components/Buttons/Button";

export default function ManageUsers() {
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState("");

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

      // Step 1: Get current user's profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

      console.log("🧪 profile =", profile);
      console.log("🧪 profileError =", profileError);

      if (profileError || !profile || !profile.team_id) {
        setError("You are not part of a team.");
        setLoading(false);
        return;
      }

      const teamId = profile.team_id;

      // Step 2: Get team info
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("name, tier, max_users")
        .eq("id", teamId)
        .single();

      if (teamError || !team) {
        setError("Failed to load team info.");
        setLoading(false);
        return;
      }

      setTeamInfo({
        id: teamId,
        name: team.name,
        tier: team.tier,
        max_users: team.max_users,
      });

      // Step 3: Get all members of the team
      const { data: members, error: membersError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, title, email")
        .eq("team_id", teamId);

      if (membersError) {
        setError("Failed to load team members.");
        console.error("❌ membersError:", membersError);
        setLoading(false);
        return;
      }

      setTeamMembers(members);
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
        fetchTeamData(); // refresh to show the new member
      }
    } catch (err) {
      console.error("💥 Invite failed:", err);
      setMessage("❌ Failed to send invite. Try again.");
    }
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Manage Team Members</h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          <div className={styles.summaryBar}>
            <span>
              👥 Team: <strong>{teamInfo.name}</strong>
            </span>
            <span>
              📦 Licenses: {teamMembers.length} / {teamInfo.max_users}
            </span>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Email</th>
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
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.inviteSection}>
            <h4>Invite New User</h4>
            <input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className={styles.emailInput}
            />
            <Button
              variant="green"
              size="sm"
              onClick={sendInviteEmail}
              disabled={!inviteEmail}
            >
              Send Invite
            </Button>
            {message && <p className={styles.inviteMessage}>{message}</p>}
          </div>
        </>
      )}
    </div>
  );
}
