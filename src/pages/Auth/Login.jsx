import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import styles from "./AuthForm.module.css";
import localStyles from "./Login.module.css";
import Button from "../../components/Buttons/Button"; // ✅ Import shared Button

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("login");
  const emailInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, [mode]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setStatus("");
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setStatus("Processing...");

    let error;
    if (mode === "login") {
      ({ error } = await supabase.auth.signInWithPassword({ email, password }));
    } else {
      ({ error } = await supabase.auth.resetPasswordForEmail(email));
    }

    if (error) {
      setStatus(`❌ ${error.message}`);
    } else {
      setStatus(
        mode === "reset" ? "✅ Password reset email sent." : "✅ Logged in!"
      );
    }
  };

  const handleCreateAccount = () => {
    resetForm();
    navigate("/pricing");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {mode === "login" ? "Welcome Back" : "Reset Password"}
        </h2>

        <form onSubmit={handleAuth} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              className={styles.input}
              id="email"
              type="email"
              ref={emailInputRef}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== "reset" && (
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                className={styles.input}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <Button
            type="submit"
            variant="green"
            size="lg"
            style={{ marginTop: "1rem" }}
          >
            {mode === "login" ? "Log In" : "Send Reset Email"}
          </Button>
        </form>

        <div className={localStyles.switchMode}>
  {mode === 'login' ? (
    <>
      <Button variant="blue" ghost size="sm" onClick={handleCreateAccount}>
        Create an account
      </Button>
      <Button variant="blue" ghost size="sm" onClick={() => { setMode('reset'); resetForm(); }}>
        Forgot password?
      </Button>
    </>
  ) : (
    <Button variant="blue" ghost size="sm" onClick={() => { setMode('login'); resetForm(); }}>
      ← Back to login
    </Button>
  )}
</div>


        {status && <p className={styles.status}>{status}</p>}
      </div>
    </div>
  );
};

export default Login;
