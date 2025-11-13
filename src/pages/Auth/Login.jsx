import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import Button from "../../components/Buttons/Button";
import styles from "./Login.module.css";
import authStyles from "./AuthForm.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const emailInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus({ type: "info", message: "Processing..." });

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({ type: "success", message: "Logged in!" });
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className={`${authStyles.page} ${authStyles.pageBlue}`}>
      <div className={authStyles.container}>
        <div className={authStyles.card}>
          <div className={styles.headerText}>
            <h1 className={authStyles.title}>Welcome Back</h1>
            <p className={styles.headerSubtitle}>Sign in to access your healthcare market insights</p>
          </div>

          <form className={authStyles.form} onSubmit={handleLogin}>
            <div className={authStyles.formGroup}>
              <label className={authStyles.label}>Email Address</label>
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={authStyles.input}
              />
            </div>

            <div className={authStyles.formGroup}>
              <label className={authStyles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={authStyles.input}
              />
            </div>

            <Button type="submit" variant="blue" size="lg" className={styles.primaryButton}>
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
            <p
              className={`${authStyles.statusMessage} ${
                status.type === "error"
                  ? authStyles.statusError
                  : status.type === "success"
                  ? authStyles.statusSuccess
                  : authStyles.statusInfo
              }`}
            >
              {status.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
