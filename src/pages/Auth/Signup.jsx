import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Layers, Users } from "lucide-react";
import { supabase } from "../../app/supabaseClient";
import Button from "../../components/Buttons/Button";
import styles from "./Signup.module.css";
import authStyles from "./AuthForm.module.css";

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
    <div className={`${authStyles.page} ${authStyles.pageGreen}`}>
      <div className={`${authStyles.container} ${authStyles.containerWide}`}>
        <div className={authStyles.card}>
          <div className={styles.heroHeader}>
            <h1 className={styles.heroTitle}>Join Market Mover</h1>
            <p className={styles.heroSubtitle}>Unlock the power of healthcare market intelligence</p>
            <p className={styles.heroHelper}>
              Already have an account?{' '}
              <button type="button" className={styles.heroLink} onClick={() => navigate('/login')}>
                Sign in here
              </button>
            </p>
          </div>

          <div className={styles.contentGrid}>
            <div className={styles.formColumn}>
              <h2 className={styles.formTitle}>Create Your Account</h2>
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    ref={emailRef}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`${authStyles.input} ${styles.inputOverride}`}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`${authStyles.input} ${styles.inputOverride}`}
                  />
                </div>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    name="acceptedTerms"
                    checked={formData.acceptedTerms}
                    onChange={handleChange}
                    required
                  />
                  <span>
                    I agree to the{' '}
                    <a href="/legal" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                      Terms of Service
                    </a>
                  </span>
                </label>

                <Button
                 type="submit"
                 variant="green"
                 size="lg"
                 disabled={loading}
                 className={styles.primaryAction}
               >
                 {loading ? 'Creating Account...' : 'Create Your Account'}
               </Button>

                <div className={styles.guardrail}>
                  <p>
                    This creates your free account to explore the Market Mover platform. Upgrade anytime to a monthly
                    subscription to access all premium features for $2,000 per month.
                  </p>
                  <p>
                    Paid subscriptions include three user licenses, with optional bundles of three additional seats available
                    for $250 per month.
                  </p>
                </div>
              </form>

              {status && <p className={styles.status}>{status}</p>}
            </div>

            <div className={styles.marketingColumn}>
              <h3 className={styles.sectionTitle}>Platform Capabilities</h3>
              <div className={styles.featureList}>
                <div className={styles.featureCard}>
                  <div className={styles.featureHeading}>
                    <Tag size={18} color="#265947" className={styles.icon} />
                    <h4 className={styles.featureTitle}>Segmentation Workbench</h4>
                  </div>
                  <p className={styles.featureCopy}>
                    Create reusable parameters by tagging the providers, codes, metrics, and markets that matter, and apply them
                    for easy analysis.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureHeading}>
                    <Layers size={18} color="#265947" className={styles.icon} />
                    <h4 className={styles.featureTitle}>Connected Data Signals</h4>
                  </div>
                  <p className={styles.featureCopy}>
                    Analyze claims, quality, enrollment, and demographic signals to get a full market picture of the five
                    dimensions of healthcare: <strong>Population</strong>, <strong>Payers</strong>, <strong>Providers</strong>,
                    <strong> Pathways</strong>, and <strong>Positioning</strong>.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureHeading}>
                    <Users size={18} color="#265947" className={styles.icon} />
                    <h4 className={styles.featureTitle}>Team-Ready Execution</h4>
                  </div>
                  <p className={styles.featureCopy}>
                    Collaborate with your team to create strategies built for sales, marketing, and leadership alignment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
