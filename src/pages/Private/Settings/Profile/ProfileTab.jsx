import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { supabase } from "../../../../app/supabaseClient";
import Button from "../../../../components/Buttons/Button";
import Spinner from "../../../../components/Buttons/Spinner";
import SectionHeader from "../../../../components/Layouts/SectionHeader";
import { trackActivity } from "../../../../utils/activityTracker";
import { getRoleDisplayName } from "../../../../utils/roleHelpers";
import styles from "./ProfileTab.module.css";

export default function ProfileTab() {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    title: "",
    role: null,
    team_id: null,
  });
  const [originalProfile, setOriginalProfile] = useState({
    first_name: "",
    last_name: "",
    title: "",
    role: null,
    team_id: null,
  });
  const [teamInfo, setTeamInfo] = useState(null);
  const [subscription, setSubscription] = useState({
    plan_name: "free",
    team_name: null,
    max_users: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [showTierOptions, setShowTierOptions] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Handle footer visibility with animation
  useEffect(() => {
    const hasChanges = 
      profile.first_name !== originalProfile.first_name ||
      profile.last_name !== originalProfile.last_name ||
      profile.title !== originalProfile.title;
    
    const hasMessage = message.length > 0;
    
    if (hasChanges || hasMessage) {
      setFooterVisible(true);
    } else {
      // Delay hiding to allow for slide-down animation
      const timer = setTimeout(() => {
        setFooterVisible(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [profile, originalProfile, message]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setMessage("Authentication failed.");
        setMessageType("error");
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
        setMessage("Failed to load profile.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setOriginalProfile(profileData);

      // Fetch team data if user is part of a team
      if (profileData.team_id) {
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("name, tier, max_users, created_at")
          .eq("id", profileData.team_id)
          .single();

        if (!teamError && team) {
          setTeamInfo({
            id: profileData.team_id,
            name: team.name,
            tier: team.tier,
            max_users: team.max_users,
            created_at: team.created_at,
          });

          setSubscription({
            plan_name: team.tier || "free",
            team_name: team.name || null,
            max_users: team.max_users || null,
          });
        }
      } else {
        setShowTierOptions(true);
      }
    } catch (err) {
      console.error("💥 Unexpected error:", err);
      setMessage("Unexpected error occurred.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
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
      setMessage("Profile updated successfully!");
      setMessageType("success");
      setOriginalProfile(profile);
      
      // Keep the footer visible for a moment to show success message
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2000);
    } else {
      setMessage("Failed to update profile.");
      setMessageType("error");
    }
    setSaving(false);
  };

  const handleCancelChanges = () => {
    setProfile(originalProfile);
    setMessage("");
    setMessageType("");
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
        setMessageType("error");
        return;
      }

      const res = await fetch(
        "https://ukuxibhujcozcwozljzf.functions.supabase.co/join_team_by_code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({ access_code: teamCode }),
        }
      );

      const raw = await res.text();
      console.log("📥 Raw response:", raw);

      const result = JSON.parse(raw);

      if (!res.ok) {
        setMessage("❌ " + (result.error || "Failed to join team"));
        setMessageType("error");
      } else {
        setMessage("✅ Successfully joined team!");
        setMessageType("success");
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      console.error("💥 Join failed:", err);
      setMessage("❌ Unexpected error occurred.");
      setMessageType("error");
    }
  };

  const hasTeam = !!profile.team_id;
  const isTeamAdmin = profile.role === "Team Admin" || profile.role === "Platform Admin" || profile.role === "Platform Support";

  // Check if profile has been modified
  const hasChanges = 
    profile.first_name !== originalProfile.first_name ||
    profile.last_name !== originalProfile.last_name ||
    profile.title !== originalProfile.title;

  if (loading) return <Spinner message="Loading profile information..." />;

  return (
    <div className={`${styles.section} ${hasChanges ? styles.hasStickyFooter : ''}`}>
      
      <SectionHeader 
        title="Profile Management" 
        icon={User} 
        showEditButton={false}
      />
      
      <div className={styles.content}>
        <div className={styles.twoColumnLayout}>
          {/* Left Column - Personal Information */}
          <div className={styles.leftColumn}>
            <div className={styles.personalInfo}>
              <h3 className={styles.subsectionTitle}>Personal Information</h3>
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
        </div>

        {/* Right Column - Subscription Section */}
        <div className={styles.rightColumn}>
          <div className={styles.subscriptionBox}>
            <h3 className={styles.subsectionTitle}>Subscription Details</h3>

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
                <div className={styles.metaInfoGroup}>
                  <p className={styles.metaInfo}>
                    👥 Team: <strong>{subscription.team_name}</strong>
                  </p>
                  <p className={styles.metaInfo}>
                    🧑 Role: <strong>{profile.role}</strong>
                  </p>
                </div>
              </>
            ) : (
              <>
                {showTierOptions && (
                  <>
                    <div className={styles.tierDivider} />
                    <p className={styles.tierIntro}>
                      You're currently on the free plan. Choose your next step:
                    </p>
                    <div className={styles.tierActions}>
                      <div className={styles.tierCard}>
                        <div className={styles.optionLabel}>🤝 Join a Team</div>
                        <p>
                          Enter the team code you received to join an existing
                          team. Your access will match the team's plan.
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
                          You'll choose your plan and be able to invite teammates
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
      </div>

      {/* Sticky Footer */}
      {footerVisible && (
        <div className={`${styles.stickyFooter} ${(hasChanges || message) ? styles.footerVisible : styles.footerHiding}`}>
          <div className={styles.stickyFooterContent}>
            {message && (
              <div className={`${styles.footerMessage} ${styles[messageType]}`}>
                {messageType === "success" && "✅"}
                {messageType === "error" && "❌"}
                {message}
              </div>
            )}
            {hasChanges && (
              <>
                <Button variant="gray" onClick={handleCancelChanges}>
                  Cancel
                </Button>
                <Button variant="blue" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 