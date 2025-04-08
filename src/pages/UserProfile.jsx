import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import styles from './UserProfile.module.css';

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

  // Load profile on mount
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

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Save profile to Supabase
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
      setMessage(`❌ Error saving profile: ${error.message}`); // update this line
    } else {
      setMessage('✅ Profile updated successfully');
    }

    setSaving(false);
  };

  return (
    <div className={styles.container}>
      <h2>Edit Your Profile</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <label>
            First Name
            <input
              name="first_name"
              value={profile.first_name}
              onChange={handleChange}
              type="text"
              required
            />
          </label>

          <label>
            Last Name
            <input
              name="last_name"
              value={profile.last_name}
              onChange={handleChange}
              type="text"
              required
            />
          </label>

          <label>
            Company
            <input
              name="company"
              value={profile.company}
              onChange={handleChange}
              type="text"
            />
          </label>

          <label>
            Title
            <input
              name="title"
              value={profile.title}
              onChange={handleChange}
              type="text"
            />
          </label>

          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>

          {message && <p className={styles.message}>{message}</p>}
        </form>
      )}
    </div>
  );
}
