import Button from '../../Buttons/Button';
import styles from './PaymentFlow.module.css';

export default function TeamSetup({ 
  selectedPlan, 
  plans, 
  billingCycle, 
  seats, 
  setSeats, 
  teamName, 
  setTeamName, 
  companyType, 
  setCompanyType, 
  onNext, 
  onBack 
}) {
  const getSelectedPlanData = () => {
    return plans.find(plan => plan.name.toLowerCase() === selectedPlan);
  };

  const calculatePrice = () => {
    const planData = getSelectedPlanData();
    if (!planData) return 0;
    
    const basePrice = planData.price_monthly;
    const includedSeats = planData.max_users;
    const additionalSeats = Math.max(0, seats - includedSeats);
    const additionalCost = additionalSeats * (planData.license_block_price || 250);
    const totalPrice = basePrice + additionalCost;
    
    if (billingCycle === 'annual') {
      return totalPrice * 12 * 0.8; // 20% discount
    }
    
    return totalPrice;
  };

  const calculateSavings = () => {
    const planData = getSelectedPlanData();
    if (!planData || billingCycle === 'monthly') return 0;
    
    const basePrice = planData.price_monthly;
    const includedSeats = planData.max_users;
    const additionalSeats = Math.max(0, seats - includedSeats);
    const additionalCost = additionalSeats * (planData.license_block_price || 250);
    const totalPrice = basePrice + additionalCost;
    
    return totalPrice * 12 * 0.2; // 20% savings
  };

  const getAdditionalSeats = () => {
    const planData = getSelectedPlanData();
    if (!planData) return 0;
    
    return Math.max(0, seats - planData.max_users);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleContinue = () => {
    if (!teamName.trim()) {
      return false; // Let parent handle error
    }
    onNext();
  };

  const planData = getSelectedPlanData();
  const additionalSeats = getAdditionalSeats();

  return (
    <div className={styles.step}>
      <h2>Team Setup</h2>
      <div className={styles.twoColumnLayout}>
        <div className={styles.leftColumn}>
          <div className={styles.formGroup}>
            <label>Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
            />
          </div>

          <div className={styles.licenseSelector}>
            <label>Number of Seats:</label>
            <select 
              value={seats} 
              onChange={(e) => setSeats(parseInt(e.target.value, 10))}
            >
              {[5, 10, 15, 20, 25, 30].map(num => (
                <option key={num} value={num}>{num} users</option>
              ))}
            </select>
          </div>

          {additionalSeats > 0 && (
            <div className={styles.additionalLicenses}>
              <strong>+{additionalSeats} additional licenses</strong> at ${planData?.license_block_price || 250} each
            </div>
          )}
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.summary}>
            <h3>Order Summary</h3>
            <div className={styles.summaryRow}>
              <span>{planData?.name} Plan</span>
              <span>{formatCurrency(planData?.price_monthly || 0)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>{planData?.max_users} seats included</span>
              <span>Included</span>
            </div>
            {additionalSeats > 0 && (
              <div className={styles.summaryRow}>
                <span>+{additionalSeats} additional seats</span>
                <span>{formatCurrency(additionalSeats * (planData?.license_block_price || 250))}</span>
              </div>
            )}
            {billingCycle === 'annual' && (
              <div className={styles.summaryRow}>
                <span>Annual discount (20%)</span>
                <span>-{formatCurrency(calculateSavings())}</span>
              </div>
            )}
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>{formatCurrency(calculatePrice())}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.stepActions}>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="green" onClick={handleContinue}>
          Continue to Payment
        </Button>
      </div>
    </div>
  );
} 