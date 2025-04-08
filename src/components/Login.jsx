import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { supabase } from '../supabaseClient';
import Navbar from './Navbar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('login'); // Modes: login, reset
  const emailInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (emailInputRef.current) emailInputRef.current.focus();
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
    } else if (mode === 'reset') {
      ({ error } = await supabase.auth.resetPasswordForEmail(email));
    }

    if (error) {
      setStatus(`❌ ${error.message}`);
    } else {
      if (mode === 'reset') {
        setStatus('✅ Password reset email sent.');
      } else {
        setStatus('✅ Logged in!');
      }
    }
  };

  const handleCreateAccount = () => {
    resetForm();
    navigate('/pricing'); // 👈 Go to pricing page
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            {mode === 'login' ? 'Welcome Back' : 'Reset Password'}
          </h1>

          <form onSubmit={handleAuth} className={styles.form}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              ref={emailInputRef}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />

            {mode !== 'reset' && (
              <>
                <label htmlFor="password" className={styles.label}>Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  required
                />
              </>
            )}

            <button type="submit" className={styles.button}>
              {mode === 'login' ? 'Log In' : 'Send Reset Email'}
            </button>
          </form>

          <div className={styles.switchMode}>
            {mode === 'login' && (
              <>
                <button onClick={handleCreateAccount} className={styles.link}>
                  Create an account
                </button>
                <button
                  onClick={() => { setMode('reset'); resetForm(); }}
                  className={styles.link}
                >
                  Forgot password?
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button
                onClick={() => { setMode('login'); resetForm(); }}
                className={styles.link}
              >
                ← Back to login
              </button>
            )}
          </div>

          {status && <p className={styles.status}>{status}</p>}
        </div>
      </div>
    </>
  );
};

export default Login;
