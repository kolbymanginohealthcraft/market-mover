import React, { useState } from 'react';
import styles from './PricingPage.module.css';
import Button from '../../../components/Buttons/Button';
import { usePlans } from '../../../hooks/usePlans';
import Spinner from '../../../components/Buttons/Spinner';
import { featureMatrix, planDescriptions } from './pricingMatrix.js';
import { supabase } from '../../../app/supabaseClient';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [additionalLicenses, setAdditionalLicenses] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
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

  const calculateTotalAnnualSavings = () => {
    if (selectedPlan === null) return null;
    const plan = plans?.[selectedPlan];
    if (!plan) return null;
    
    // Base plan savings
    const basePlanSavings = (plan.price_monthly || 0) * 12 * 0.2;
    
    // Additional licenses savings
    const licenseBlockPrice = plans?.[0]?.license_block_price || 250;
    const additionalLicensesSavings = additionalLicenses > 0 
      ? ((additionalLicenses / 5) * licenseBlockPrice) * 12 * 0.2
      : 0;
    
    const totalSavings = basePlanSavings + additionalLicensesSavings;
    return `$${totalSavings.toLocaleString()} saved`;
  };

  const calculateAdditionalCost = () => {
    const licenseBlockPrice = plans?.[0]?.license_block_price || 250;
    const additionalCost = (additionalLicenses / 5) * licenseBlockPrice;
    if (billingCycle === 'annual') {
      return additionalCost * 12 * 0.8;
    }
    return additionalCost;
  };

  const handleIncrementLicenses = () => {
    setAdditionalLicenses(prev => prev + 5);
  };

  const handleDecrementLicenses = () => {
    setAdditionalLicenses(prev => Math.max(0, prev - 5));
  };

  const handlePlanSelect = (planIndex) => {
    setSelectedPlan(planIndex);
  };

  const getSelectedPlanPrice = () => {
    if (selectedPlan === null) return 0;
    const plan = plans?.[selectedPlan];
    if (!plan) return 0;
    
    let basePrice = plan.price_monthly || 0;
    if (billingCycle === 'annual') {
      basePrice = basePrice * 12 * 0.8;
    }
    
    const additionalCost = calculateAdditionalCost();
    return basePrice + additionalCost;
  };

  const getSelectedPlanPriceDisplay = () => {
    if (selectedPlan === null) return 0;
    const plan = plans?.[selectedPlan];
    if (!plan) return 0;
    
    let basePrice = plan.price_monthly || 0;
    if (billingCycle === 'annual') {
      basePrice = basePrice * 12 * 0.8;
    }
    
    return basePrice;
  };

  const getTotalPriceDisplay = () => {
    if (selectedPlan === null) return 0;
    const plan = plans?.[selectedPlan];
    if (!plan) return 0;
    
    let basePrice = plan.price_monthly || 0;
    if (billingCycle === 'annual') {
      basePrice = basePrice * 12 * 0.8;
    }
    
    const additionalCost = calculateAdditionalCost();
    const total = basePrice + additionalCost;
    
    if (billingCycle === 'monthly') {
      return `$${total.toLocaleString()}/mo`;
    } else {
      return `$${total.toLocaleString()}/yr`;
    }
  };

  const getSelectedPlanMaxUsers = () => {
    if (selectedPlan === null) return 0;
    const plan = plans?.[selectedPlan];
    return plan?.max_users || 0;
  };

  const handleCheckout = async () => {
    if (selectedPlan === null) {
      alert('Please select a plan first');
      return;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      alert('Please log in to continue');
      return;
    }

    const user_id = data.user.id;
    
    // Map plan index to price_id (you'll need to update these based on your actual Stripe price IDs)
    const planPriceIds = {
      0: 'starter_mock', // Starter plan
      1: 'advanced_mock', // Advanced plan  
      2: 'pro_mock' // Pro plan
    };

    const price_id = planPriceIds[selectedPlan];
    if (!price_id) {
      alert('Invalid plan selected');
      return;
    }

    try {
      const res = await fetch(
        'https://ukuxibhujcozcwozljzf.supabase.co/functions/v1/create-checkout-session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id, 
            price_id,
            billing_cycle: billingCycle,
            additional_licenses: additionalLicenses
          }),
        }
      );

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        alert('Error creating checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error processing checkout. Please try again.');
    }
  };

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
      {/* Hero Banner Section */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>Pricing Options</h1>
            <p className={styles.heroSubtitle}>
              Flexible plans for teams of all sizes
            </p>
          </div>
          <div className={styles.heroActions}>
            <div className={styles.toggleWrapper}>
              <span className={`${styles.toggleLabel} ${billingCycle === 'monthly' ? styles.active : ''}`}>
                Monthly Billing
              </span>
              <button
                className={`${styles.toggleSwitch} ${billingCycle === 'annual' ? styles.annual : ''}`}
                onClick={() =>
                  setBillingCycle((prev) => (prev === 'monthly' ? 'annual' : 'monthly'))
                }
                aria-label="Toggle billing cycle"
              >
                <div className={styles.toggleHandle} />
              </button>
              <span className={`${styles.toggleLabel} ${billingCycle === 'annual' ? styles.active : ''}`}>
                Annual Billing <span className={styles.discountNote}>(Saves 20%)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className={styles.twoColumnLayout}>
        {/* Left Column - Pricing Matrix */}
        <div className={styles.leftColumn}>
          <div className={styles.pricingMatrix}>
            <div className={styles.matrixTable}>
              <div className={styles.matrixHeader}>
                <div className={styles.matrixFeature}>Feature</div>
                <div className={`${styles.matrixPlan} ${selectedPlan === 0 ? styles.selectedPlan : ''}`}>
                  <div className={styles.planName}>{planDescriptions.starter.name}</div>
                  <div className={styles.planDescription}>{planDescriptions.starter.description}</div>
                </div>
                <div className={`${styles.matrixPlan} ${selectedPlan === 1 ? styles.selectedPlan : ''}`}>
                  <div className={styles.planName}>{planDescriptions.advanced.name}</div>
                  <div className={styles.planDescription}>{planDescriptions.advanced.description}</div>
                </div>
                <div className={`${styles.matrixPlan} ${selectedPlan === 2 ? styles.selectedPlan : ''}`}>
                  <div className={styles.planName}>{planDescriptions.pro.name}</div>
                  <div className={styles.planDescription}>{planDescriptions.pro.description}</div>
                </div>
              </div>
              {featureMatrix.map((row, index) => (
                <div key={index} className={styles.matrixRow}>
                  <div className={styles.matrixFeature}>
                    {row.feature}
                  </div>
                  <div className={`${styles.matrixCell} ${row.type === 'price' ? styles.priceCell : ''} ${selectedPlan === 0 ? styles.selectedCell : ''}`}>
                    {row.feature === 'Price' ? (
                      <div className={styles.priceDisplay}>
                        <div className={styles.priceAmount}>
                          {calculatePrice(plans?.[0]?.price_monthly || 0)}
                        </div>
                        {billingCycle === 'annual' && (
                          <div className={styles.savingsAmount}>
                            {calculateSavings(plans?.[0]?.price_monthly || 0)}
                          </div>
                        )}
                      </div>
                    ) : row.feature === 'Team Members' ? (
                      <div className={styles.teamMembersDisplay}>
                        <div className={styles.baseMembers}>
                          {plans?.[0]?.max_users || 3}
                        </div>
                      </div>
                    ) : row.feature === 'Saved Markets' ? (
                      plans?.[0]?.saved_markets || row.starter
                    ) : row.feature === 'Available Filters' ? (
                      row.starter
                    ) : row.feature === 'Provider Contact Info' ? (
                      row.starter
                    ) : row.feature === 'AI Marketing Assistant' ? (
                      row.starter
                    ) : (
                      row.starter
                    )}
                  </div>
                  <div className={`${styles.matrixCell} ${row.type === 'price' ? styles.priceCell : ''} ${selectedPlan === 1 ? styles.selectedCell : ''}`}>
                    {row.feature === 'Price' ? (
                      <div className={styles.priceDisplay}>
                        <div className={styles.priceAmount}>
                          {calculatePrice(plans?.[1]?.price_monthly || 0)}
                        </div>
                        {billingCycle === 'annual' && (
                          <div className={styles.savingsAmount}>
                            {calculateSavings(plans?.[1]?.price_monthly || 0)}
                          </div>
                        )}
                      </div>
                    ) : row.feature === 'Team Members' ? (
                      <div className={styles.teamMembersDisplay}>
                        <div className={styles.baseMembers}>
                          {plans?.[1]?.max_users || 10}
                        </div>
                      </div>
                    ) : row.feature === 'Saved Markets' ? (
                      plans?.[1]?.saved_markets || row.advanced
                    ) : row.feature === 'Available Filters' ? (
                      row.advanced
                    ) : row.feature === 'Provider Contact Info' ? (
                      row.advanced
                    ) : row.feature === 'AI Marketing Assistant' ? (
                      row.advanced
                    ) : (
                      row.advanced
                    )}
                  </div>
                  <div className={`${styles.matrixCell} ${row.type === 'price' ? styles.priceCell : ''} ${selectedPlan === 2 ? styles.selectedCell : ''}`}>
                    {row.feature === 'Price' ? (
                      <div className={styles.priceDisplay}>
                        <div className={styles.priceAmount}>
                          {calculatePrice(plans?.[2]?.price_monthly || 0)}
                        </div>
                        {billingCycle === 'annual' && (
                          <div className={styles.savingsAmount}>
                            {calculateSavings(plans?.[2]?.price_monthly || 0)}
                          </div>
                        )}
                      </div>
                    ) : row.feature === 'Team Members' ? (
                      <div className={styles.teamMembersDisplay}>
                        <div className={styles.baseMembers}>
                          {plans?.[2]?.max_users || 30}
                        </div>
                      </div>
                    ) : row.feature === 'Saved Markets' ? (
                      plans?.[2]?.saved_markets || row.pro
                    ) : row.feature === 'Available Filters' ? (
                      row.pro
                    ) : row.feature === 'Provider Contact Info' ? (
                      row.pro
                    ) : row.feature === 'AI Marketing Assistant' ? (
                      row.pro
                    ) : (
                      row.pro
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Running Total and Checkout */}
        <div className={styles.rightColumn}>
          <div className={styles.orderSummary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            
            {/* Plan Selection Line Item */}
            <div className={styles.lineItem}>
              <div className={styles.planGroup}>
                <span className={styles.itemLabel}>Plan</span>
                <select 
                  value={selectedPlan !== null ? selectedPlan : ''} 
                  onChange={(e) => handlePlanSelect(parseInt(e.target.value))}
                  className={styles.planSelect}
                >
                  <option value="">Choose a plan...</option>
                  <option value="0">Starter</option>
                  <option value="1">Advanced</option>
                  <option value="2">Pro</option>
                </select>
              </div>
              {selectedPlan !== null && selectedPlan !== undefined && (
                <span className={styles.itemPrice}>
                  {billingCycle === 'annual' 
                    ? `$${((plans?.[selectedPlan]?.price_monthly || 0) * 12).toLocaleString()}/yr`
                    : `$${(plans?.[selectedPlan]?.price_monthly || 0).toLocaleString()}/mo`
                  }
                </span>
              )}
            </div>

            {selectedPlan !== null && selectedPlan !== undefined && (
              <>

                {/* Number of Users Line Item */}
                <div className={styles.lineItem}>
                  <div className={styles.itemLabelWithControls}>
                    <div className={styles.usersGroup}>
                      <span className={styles.itemLabel}>Users</span>
                      <span className={styles.defaultUsers}>
                        ({getSelectedPlanMaxUsers()} included)
                      </span>
                      <span className={styles.addMoreLabel}>Add more?</span>
                      <div className={styles.licenseControls}>
                        <button 
                          className={styles.licenseBtn}
                          onClick={handleDecrementLicenses}
                          disabled={additionalLicenses === 0}
                        >
                          -5
                        </button>
                        <button 
                          className={styles.licenseBtn}
                          onClick={handleIncrementLicenses}
                        >
                          +5
                        </button>
                      </div>
                      {additionalLicenses > 0 && (
                        <div className={styles.licenseInfo}>
                          <span className={styles.licenseCount}>
                            {additionalLicenses} users added (total {getSelectedPlanMaxUsers() + additionalLicenses})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={styles.itemPrice}>
                    {additionalLicenses > 0 
                      ? billingCycle === 'monthly'
                        ? `$${calculateAdditionalCost().toLocaleString()}/mo`
                        : `$${((additionalLicenses / 5) * (plans?.[0]?.license_block_price || 250) * 12).toLocaleString()}/yr`
                      : billingCycle === 'monthly' ? '$0/mo' : '$0/yr'
                    }
                  </span>
                </div>

                {billingCycle === 'annual' && (
                  <div className={styles.lineItem}>
                    <span className={styles.itemLabel}>Annual Savings</span>
                    <span className={styles.itemPrice}>
                      -${(
                        // Calculate 20% of the total annual amount (plan + licenses)
                        ((plans?.[selectedPlan]?.price_monthly || 0) * 12 +
                         ((additionalLicenses / 5) * (plans?.[0]?.license_block_price || 250) * 12)) * 0.2
                      ).toLocaleString()}/yr
                    </span>
                  </div>
                )}

                <div className={styles.summaryTotal}>
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.totalPrice}>
                    {getTotalPriceDisplay()}
                  </span>
                </div>

                <Button
                  onClick={handleCheckout}
                  className={styles.checkoutButton}
                  variant="primary"
                >
                  Proceed to Checkout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}