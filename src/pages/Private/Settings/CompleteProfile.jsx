// src/pages/Private/CompleteProfile.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../../app/supabaseClient";
import { useNavigate } from "react-router-dom";
import styles from "./CompleteProfile.module.css";

export default function CompleteProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ first_name: "", last_name: "", title: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const completeSetup = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setMessage("❌ You must be logged in.");
        setLoading(false);
        return;
      }

      const team_id = new URLSearchParams(window.location.search).get("team_id");

      if (!team_id) {
        setMessage("❌ Missing team ID.");
        setLoading(false);
        return;
      }

      // insert into team_members
      await supabase.from("team_members").insert({ user_id: user.id, team_id });

      // pre-fill email
      setProfile((prev) => ({ ...prev, email: user.email }));
      setLoading(false);
    };

    completeSetup();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      ...profile,
    });

    if (error) {
      setMessage("❌ Failed to save profile.");
    } else {
      setMessage("✅ Profile completed!");
      setTimeout(() => navigate("/home"), 1500);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <h2>Complete Your Profile</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="First Name"
          value={profile.first_name}
          onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={profile.last_name}
          onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Job Title"
          value={profile.title}
          onChange={(e) => setProfile({ ...profile, title: e.target.value })}
          required
        />
        <button type="submit">Save and Continue</button>
      </form>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
