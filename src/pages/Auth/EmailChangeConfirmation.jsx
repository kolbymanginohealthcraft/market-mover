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
    let authSubscription;
    let timeoutId;
    let sessionValidated = false;

    const handleEmailChangeConfirmation = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        
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

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          
          const hashHasTokens = hashParams.get('access_token') || hashParams.get('type') === 'email_change';
          
          if (hashHasTokens) {
            setStatus("Processing email change link...");
            return;
          }
          
          setStatus("Unable to verify your session. Please try the email link again.");
          setLoading(false);
          return;
        }

        if (session && session.user) {
          const user = session.user;
          console.log("🔍 EmailChangeConfirmation - User authenticated:", { 
            email: user.email,
            emailChangeSession: true
          });
          
          sessionValidated = true;
          setIsSuccess(true);
          setStatus("✅ Your email address has been successfully updated!");
          setLoading(false);
          
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          setTimeout(() => {
            window.close();
            setTimeout(() => {
              window.location.href = '/app/settings/profile';
            }, 1000);
          }, 3000);
          
          return;
        }

        const hashHasTokens = hashParams.get('access_token') || hashParams.get('type') === 'email_change';
        const queryHasTokens = searchParams.get('access_token') || searchParams.get('token');
        
        if (hashHasTokens || queryHasTokens) {
          setStatus("Processing email change link...");
          
          timeoutId = setTimeout(async () => {
            if (!sessionValidated) {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (!retrySession || !retrySession.user) {
                setStatus("Invalid or expired email change link. Please check your email for the correct link.");
                setLoading(false);
              }
            }
          }, 5000);
          
          return;
        }

        setStatus("Invalid email change link. Please check your email for the correct link.");
        setLoading(false);

      } catch (err) {
        console.error("Error processing email change confirmation:", err);
        setStatus("❌ An unexpected error occurred. Please try again.");
        setLoading(false);
      }
    };

    authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔍 EmailChangeConfirmation - Auth state change:", event);
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session && session.user) {
          sessionValidated = true;
          const user = session.user;
          
          setIsSuccess(true);
          setStatus("✅ Your email address has been successfully updated!");
          setLoading(false);
          
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          setTimeout(() => {
            window.close();
            setTimeout(() => {
              window.location.href = '/app/settings/profile';
            }, 1000);
          }, 3000);
        }
      } else if (event === 'SIGNED_OUT') {
        sessionValidated = false;
        setLoading(false);
      }
    });

    setTimeout(() => {
      handleEmailChangeConfirmation();
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
