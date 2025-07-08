import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PricingPage.module.css';
import Button from '../../components/Buttons/Button';
import { PLANS } from '../../data/planData'; // ✅ Shared plan data

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
        {PLANS.map(({ id, name, basePrice, features, badge }) => {
          const displayPrice = calculatePrice(basePrice);
          const savingsNote =
            billingCycle === 'annual' ? calculateSavings(basePrice) : null;

          return (
            <div
              key={id}
              className={`${styles.card} ${name === 'Advanced' ? styles.popular : ''}`}
            >
              {badge && <div className={styles.badge}>{badge}</div>}
              <h2>{name}</h2>
              <div className={styles.priceRow}>
                <span key={billingCycle} className={styles.priceAnimated}>
                  {displayPrice}
                </span>
                {savingsNote && (
                  <span className={styles.savingsInline}>({savingsNote})</span>
                )}
              </div>
              <ul>
                {features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <Button
                variant="green"
                size="lg"
                onClick={() => handleSelect(name)}
                style={{ marginTop: 'auto' }}
              >
                Choose {name}
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
            onClick={() => handleSelect('Free')}
          >
            Try the Free Version
          </Button>
        </p>
      </div>
    </div>
  );
}
