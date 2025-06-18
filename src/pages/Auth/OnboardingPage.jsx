import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OnboardingPage.module.css';
import ButtonGroup from '../../components/Buttons/ButtonGroup';
import Button from '../../components/Buttons/Button';
import { PLANS, calculatePrice, calculateSavings } from '../../data/planData';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState(null); // 'join' | 'create'

  const renderExplanation = () => {
    if (selectedPath === 'join') {
      return <p className={styles.explanation}>Use a team access code provided by your administrator to join an existing team.</p>;
    }
    if (selectedPath === 'create') {
      return <p className={styles.explanation}>Create your own team and choose a plan that fits your needs. You’ll be able to invite others later.</p>;
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Let’s get started</h2>
      <p className={styles.subtitle}>Choose your path:</p>

      <ButtonGroup
        options={[
          { label: 'Join a Team', value: 'join' },
          { label: 'Start a New Team', value: 'create' },
        ]}
        selected={selectedPath}
        onSelect={setSelectedPath}
        variant="blue"
        size="lg"
        fullWidth
      />

      {renderExplanation()}

      <div className={styles.formContainer}>
        {selectedPath === 'join' && <JoinTeamForm />}
        {selectedPath === 'create' && <PlanSelector />}
      </div>
    </div>
  );
}

function JoinTeamForm() {
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
    <div className={styles.formCard}>
      <h3>Enter your team’s access code</h3>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g. HEALTH123"
        className={styles.input}
      />
      <Button variant="blue" onClick={handleJoin}>
        Join Team
      </Button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

function PlanSelector() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const handleSelect = (planName) => {
    navigate(`/profile-setup?plan=${planName.toLowerCase()}`);
  };

  return (
    <>
      <div className={styles.toggleWrapper}>
        <span className={styles.toggleLabel}>Monthly</span>
        <button
          className={`${styles.toggleSwitch} ${billingCycle === 'annual' ? styles.annual : ''}`}
          onClick={() =>
            setBillingCycle((prev) => (prev === 'monthly' ? 'annual' : 'monthly'))
          }
          aria-label="Toggle billing cycle"
        >
          <div className={styles.toggleHandle} />
        </button>
        <span className={styles.toggleLabel}>
          Annual <span className={styles.discountNote}>– Save 20%</span>
        </span>
      </div>

      <div className={styles.grid}>
        {PLANS.map((plan) => {
          const displayPrice = calculatePrice(plan.amount, billingCycle);
          const savingsNote =
            billingCycle === 'annual' ? calculateSavings(plan.amount) : null;

          return (
            <div
              key={plan.name}
              className={`${styles.card} ${plan.popular ? styles.popular : ''}`}
            >
              {plan.popular && (
                <div className={styles.badge}>Most Popular</div>
              )}
              <h3>{plan.name}</h3>
              <div className={styles.priceRow}>
                <span className={styles.priceAnimated}>{displayPrice}</span>
                {savingsNote && (
                  <span className={styles.savingsInline}>({savingsNote})</span>
                )}
              </div>
              <ul>
                {plan.features.map((feat, i) => (
                  <li key={i}>{feat}</li>
                ))}
              </ul>
              <Button
                variant="green"
                size="lg"
                onClick={() => handleSelect(plan.name)}
              >
                Choose {plan.name}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}

