import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Users, ArrowRight, Home } from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import SectionHeader from '../../../components/Layouts/SectionHeader';
import styles from './PaymentSuccess.module.css';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from navigation state
  const { teamName, planName, totalAmount } = location.state || {};

  const handleGoToDashboard = () => {
    navigate('/app/dashboard');
  };

  const handleInviteTeamMembers = () => {
    navigate('/app/settings');
  };

  return (
    <div className={styles.page}>
      <SectionHeader 
        title="Payment Successful!" 
        icon={CheckCircle}
        showEditButton={false}
      />
      
      <div className={styles.content}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckCircle size={64} />
          </div>
          
          <h1 className={styles.title}>Welcome to Market Mover!</h1>
          <p className={styles.subtitle}>
            Your team has been created successfully and your payment has been processed.
          </p>
          
          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Team Name:</span>
              <span className={styles.value}>{teamName || 'Your Team'}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.label}>Plan:</span>
              <span className={styles.value}>{planName || 'Selected Plan'}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.label}>Amount Paid:</span>
              <span className={styles.value}>${totalAmount || '0.00'}</span>
            </div>
          </div>
          
          <div className={styles.nextSteps}>
            <h3 className={styles.nextStepsTitle}>What's Next?</h3>
            
            <div className={styles.stepsList}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h4>Explore Your Dashboard</h4>
                  <p>Start using Market Mover's powerful features to analyze markets and find providers.</p>
                </div>
              </div>
              
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h4>Invite Team Members</h4>
                  <p>Add colleagues to your team so they can collaborate on market analysis.</p>
                </div>
              </div>
              
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h4>Create Your First Market</h4>
                  <p>Define a geographic area and start analyzing healthcare markets.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.actions}>
            <Button
              onClick={handleGoToDashboard}
              variant="blue"
              className={styles.primaryButton}
            >
              <Home size={16} />
              Go to Dashboard
            </Button>
            
            <Button
              onClick={handleInviteTeamMembers}
              variant="secondary"
              className={styles.secondaryButton}
            >
              <Users size={16} />
              Invite Team Members
            </Button>
          </div>
          
          <div className={styles.support}>
            <p>
              Need help getting started? Check out our{' '}
              <a href="/faq" className={styles.link}>FAQ</a> or{' '}
              <a href="mailto:support@marketmover.com" className={styles.link}>contact support</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
