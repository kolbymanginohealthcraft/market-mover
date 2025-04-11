// src/pages/UserProfile.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import styles from '../styles/AuthForm.module.css';

export default function UserProfile() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    company: '',
    title: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not found:', userError);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, company, title')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('No profile found, or error loading profile:', error.message);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...profile,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving profile:', error.message);
      setMessage(`❌ Error saving profile: ${error.message}`);
    } else {
      setMessage('✅ Profile updated successfully');
    }

    setSaving(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Edit Your Profile</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.formGroup}>
              <label className={styles.label}>First Name</label>
              <input
                className={styles.input}
                name="first_name"
                value={profile.first_name}
                onChange={handleChange}
                type="text"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Last Name</label>
              <input
                className={styles.input}
                name="last_name"
                value={profile.last_name}
                onChange={handleChange}
                type="text"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Company</label>
              <input
                className={styles.input}
                name="company"
                value={profile.company}
                onChange={handleChange}
                type="text"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Job Title</label>
              <input
                className={styles.input}
                name="title"
                value={profile.title}
                onChange={handleChange}
                type="text"
              />
            </div>

            <button className={styles.button} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>

            {message && <p className={styles.error}>{message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
