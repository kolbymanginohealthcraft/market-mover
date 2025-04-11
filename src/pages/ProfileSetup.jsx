// src/pages/ProfileSetup.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from '../styles/AuthForm.module.css';

function ProfileSetup() {
  const navigate = useNavigate();
  const firstNameRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    title: '',
  });

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setUserId(data.user.id);
      } else {
        setErrorMsg('User session not available. Please log in again.');
      }
    };

    fetchUser();
    firstNameRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!userId) {
      setErrorMsg('User session not available. Please log in again.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        company: formData.company,
        title: formData.title,
      })
      .eq('id', userId);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    navigate('/home');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Complete Your Profile</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>First Name</label>
            <input
              className={styles.input}
              name="firstName"
              ref={firstNameRef}
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Last Name</label>
            <input
              className={styles.input}
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Company</label>
            <input
              className={styles.input}
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Job Title</label>
            <input
              className={styles.input}
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {errorMsg && <p className={styles.error}>{errorMsg}</p>}

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Finish Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;
