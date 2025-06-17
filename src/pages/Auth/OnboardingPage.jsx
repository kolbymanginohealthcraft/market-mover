// OnboardingPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OnboardingPage.module.css';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('intro');

  const handlePathSelect = (path) => {
    if (path === 'join') setStep('join');
    if (path === 'create') setStep('create');
    if (path === 'free') {
      navigate('/app/home');
    }
  };

  return (
    <div className={styles.container}>
      {step === 'intro' && (
        <>
          <h2>How would you like to get started?</h2>
          <div className={styles.options}>
            <button onClick={() => handlePathSelect('join')}>🔑 Join a Team</button>
            <button onClick={() => handlePathSelect('create')}>🚀 Start a New Team</button>
            <button onClick={() => handlePathSelect('free')}>👀 Explore for Free</button>
          </div>
        </>
      )}

      {step === 'join' && <JoinTeamForm onBack={() => setStep('intro')} />}
      {step === 'create' && <CreateTeamForm onBack={() => setStep('intro')} />}
    </div>
  );
}

// ⬇️ Paste these two below ⬇️

function JoinTeamForm({ onBack }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);

  const handleJoin = async () => {
    const res = await fetch('/api/join-team', {
      method: 'POST',
      body: JSON.stringify({ code }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (res.ok) {
      window.location.href = '/app/home';
    } else {
      setError(data.error || 'Invalid access code.');
    }
  };

  return (
    <div>
      <h3>Enter your team’s access code</h3>
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. HEALTH123" />
      <button onClick={handleJoin}>Join Team</button>
      <button onClick={onBack}>Back</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function CreateTeamForm({ onBack }) {
  const [teamName, setTeamName] = useState('');
  const [tier, setTier] = useState('starter');
  const [seats, setSeats] = useState(5);

  const handleContinue = () => {
    const query = new URLSearchParams({ teamName, tier, seats }).toString();
    window.location.href = `/payment?${query}`;
  };

  return (
    <div>
      <h3>Create a New Team</h3>
      <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team Name" />
      <select value={tier} onChange={(e) => setTier(e.target.value)}>
        <option value="starter">Starter (5 users)</option>
        <option value="advanced">Advanced (10 users)</option>
        <option value="pro">Pro (15 users)</option>
      </select>
      <input
        type="number"
        min={1}
        max={15}
        value={seats}
        onChange={(e) => setSeats(Number(e.target.value))}
        placeholder="Number of Seats"
      />
      <button onClick={handleContinue}>Continue to Payment</button>
      <button onClick={onBack}>Back</button>
    </div>
  );
}
