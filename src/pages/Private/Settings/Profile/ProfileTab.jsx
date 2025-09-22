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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [footerVisible, setFooterVisible] = useState(false);
  
  // Email change state
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeMessage, setEmailChangeMessage] = useState("");
  const [emailChangeMessageType, setEmailChangeMessageType] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);

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
      setCurrentEmail(user.email);

      // Fetch team data if user is part of a team
      if (profileData.team_id) {
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("name, created_at")
          .eq("id", profileData.team_id)
          .single();

        if (!teamError && team) {
          setTeamInfo({
            id: profileData.team_id,
            name: team.name,
            created_at: team.created_at,
          });
        }
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

  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      setEmailChangeMessage("Please enter a new email address.");
      setEmailChangeMessageType("error");
      return;
    }

    if (newEmail.trim() === currentEmail) {
      setEmailChangeMessage("The new email must be different from your current email.");
      setEmailChangeMessageType("error");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setEmailChangeMessage("Please enter a valid email address.");
      setEmailChangeMessageType("error");
      return;
    }

    setIsChangingEmail(true);
    setEmailChangeMessage("Sending confirmation email...");
    setEmailChangeMessageType("info");

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim()
      });

      if (error) {
        console.error("Email change error:", error);
        setEmailChangeMessage(`Failed to send confirmation email: ${error.message}`);
        setEmailChangeMessageType("error");
      } else {
        setEmailChangeMessage("✅ Confirmation email sent! Please check your new email address and click the confirmation link to complete the change.");
        setEmailChangeMessageType("success");
        setNewEmail("");
        
        // Track the activity
        await trackActivity('email_change_requested', null, 'Email Change Requested');
      }
    } catch (err) {
      console.error("Unexpected error during email change:", err);
      setEmailChangeMessage("An unexpected error occurred. Please try again.");
      setEmailChangeMessageType("error");
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleCancelEmailChange = () => {
    setNewEmail("");
    setEmailChangeMessage("");
    setEmailChangeMessageType("");
  };



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

        {/* Email Management Section */}
        <div className={styles.emailSection}>
          <h3 className={styles.subsectionTitle}>Email Address</h3>
          <div className={styles.currentEmail}>
            <label>Current Email</label>
            <div className={styles.emailDisplay}>
              {currentEmail}
            </div>
          </div>
          
          <div className={styles.emailChangeForm}>
            <div className={styles.formGroup}>
              <label>New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter your new email address"
                disabled={isChangingEmail}
              />
            </div>
            
            {emailChangeMessage && (
              <div className={`${styles.emailMessage} ${styles[emailChangeMessageType]}`}>
                {emailChangeMessageType === "success" && "✅ "}
                {emailChangeMessageType === "error" && "❌ "}
                {emailChangeMessageType === "info" && "ℹ️ "}
                {emailChangeMessage}
              </div>
            )}
            
            <div className={styles.emailButtons}>
              {newEmail && (
                <Button 
                  variant="gray" 
                  onClick={handleCancelEmailChange}
                  disabled={isChangingEmail}
                >
                  Cancel
                </Button>
              )}
              <Button 
                variant="blue" 
                onClick={handleEmailChange}
                disabled={isChangingEmail || !newEmail.trim()}
              >
                {isChangingEmail ? "Sending..." : "Change Email"}
              </Button>
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