import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Users, Calendar, Settings, Edit, Trash2, Plus } from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import SectionHeader from '../../../components/Layouts/SectionHeader';
import { supabase } from '../../../app/supabaseClient';
import styles from './SubscriptionManagePage.module.css';

export default function SubscriptionManagePage() {
  const [subscription, setSubscription] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, title, role, team_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch team data if user is part of a team
      if (profileData.team_id) {
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('name, tier, max_users, created_at')
          .eq('id', profileData.team_id)
          .single();

        if (!teamError && team) {
          setTeamInfo(team);
        }

        // Fetch subscription data
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select(`
            id, 
            started_at, 
            renewed_at, 
            expires_at, 
            canceled_at,
            status, 
            billing_interval, 
            discount_percent, 
            discount_reason,
            plan_id, 
            license_quantity,
            trial_ends_at
          `)
          .eq('team_id', profileData.team_id)
          .in('status', ['active', 'trialing', 'past_due', 'canceled'])
          .order('renewed_at', { ascending: false })
          .limit(1)
          .single();

        if (!subError && subData) {
          setSubscription(subData);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "–";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'trialing': return '#f59e0b';
      case 'past_due': return '#ef4444';
      case 'canceled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trialing': return 'Trial';
      case 'past_due': return 'Past Due';
      case 'canceled': return 'Canceled';
      default: return status;
    }
  };

  const getNextRenewalDate = () => {
    if (!subscription) return null;
    
    if (subscription.billing_interval === 'annual') {
      const lastRenewal = new Date(subscription.renewed_at || subscription.started_at);
      return new Date(lastRenewal.getFullYear() + 1, lastRenewal.getMonth(), lastRenewal.getDate());
    } else {
      const lastRenewal = new Date(subscription.renewed_at || subscription.started_at);
      return new Date(lastRenewal.getFullYear(), lastRenewal.getMonth() + 1, lastRenewal.getDate());
    }
  };

  if (loading) return <Spinner message="Loading subscription information..." />;

     if (!profile?.team_id) {
     return (
       <div className={styles.content}>
         <SectionHeader 
           title="Subscription Management" 
           icon={CreditCard} 
           showEditButton={false}
         />
         <div className={styles.noSubscription}>
           <h3>No Active Subscription</h3>
           <p>You need to have an active subscription to manage it.</p>
           <Button 
             variant="gold" 
             size="md"
             onClick={() => navigate("/app/settings/subscription/subscribe")}
           >
             Subscribe Now
           </Button>
         </div>
       </div>
     );
   }

           return (
        <div className={styles.content}>
          <div className={styles.customSectionHeader}>
            <div className={styles.headerContent}>
              <div className={styles.leftSection}>
                <CreditCard size={16} className={styles.headerIcon} />
                <span className={styles.headerTitle}>Subscription Management</span>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.actionButton} onClick={() => navigate("/app/settings/subscription/subscribe")}>
                  <Edit size={14} />
                  <span>Modify Subscription</span>
                </button>
              </div>
            </div>
            <div className={styles.separator} />
          </div>
          
          {/* Current Subscription Overview */}
          <div className={styles.subscriptionOverview}>
            <h3>Current Subscription</h3>
            <div className={styles.overviewGrid}>
              <div className={styles.overviewCard}>
                <div className={styles.overviewLabel}>Status</div>
                <div className={styles.overviewValue}>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(subscription?.status) }}
                  >
                    {getStatusLabel(subscription?.status)}
                  </span>
                </div>
              </div>
              <div className={styles.overviewCard}>
                <div className={styles.overviewLabel}>Licenses</div>
                <div className={styles.overviewValue}>{teamInfo?.max_users || 1}</div>
              </div>
              <div className={styles.overviewCard}>
                <div className={styles.overviewLabel}>Billing Cycle</div>
                <div className={styles.overviewValue}>
                  {subscription?.billing_interval === 'annual' ? 'Annual' : 'Monthly'}
                </div>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className={styles.billingSection}>
            <h3>Billing Information</h3>
            <div className={styles.billingGrid}>
              <div className={styles.billingCard}>
                <div className={styles.billingHeader}>
                  <Calendar />
                  <span>Billing Dates</span>
                </div>
                <div className={styles.billingDetails}>
                  <div className={styles.billingRow}>
                    <span>Started:</span>
                    <span>{formatDate(subscription?.started_at)}</span>
                  </div>
                  <div className={styles.billingRow}>
                    <span>Last Renewed:</span>
                    <span>{formatDate(subscription?.renewed_at)}</span>
                  </div>
                  <div className={styles.billingRow}>
                    <span>Next Renewal:</span>
                    <span>{formatDate(getNextRenewalDate())}</span>
                  </div>
                  {subscription?.trial_ends_at && (
                    <div className={styles.billingRow}>
                      <span>Trial Ends:</span>
                      <span>{formatDate(subscription.trial_ends_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.billingCard}>
                <div className={styles.billingHeader}>
                  <CreditCard />
                  <span>Payment Methods</span>
                  <Button
                    variant="blue"
                    size="sm"
                    onClick={() => setShowAddPayment(!showAddPayment)}
                  >
                    <Plus />
                    Add
                  </Button>
                </div>
                <div className={styles.paymentMethods}>
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((method, index) => (
                      <div key={index} className={styles.paymentMethod}>
                        <span>•••• {method.last4}</span>
                        <span>{method.brand}</span>
                        <span>Expires {method.expMonth}/{method.expYear}</span>
                        <Button variant="gray" size="sm">
                          <Edit />
                        </Button>
                        <Button variant="red" size="sm">
                          <Trash2 />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className={styles.noPaymentMethods}>No payment methods on file</p>
                  )}
                </div>
              </div>
            </div>
          </div>



          {/* Billing History */}
          <div className={styles.billingHistory}>
            <h3>Billing History</h3>
            <p>View your past invoices and payment history.</p>
            <Button 
              variant="gray" 
              size="md"
              onClick={() => navigate("/app/billing-history")}
            >
              View Billing History
            </Button>
          </div>
        </div>
      );
    }
