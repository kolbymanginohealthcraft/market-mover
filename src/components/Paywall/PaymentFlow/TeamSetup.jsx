import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../app/supabaseClient';
import styles from './TeamSetup.module.css';

export default function TeamSetup() {
  const [teamName, setTeamName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('selected_plan')
        .eq('id', user.id)
        .single();
      if (data) {
        setSelectedPlan(data.selected_plan);
        setAccessCode(generateAccessCode());
      }
    };

    fetchUserProfile();
  }, []);

  const generateAccessCode = () => {
    return 'TEAM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert([
        {
          name: teamName,
          access_code: accessCode,
          tier: selectedPlan,
          max_users: selectedPlan === 'starter' ? 3 : selectedPlan === 'advanced' ? 10 : 25,
          created_by: user.id,
        }
      ])
      .select()
      .single();

    if (teamError) {
      setError(`❌ ${teamError.message}`);
      setSubmitting(false);
      return;
    }

    const { error: memberError } = await supabase
      .from('team_members')
      .insert([
        {
          team_id: team.id,
          user_id: user.id,
          role: 'admin',
        }
      ]);

    if (memberError) {
      setError(`❌ ${memberError.message}`);
      setSubmitting(false);
      return;
    }

    navigate('/dashboard');
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Create Your Team</h2>

      <div className={styles.form}>
        <label>Team Name</label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g. HealthCraft HQ"
        />

        <label>Access Code</label>
        <input
          type="text"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
        />

        <p className={styles.planNote}>
          You selected the <strong>{selectedPlan}</strong> plan.
        </p>

        <button onClick={handleSubmit} disabled={submitting || !teamName}>
          {submitting ? 'Creating Team...' : 'Finish Setup'}
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
