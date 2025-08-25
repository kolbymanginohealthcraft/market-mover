import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePlans } from '../../../hooks/usePlans';
import { supabase } from '../../../app/supabaseClient';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import { CreditCard, Users, Calendar, CheckCircle } from 'lucide-react';
import styles from './PaymentForm.module.css';

export default function PaymentForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { plans, loading: plansLoading } = usePlans();
  
  // Plan details from URL params
  const selectedPlan = parseInt(searchParams.get('plan') || '0');
  const billingCycle = searchParams.get('cycle') || 'monthly';
  const additionalLicenses = parseInt(searchParams.get('seats') || '0');
  
  // Step navigation
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Form state
  const [teamName, setTeamName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Validate form
  const isFormValid = () => {
    if (currentStep === 1) {
      return teamName.trim();
    }
    return teamName.trim() && 
           cardNumber.replace(/\s/g, '').length >= 13 &&
           expMonth && 
           expYear && 
           cvv.length >= 3;
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

  const calculateTotal = () => {
    if (!plans || selectedPlan === null) return 0;
    
    const plan = plans[selectedPlan];
    let basePrice = plan.price_monthly || 0;
    
    if (billingCycle === 'annual') {
      basePrice = basePrice * 12 * 0.8; // 20% discount
    }
    
    // Additional licenses cost
    const licenseBlockPrice = plans[0]?.license_block_price || 250;
    const additionalCost = additionalLicenses > 0 
      ? (additionalLicenses / 5) * licenseBlockPrice * (billingCycle === 'annual' ? 12 * 0.8 : 1)
      : 0;
    
    return basePrice + additionalCost;
  };

  const getPlanName = () => {
    const planNames = ['Starter', 'Advanced', 'Pro'];
    return planNames[selectedPlan] || 'Unknown';
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('Authentication failed. Please log in again.');
        setProcessing(false);
        return;
      }

      const totalAmount = calculateTotal();
      
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
            teamName,
            companyType: 'Provider', // Default value
            planId: selectedPlan,
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

      // Payment successful - show success state
      setPaymentSuccess(true);
      setCurrentStep(3);

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (plansLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <Spinner />
          <p>Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Step Navigation */}
      <div className={styles.stepNavigation}>
        <div className={styles.stepTabs}>
          <div className={`${styles.stepTab} ${currentStep >= 1 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepLabel}>Team Setup</div>
          </div>
          <div className={styles.stepDivider} />
          <div className={`${styles.stepTab} ${currentStep >= 2 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepLabel}>Payment</div>
          </div>
          <div className={styles.stepDivider} />
          <div className={`${styles.stepTab} ${currentStep >= 3 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepLabel}>Complete</div>
          </div>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.twoColumnLayout}>
          {/* Left Column - Form */}
          <div className={styles.leftColumn}>
            <form onSubmit={handleSubmit} className={styles.paymentForm}>
              {/* Step 1: Team Setup */}
              {currentStep === 1 && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Team Information</h3>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="teamName">Team Name *</label>
                    <input
                      id="teamName"
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter your team name"
                      required
                      className={styles.input}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Payment Information */}
              {currentStep === 2 && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Payment Information</h3>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="cardNumber">Card Number *</label>
                    <input
                      id="cardNumber"
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                      className={styles.input}
                    />
                  </div>
                  
                  <div className={styles.cardDetails}>
                    <div className={styles.formGroup}>
                      <label htmlFor="expMonth">Expiry Month *</label>
                      <select
                        id="expMonth"
                        value={expMonth}
                        onChange={(e) => setExpMonth(e.target.value)}
                        required
                        className={styles.select}
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month.toString().padStart(2, '0')}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="expYear">Expiry Year *</label>
                      <select
                        id="expYear"
                        value={expYear}
                        onChange={(e) => setExpYear(e.target.value)}
                        required
                        className={styles.select}
                      >
                        <option value="">YYYY</option>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="cvv">CVV *</label>
                      <input
                        id="cvv"
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        maxLength="4"
                        required
                        className={styles.input}
                      />
                    </div>
                  </div>
                                 </div>
               )}

               {/* Step 3: Success */}
               {currentStep === 3 && paymentSuccess && (
                 <div className={styles.successSection}>
                   <div className={styles.successIcon}>
                     <CheckCircle size={64} />
                   </div>
                   
                   <h3 className={styles.successTitle}>Welcome to Market Mover!</h3>
                   <p className={styles.successSubtitle}>
                     Your team has been created successfully and your payment has been processed.
                   </p>
                   
                   <div className={styles.successDetails}>
                     <div className={styles.successDetailItem}>
                       <span className={styles.detailLabel}>Team Name:</span>
                       <span className={styles.detailValue}>{teamName}</span>
                     </div>
                     
                     <div className={styles.successDetailItem}>
                       <span className={styles.detailLabel}>Plan:</span>
                       <span className={styles.detailValue}>{getPlanName()}</span>
                     </div>
                     
                     <div className={styles.successDetailItem}>
                       <span className={styles.detailLabel}>Amount Paid:</span>
                       <span className={styles.detailValue}>${calculateTotal().toFixed(2)}</span>
                     </div>
                   </div>
                   
                   <div className={styles.successActions}>
                     <Button
                       onClick={() => navigate('/app/dashboard')}
                       variant="blue"
                       className={styles.successButton}
                     >
                       Go to Dashboard
                     </Button>
                   </div>
                 </div>
               )}
 
               {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className={styles.navigationButtons}>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="gray"
                    onClick={handleBack}
                    className={styles.backButton}
                  >
                    Back
                  </Button>
                )}
                
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    variant="blue"
                    onClick={handleNext}
                    disabled={!isFormValid()}
                    className={styles.nextButton}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="blue"
                    disabled={!isFormValid() || processing}
                    className={styles.submitButton}
                  >
                    {processing ? (
                      <>
                        <Spinner size={16} />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} />
                        Complete Purchase
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className={styles.rightColumn}>
            <div className={styles.orderSummary}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>
              
              <div className={styles.summaryItem}>
                <span className={styles.itemLabel}>Plan</span>
                <span className={styles.itemValue}>{getPlanName()}</span>
              </div>
              
              <div className={styles.summaryItem}>
                <span className={styles.itemLabel}>Billing Cycle</span>
                <span className={styles.itemValue}>
                  <Calendar size={14} />
                  {billingCycle === 'annual' ? 'Annual (20% off)' : 'Monthly'}
                </span>
              </div>
              
              {additionalLicenses > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.itemLabel}>Additional Users</span>
                  <span className={styles.itemValue}>
                    <Users size={14} />
                    +{additionalLicenses} users
                  </span>
                </div>
              )}
              
              <div className={styles.summaryTotal}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalAmount}>
                  ${calculateTotal().toFixed(2)}
                  <span className={styles.billingPeriod}>
                    /{billingCycle === 'annual' ? 'year' : 'month'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
