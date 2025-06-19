import { useEffect, useState } from "react";
import { supabase } from "../../app/supabaseClient";
import styles from "./ManageUsers.module.css";
import Button from "../../components/Buttons/Button";

export default function ManageUsers() {
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true);
      setError("");

      const { data: { user }, error: userErr } = await supabase.auth.getUser();

      if (userErr || !user) {
        setError("Authentication failed.");
        setLoading(false);
        return;
      }

      const { data: membership, error: teamErr } = await supabase
        .from("team_members")
        .select("team_id, role, team:teams(name, tier, max_users, current_users)")
        .eq("user_id", user.id)
        .single();

      if (teamErr || !membership?.team_id) {
        setError("You are not part of a team.");
        setLoading(false);
        return;
      }

      setTeamInfo({
        id: membership.team_id,
        name: membership.team.name,
        tier: membership.team.tier,
        max_users: membership.team.max_users,
        current_users: membership.team.current_users,
        role: membership.role,
      });

      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("id, role, joined_at, profiles(first_name, last_name, title, email)")
        .eq("team_id", membership.team_id);

      if (membersError) {
        console.error("❌ Failed to load members:", membersError);
        setError("Failed to load team members.");
      } else {
        setTeamMembers(members);
      }

      setLoading(false);
    };

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
      team_name: teamInfo.name,
      team_id: teamInfo.id,
    };

    console.log("📤 Sending invite email with payload:", payload);

    try {
      const res = await fetch("https://ukuxibhujcozcwozljzf.functions.supabase.co/invite_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "x-invite-secret": import.meta.env.VITE_EDGE_INVITE_SECRET,
        },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      console.log("📥 Raw response:", raw);

      const result = JSON.parse(raw);
      if (!res.ok) {
        console.error("❌ Invite failed:", result);
        setMessage(`❌ Invite failed: ${result.error || result.message || "Unknown error"}`);
      } else {
        setMessage("✅ Invite sent!");
        setInviteEmail("");
      }
    } catch (err) {
      console.error("💥 Error sending invite:", err);
      setMessage("❌ Failed to send invite.");
    }
  };

  const formatDate = (iso) => (iso ? iso.split("T")[0] : "-");

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
            <span>👥 Team: <strong>{teamInfo.name}</strong></span>
            <span>📦 Licenses: {teamInfo.current_users} / {teamInfo.max_users}</span>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((m) => (
                <tr key={m.id}>
                  <td>{m.profiles?.first_name} {m.profiles?.last_name}</td>
                  <td>{m.profiles?.title || "-"}</td>
                  <td>{m.profiles?.email || "-"}</td>
                  <td>{m.role}</td>
                  <td>{formatDate(m.joined_at)}</td>
                  <td>
                    <Button size="xs" variant="gray">Edit</Button>{" "}
                    <Button size="xs" variant="red" ghost>Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.inviteSection}>
            <h4>Invite New User</h4>
            <input
              type="email"
              placeholder="Enter email"
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
