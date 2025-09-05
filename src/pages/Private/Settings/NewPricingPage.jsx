import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Users, CheckCircle } from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import { supabase } from '../../../app/supabaseClient';
import styles from './NewPricingPage.module.css';

import { PRICING_CONFIG, calculateBasePrice, calculateAdditionalCost, calculateTotal, calculateSavings } from '../../../utils/pricingConfig';

export default function NewPricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [additionalLicenses, setAdditionalLicenses] = useState(5); // Default to 5 users (1 license block)
  const [teamName, setTeamName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const navigate = useNavigate();

  // Use imported pricing calculation functions
  const getBasePrice = () => calculateBasePrice(billingCycle);
  const getAdditionalCost = () => {
    // Base plan includes 1 user, additional users start from 5
    const additionalUsers = Math.max(0, additionalLicenses - 5);
    return calculateAdditionalCost(additionalUsers, billingCycle);
  };
  const getTotal = () => {
    const additionalUsers = Math.max(0, additionalLicenses - 5);
    return calculateTotal(additionalUsers, billingCycle);
  };
  const getSavings = () => {
    const additionalUsers = Math.max(0, additionalLicenses - 5);
    return billingCycle === 'annual' ? calculateSavings(additionalUsers) : null;
  };

  const handleIncrementLicenses = () => {
    setAdditionalLicenses(prev => prev + PRICING_CONFIG.licenseBlockSize);
  };

  const handleDecrementLicenses = () => {
    setAdditionalLicenses(prev => Math.max(0, prev - PRICING_CONFIG.licenseBlockSize));
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const isFormValid = () => {
    return cardNumber.replace(/\s/g, '').length >= 13 &&
           expMonth && 
           expYear && 
           cvv.length >= 3;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setPaymentError('');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setPaymentError('Authentication failed. Please log in again.');
        setProcessing(false);
        return;
      }

      const totalAmount = getTotal();
      
      const response = await fetch(
        'https://ukuxibhujcozcwozljzf.supabase.co/functions/v1/process-payment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: cardNumber.replace(/\s/g, ''),
            expMonth: parseInt(expMonth),
            expYear: parseInt(expYear),
            cvv,
            amount: totalAmount.toFixed(2),
            companyType: 'Provider',
            planId: 'premium', // Single tier system
            billingCycle,
            additionalLicenses,
            userId: user.id
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      setPaymentSuccess(true);

    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.successContent}>
          <CheckCircle className={styles.successIcon} />
          <h2>Payment Successful!</h2>
          <p>Your subscription has been activated. You can now access all premium features.</p>
          <Button
            variant="blue"
            size="lg"
            onClick={() => navigate('/app/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Upgrade to {PRICING_CONFIG.planName}</h1>
        <p>{PRICING_CONFIG.planDescription}</p>
      </div>

              <div className={styles.content}>
          <div className={styles.pricingSection}>
            <div className={styles.pricingCard}>
              <h3>{PRICING_CONFIG.planName} Plan</h3>
              
              {/* Billing Toggle - Moved to top of pricing card */}
              <div className={styles.billingToggle}>
                <span className={billingCycle === 'monthly' ? styles.active : ''}>Monthly</span>
                <button
                  className={`${styles.toggleSwitch} ${billingCycle === 'annual' ? styles.annual : ''}`}
                  onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                  aria-label="Toggle billing cycle"
                >
                  <div className={styles.toggleHandle} />
                </button>
                <span className={billingCycle === 'annual' ? styles.active : ''}>
                  Annual <span className={styles.discountNote}>(20% off)</span>
                </span>
              </div>

              <div className={styles.priceDisplay}>
                <div className={styles.priceAmount}>
                  ${billingCycle === 'annual' ? getBasePrice().toLocaleString() : PRICING_CONFIG.basePrice.toLocaleString()}
                </div>
                <div className={styles.pricePeriod}>
                  /{billingCycle === 'annual' ? 'year' : 'month'}
                </div>
              </div>
              
              {billingCycle === 'annual' && (
                <div className={styles.savings}>
                  Save ${getSavings().toLocaleString()} annually
                </div>
              )}

              <div className={styles.features}>
                {PRICING_CONFIG.features.map((feature, index) => (
                  <div key={index} className={styles.feature}>
                    <CheckCircle />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        <form onSubmit={handleSubmit} className={styles.paymentForm}>

          <div className={styles.formSection}>
            <h3>Team Size</h3>
            <div className={styles.licenseSelector}>
              <div className={styles.licenseInfo}>
                <span>Total Users: {additionalLicenses + 1} user{additionalLicenses + 1 !== 1 ? 's' : ''}</span>
                <span className={styles.licensePrice}>
                  Base plan includes 1 user, +${PRICING_CONFIG.additionalLicensePrice}/mo per {PRICING_CONFIG.licenseBlockSize} additional users
                </span>
              </div>
              <div className={styles.licenseControls}>
                <button
                  type="button"
                  onClick={handleDecrementLicenses}
                  disabled={additionalLicenses === 5}
                  className={styles.licenseButton}
                >
                  -
                </button>
                <span className={styles.licenseCount}>{additionalLicenses + 1}</span>
                <button
                  type="button"
                  onClick={handleIncrementLicenses}
                  className={styles.licenseButton}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Payment Information</h3>
            <div className={styles.inputGroup}>
              <label htmlFor="cardNumber">Card Number</label>
              <input
                id="cardNumber"
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                required
              />
            </div>
            
            <div className={styles.cardDetails}>
              <div className={styles.inputGroup}>
                <label htmlFor="expMonth">Exp Month</label>
                <select
                  id="expMonth"
                  value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value)}
                  required
                >
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {String(i + 1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="expYear">Exp Year</label>
                <select
                  id="expYear"
                  value={expYear}
                  onChange={(e) => setExpYear(e.target.value)}
                  required
                >
                  <option value="">YYYY</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="cvv">CVV</label>
                <input
                  id="cvv"
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  maxLength="4"
                  required
                />
              </div>
            </div>
          </div>

          {paymentError && (
            <div className={styles.errorMessage}>
              {paymentError}
            </div>
          )}

          <div className={styles.orderSummary}>
            <h3>Order Summary</h3>
            <div className={styles.summaryRow}>
              <span>{PRICING_CONFIG.planName} Plan (1 user)</span>
              <span>${billingCycle === 'annual' ? getBasePrice().toLocaleString() : PRICING_CONFIG.basePrice.toLocaleString()}</span>
            </div>
            {additionalLicenses > 5 && (
              <div className={styles.summaryRow}>
                <span>Additional Users ({additionalLicenses - 5})</span>
                <span>${getAdditionalCost().toLocaleString()}</span>
              </div>
            )}
            <div className={styles.summaryDivider} />
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>${getTotal().toLocaleString()}</span>
            </div>
            <div className={styles.summaryPeriod}>
              {billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly'}
            </div>
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            disabled={!isFormValid() || processing}
            className={styles.submitButton}
          >
            {processing ? (
              <>
                <Spinner size="sm" />
                Processing...
              </>
            ) : (
              `Complete Payment - $${getTotal().toLocaleString()}`
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
