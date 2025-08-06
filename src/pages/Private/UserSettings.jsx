import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import styles from "./UserSettings.module.css";
import Button from "../../components/Buttons/Button";
import { trackActivity } from "../../utils/activityTracker";
import { getRoleDisplayName } from "../../utils/roleHelpers";

export default function UserSettings() {
  const navigate = useNavigate();
  
  // User profile state
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    title: "",
    role: null,
    team_id: null,
  });

  // Team info for display only
  const [teamInfo, setTeamInfo] = useState(null);
  const [subscription, setSubscription] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchUserData = async () => {
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

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, title, role, team_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        setError("Failed to load profile.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch team info for display only
      if (profileData.team_id) {
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("name, tier, max_users")
          .eq("id", profileData.team_id)
          .single();

        if (!teamError && team) {
          setTeamInfo({
            name: team.name,
            tier: team.tier,
            max_users: team.max_users,
          });

          // Fetch subscription info for display
          const { data: subData, error: subError } = await supabase
            .from("subscriptions")
            .select("status, plans(name)")
            .eq("team_id", profileData.team_id)
            .in("status", ["active", "trialing"])
            .order("renewed_at", { ascending: false })
            .limit(1)
            .single();

          if (!subError && subData) {
            setSubscription({
              status: subData.status,
              plan_name: subData.plans?.name || "–",
            });
          }
        }
      }
    } catch (err) {
      console.error("💥 Unexpected error:", err);
      setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

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

  const isTeamAdmin = profile.role === "Team Admin" || profile.role === "Platform Admin" || profile.role === "Platform Support";
  const isPlatformAdmin = profile.role === "Platform Admin";
  const hasTeam = !!profile.team_id;

  if (loading) return <div className={styles.page}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Settings</h1>
        <p className={styles.subtitle}>
          Manage your personal profile and preferences
        </p>
      </div>

      {message && <div className={styles.toast}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        {/* Profile Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          <div className={styles.profileForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>First Name</label>
                <input
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleProfileChange}
                  placeholder="Enter your first name"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name</label>
                <input
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleProfileChange}
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Job Title</label>
                <input
                  name="title"
                  value={profile.title}
                  onChange={handleProfileChange}
                  placeholder="Enter your job title"
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <Button variant="green" onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        {/* Account Info Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Account Information</h2>
          <div className={styles.infoCards}>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Role</div>
              <div className={styles.infoValue}>
                {getRoleDisplayName(profile.role)}
              </div>
            </div>
            {hasTeam && (
              <>
                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>Team</div>
                  <div className={styles.infoValue}>{teamInfo?.name}</div>
                </div>
                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>Plan</div>
                  <div className={styles.infoValue}>
                    {subscription?.plan_name || teamInfo?.tier || "Free"}
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>Status</div>
                  <div className={styles.infoValue}>
                    {subscription?.status === "active" ? "✅ Active" : "⏳ Trial"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Team Access Section */}
        {hasTeam && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Team Access</h2>
            <div className={styles.teamAccess}>
              {isTeamAdmin ? (
                <div className={styles.adminAccess}>
                  <div className={styles.accessHeader}>
                    <h3>👥 Team Admin Access</h3>
                    <p>You have administrative privileges for your team.</p>
                  </div>
                  <div className={styles.adminActions}>
                    <Button
                      variant="blue"
                      size="md"
                      onClick={() => navigate("/app/admin")}
                    >
                      Go to Admin Dashboard
                    </Button>
                    <p className={styles.adminNote}>
                      Manage team members, colors, and subscription settings.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.memberAccess}>
                  <div className={styles.accessHeader}>
                    <h3>👤 Team Member Access</h3>
                    <p>You have standard member access to your team's features.</p>
                  </div>
                  <div className={styles.memberInfo}>
                    <p>Contact your team admin for:</p>
                    <ul>
                      <li>Adding or removing team members</li>
                      <li>Changing team colors and branding</li>
                      <li>Upgrading or modifying subscription</li>
                      <li>Managing billing and payment</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Team Section */}
        {!hasTeam && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Join a Team</h2>
            <div className={styles.noTeamMessage}>
              <h3>No Team Access</h3>
              <p>You're not currently part of a team. Join or create a team to access collaborative features.</p>
              <div className={styles.teamActions}>
                <Button variant="blue" size="md" onClick={() => navigate("/pricing")}>
                  View Plans
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Future Preferences Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Preferences</h2>
          <div className={styles.preferences}>
            <div className={styles.preferenceItem}>
              <h4>Email Notifications</h4>
              <p>Manage your email notification preferences.</p>
              <Button variant="gray" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
            <div className={styles.preferenceItem}>
              <h4>Display Settings</h4>
              <p>Customize your dashboard and chart display options.</p>
              <Button variant="gray" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
            <div className={styles.preferenceItem}>
              <h4>Data Export</h4>
              <p>Export your personal data and activity history.</p>
              <Button variant="gray" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 