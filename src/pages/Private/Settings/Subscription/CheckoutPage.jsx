import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Users, Calendar, Check, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '../../../../app/supabaseClient';
import Button from '../../../../components/Buttons/Button';
import Spinner from '../../../../components/Buttons/Spinner';
import SectionHeader from '../../../../components/Layouts/SectionHeader';
import styles from './CheckoutPage.module.css';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState('monthly');
  const [licenseQuantity, setLicenseQuantity] = useState(5);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [processing, setProcessing] = useState(false);

  const checkoutType = searchParams.get('type') || 'new'; // 'new', 'upgrade', 'add-licenses'
  const currentPlan = searchParams.get('plan') || 'starter';

  useEffect(() => {
    fetchUserData();
  }, [checkoutType]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("team_id, role")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      if (profileData.team_id) {
        // Fetch team data
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("name, max_users")
          .eq("id", profileData.team_id)
          .single();

        if (!teamError && team) {
          setTeamInfo({ id: profileData.team_id, ...team });
        }

        // Fetch current subscription
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("team_id", profileData.team_id)
          .single();

        if (!subError && subData) {
          setSubscription(subData);
          setLicenseQuantity(subData.license_quantity || 1);
        }
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const pricingConfig = {
    monthlyPrice: 2000,
    annualPrice: 19200, // 20% discount
    baseLicenses: 5,
    additionalLicensePrice: 250,
    additionalLicenseAnnualPrice: 200 // 20% discount
  };

  const calculatePricing = () => {
    const basePrice = selectedBilling === 'annual' ? pricingConfig.annualPrice : pricingConfig.monthlyPrice;
    const additionalLicenses = Math.max(0, licenseQuantity - pricingConfig.baseLicenses);
    const additionalLicensePrice = selectedBilling === 'annual' ? 
      pricingConfig.additionalLicenseAnnualPrice : pricingConfig.additionalLicensePrice;
    
    const baseSubtotal = basePrice;
    const additionalSubtotal = additionalLicenses * additionalLicensePrice;
    const subtotal = baseSubtotal + additionalSubtotal;
    
    // Annual billing discount (20%)
    const discount = selectedBilling === 'annual' ? subtotal * 0.20 : 0;
    const total = subtotal - discount;

    return { 
      subtotal, 
      discount, 
      total, 
      baseSubtotal, 
      additionalSubtotal, 
      additionalLicenses 
    };
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      // TODO: Integrate with Cybersource payment processing
      console.log('Processing checkout:', {
        type: checkoutType,
        plan: selectedPlan,
        billing: selectedBilling,
        licenses: licenseQuantity,
        pricing: calculatePricing()
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate to success page
      navigate('/app/settings/subscription/success');
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const canProceed = () => {
    if (checkoutType === 'new') {
      return selectedBilling && licenseQuantity >= 5;
    }
    if (checkoutType === 'upgrade') {
      return true; // Always can upgrade to the single plan
    }
    if (checkoutType === 'add-licenses') {
      return licenseQuantity > (subscription?.license_quantity || 0);
    }
    return false;
  };

  const getPageTitle = () => {
    switch (checkoutType) {
      case 'upgrade': return 'Upgrade Subscription';
      case 'add-licenses': return 'Add Licenses';
      default: return 'Choose Your Plan';
    }
  };

  const getPageDescription = () => {
    switch (checkoutType) {
      case 'upgrade': return 'Upgrade your current plan to access more features';
      case 'add-licenses': return 'Add more user licenses to your current plan';
      default: return 'Select a plan that fits your team\'s needs';
    }
  };

  if (loading) return <Spinner message="Loading checkout..." />;

  const pricing = calculatePricing();

  return (
    <div className={styles.container}>
      <SectionHeader 
        title={getPageTitle()} 
        icon={CreditCard} 
        showEditButton={false}
      />
      
      <div className={styles.content}>
        <div className={styles.description}>
          <p>{getPageDescription()}</p>
        </div>


        {/* Current Plan Display for Upgrades */}
        {checkoutType === 'upgrade' && subscription && (
          <div className={styles.currentPlan}>
            <h3>Current Plan</h3>
            <div className={styles.currentPlanCard}>
              <div className={styles.planInfo}>
                <h4>Current Plan</h4>
                <p>Current plan with {subscription.license_quantity} licenses</p>
              </div>
            </div>
          </div>
        )}

        {/* Billing Interval Selection */}
        <div className={styles.billingSelection}>
          <h3>Billing Interval</h3>
          <div className={styles.billingOptions}>
            <div
              className={`${styles.billingOption} ${selectedBilling === 'monthly' ? styles.selected : ''}`}
              onClick={() => setSelectedBilling('monthly')}
            >
              <div className={styles.billingHeader}>
                <h4>Monthly</h4>
                <span className={styles.billingPrice}>
                  ${pricingConfig.monthlyPrice}/month
                </span>
              </div>
              <p>Pay monthly, cancel anytime</p>
            </div>
            <div
              className={`${styles.billingOption} ${selectedBilling === 'annual' ? styles.selected : ''}`}
              onClick={() => setSelectedBilling('annual')}
            >
              <div className={styles.billingHeader}>
                <h4>Annual</h4>
                <span className={styles.billingPrice}>
                  ${pricingConfig.annualPrice}/year
                </span>
              </div>
              <p>Save 20% with annual billing</p>
              <span className={styles.savingsBadge}>Save ${pricing.discount}</span>
            </div>
          </div>
        </div>

        {/* License Quantity */}
        <div className={styles.licenseSelection}>
          <h3>
            {checkoutType === 'add-licenses' ? 'Add Licenses' : 'Number of Licenses'}
          </h3>
          <div className={styles.licenseControls}>
            <div className={styles.licenseInput}>
              <button
                type="button"
                onClick={() => setLicenseQuantity(Math.max(5, licenseQuantity - 5))}
                disabled={licenseQuantity <= 5}
              >
                −5
              </button>
              <input
                type="number"
                value={licenseQuantity}
                onChange={(e) => setLicenseQuantity(Math.max(5, parseInt(e.target.value) || 5))}
                min="5"
                step="5"
              />
              <button
                type="button"
                onClick={() => setLicenseQuantity(licenseQuantity + 5)}
              >
                +5
              </button>
            </div>
            <div className={styles.licenseInfo}>
              <Users size={16} style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)' }} />
              <span>{licenseQuantity} user{licenseQuantity !== 1 ? 's' : ''}</span>
              {licenseQuantity > 5 && (
                <span className={styles.additionalLicenses}>
                  ({licenseQuantity - 5} additional)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className={styles.pricingSummary}>
          <h3>Order Summary</h3>
                      <div className={styles.pricingDetails}>
              <div className={styles.pricingRow}>
                <span>Subscription (5 licenses)</span>
                <span>${pricing.baseSubtotal}</span>
              </div>
              {pricing.additionalLicenses > 0 && (
                <div className={styles.pricingRow}>
                  <span>Additional Licenses ({pricing.additionalLicenses})</span>
                  <span>${pricing.additionalSubtotal}</span>
                </div>
              )}
              {pricing.discount > 0 && (
                <div className={styles.pricingRow}>
                  <span>Annual Discount (20%)</span>
                  <span className={styles.discount}>-${pricing.discount}</span>
                </div>
              )}
              <div className={styles.pricingTotal}>
                <span>Total</span>
                <span>${pricing.total}</span>
              </div>
            </div>
        </div>

        {/* Security Notice */}
        <div className={styles.securityNotice}>
          <Shield size={20} style={{ width: 'var(--icon-size-lg)', height: 'var(--icon-size-lg)' }} />
          <div>
            <h4>Secure Payment</h4>
            <p>Your payment information is encrypted and processed securely through our payment processor.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button
            variant="gray"
            size="md"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            variant="gold"
            size="md"
            onClick={handleCheckout}
            disabled={!canProceed() || processing}
            className={styles.checkoutButton}
          >
            {processing ? (
              <>
                <Spinner size="sm" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard size={16} style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)' }} />
                {checkoutType === 'new' ? 'Start Subscription' : 
                 checkoutType === 'upgrade' ? 'Upgrade Plan' : 
                 'Add Licenses'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
