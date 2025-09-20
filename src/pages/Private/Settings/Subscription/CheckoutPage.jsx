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
  const [licenseQuantity, setLicenseQuantity] = useState(3);
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
          .select("name")
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
    baseLicenses: 3,
    additionalLicensePrice: 250 // per set of 3 users
  };

  const calculatePricing = () => {
    const basePrice = pricingConfig.monthlyPrice;
    const additionalSets = Math.max(0, Math.ceil((licenseQuantity - pricingConfig.baseLicenses) / 3));
    const additionalLicensePrice = pricingConfig.additionalLicensePrice;
    
    const baseSubtotal = basePrice;
    const additionalSubtotal = additionalSets * additionalLicensePrice;
    const subtotal = baseSubtotal + additionalSubtotal;
    
    const total = subtotal;

    return { 
      subtotal, 
      discount: 0, 
      total, 
      baseSubtotal, 
      additionalSubtotal, 
      additionalSets 
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
      return selectedBilling && licenseQuantity >= 3;
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
      default: return 'New Subscription';
    }
  };

  const getPageDescription = () => {
    switch (checkoutType) {
      case 'upgrade': return 'Upgrade your current plan to access more features';
      case 'add-licenses': return 'Add more user licenses to your current plan';
      default: return '';
    }
  };

  if (loading) return <Spinner message="Loading checkout..." />;

  const pricing = calculatePricing();

  return (
    <>
      <SectionHeader 
        title={getPageTitle()} 
        icon={CreditCard} 
        showEditButton={false}
      />
      
      <div className={styles.content}>
        {getPageDescription() && (
          <div className={styles.description}>
            <p>{getPageDescription()}</p>
          </div>
        )}


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

        {/* Billing and Users Section */}
        <div className={styles.billingAndUsers}>
          {/* Billing Information */}
          <div className={styles.billingSelection}>
            <div className={styles.billingHeader}>
              <h3>Base Subscription</h3>
              <span className={styles.billingPrice}>
                ${pricingConfig.monthlyPrice}/month
              </span>
            </div>
            <p>Pay monthly, cancel anytime</p>
          </div>

          {/* License Quantity */}
          <div className={styles.licenseSelection}>
            <div className={styles.licenseHeader}>
              <h3>
                {checkoutType === 'add-licenses' ? 'Add Licenses' : 'Number of Users'}
              </h3>
              <span className={styles.licenseIncluded}>
                3 users included
              </span>
            </div>
            <div className={styles.licenseControls}>
              <div className={styles.licenseToggle}>
                <button
                  type="button"
                  className={styles.toggleButton}
                  onClick={() => setLicenseQuantity(Math.max(3, licenseQuantity - 3))}
                  disabled={licenseQuantity <= 3}
                >
                  <span>−</span>
                </button>
                <div className={styles.licenseDisplay}>
                  <span className={styles.licenseNumber}>{licenseQuantity}</span>
                  <span className={styles.licenseLabel}>users</span>
                </div>
                <button
                  type="button"
                  className={styles.toggleButton}
                  onClick={() => setLicenseQuantity(licenseQuantity + 3)}
                >
                  <span>+</span>
                </button>
              </div>
              {licenseQuantity > 3 && (
                <div className={styles.additionalInfo}>
                  <span className={styles.additionalText}>
                    +{Math.ceil((licenseQuantity - 3) / 3)} additional set{Math.ceil((licenseQuantity - 3) / 3) !== 1 ? 's' : ''} of 3
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className={styles.pricingSummary}>
          <h3>Order Summary</h3>
          <div className={styles.pricingDetails}>
            <div className={styles.pricingRow}>
              <span>Subscription (3 users)</span>
              <span>${pricing.baseSubtotal}</span>
            </div>
            {pricing.additionalSets > 0 && (
              <div className={styles.pricingRow}>
                <span>Additional sets of 3 users ({pricing.additionalSets})</span>
                <span>${pricing.additionalSubtotal}</span>
              </div>
            )}
            <div className={styles.pricingTotal}>
              <span>Total ({licenseQuantity} users)</span>
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
            variant="teal"
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
    </>
  );
}
