import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import Button from "../../components/Buttons/Button";
import Spinner from "../../components/Buttons/Spinner";
import styles from "./LoginTest.module.css";

const TeamOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    title: "",
  });
  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const firstNameRef = useRef(null);

  useEffect(() => {
    checkUserAndTeam();
  }, []);

  const checkUserAndTeam = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        navigate('/login');
        return;
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, title, team_id, role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setMessage("Failed to load profile.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      // Check if user just accepted an invitation (has team but no name)
      if (profileData.team_id && (!profileData.first_name || !profileData.last_name)) {
        // User accepted invitation but needs to complete profile
        // Continue with onboarding
      } else if (!profileData.team_id) {
        // User doesn't have a team, redirect to dashboard
        navigate('/app/dashboard');
        return;
      }

      // Get team information
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("name, max_users")
        .eq("id", profileData.team_id)
        .single();

      if (teamError) {
        setMessage("Failed to load team information.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setTeamInfo({
        id: profileData.team_id,
        name: teamData.name,
        max_users: teamData.max_users,
      });

      // Pre-fill existing profile data
      setProfile({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        title: profileData.title || "",
      });

      // Focus on first name input if it's empty
      if (!profileData.first_name) {
        setTimeout(() => {
          firstNameRef.current?.focus();
        }, 100);
      }

    } catch (err) {
      console.error("Error checking user and team:", err);
      setMessage("An unexpected error occurred.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      setMessage("Please provide your first and last name.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          title: profile.title.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        setMessage("Failed to update profile. Please try again.");
        setMessageType("error");
        return;
      }

      setMessage("Profile updated successfully! Welcome to the team!");
      setMessageType("success");
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 2000);

    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage("An unexpected error occurred. Please try again.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner message="Loading your team information..." />;
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #3599b8 0%, #52bad7 100%)',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '60px',
        width: '100%',
        maxWidth: '600px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        margin: '24px auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            color: '#265947',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '0 0 12px 0'
          }}>
            Welcome to {teamInfo?.name}!
          </h1>
          <p style={{
            color: '#5f6b6d',
            fontSize: '16px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Complete your profile to get started with your team
          </p>
        </div>

        {message && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: messageType === 'error' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(53, 153, 184, 0.1)',
            color: messageType === 'error' ? '#dc3545' : '#265947',
            textAlign: 'center',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {messageType === 'success' && '✅ '}
            {messageType === 'error' && '❌ '}
            {message}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  color: '#5f6b6d',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  First Name *
                </label>
                <input
                  ref={firstNameRef}
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  required
                  disabled={saving}
                  className={`form-input ${styles['form-input']}`}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  color: '#5f6b6d',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  required
                  disabled={saving}
                  className={`form-input ${styles['form-input']}`}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your last name"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  color: '#5f6b6d',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  Job Title
                </label>
                <input
                  type="text"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  disabled={saving}
                  className={`form-input ${styles['form-input']}`}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your job title (optional)"
                />
              </div>

              <Button
                type="submit"
                variant="blue"
                size="lg"
                disabled={saving}
                style={{ marginTop: '8px' }}
              >
                {saving ? 'Saving...' : 'Complete Setup'}
              </Button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Button
                variant="blue"
                ghost
                size="sm"
                onClick={() => navigate('/app/dashboard')}
                disabled={saving}
              >
                Skip for Now
              </Button>
            </div>
          </div>
        </div>

        {teamInfo && (
          <div style={{
            marginTop: '32px',
            padding: '20px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#0369a1', fontSize: '18px' }}>
              Team Information
            </h3>
            <div style={{ color: '#0c4a6e', fontSize: '14px', lineHeight: '1.5' }}>
              <div><strong>Team:</strong> {teamInfo.name}</div>
              <div><strong>Your Role:</strong> Team Member</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamOnboarding;
