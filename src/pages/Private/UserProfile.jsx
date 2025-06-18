import { useEffect, useState } from "react";
import { supabase } from "../../app/supabaseClient";
import styles from "./UserProfile.module.css";
import Button from "../../components/Buttons/Button";

export default function UserProfile() {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    company: "",
    title: "",
  });
  const [subscription, setSubscription] = useState({
    tier: "free",
    team_name: null,
    member_since: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showTierOptions, setShowTierOptions] = useState(false);
  const [teamCode, setTeamCode] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, company, title")
        .eq("id", user.id)
        .single();

      const { data: teamInfo } = await supabase
        .from("team_members")
        .select("joined_at, team:teams(name, tier)")
        .eq("user_id", user.id)
        .single();

      if (profileData) setProfile(profileData);
      if (teamInfo?.team) {
        setSubscription({
          tier: teamInfo.team.tier,
          team_name: teamInfo.team.name,
          member_since: teamInfo.joined_at?.split("T")[0],
        });
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

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      ...profile,
      updated_at: new Date().toISOString(),
    });

    setMessage(error ? `❌ Error: ${error.message}` : "✅ Profile updated");
    setSaving(false);
  };

  const handleTierClick = () => setShowTierOptions(!showTierOptions);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Your Profile</h2>
      <div className={styles.columns}>
        {/* Left: Profile Form */}
        <div className={styles.formCard}>
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

            {message && <p className={styles.message}>{message}</p>}
            <div className={styles.saveBar}>
              <Button variant="accent" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save User Details"}
              </Button>
            </div>
          </form>
        </div>

        {/* Right: Subscription Details */}
        <div className={styles.subscriptionBox}>
          <h3>Subscription Details</h3>

          <div className={styles.subscriptionRow}>
            <span className={styles.tierLabel}>🌟 {subscription.tier}</span>
            <Button
              variant="accent"
              size="sm"
              outline
              onClick={handleTierClick}
            >
              Change Tier
            </Button>
          </div>

          {subscription.team_name && (
            <p className={styles.metaInfo}>
              👥 Team: <strong>{subscription.team_name}</strong>
            </p>
          )}
          {subscription.member_since && (
            <p className={styles.metaInfo}>
              📅 Member Since: {subscription.member_since}
            </p>
          )}

          {showTierOptions && (
            <>
              <div className={styles.tierDivider} />
              <p className={styles.tierIntro}>
                🔓 Choose one of the following methods to upgrade your
                subscription:
              </p>
              <div className={styles.tierActions}>
                <div className={styles.tierCard}>
                  <div className={styles.optionLabel}>
                    🤝 Option 1: Join a Team
                  </div>
                  <p>
                    Enter the team code you received to join an existing team.
                    Your access will match the team’s plan.
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
                    onClick={() => alert(`Joining team with code: ${teamCode}`)}
                  >
                    Join Team
                  </Button>
                </div>

                <div className={styles.tierCard}>
                  <div className={styles.optionLabel}>
                    🚀 Option 2: Create a Team
                  </div>
                  <p>
                    You’ll choose your plan and be able to invite teammates
                    after completing payment.
                  </p>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => alert("Redirect to pricing and payment")}
                  >
                    Go to Pricing & Payment
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
