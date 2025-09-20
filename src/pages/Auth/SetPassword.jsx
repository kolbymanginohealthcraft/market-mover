import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import Button from "../../components/Buttons/Button";
import Spinner from "../../components/Buttons/Spinner";
import styles from "./Login.module.css";

const SetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const passwordRef = useRef(null);

  useEffect(() => {
    checkInvitation();
  }, []);

  const checkInvitation = async () => {
    try {
      // Debug: Log the current URL and search params
      console.log("🔍 SetPassword - Current URL:", window.location.href);
      console.log("🔍 SetPassword - Search params:", Object.fromEntries(searchParams.entries()));
      console.log("🔍 SetPassword - Hash:", window.location.hash);
      
      // Check for error in hash fragment first
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      console.log("🔍 SetPassword - Hash params:", Object.fromEntries(hashParams.entries()));
      
      const hashError = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');
      
      if (hashError) {
        console.log("🔍 SetPassword - Hash error detected:", hashError, errorDescription);
        if (hashError === 'access_denied' && errorDescription?.includes('expired')) {
          setMessage("This invitation link has expired. Please ask your team admin to send a new invitation.");
        } else {
          setMessage(`Invitation error: ${errorDescription || hashError}`);
        }
        setMessageType("error");
        setLoading(false);
        return;
      }

      // First, check if we already have a valid session (user clicked invitation link)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log("🔍 SetPassword - Session check:", { hasSession: !!session, sessionError });
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setMessage("Unable to verify your session. Please try the invitation link again.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      if (session && session.user) {
        // User is authenticated, check if they need to set password
        const user = session.user;
        console.log("🔍 SetPassword - User authenticated:", { 
          email: user.email, 
          provider: user.app_metadata?.provider,
          emailConfirmed: user.email_confirmed_at,
          userMetadata: user.user_metadata
        });
        
        setUserEmail(user.email);

        // User is on the set-password page, so they need to set a password
        console.log("🔍 SetPassword - User needs to set password");
        setMessage("Please set your password to complete your account setup.");
        setMessageType("info");

        // Get team info from user metadata or profile
        if (user.user_metadata?.team_name) {
          console.log("🔍 SetPassword - Team name from metadata:", user.user_metadata.team_name);
          setTeamName(user.user_metadata.team_name);
        } else {
          // Try to get team info from profile
          console.log("🔍 SetPassword - Fetching team info from profile");
          const { data: profile } = await supabase
            .from('profiles')
            .select('teams(name)')
            .eq('id', user.id)
            .single();
          
          if (profile?.teams?.name) {
            console.log("🔍 SetPassword - Team name from profile:", profile.teams.name);
            setTeamName(profile.teams.name);
          }
        }

        // Focus on password input
        setTimeout(() => {
          passwordRef.current?.focus();
        }, 100);
        
        setLoading(false);
        return;
      }

      // No session found - check for tokens in URL (legacy support)
      let accessToken = searchParams.get('access_token') || searchParams.get('token');
      let refreshToken = searchParams.get('refresh_token') || searchParams.get('refresh');
      
      console.log("🔍 SetPassword - No session, checking URL tokens:", { accessToken: !!accessToken, refreshToken: !!refreshToken });
      
      // Also check hash fragment
      if (!accessToken) {
        accessToken = hashParams.get('access_token') || hashParams.get('token');
        refreshToken = hashParams.get('refresh_token') || hashParams.get('refresh');
        console.log("🔍 SetPassword - Checking hash tokens:", { accessToken: !!accessToken, refreshToken: !!refreshToken });
      }
      
      if (accessToken) {
        // Try to set session with tokens
        console.log("🔍 SetPassword - Setting session with tokens");
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error("🔍 SetPassword - Token session error:", error);
          setMessage("Invalid or expired invitation link.");
          setMessageType("error");
          setLoading(false);
          return;
        }

        // Get user info
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setMessage("Unable to verify user.");
          setMessageType("error");
          setLoading(false);
          return;
        }

        setUserEmail(user.email);

        // Get team info from user metadata
        if (user.user_metadata?.team_name) {
          setTeamName(user.user_metadata.team_name);
        }

        // Focus on password input
        setTimeout(() => {
          passwordRef.current?.focus();
        }, 100);
        
        setLoading(false);
        return;
      }

      // No valid session or tokens found
      console.log("🔍 SetPassword - No valid session or tokens found");
      setMessage("Invalid invitation link. Please check your email for the correct link.");
      setMessageType("error");
      setLoading(false);

    } catch (err) {
      console.error("Error checking invitation:", err);
      setMessage("An unexpected error occurred. Please try again.");
      setMessageType("error");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("🔍 SetPassword - FORM SUBMITTED!");
    console.log("🔍 SetPassword - Password length:", password.length);
    console.log("🔍 SetPassword - Passwords match:", password === confirmPassword);
    
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    console.log("🔍 SetPassword - Starting password update...");
    setSaving(true);
    setMessage("");

    try {
      console.log("🔍 SetPassword - Calling supabase.auth.updateUser...");
      
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      console.log("🔍 SetPassword - updateUser result:", { updateError });

      if (updateError) {
        console.log("🔍 SetPassword - Password update failed:", updateError);
        setMessage("Failed to set password. Please try again.");
        setMessageType("error");
        setSaving(false);
        return;
      }

      console.log("🔍 SetPassword - Password update successful!");

      // Wait a moment for the password update to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the updated user session
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      console.log("🔍 SetPassword - Updated user state:", {
        email: updatedUser.email,
        emailConfirmed: updatedUser.email_confirmed_at,
        provider: updatedUser.app_metadata?.provider
      });

      setMessage("Password set successfully!");
      setMessageType("success");
      
      // Force redirect using window.location - most reliable method
      console.log("🔍 SetPassword - About to redirect to /team-onboarding");
      console.log("🔍 SetPassword - Current URL before redirect:", window.location.href);
      
      window.location.href = '/team-onboarding';
      
      console.log("🔍 SetPassword - Redirect command sent");

    } catch (err) {
      console.error("Error setting password:", err);
      setMessage("An unexpected error occurred. Please try again.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner message="Verifying your invitation..." />;
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
            Set Your Password
          </h1>
          <p style={{
            color: '#5f6b6d',
            fontSize: '16px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            {teamName ? `Welcome to ${teamName}!` : 'Welcome!'} Create your password to get started.
          </p>
          {userEmail && (
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              margin: '8px 0 0 0',
              fontStyle: 'italic'
            }}>
              {userEmail}
            </p>
          )}
        </div>

        {message && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: messageType === 'error' ? 'rgba(220, 53, 69, 0.1)' : 
                           messageType === 'success' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(53, 153, 184, 0.1)',
            color: messageType === 'error' ? '#dc3545' : 
                   messageType === 'success' ? '#28a745' : '#265947',
            textAlign: 'center',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {messageType === 'success' && '✅ '}
            {messageType === 'error' && '❌ '}
            {messageType === 'info' && 'ℹ️ '}
            {message}
          </div>
        )}

        {messageType === 'error' && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button
              variant="blue"
              size="md"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </div>
        )}

        {messageType !== 'error' && (
          <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#265947',
                fontWeight: '500',
                fontSize: '14px'
              }}>
                Password
              </label>
              <input
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`form-input ${styles['form-input']}`}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Enter your password"
                disabled={saving}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#265947',
                fontWeight: '500',
                fontSize: '14px'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`form-input ${styles['form-input']}`}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Confirm your password"
                disabled={saving}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="blue"
                size="lg"
                disabled={saving}
                style={{ width: '100%' }}
              >
                {saving ? 'Setting Password...' : 'Set Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetPassword;
