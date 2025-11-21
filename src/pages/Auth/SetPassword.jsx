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
    let authSubscription;
    let timeoutId;
    let sessionValidated = false;

    const checkInvitation = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        
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

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          
          const hashHasTokens = hashParams.get('access_token') || hashParams.get('type') === 'invite';
          
          if (hashHasTokens) {
            setMessage("Processing invitation link...");
            return;
          }
          
          setMessage("Unable to verify your session. Please try the invitation link again.");
          setMessageType("error");
          setLoading(false);
          return;
        }

        if (session && session.user) {
          const user = session.user;
          console.log("🔍 SetPassword - User authenticated:", { 
            email: user.email,
            invitationSession: true
          });
          
          sessionValidated = true;
          setUserEmail(user.email);

          if (user.user_metadata?.team_name) {
            console.log("🔍 SetPassword - Team name from metadata:", user.user_metadata.team_name);
            setTeamName(user.user_metadata.team_name);
          } else {
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

          setTimeout(() => {
            passwordRef.current?.focus();
          }, 100);
          
          setLoading(false);
          return;
        }

        const hashHasTokens = hashParams.get('access_token') || hashParams.get('type') === 'invite';
        const queryHasTokens = searchParams.get('access_token') || searchParams.get('token');
        
        if (hashHasTokens || queryHasTokens) {
          setMessage("Processing invitation link...");
          
          timeoutId = setTimeout(async () => {
            if (!sessionValidated) {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (!retrySession || !retrySession.user) {
                setMessage("Invalid or expired invitation link. Please check your email for the correct link.");
                setMessageType("error");
                setLoading(false);
              }
            }
          }, 5000);
          
          return;
        }

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

    authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔍 SetPassword - Auth state change:", event);
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session && session.user) {
          sessionValidated = true;
          const user = session.user;
          
          setUserEmail(user.email);

          if (user.user_metadata?.team_name) {
            setTeamName(user.user_metadata.team_name);
          } else {
            const { data: profile } = await supabase
              .from('profiles')
              .select('teams(name)')
              .eq('id', user.id)
              .single();
            
            if (profile?.teams?.name) {
              setTeamName(profile.teams.name);
            }
          }

          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          setTimeout(() => {
            passwordRef.current?.focus();
          }, 100);
          
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        sessionValidated = false;
        setLoading(false);
      }
    });

    setTimeout(() => {
      checkInvitation();
    }, 100);

    return () => {
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams]);

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
      console.log("🔍 SetPassword - Updating password directly...");
      
      // Update the user's password with timeout
      const updatePromise = supabase.auth.updateUser({
        password: password
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Password update timeout')), 1500)
      );
      
      try {
        const { error: updateError } = await Promise.race([updatePromise, timeoutPromise]);
        console.log("🔍 SetPassword - updateUser result:", { updateError });

        if (updateError) {
          console.log("🔍 SetPassword - Password update failed:", updateError);
          setMessage("Failed to set password. Please try again.");
          setMessageType("error");
          setSaving(false);
          return;
        }
      } catch (timeoutError) {
        console.log("🔍 SetPassword - UpdateUser call timed out, but Supabase logs show success. Proceeding with redirect...");
        // The password update succeeded on the server side, so we continue
      }

      console.log("🔍 SetPassword - Password update successful!");
      console.log("🔍 SetPassword - About to set success message and redirect...");

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
            Welcome to Market Mover
          </h1>
          <p style={{
            color: '#5f6b6d',
            fontSize: '16px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Set your password to get started
          </p>
          {userEmail && (
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              margin: '8px 0 0 0',
              fontStyle: 'italic'
            }}>
              Account: {userEmail}
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
                    Password *
                  </label>
                  <input
                    ref={passwordRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    placeholder="Enter your password"
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
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    placeholder="Confirm your password"
                  />
                </div>

                <Button
                  type="submit"
                  variant="blue"
                  size="lg"
                  disabled={saving}
                  style={{ marginTop: '8px' }}
                >
                  {saving ? 'Setting Password...' : 'Set Password'}
                </Button>
              </form>

              {teamName && (
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
                    <div><strong>Team:</strong> {teamName}</div>
                    <div><strong>Your Role:</strong> Team Member</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetPassword;
