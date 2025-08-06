import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../app/supabaseClient";
import Button from "../../../components/Buttons/Button";
import Spinner from "../../../components/Buttons/Spinner";
import styles from "./SettingsShared.module.css";

export default function SubscriptionTab() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    title: "",
    role: null,
    team_id: null,
  });
  const [teamInfo, setTeamInfo] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, title, role, team_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch team data if user is part of a team
      if (profileData.team_id) {
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("name, tier, max_users, created_at")
          .eq("id", profileData.team_id)
          .single();

        if (!teamError && team) {
          setTeamInfo({
            id: profileData.team_id,
            name: team.name,
            tier: team.tier,
            max_users: team.max_users,
            created_at: team.created_at,
          });
        }

        // Fetch subscription data with all fields
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
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
            trial_ends_at,
            plans(name, price)
          `)
          .eq("team_id", profileData.team_id)
          .in("status", ["active", "trialing", "past_due", "canceled"])
          .order("renewed_at", { ascending: false })
          .limit(1)
          .single();

        if (!subError && subData) {
          setSubscription({
            ...subData,
            plan_name: subData.plans?.name || "–",
            plan_price: subData.plans?.price || 0,
          });
        }
      }
    } catch (err) {
      console.error("💥 Unexpected error:", err);
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

  const getCurrentPeriodDates = () => {
    if (!subscription) return null;
    
    const now = new Date();
    const originalStartDate = subscription.started_at;
    
    if (!originalStartDate) return null;
    
    const originalStart = new Date(originalStartDate);
    
    // Calculate how many periods have passed since the original start
    const monthsSinceStart = (now.getFullYear() - originalStart.getFullYear()) * 12 + 
                            (now.getMonth() - originalStart.getMonth());
    
    let currentPeriodStart;
    let currentPeriodEnd;
    
    if (subscription.billing_interval === 'annual') {
      // For annual billing, calculate years since start
      const yearsSinceStart = now.getFullYear() - originalStart.getFullYear();
      currentPeriodStart = new Date(originalStart.getFullYear() + yearsSinceStart, originalStart.getMonth(), originalStart.getDate());
      currentPeriodEnd = new Date(originalStart.getFullYear() + yearsSinceStart + 1, originalStart.getMonth(), originalStart.getDate());
    } else {
      // For monthly billing, calculate months since start
      const totalMonths = originalStart.getMonth() + monthsSinceStart;
      const yearsToAdd = Math.floor(totalMonths / 12);
      const monthInYear = totalMonths % 12;
      
      currentPeriodStart = new Date(originalStart.getFullYear() + yearsToAdd, monthInYear, originalStart.getDate());
      currentPeriodEnd = new Date(originalStart.getFullYear() + yearsToAdd, monthInYear + 1, originalStart.getDate());
    }
    
    // Normalize dates to compare only date components (ignore time)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth(), currentPeriodStart.getDate());
    const end = new Date(currentPeriodEnd.getFullYear(), currentPeriodEnd.getMonth(), currentPeriodEnd.getDate());
    
    return {
      start: currentPeriodStart,
      end: currentPeriodEnd,
      isCurrent: today >= start && today <= end
    };
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



  const hasTeam = !!profile.team_id;
  const currentPeriod = getCurrentPeriodDates();

  if (loading) return <Spinner message="Loading subscription information..." />;

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Subscription Management</h2>
      
      {hasTeam ? (
        <div className={styles.subscriptionDetails}>
          {/* Current Plan Overview */}
          <div className={styles.planInfo}>
            <h3>Current Plan: {subscription?.plan_name || "Free"}</h3>
            <p>Team: {teamInfo?.name}</p>
            <p>Role: {profile.role}</p>
          </div>



          {/* Current Period Dates */}
          {currentPeriod && (
            <div className={styles.periodCard}>
              <h4>Current Period</h4>
              <div className={styles.periodDates}>
                <div className={styles.periodRow}>
                  <span className={styles.periodLabel}>Period Start:</span>
                  <span className={styles.periodValue}>{formatDate(currentPeriod.start)}</span>
                </div>
                <div className={styles.periodRow}>
                  <span className={styles.periodLabel}>Period End:</span>
                  <span className={styles.periodValue}>{formatDate(currentPeriod.end)}</span>
                </div>
                <div className={styles.periodRow}>
                  <span className={styles.periodLabel}>Status:</span>
                  <span className={styles.periodValue}>
                    {currentPeriod.isCurrent ? 'Active' : 'Outside Current Period'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* License and Pricing Info */}
          {subscription && (
            <div className={styles.pricingCard}>
              <h4>License & Pricing</h4>
              <div className={styles.pricingDetails}>
                <div className={styles.pricingRow}>
                  <span className={styles.pricingLabel}>Licenses:</span>
                  <span className={styles.pricingValue}>{subscription.license_quantity || 1}</span>
                </div>
                {subscription.discount_percent > 0 && (
                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>Discount:</span>
                    <span className={styles.pricingValue}>{subscription.discount_percent}%</span>
                  </div>
                )}
                {subscription.discount_reason && (
                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>Discount Reason:</span>
                    <span className={styles.pricingValue}>{subscription.discount_reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className={styles.subscriptionActions}>
            <Button
              variant="blue"
              size="md"
              onClick={() => navigate("/app/billing-history")}
            >
              View Billing History
            </Button>
            <Button variant="gold" size="md" disabled>
              Upgrade / Downgrade (Coming Soon)
            </Button>
            <Button variant="teal" size="md" disabled>
              Purchase Licenses (Coming Soon)
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.noTeamMessage}>
          <h3>No Active Subscription</h3>
          <p>You need to join or create a team to access subscription features.</p>
          <div className={styles.teamActions}>
            <Button variant="blue" size="md" onClick={() => navigate("/pricing")}>
              View Plans
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 