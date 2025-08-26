import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../app/supabaseClient';
import Button from '../Buttons/Button';
import Spinner from '../Buttons/Spinner';
import styles from './SubscriptionManager.module.css';

export default function SubscriptionManager() {
  const [subscription, setSubscription] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) return;

      // Fetch team data
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', profile.team_id)
        .single();

      setTeam(teamData);

      // Fetch subscription data (simplified to avoid 406 errors)
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('team_id', profile.team_id)
        .eq('status', 'active')
        .single();

      setSubscription(subData);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (newPlan) => {
    setUpgrading(true);
    try {
      // Navigate to payment flow with upgrade parameters
      navigate(`/payment-flow?plan=${newPlan}&upgrade=true`);
    } catch (error) {
      console.error('Error initiating upgrade:', error);
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          canceled_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Update team tier to free
      await supabase
        .from('teams')
        .update({ tier: 'free' })
        .eq('id', team.id);

      await fetchSubscriptionData();
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPlanFeatures = (planName) => {
    const features = {
      starter: ['5 users included', 'Basic provider search', 'Summary analytics', 'Email support'],
      advanced: ['10 users included', 'Full provider profiles', 'Save & export data', 'Priority support'],
      pro: ['10 users included', 'Custom analytics dashboard', 'Team collaboration tools', 'Dedicated account manager']
    };
    return features[planName] || [];
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner />
        <p>Loading subscription details...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={styles.noSubscription}>
        <h2>No Active Subscription</h2>
        <p>You don't have an active subscription. Upgrade to access premium features.</p>
        <Button variant="green" onClick={() => navigate('/payment-flow')}>
          Choose a Plan
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Subscription Management</h2>
        <div className={styles.status}>
          <span className={`${styles.statusBadge} ${styles[subscription.status]}`}>
            {subscription.status}
          </span>
        </div>
      </div>

      <div className={styles.currentPlan}>
        <h3>Current Plan: {team?.tier?.charAt(0).toUpperCase() + team?.tier?.slice(1)}</h3>
        <div className={styles.planDetails}>
          <div className={styles.detail}>
            <span>Billing Cycle:</span>
            <span>{subscription.billing_interval}</span>
          </div>
          <div className={styles.detail}>
            <span>Users:</span>
            <span>{subscription.license_quantity}</span>
          </div>
          <div className={styles.detail}>
            <span>Started:</span>
            <span>{formatDate(subscription.started_at)}</span>
          </div>
          {subscription.renewed_at && (
            <div className={styles.detail}>
              <span>Last Renewed:</span>
              <span>{formatDate(subscription.renewed_at)}</span>
            </div>
          )}
          {subscription.expires_at && (
            <div className={styles.detail}>
              <span>Expires:</span>
              <span>{formatDate(subscription.expires_at)}</span>
            </div>
          )}
        </div>

        <div className={styles.features}>
          <h4>Current Features:</h4>
          <ul>
            {getPlanFeatures(team?.tier).map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.actions}>
        <h3>Manage Subscription</h3>
        
        <div className={styles.upgradeOptions}>
          {team?.tier !== 'advanced' && (
            <div className={styles.upgradeOption}>
              <h4>Upgrade to Advanced</h4>
              <p>Get full provider profiles, save & export data, and priority support.</p>
              <Button 
                variant="green" 
                onClick={() => handleUpgrade('advanced')}
                disabled={upgrading}
              >
                {upgrading ? <Spinner /> : 'Upgrade to Advanced'}
              </Button>
            </div>
          )}

          {team?.tier !== 'pro' && (
            <div className={styles.upgradeOption}>
              <h4>Upgrade to Pro</h4>
              <p>Get custom analytics dashboard, team collaboration tools, and dedicated account manager.</p>
              <Button 
                variant="green" 
                onClick={() => handleUpgrade('pro')}
                disabled={upgrading}
              >
                {upgrading ? <Spinner /> : 'Upgrade to Pro'}
              </Button>
            </div>
          )}
        </div>

        <div className={styles.dangerZone}>
          <h4>Danger Zone</h4>
          <p>Cancel your subscription to downgrade to the free plan.</p>
          <Button 
            variant="danger" 
            onClick={handleCancel}
            disabled={upgrading}
          >
            Cancel Subscription
          </Button>
        </div>
      </div>
    </div>
  );
} 