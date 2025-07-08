import { useState } from "react";
import styles from "./InviteUserBox.module.css";

export default function InviteUserBox({ teamId }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleInvite = async () => {
    setStatus("Sending...");
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_EDGE_URL}/invite_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_EDGE_INVITE_SECRET}`,
        },
        body: JSON.stringify({ email, team_id: teamId }),
      });

      const result = await res.json();
      setStatus(res.ok ? "✅ Invitation sent!" : `❌ ${result.error}`);
    } catch (err) {
      setStatus(`❌ Failed: ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <input
        type="email"
        placeholder="Enter email to invite"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={styles.input}
      />
      <button onClick={handleInvite} className={styles.button}>Invite</button>
      <div className={styles.status}>{status}</div>
    </div>
  );
}
