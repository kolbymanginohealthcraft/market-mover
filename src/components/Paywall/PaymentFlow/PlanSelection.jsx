import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import Spinner from '../../Buttons/Spinner';
import styles from './PaymentFlow.module.css';

export default function PlanSelection({ 
  selectedPlan, 
  setSelectedPlan, 
  billingCycle, 
  setBillingCycle, 
  onNext 
}) {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data: plansData, error } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      
      setPlans(plansData || []);
      
      // Set default plan if none selected
      if (!selectedPlan && plansData?.length > 0) {
        setSelectedPlan(plansData[0].name.toLowerCase());
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePlanSelect = (planName) => {
    setSelectedPlan(planName.toLowerCase());
    onNext();
  };

  return (
    <div className={styles.step}>
      <h2>Choose Your Plan</h2>
      <div className={styles.billingToggle}>
        <span>Monthly</span>
        <button
          className={`${styles.toggle} ${billingCycle === 'annual' ? styles.annual : ''}`}
          onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
        >
          <div className={styles.toggleHandle} />
        </button>
        <span>Annual <span className={styles.discount}>Save 20%</span></span>
      </div>

      {loadingPlans ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner />
          <p>Loading plans...</p>
        </div>
      ) : (
        <div className={styles.plansGrid}>
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.name.toLowerCase();
            const displayPrice = billingCycle === 'annual' 
              ? formatCurrency(plan.price_monthly * 12 * 0.8)
              : formatCurrency(plan.price_monthly);
            
            return (
              <div
                key={plan.id}
                className={`${styles.planCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => handlePlanSelect(plan.name)}
              >
                {plan.name === 'Advanced' && (
                  <div className={styles.popularBadge}>Most Popular</div>
                )}
                <h3>{plan.name}</h3>
                <div className={styles.price}>
                  {displayPrice}
                  <span>/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                </div>
                <ul>
                  <li>{plan.max_users} users included</li>
                  <li>{plan.description}</li>
                  <li>Extra users: +${plan.license_block_price || 250}/mo each</li>
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 