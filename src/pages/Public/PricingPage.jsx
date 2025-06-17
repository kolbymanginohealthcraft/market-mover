import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PricingPage.module.css';
import Button from '../../components/Buttons/Button';

const BASE_PLANS = {
  Starter: 2500,
  Advanced: 3750,
  Pro: 5750,
};

const FREE_PLAN = {
  name: 'Free',
  price: '$0/mo',
};

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();

  const calculatePrice = (amount) => {
    if (billingCycle === 'monthly') return `$${amount.toLocaleString()}/mo`;
    const annual = amount * 12 * 0.8;
    return `$${annual.toLocaleString()}/yr`;
  };

  const calculateSavings = (amount) => {
    const savings = amount * 12 * 0.2;
    return `$${savings.toLocaleString()} saved`;
  };

  const handleSelect = (planName) => {
    navigate(`/profile-setup?plan=${planName.toLowerCase()}`);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Flexible Plans for Teams of All Sizes</h1>

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
        {Object.entries(BASE_PLANS).map(([planName, amount]) => {
          const displayPrice = calculatePrice(amount);
          const savingsNote =
            billingCycle === 'annual' ? calculateSavings(amount) : null;

          return (
            <div
              key={planName}
              className={`${styles.card} ${planName === 'Advanced' ? styles.popular : ''}`}
            >
              {planName === 'Advanced' && (
                <div className={styles.badge}>Most Popular</div>
              )}
              <h2>{planName}</h2>
              <div className={styles.priceRow}>
                <span key={billingCycle} className={styles.priceAnimated}>
                  {displayPrice}
                </span>
                {savingsNote && (
                  <span className={styles.savingsInline}>({savingsNote})</span>
                )}
              </div>
              <ul>
                {planName === 'Starter' && (
                  <>
                    <li>Includes 5 users</li>
                    <li>Basic provider search</li>
                    <li>Summary analytics</li>
                    <li>Email support</li>
                    <li>Extra 5 users: +$250/mo</li>
                  </>
                )}
                {planName === 'Advanced' && (
                  <>
                    <li>Includes 10 users</li>
                    <li>Full provider profiles</li>
                    <li>Save & export data</li>
                    <li>Priority support</li>
                    <li>Extra 5 users: +$250/mo</li>
                  </>
                )}
                {planName === 'Pro' && (
                  <>
                    <li>Includes 10 users</li>
                    <li>Custom analytics dashboard</li>
                    <li>Team collaboration tools</li>
                    <li>Dedicated account manager</li>
                    <li>Extra 5 users: +$250/mo</li>
                  </>
                )}
              </ul>
              <Button
                variant="green"
                size="lg"
                onClick={() => handleSelect(planName)}
                style={{ marginTop: 'auto' }}
              >
                Choose {planName}
              </Button>
            </div>
          );
        })}
      </div>

      <div className={styles.freeRowMinimal}>
        <p>
          Just exploring?{' '}
          <Button
            variant="blue"
            outline
            size="sm"
            className={styles.linkButton}
            onClick={() => handleSelect(FREE_PLAN.name)}
          >
            Try the Free Version
          </Button>
        </p>
      </div>
    </div>
  );
}
