import React from 'react';
import Button from '../../../components/Buttons/Button';
import styles from './SubscriptionTab.module.css';

export const SubscriptionTab = ({ hasTeam, teamInfo, subscription, profile, onNavigate }) => {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Subscription Management</h2>
      
      {hasTeam ? (
        <div className={styles.subscriptionDetails}>
          <div className={styles.planInfo}>
            <h3>Current Plan: {subscription?.plan_name || "Free"}</h3>
            <p>Team: {teamInfo?.name}</p>
            <p>Role: {profile.role}</p>
          </div>
          
          <div className={styles.subscriptionActions}>
            <Button
              variant="blue"
              size="md"
              onClick={() => onNavigate("/app/billing-history")}
            >
              View Billing History
            </Button>
            <Button variant="gold" size="md" disabled>
              Upgrade / Downgrade (Coming Soon)
            </Button>
            <Button variant="teal" size="md" disabled>
              Purchase Licenses (Coming Soon)
            </Button>
            <Button
              variant="red"
              size="md"
              ghost
              disabled
            >
              Delete Account (Coming Soon)
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.noTeamMessage}>
          <h3>No Active Subscription</h3>
          <p>You need to join or create a team to access subscription features.</p>
          <div className={styles.teamActions}>
            <Button variant="blue" size="md" onClick={() => onNavigate("/pricing")}>
              View Plans
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}; 