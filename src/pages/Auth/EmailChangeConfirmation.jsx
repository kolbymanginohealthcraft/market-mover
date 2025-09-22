import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import Button from "../../components/Buttons/Button";
import Spinner from "../../components/Buttons/Spinner";
import styles from "./Login.module.css";

const EmailChangeConfirmation = () => {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    handleEmailChangeConfirmation();
  }, []);

  const handleEmailChangeConfirmation = async () => {
    try {
      console.log("🔍 EmailChangeConfirmation - Processing email change confirmation");
      
      // Check for error in hash fragment first
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      console.log("🔍 EmailChangeConfirmation - Hash params:", Object.fromEntries(hashParams.entries()));
      
      const hashError = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');
      
      if (hashError) {
        console.log("🔍 EmailChangeConfirmation - Hash error detected:", hashError, errorDescription);
        if (hashError === 'access_denied' && errorDescription?.includes('expired')) {
          setStatus("This email change link has expired. Please request a new email change from your profile settings.");
        } else {
          setStatus(`Email change error: ${errorDescription || hashError}`);
        }
        setLoading(false);
        return;
      }

      // Check if we have a valid session (user clicked email link)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log("🔍 EmailChangeConfirmation - Session check:", { hasSession: !!session, sessionError });
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setStatus("Unable to verify your session. Please try the email link again.");
        setLoading(false);
        return;
      }

      if (session && session.user) {
        // User is authenticated, email change was successful
        const user = session.user;
        console.log("🔍 EmailChangeConfirmation - User authenticated:", { 
          email: user.email, 
          emailConfirmed: user.email_confirmed_at
        });
        
        setIsSuccess(true);
        setStatus("✅ Your email address has been successfully updated!");
        setLoading(false);
        
        // Auto-redirect to profile after showing success message
        setTimeout(() => {
          window.close(); // Try to close the tab first
          // If that doesn't work, redirect to profile
          setTimeout(() => {
            window.location.href = '/app/settings/profile';
          }, 1000);
        }, 3000);
        
        return;
      }

      // No session found - check for tokens in URL (legacy support)
      let accessToken = searchParams.get('access_token') || searchParams.get('token');
      let refreshToken = searchParams.get('refresh_token') || searchParams.get('refresh');
      
      console.log("🔍 EmailChangeConfirmation - No session, checking URL tokens:", { accessToken: !!accessToken, refreshToken: !!refreshToken });
      
      // Also check hash fragment
      if (!accessToken) {
        accessToken = hashParams.get('access_token') || hashParams.get('token');
        refreshToken = hashParams.get('refresh_token') || hashParams.get('refresh');
        console.log("🔍 EmailChangeConfirmation - Checking hash tokens:", { accessToken: !!accessToken, refreshToken: !!refreshToken });
      }
      
      if (accessToken) {
        // Try to set session with tokens
        console.log("🔍 EmailChangeConfirmation - Setting session with tokens");
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error("🔍 EmailChangeConfirmation - Token session error:", error);
          setStatus("Invalid or expired email change link.");
          setLoading(false);
          return;
        }

        // Get user info
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus("Unable to verify user.");
          setLoading(false);
          return;
        }

        setIsSuccess(true);
        setStatus("✅ Your email address has been successfully updated!");
        setLoading(false);
        
        // Auto-redirect to profile after showing success message
        setTimeout(() => {
          window.close(); // Try to close the tab first
          // If that doesn't work, redirect to profile
          setTimeout(() => {
            window.location.href = '/app/settings/profile';
          }, 1000);
        }, 3000);
        
        return;
      }

      // No valid session or tokens found
      console.log("🔍 EmailChangeConfirmation - No valid session or tokens found");
      setStatus("Invalid email change link. Please check your email for the correct link.");
      setLoading(false);

    } catch (err) {
      console.error("Error processing email change confirmation:", err);
      setStatus("❌ An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner message="Confirming your email change..." />;
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
            color: isSuccess ? '#28a745' : '#265947',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '0 0 12px 0'
          }}>
            {isSuccess ? 'Email Updated Successfully!' : 'Email Change Confirmation'}
          </h1>
          <p style={{
            color: '#5f6b6d',
            fontSize: '16px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            {isSuccess 
              ? 'Your email address has been successfully updated. You can now close this tab and return to your profile.'
              : 'Processing your email change request...'
            }
          </p>
        </div>

        {status && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: isSuccess ? 'rgba(40, 167, 69, 0.1)' : 
                           status.includes('❌') ? 'rgba(220, 53, 69, 0.1)' : 'rgba(53, 153, 184, 0.1)',
            color: isSuccess ? '#28a745' : 
                   status.includes('❌') ? '#dc3545' : '#265947',
            textAlign: 'center',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {status}
          </div>
        )}

        {isSuccess && (
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              variant="blue"
              size="lg"
              onClick={() => {
                window.close();
                setTimeout(() => {
                  window.location.href = '/app/settings/profile';
                }, 100);
              }}
            >
              Return to Profile
            </Button>
          </div>
        )}

        {!isSuccess && (
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button
              variant="blue"
              size="lg"
              onClick={() => navigate('/app/settings/profile')}
            >
              Go to Profile Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailChangeConfirmation;
