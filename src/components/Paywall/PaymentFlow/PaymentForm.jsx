import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Button from '../../Buttons/Button';
import Spinner from '../../Buttons/Spinner';
import styles from './PaymentFlow.module.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function PaymentForm({ 
  selectedPlan, 
  plans, 
  billingCycle, 
  seats, 
  teamName, 
  companyType, 
  onBack 
}) {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate payment form
      if (!cardNumber || !expMonth || !expYear || !cvv || !billingName || !billingEmail) {
        throw new Error('Please fill in all payment fields');
      }

      const amount = calculatePrice();
      const payload = { 
        number: cardNumber.replace(/\s/g, ''), 
        expMonth, 
        expYear, 
        cvv, 
        amount: amount.toString() 
      };

      // Process payment
      const { data: paymentResult, error: funcError } = await supabase.functions.invoke(
        "process-payment",
        { body: payload }
      );

      if (funcError || !paymentResult) {
        throw new Error(funcError?.message || "Payment failed");
      }

      // Get current user
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error("User authentication failed");

      // Generate access code
      const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert([{
          name: teamName,
          tier: selectedPlan,
          access_code: accessCode,
          max_users: seats,
          company_type: companyType,
          created_by: user.id,
        }])
        .select()
        .single();

      if (teamError) throw new Error("Could not create team");

      // Create subscription
      const { error: subError } = await supabase
        .from("subscriptions")
        .insert([{
          team_id: team.id,
          billing_interval: billingCycle,
          license_quantity: seats,
          status: 'active',
        }]);

      if (subError) throw new Error("Could not create subscription");

      // Add user to team
      const { error: memberError } = await supabase
        .from("profiles")
        .update({ 
          team_id: team.id,
          role: 'Team Admin'
        })
        .eq("id", user.id);

      if (memberError) throw new Error("Could not assign user to team");

      // Redirect to success
      navigate(`/success?code=${accessCode}&plan=${selectedPlan}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.step}>
      <h2>Payment Information</h2>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      <div className={styles.paymentForm}>
        <div className={styles.formGroup}>
          <label>Card Number</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="1234 5678 9012 3456"
            maxLength="19"
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Expiry Month</label>
            <select value={expMonth} onChange={(e) => setExpMonth(e.target.value)}>
              <option value="">MM</option>
              {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                <option key={month} value={month.toString().padStart(2, '0')}>
                  {month.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Expiry Year</label>
            <select value={expYear} onChange={(e) => setExpYear(e.target.value)}>
              <option value="">YYYY</option>
              {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>CVV</label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="123"
              maxLength="4"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Billing Name</label>
          <input
            type="text"
            value={billingName}
            onChange={(e) => setBillingName(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Billing Email</label>
          <input
            type="email"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
            placeholder="billing@company.com"
          />
        </div>
      </div>

      <div className={styles.stepActions}>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button 
          variant="green" 
          onClick={handlePayment}
          disabled={loading}
        >
          {loading ? <Spinner /> : `Pay ${formatCurrency(calculatePrice())}`}
        </Button>
      </div>
    </div>
  );
} 