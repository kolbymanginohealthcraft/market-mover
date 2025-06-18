import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import styles from "./AuthForm.module.css";
import localStyles from "./Signup.module.css";
import Button from "../../components/Buttons/Button";
import LegalPanel from "../../components/Overlays/LegalPanel";

function SignUp() {
  const navigate = useNavigate();
  const emailRef = useRef(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    acceptedTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showLegalPanel, setShowLegalPanel] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
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
    setErrorMsg("");

    if (!formData.acceptedTerms) {
      setErrorMsg("You must agree to the terms.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (signUpError) {
      setErrorMsg(signUpError.message);
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (signInError) {
      setErrorMsg("Account created, but login failed: " + signInError.message);
      setLoading(false);
      return;
    }

    navigate("/app/profile");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Create an Account</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              name="email"
              type="email"
              ref={emailRef}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={localStyles.termsRow}>
            <input
              type="checkbox"
              name="acceptedTerms"
              checked={formData.acceptedTerms}
              onChange={handleChange}
              required
            />
            <span>
              I accept the{" "}
              <span
                className={localStyles.termsLink}
                onClick={() => setShowLegalPanel(true)}
              >
                Terms and Conditions
              </span>
            </span>
          </div>

          {errorMsg && <p className={styles.error}>{errorMsg}</p>}

          <Button
            type="submit"
            variant="green"
            size="lg"
            disabled={loading}
            style={{ marginTop: "1rem" }}
          >
            {loading ? "Creating Account..." : "Continue"}
          </Button>
        </form>
      </div>

      {/* ✅ LegalPanel now explicitly receives isOpen */}
      <LegalPanel
        isOpen={showLegalPanel}
        initialTab="terms"
        onClose={() => setShowLegalPanel(false)}
      />
    </div>
  );
}

export default SignUp;
