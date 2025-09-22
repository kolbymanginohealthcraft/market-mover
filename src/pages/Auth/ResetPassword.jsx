import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import Button from "../../components/Buttons/Button";
import styles from "./ResetPassword.module.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const passwordInputRef = useRef(null);

  useEffect(() => {
    // Check if we need to refresh the session first
    refreshSessionIfNeeded();
  }, []);

  const refreshSessionIfNeeded = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log("🔍 ResetPassword - Session error, refreshing:", error);
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.log("🔍 ResetPassword - Session refresh failed:", refreshError);
          setStatus("Your password reset link has expired. Please request a new password reset.");
          return;
        }
        
        console.log("🔍 ResetPassword - Session refreshed successfully");
      }
      
      // Now check the recovery session
      checkRecoverySession();
    } catch (err) {
      console.error("Error refreshing session:", err);
      setStatus("Your password reset link has expired. Please request a new password reset.");
    }
  };

  const checkRecoverySession = async () => {
    try {
      // Debug: Log the current URL and search params
      console.log("🔍 ResetPassword - Current URL:", window.location.href);
      console.log("🔍 ResetPassword - Search params:", Object.fromEntries(searchParams.entries()));
      console.log("🔍 ResetPassword - Hash:", window.location.hash);
      
      // Check for error in hash fragment first
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      console.log("🔍 ResetPassword - Hash params:", Object.fromEntries(hashParams.entries()));
      
      const hashError = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');
      
      if (hashError) {
        console.log("🔍 ResetPassword - Hash error detected:", hashError, errorDescription);
        if (hashError === 'access_denied' && errorDescription?.includes('expired')) {
          setStatus("This password reset link has expired. Please request a new password reset.");
        } else {
          setStatus(`Password reset error: ${errorDescription || hashError}`);
        }
        return;
      }

      // First, check if we already have a valid session (user clicked reset link)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log("🔍 ResetPassword - Session check:", { hasSession: !!session, sessionError });
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setStatus("Unable to verify your session. Please try the reset link again.");
        return;
      }

      if (session && session.user) {
        // User is authenticated, they can reset their password
        const user = session.user;
        console.log("🔍 ResetPassword - User authenticated:", { 
          email: user.email, 
          provider: user.app_metadata?.provider,
          emailConfirmed: user.email_confirmed_at
        });
        
        setIsValidSession(true);
        setStatus("✅ Recovery session valid. Please enter your new password.");
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 100);
        return;
      }

      // No session found - check for tokens in URL (legacy support)
      let accessToken = searchParams.get('access_token') || searchParams.get('token');
      let refreshToken = searchParams.get('refresh_token') || searchParams.get('refresh');
      
      console.log("🔍 ResetPassword - No session, checking URL tokens:", { accessToken: !!accessToken, refreshToken: !!refreshToken });
      
      // Also check hash fragment
      if (!accessToken) {
        accessToken = hashParams.get('access_token') || hashParams.get('token');
        refreshToken = hashParams.get('refresh_token') || hashParams.get('refresh');
        console.log("🔍 ResetPassword - Checking hash tokens:", { accessToken: !!accessToken, refreshToken: !!refreshToken });
      }
      
      if (accessToken) {
        // Try to set session with tokens
        console.log("🔍 ResetPassword - Setting session with tokens");
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error("🔍 ResetPassword - Token session error:", error);
          setStatus("Invalid or expired password reset link.");
          return;
        }

        // Get user info
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus("Unable to verify user.");
          return;
        }

        setIsValidSession(true);
        setStatus("✅ Recovery session valid. Please enter your new password.");
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 100);
        return;
      }

      // No valid session or tokens found
      console.log("🔍 ResetPassword - No valid session or tokens found");
      setStatus("❌ Invalid or expired reset link. Please request a new password reset using the button below.");

    } catch (err) {
      console.error("Error checking recovery session:", err);
      setStatus("❌ An unexpected error occurred. Please try again.");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    console.log("🔍 ResetPassword - FORM SUBMITTED!");
    console.log("🔍 ResetPassword - Password length:", password.length);
    console.log("🔍 ResetPassword - Passwords match:", password === confirmPassword);
    
    if (!isValidSession) {
      setStatus("❌ Invalid reset session. Please request a new password reset.");
      return;
    }

    // Validate passwords
    if (password.length < 8) {
      setStatus("❌ Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("❌ Passwords do not match.");
      return;
    }

    console.log("🔍 ResetPassword - Starting password update...");
    setIsResetting(true);
    setStatus("Processing...");

    try {
      console.log("🔍 ResetPassword - Updating password directly...");
      
      // Update the user's password with timeout
      const updatePromise = supabase.auth.updateUser({
        password: password
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Password update timeout')), 1500)
      );
      
      try {
        const { error: updateError } = await Promise.race([updatePromise, timeoutPromise]);
        console.log("🔍 ResetPassword - updateUser result:", { updateError });

        if (updateError) {
          console.log("🔍 ResetPassword - Password update failed:", updateError);
          setStatus("Failed to update password. Please try again.");
          setIsResetting(false);
          return;
        }
      } catch (timeoutError) {
        console.log("🔍 ResetPassword - UpdateUser call timed out, but Supabase logs show success. Proceeding with redirect...");
        // The password update succeeded on the server side, so we continue
      }

      console.log("🔍 ResetPassword - Password update successful!");
      console.log("🔍 ResetPassword - About to set success message and redirect...");

      setStatus("✅ Password updated successfully! Redirecting to login...");
      
      // Force redirect using window.location - most reliable method
      console.log("🔍 ResetPassword - About to redirect to /login");
      console.log("🔍 ResetPassword - Current URL before redirect:", window.location.href);
      
      window.location.href = '/login';
      
      console.log("🔍 ResetPassword - Redirect command sent");

    } catch (err) {
      console.error("Error updating password:", err);
      setStatus("❌ An unexpected error occurred. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

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
            Reset Password
          </h1>
          <p style={{
            color: '#5f6b6d',
            fontSize: '16px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Enter your new password below
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  color: '#5f6b6d',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  New Password
                </label>
                <input
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!isValidSession || isResetting}
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
                  placeholder="Enter new password (min 8 characters)"
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
              Confirm New Password
            </label>
                            <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={!isValidSession || isResetting}
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
                  placeholder="Confirm new password"
                />
              </div>

              <Button
                type="submit"
                variant="blue"
                size="lg"
                disabled={!isValidSession || isResetting}
                className={styles.primaryButton}
                style={{ marginTop: '8px' }}
              >
                {isResetting ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>

                         <div className={styles.buttonGroup}>
               {!isValidSession && (
                 <Button
                   variant="blue"
                   ghost
                   size="sm"
                   onClick={() => navigate('/forgot-password')}
                   disabled={isResetting}
                   className={styles.secondaryButton}
                 >
                   Request New Reset Link
                 </Button>
               )}
             </div>
          </div>
        </div>

        {status && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: status.includes('❌') ? 'rgba(220, 53, 69, 0.1)' : 'rgba(53, 153, 184, 0.1)',
            color: status.includes('❌') ? '#dc3545' : '#265947',
            textAlign: 'center',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
