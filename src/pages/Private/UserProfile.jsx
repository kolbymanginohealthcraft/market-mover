import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import styles from "./UserProfile.module.css";
import ButtonGroup from "../../components/Buttons/ButtonGroup";

import { PLANS } from "../../data/planData";

export default function UserProfile() {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    company: "",
    title: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [accessType, setAccessType] = useState(null); // 'create' | 'join' | 'free'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [teamCode, setTeamCode] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, company, title, access_type, selected_plan, team_code")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          company: data.company || "",
          title: data.title || "",
        });
        setAccessType(data.access_type || null);
        setSelectedPlan(data.selected_plan || null);
        setTeamCode(data.team_code || "");
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = async () => {
  setSaving(true);
  setMessage("");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setMessage("❌ User not found");
    setSaving(false);
    return;
  }

  // First: save profile
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    ...profile,
    updated_at: new Date().toISOString(),
    access_type: accessType,
    selected_plan: selectedPlan,
    team_code: teamCode || null,
  });

  if (profileError) {
    setMessage(`❌ Error saving profile: ${profileError.message}`);
    setSaving(false);
    return;
  }

  if (accessType === "join") {
    // Check if team exists
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id")
      .eq("access_code", teamCode.trim())
      .single();

    if (teamError || !team) {
      setMessage("❌ Invalid team access code. Please double-check and try again.");
      setSaving(false);
      return;
    }

    // Add to team_members
    const { error: memberError } = await supabase.from("team_members").insert([
      {
        team_id: team.id,
        user_id: user.id,
        role: "member",
      },
    ]);

    if (memberError) {
      setMessage(`❌ Could not join team: ${memberError.message}`);
      setSaving(false);
      return;
    }
  }

  // Routing
  if (accessType === "create") {
    navigate("/team-setup");
  } else {
    navigate("/dashboard");
  }

  setSaving(false);
};


  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Complete Your Profile</h2>
      <div className={styles.columns}>
        {/* Left: Profile Info */}
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div>
            <label>First Name</label>
            <input
              name="first_name"
              value={profile.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Last Name</label>
            <input
              name="last_name"
              value={profile.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Company</label>
            <input
              name="company"
              value={profile.company}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Job Title</label>
            <input name="title" value={profile.title} onChange={handleChange} />
          </div>

          {message && <p className={styles.message}>{message}</p>}
        </form>

        {/* Right: Access Settings */}
        <div className={styles.access}>
          <h3>Access Settings</h3>

          <ButtonGroup
            options={[
              { label: "Create a Team", value: "create" },
              { label: "Join a Team", value: "join" },
              { label: "Continue for Free", value: "free" },
            ]}
            selected={accessType}
            onSelect={setAccessType}
            fullWidth
          />

          {accessType && (
            <>
              <div className={styles.modeDescriptionBox}>
                {accessType === "create" && (
                  <p>
                    Create your own team and choose a plan that fits your needs. You’ll be able to invite others later.
                  </p>
                )}
                {accessType === "join" && (
                  <p>
                    Use a team access code provided by your administrator to join an existing team.
                  </p>
                )}
                {accessType === "free" && (
                  <p>
                    You can explore Market Mover for free with limited access to features.
                    Free mode includes basic provider search and summary insights, but
                    excludes advanced market tools and export options.
                  </p>
                )}
              </div>

              {accessType === "create" && (
                <div className={styles.planList}>
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className={`${styles.planRow} ${
                        selectedPlan === plan.id ? styles.selected : ""
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <span className={styles.planName}>{plan.name}</span>
                      <span className={styles.planPrice}>${plan.basePrice.toLocaleString()}/mo</span>
                    </div>
                  ))}
                  {selectedPlan && (
                    <p className={styles.planSelectedNote}>
                      Selected plan: <strong>{selectedPlan}</strong>
                    </p>
                  )}
                </div>
              )}

              {accessType === "join" && (
                <div className={styles.joinForm}>
                  <label>Enter your team access code</label>
                  <input
                    type="text"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value)}
                    placeholder="e.g. TEAM123"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.saveBar}>
        <button onClick={handleContinue} disabled={saving || !accessType}>
          {accessType === "create" && selectedPlan
            ? "Continue to Team Setup"
            : "Save and Continue"}
        </button>
      </div>
    </div>
  );
}
