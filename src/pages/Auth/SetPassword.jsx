import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import Button from "../../components/Buttons/Button";
import Spinner from "../../components/Buttons/Spinner";
import styles from "./LoginTest.module.css";

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
       console.log("Current URL:", window.location.href);
       console.log("Search params:", Object.fromEntries(searchParams.entries()));
       console.log("Hash:", window.location.hash);
       console.log("Full URL search:", window.location.search);
       console.log("All URLSearchParams entries:");
       for (const [key, value] of searchParams.entries()) {
         console.log(`  ${key}: ${value}`);
       }
      
             // Check for error in hash fragment first
       const hash = window.location.hash.substring(1);
       const hashParams = new URLSearchParams(hash);
       const hashError = hashParams.get('error');
       const errorDescription = hashParams.get('error_description');
      
             if (hashError) {
         if (hashError === 'access_denied' && errorDescription?.includes('expired')) {
           setMessage("This invitation link has expired. Please ask your team admin to send a new invitation.");
         } else {
           setMessage(`Invitation error: ${errorDescription || hashError}`);
         }
         setMessageType("error");
         setLoading(false);
         return;
       }
      
             // Get the access token from URL params (try different parameter names)
       let accessToken = searchParams.get('access_token');
       let refreshToken = searchParams.get('refresh_token');
       
       // If not found, try alternative parameter names
       if (!accessToken) {
         accessToken = searchParams.get('token');
       }
       if (!refreshToken) {
         refreshToken = searchParams.get('refresh');
       }
       
       // Also check for hash fragment parameters
       if (!accessToken) {
         accessToken = hashParams.get('access_token') || hashParams.get('token');
         refreshToken = hashParams.get('refresh_token') || hashParams.get('refresh');
       }
       
       // Try getting tokens directly from URL as fallback
       if (!accessToken) {
         const urlParams = new URLSearchParams(window.location.search);
         accessToken = urlParams.get('access_token') || urlParams.get('token');
         refreshToken = urlParams.get('refresh_token') || urlParams.get('refresh');
       }
       
       // Try getting tokens from hash as fallback
       if (!accessToken) {
         const hashParams = new URLSearchParams(window.location.hash.substring(1));
         accessToken = hashParams.get('access_token') || hashParams.get('token');
         refreshToken = hashParams.get('refresh_token') || hashParams.get('refresh');
       }
      
      console.log("Found accessToken:", accessToken ? "YES" : "NO");
      console.log("Found refreshToken:", refreshToken ? "YES" : "NO");
      
      if (!accessToken) {
        setMessage("Invalid invitation link. Please check your email.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      // Set the session with the tokens
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
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

    } catch (err) {
      console.error("Error checking invitation:", err);
      setMessage("An unexpected error occurred.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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

    setSaving(true);
    setMessage("");

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setMessage("Failed to set password. Please try again.");
        setMessageType("error");
        return;
      }

      setMessage("Password set successfully! Welcome to the team!");
      setMessageType("success");
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 2000);

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
                  New Password *
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
                  placeholder="Enter your new password"
                  minLength={6}
                />
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px'
                }}>
                  Must be at least 6 characters
                </div>
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
                  placeholder="Confirm your new password"
                />
              </div>

              <Button
                type="submit"
                variant="blue"
                size="lg"
                disabled={saving}
                style={{ marginTop: '8px' }}
              >
                {saving ? 'Setting Password...' : 'Set Password & Continue'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
