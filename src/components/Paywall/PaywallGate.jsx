import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../app/supabaseClient';
import Button from '../Buttons/Button';
import styles from './PaywallGate.module.css';

export default function PaywallGate({ 
  children, 
  requiredPlan = 'starter',
  featureName = 'this feature',
  showUpgrade = true 
}) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Get user's team and subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const { data: team } = await supabase
        .from('teams')
        .select('tier')
        .eq('id', profile.team_id)
        .single();

      if (!team) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Check subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('team_id', profile.team_id)
        .eq('status', 'active')
        .single();

      setSubscription(subscription);

      // Plan hierarchy: starter < advanced < pro
      const planHierarchy = { starter: 1, advanced: 2, pro: 3 };
      const userPlanLevel = planHierarchy[team.tier] || 0;
      const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

      setHasAccess(userPlanLevel >= requiredPlanLevel && subscription?.status === 'active');
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/payment-flow');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Checking access...</p>
      </div>
    );
  }

  if (hasAccess) {
    return children;
  }

  return (
    <div className={styles.paywall}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        
        <h2>Premium Feature</h2>
        <p>
          {featureName} is available on the {requiredPlan} plan and above. 
          {subscription ? ' Your current subscription does not include this feature.' : ' You need an active subscription to access this feature.'}
        </p>

        {showUpgrade && (
          <div className={styles.actions}>
            <Button variant="green" size="lg" onClick={handleUpgrade}>
              Upgrade Plan
            </Button>
            <Button variant="secondary" onClick={() => navigate('/app/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        )}

        <div className={styles.features}>
          <h3>What's included in {requiredPlan} plan:</h3>
          <ul>
            {requiredPlan === 'starter' && (
              <>
                <li>5 users included</li>
                <li>Basic provider search</li>
                <li>Summary analytics</li>
                <li>Email support</li>
              </>
            )}
            {requiredPlan === 'advanced' && (
              <>
                <li>10 users included</li>
                <li>Full provider profiles</li>
                <li>Save & export data</li>
                <li>Priority support</li>
              </>
            )}
            {requiredPlan === 'pro' && (
              <>
                <li>10 users included</li>
                <li>Custom analytics dashboard</li>
                <li>Team collaboration tools</li>
                <li>Dedicated account manager</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 