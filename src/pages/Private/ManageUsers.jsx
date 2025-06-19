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

  useEffect(() => {
    const fetchTeamData = async () => {
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

        const { data: teamRow, error: teamError } = await supabase
          .from("team_members")
          .select("team_id, role, team:teams(name, tier, max_users, current_users)")
          .eq("user_id", user.id)
          .single();

        if (teamError || !teamRow?.team_id) {
          setError("You are not part of a team.");
          setLoading(false);
          return;
        }

        setTeamInfo({
          id: teamRow.team_id,
          name: teamRow.team.name,
          tier: teamRow.team.tier,
          max_users: teamRow.team.max_users,
          current_users: teamRow.team.current_users,
          role: teamRow.role,
        });

        const { data: members, error: membersError } = await supabase
          .from("team_members")
          .select("id, role, joined_at, profiles(first_name, last_name, title, email)")
          .eq("team_id", teamRow.team_id);

        if (membersError) {
          setError("Failed to load team members.");
          console.error("❌ membersError:", membersError);
        } else {
          setTeamMembers(members);
        }
      } catch (err) {
        console.error("💥 Unexpected error:", err);
        setError("Unexpected error occurred.");
      } finally {
        setLoading(false);
      }
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
    console.log("📤 Using secret:", import.meta.env.VITE_EDGE_INVITE_SECRET);

    try {
      const res = await fetch(
        "https://ukuxibhujcozcwozljzf.functions.supabase.co/send_invite_email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-invite-secret": import.meta.env.VITE_EDGE_INVITE_SECRET,
          },
          body: JSON.stringify(payload),
        }
      );

      const raw = await res.text();
      console.log("📥 Raw response:", raw);

      const result = JSON.parse(raw);
      if (!res.ok) {
        setMessage("❌ " + (result.error || "Unknown error"));
        console.error("❌ Email failed:", result);
      } else {
        setMessage("✅ Invitation email sent!");
        setInviteEmail("");
      }
    } catch (err) {
      console.error("💥 Unexpected error:", err);
      setMessage("❌ Failed to send email. Try again.");
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
            <span>
              👥 Team: <strong>{teamInfo.name}</strong>
            </span>
            <span>
              📦 Licenses: {teamInfo.current_users} / {teamInfo.max_users}
            </span>
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
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    {member.profiles?.first_name} {member.profiles?.last_name}
                  </td>
                  <td>{member.profiles?.title || "-"}</td>
                  <td>{member.profiles?.email || "-"}</td>
                  <td>{member.role}</td>
                  <td>{formatDate(member.joined_at)}</td>
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
