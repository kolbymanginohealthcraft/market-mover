import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import Button from "../../components/Buttons/Button";
import styles from "./LoginTest.module.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const emailInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setStatus("❌ Please enter your email address");
      return;
    }

    setIsProcessing(true);
    setStatus("Processing...");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        if (error.message.includes("User not found")) {
          setStatus("❌ No account found with this email address");
        } else if (error.message.includes("Invalid email")) {
          setStatus("❌ Please enter a valid email address");
        } else {
          setStatus(`❌ ${error.message}`);
        }
      } else {
        setStatus("✅ Password reset email sent! Please check your email and click the link. If the link doesn't work, you can return here to request a new one.");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setStatus("❌ An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
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
            Forgot Password
          </h1>
          <p style={{
            color: '#5f6b6d',
            fontSize: '16px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  color: '#5f6b6d',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  Email Address
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isProcessing}
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
                  placeholder="Enter your email address"
                />
              </div>

              <Button
                type="submit"
                variant="blue"
                size="lg"
                disabled={isProcessing}
                style={{ marginTop: '8px' }}
              >
                {isProcessing ? 'Sending...' : 'Reset Password'}
              </Button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Button
                variant="blue"
                ghost
                size="sm"
                onClick={() => navigate('/login')}
                disabled={isProcessing}
              >
                Back to Login
              </Button>
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
      </div>
    </div>
  );
};

export default ForgotPassword;
