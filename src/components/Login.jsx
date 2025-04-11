// src/components/Login.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from '../styles/AuthForm.module.css';
import localStyles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('login');
  const emailInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, [mode]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setStatus('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setStatus('Processing...');

    let error;
    if (mode === 'login') {
      ({ error } = await supabase.auth.signInWithPassword({ email, password }));
    } else {
      ({ error } = await supabase.auth.resetPasswordForEmail(email));
    }

    if (error) {
      setStatus(`❌ ${error.message}`);
    } else {
      setStatus(mode === 'reset' ? '✅ Password reset email sent.' : '✅ Logged in!');
    }
  };

  const handleCreateAccount = () => {
    resetForm();
    navigate('/pricing');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {mode === 'login' ? 'Welcome Back' : 'Reset Password'}
        </h2>

        <form onSubmit={handleAuth} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
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

          {mode !== 'reset' && (
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
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

          <button type="submit" className={styles.button}>
            {mode === 'login' ? 'Log In' : 'Send Reset Email'}
          </button>
        </form>

        <div className={localStyles.switchMode}>
          {mode === 'login' ? (
            <>
              <button onClick={handleCreateAccount} className={localStyles.link}>
                Create an account
              </button>
              <button
                onClick={() => { setMode('reset'); resetForm(); }}
                className={localStyles.link}
              >
                Forgot password?
              </button>
            </>
          ) : (
            <button
              onClick={() => { setMode('login'); resetForm(); }}
              className={localStyles.link}
            >
              ← Back to login
            </button>
          )}
        </div>

        {status && <p className={styles.status}>{status}</p>}
      </div>
    </div>
  );
};

export default Login;
