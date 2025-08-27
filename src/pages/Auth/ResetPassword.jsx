import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import Button from "../../components/Buttons/Button";
import styles from "./LoginTest.module.css";

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
    // Check if we have a valid recovery session for password reset
    const checkRecoverySession = async () => {
      try {
        // Check for a recovery session (created when user clicks password reset link)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setStatus("Unable to verify your recovery session. Please try the reset link again.");
          return;
        }

        // Only proceed if we have a session AND it's a recovery session
        if (session && session.user) {
          // Check if this is a recovery session (user should be in a password reset state)
          console.log("🔍 ResetPassword - Recovery session found:", { 
            email: session.user.email,
            // Recovery sessions typically have specific metadata
            recoveryMode: session.user.app_metadata?.provider === 'email' && !session.user.email_confirmed_at
          });
          
          setIsValidSession(true);
          setStatus("✅ Recovery session valid. Please enter your new password.");
          setTimeout(() => {
            passwordInputRef.current?.focus();
          }, 100);
          return;
        }

        // No recovery session found - link is invalid or expired
        console.log("🔍 ResetPassword - No recovery session found");
        setStatus("❌ Invalid or expired reset link. Please request a new password reset using the button below.");

      } catch (err) {
        console.error("Error checking recovery session:", err);
        setStatus("❌ An unexpected error occurred. Please try again.");
      }
    };

    checkRecoverySession();
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
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

    setIsResetting(true);
    setStatus("Processing...");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setStatus(`❌ ${error.message}`);
        console.error("Password update error:", error);
      } else {
        setStatus("✅ Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error("Unexpected error during password update:", err);
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
                style={{ marginTop: '8px' }}
              >
                {isResetting ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Button
                variant="blue"
                ghost
                size="sm"
                onClick={() => navigate('/login')}
                disabled={isResetting}
              >
                Back to Login
              </Button>
              {!isValidSession && (
                <div style={{ marginTop: '12px' }}>
                  <Button
                    variant="blue"
                    ghost
                    size="sm"
                    onClick={() => navigate('/forgot-password')}
                    disabled={isResetting}
                  >
                    Request New Reset Link
                  </Button>
                </div>
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
