import React, { useState } from 'react';
import styles from './PricingPage.module.css';
import Button from '../../components/Buttons/Button';
import { usePlans } from '../../hooks/usePlans';
import Spinner from '../../components/Buttons/Spinner';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { plans, loading, error } = usePlans();

  const calculatePrice = (amount) => {
    if (!amount) return '$0/mo';
    if (billingCycle === 'monthly') return `$${amount.toLocaleString()}/mo`;
    const annual = amount * 12 * 0.8;
    return `$${annual.toLocaleString()}/yr`;
  };

  const calculateSavings = (amount) => {
    if (!amount) return null;
    const savings = amount * 12 * 0.2;
    return `$${savings.toLocaleString()} saved`;
  };

  // Navigation disabled - plan selection functionality removed
  // const handleSelect = (planName) => {
  //   navigate(`/profile-setup?plan=${planName.toLowerCase()}`);
  // };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Spinner />
          <p>Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2>Error Loading Plans</h2>
          <p>{error}</p>
          <p>Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

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
        {plans.map((plan) => {
          const displayPrice = calculatePrice(plan.price_monthly);
          const savingsNote =
            billingCycle === 'annual' ? calculateSavings(plan.price_monthly) : null;

          return (
            <div
              key={plan.id}
              className={`${styles.card} ${plan.name === 'Advanced' ? styles.popular : ''}`}
            >
              {plan.badge && <div className={styles.badge}>{plan.badge}</div>}
              <h2>{plan.name}</h2>
              <div className={styles.priceRow}>
                <span key={billingCycle} className={styles.priceAnimated}>
                  {displayPrice}
                </span>
                {savingsNote && (
                  <span className={styles.savingsInline}>({savingsNote})</span>
                )}
              </div>
              <ul>
                {plan.features && plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <Button
                variant="green"
                size="lg"
                disabled
                style={{ marginTop: 'auto' }}
              >
                Coming Soon
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
            disabled
          >
            Coming Soon
          </Button>
        </p>
      </div>
    </div>
  );
}
