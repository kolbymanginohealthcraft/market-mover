import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import Button from "../../components/Buttons/Button";
import styles from "./LoginTest.module.css";

const LoginTest = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const emailInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus("Processing...");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus(`❌ ${error.message}`);
    } else {
      setStatus("✅ Logged in!");
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
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
            Welcome Back
          </h1>
          <p style={{
            color: '#5f6b6d',
            fontSize: '16px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Sign in to access your healthcare market insights
          </p>
        </div>

                 <div style={{ display: 'flex', justifyContent: 'center' }}>
           {/* Login Form */}
           <div style={{ maxWidth: '400px', width: '100%' }}>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                  Password
                </label>
                                 <input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
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
                 />
              </div>

                             <Button
                 type="submit"
                 variant="blue"
                 size="lg"
                 className={styles.primaryButton}
                 style={{ marginTop: '8px' }}
               >
                 Sign In
               </Button>
            </form>

                         <div className={styles.buttonGroup}>
               <Button
                 variant="blue"
                 ghost
                 size="sm"
                 onClick={handleForgotPassword}
                 className={styles.secondaryButton}
               >
                 Forgot Password?
               </Button>
               <Button
                 variant="blue"
                 ghost
                 size="sm"
                 onClick={() => navigate('/signup')}
                 className={styles.secondaryButton}
               >
                                  Create Account
                 </Button>
             </div>

            {status && (
              <p style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(53, 153, 184, 0.1)',
                color: '#265947',
                textAlign: 'center',
                fontSize: '14px'
              }}>
                {status}
              </p>
                         )}
           </div>
         </div>
       </div>
     </div>
   );
};

export default LoginTest;
