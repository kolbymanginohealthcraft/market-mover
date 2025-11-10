import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Layers, Users } from "lucide-react";
import { supabase } from "../../app/supabaseClient";
import Button from "../../components/Buttons/Button";
import styles from "./Signup.module.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    acceptedTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const emailRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!formData.acceptedTerms) {
      setStatus("❌ You must agree to the terms.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (signUpError) {
      setStatus(`❌ ${signUpError.message}`);
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (signInError) {
      setStatus(`❌ Account created, but login failed: ${signInError.message}`);
      setLoading(false);
      return;
    }

         setStatus("✅ Account created and logged in!");
     setLoading(false);
     
     // Navigate to dashboard after successful signup and login
     setTimeout(() => {
       navigate('/app/dashboard');
     }, 1000);
  };

                   return (
        <div style={{
          background: 'linear-gradient(135deg, #265947 0%, #3fb985 100%)',
          // minHeight: '100vh'
        }}>
          <div style={{
           background: 'rgba(255, 255, 255, 0.95)',
           borderRadius: '16px',
           padding: '60px',
           width: '100%',
           maxWidth: '1000px',
           boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
           position: 'relative',
           margin: '24px auto'
         }}>
        

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            color: '#265947',
            fontSize: '36px',
            fontWeight: 'bold',
            margin: '0 0 16px 0'
          }}>
            Join Market Mover
          </h1>
          <p style={{
            color: '#5f6b6d',
            fontSize: '18px',
            margin: '0 0 8px 0',
            lineHeight: '1.5'
          }}>
            Unlock the power of healthcare market intelligence
          </p>
          <p style={{
            color: '#5f6b6d',
            fontSize: '14px',
            margin: 0,
            lineHeight: '1.5'
          }}>
                         Already have an account? <span 
               style={{ color: '#265947', cursor: 'pointer', textDecoration: 'underline' }}
               onClick={() => navigate('/login')}
             >
               Sign in here
             </span>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>
          {/* Signup Form */}
          <div>
            <h2 style={{
              color: '#265947',
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 24px 0'
            }}>
              Create Your Account
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                   ref={emailRef}
                   name="email"
                   type="email"
                   value={formData.email}
                   onChange={handleChange}
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
                   name="password"
                   type="password"
                   value={formData.password}
                   onChange={handleChange}
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

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input
                  type="checkbox"
                  name="acceptedTerms"
                  checked={formData.acceptedTerms}
                  onChange={handleChange}
                  required
                  style={{ marginTop: '4px' }}
                />
                                 <span style={{
                   fontSize: '14px',
                   color: '#5f6b6d',
                   lineHeight: '1.5'
                 }}>
                   I agree to the <a href="/legal" target="_blank" rel="noopener noreferrer" style={{ color: '#265947', textDecoration: 'underline' }}>Terms of Service</a>
                 </span>
              </div>

              <Button
                type="submit"
                variant="green"
                size="lg"
                disabled={loading}
                style={{ marginTop: '8px' }}
              >
                {loading ? "Creating Account..." : "Create Your Account"}
              </Button>
              
              <div style={{
                margin: '12px 0 0 0',
                padding: '16px 18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(38, 89, 71, 0.08)',
                border: '1px solid rgba(38, 89, 71, 0.12)',
                textAlign: 'left'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#265947',
                  lineHeight: '1.5',
                  margin: '0 0 8px 0'
                }}>
                  Create your free account to explore the Market Mover platform. Upgrade to a monthly subscription for $2,000 to unlock all premium features.
                </p>
                <p style={{
                  fontSize: '12px',
                  color: '#5f6b6d',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  All subscriptions include three user licenses, with optional bundles of three additional seats available for $250 per month.
                </p>
              </div>
            </form>

            {status && (
              <p style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(38, 89, 71, 0.1)',
                color: '#265947',
                textAlign: 'center',
                fontSize: '14px'
              }}>
                {status}
              </p>
            )}
          </div>

          {/* Marketing Content */}
          <div style={{ paddingLeft: '40px', borderLeft: '2px solid #e0e0e0' }}>
            <h3 style={{
              color: '#265947',
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 20px 0'
            }}>
              Platform Capabilities
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(38, 89, 71, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(38, 89, 71, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Tag size={18} color="#265947" className={styles.icon} />
                  <h4 style={{
                    color: '#265947',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    Segmentation Workbench
                  </h4>
                </div>
                <p style={{
                  color: '#5f6b6d',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  Create reusable parameters by tagging the providers, codes, metrics, and markets that matter, and apply them for easy analysis.
                </p>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(38, 89, 71, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(38, 89, 71, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Layers size={18} color="#265947" className={styles.icon} />
                  <h4 style={{
                    color: '#265947',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    Connected Data Signals
                  </h4>
                </div>
                <p style={{
                  color: '#5f6b6d',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  Analyze claims, quality, enrollment, and demographic signals to get a full market picture of the five dimensions of healthcare: <strong>Population</strong>, <strong>Payers</strong>, <strong>Providers</strong>, <strong>Pathways</strong>, and <strong>Positioning</strong>.
                </p>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(38, 89, 71, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(38, 89, 71, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Users size={18} color="#265947" className={styles.icon} />
                  <h4 style={{
                    color: '#265947',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    Team-Ready Execution
                  </h4>
                </div>
                <p style={{
                  color: '#5f6b6d',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  Collaborate with your team to create strategies built for sales, marketing, and leadership alignment.
                </p>
              </div>
            </div>
          </div>
                 </div>
       </div>
     </div>
   );
};

export default Signup;
