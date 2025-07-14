import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import styles from "./UserProfile.module.css";
import Button from "../../components/Buttons/Button";
import { trackActivity } from "../../utils/activityTracker";

export default function UserProfile() {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    company: "",
    title: "",
    role: null,
    team_id: null,
  });

  const [subscription, setSubscription] = useState({
    plan_name: "free",
    team_name: null,
    max_users: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [showTierOptions, setShowTierOptions] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, company, title, role, team_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      setProfile(profileData);

      if (profileData.team_id) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("name, max_users, tier")
          .eq("id", profileData.team_id)
          .single();

        setSubscription({
          plan_name: teamData?.tier || "free",
          team_name: teamData?.name || null,
          max_users: teamData?.max_users || null,
        });
      } else {
        setShowTierOptions(true);
      }

      setLoading(false);
    };

    fetchProfileData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
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
      // Track profile completion activity
      await trackActivity('profile_completion', null, 'Profile Updated');
    }
    
    setMessage(error ? `❌ ${error.message}` : "✅ Profile updated");
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleJoinTeam = async () => {
  setMessage("");
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const access_token = session?.access_token;

    if (!access_token) {
      setMessage("❌ User is not logged in.");
      return;
    }

    const res = await fetch(
      "https://ukuxibhujcozcwozljzf.functions.supabase.co/join_team_by_code",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`, // ✅ use user token, not anon key
        },
        body: JSON.stringify({ access_code: teamCode }),
      }
    );

    const raw = await res.text();
    console.log("📥 Raw response:", raw);

    const result = JSON.parse(raw);

    if (!res.ok) {
      setMessage("❌ " + (result.error || "Failed to join team"));
    } else {
      setMessage("✅ Successfully joined team!");
      setTimeout(() => window.location.reload(), 1000);
    }
  } catch (err) {
    console.error("💥 Join failed:", err);
    setMessage("❌ Unexpected error occurred.");
  }
};


  const hasTeam = !!profile.team_id;
  const isAdmin = profile.role === "admin";

  if (loading) return <div className={styles.page}>Loading...</div>;

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Your Profile</h2>
      <div className={styles.columns}>
        {/* Left: Profile Form */}
        <div className={styles.formCard}>
          {message && <div className={styles.toast}>{message}</div>}
          <h3 className={styles.formTitle}>User Details</h3>
          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
            <div>
              <label>First Name</label>
              <input
                name="first_name"
                value={profile.first_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Last Name</label>
              <input
                name="last_name"
                value={profile.last_name}
                onChange={handleChange}
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
              <input
                name="title"
                value={profile.title}
                onChange={handleChange}
              />
            </div>

            <div className={styles.saveBar}>
              <Button variant="accent" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save User Details"}
              </Button>
            </div>
          </form>
        </div>

        {/* Right: Subscription Section */}
        <div className={styles.subscriptionBox}>
          <div className={styles.subHeader}>
            <h3>Subscription Details</h3>
            {hasTeam && isAdmin && (
              <Button
                variant="green"
                size="sm"
                onClick={() => navigate("/app/manage-users")}
              >
                Admin Dashboard
              </Button>
            )}
          </div>

          {hasTeam ? (
            <>
              <div className={styles.tierGrid}>
                {["starter", "advanced", "pro"].map((tierName) => {
                  const isCurrent = subscription.plan_name === tierName;
                  return (
                    <div
                      key={tierName}
                      className={`${styles.tierOption} ${
                        isCurrent ? styles.active : ""
                      }`}
                    >
                      <h4>
                        {tierName.charAt(0).toUpperCase() + tierName.slice(1)}
                      </h4>
                      <p>
                        {tierName === "starter" &&
                          "Great for small teams just getting started."}
                        {tierName === "advanced" &&
                          "For growing teams that need more tools."}
                        {tierName === "pro" &&
                          "Full access for large organizations."}
                      </p>
                      {isCurrent && (
                        <span className={styles.tierBadge}>Your Plan</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className={styles.metaInfo}>
                👥 Team: <strong>{subscription.team_name}</strong>
              </p>
              <p className={styles.metaInfo}>
                🧑 Role: <strong>{profile.role}</strong>
              </p>
            </>
          ) : (
            <>
              <p className={styles.metaInfo}>
                🔓 You have not joined or created a team.
              </p>

              {showTierOptions && (
                <>
                  <div className={styles.tierDivider} />
                  <p className={styles.tierIntro}>
                    Choose how you'd like to get started:
                  </p>
                  <div className={styles.tierActions}>
                    <div className={styles.tierCard}>
                      <div className={styles.optionLabel}>🤝 Join a Team</div>
                      <p>
                        Enter the team code you received to join an existing
                        team. Your access will match the team’s plan.
                      </p>
                      <input
                        type="text"
                        placeholder="Enter team code"
                        value={teamCode}
                        onChange={(e) => setTeamCode(e.target.value)}
                      />
                      <Button
                        variant="blue"
                        size="sm"
                        onClick={handleJoinTeam}
                      >
                        Join Team
                      </Button>
                    </div>

                    <div className={styles.tierCard}>
                      <div className={styles.optionLabel}>🚀 Create a Team</div>
                      <p>
                        You’ll choose your plan and be able to invite teammates
                        after completing payment.
                      </p>
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => navigate("/pricing")}
                      >
                        Go to Pricing & Payment
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
