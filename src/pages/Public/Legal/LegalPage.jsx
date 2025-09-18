import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import DynamicLegalContent from '../../Private/Settings/Platform/DynamicLegalContent';
import { getAllApprovedPolicies } from '../../../utils/legalContent';
import styles from './LegalPage.module.css';

const LegalPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [contentRef, setContentRef] = useState(null);
  const [loading, setLoading] = useState(true);

  const selectedTab = searchParams.get('tab') || 'terms';

  // Load approved policies on mount
  useEffect(() => {
    const loadPolicies = async () => {
      try {
        setLoading(true);
        const approvedPolicies = await getAllApprovedPolicies();
        setPolicies(approvedPolicies);
        
        // Set initial selected policy based on selectedTab
        if (approvedPolicies.length > 0) {
          const initialPolicy = approvedPolicies.find(p => p.slug === selectedTab) || approvedPolicies[0];
          setSelectedPolicy(initialPolicy);
        }
      } catch (error) {
        console.error('Error loading policies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPolicies();
  }, [selectedTab]);

  // Update selected policy when tab changes
  useEffect(() => {
    if (policies.length > 0) {
      const policy = policies.find(p => p.slug === selectedTab) || policies[0];
      setSelectedPolicy(policy);
    }
  }, [selectedTab, policies]);

  // Scroll to top on policy change
  useEffect(() => {
    if (contentRef) {
      contentRef.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedPolicy, contentRef]);

  if (loading) {
    return (
      <div className={styles.content}>
        <div>Loading policies...</div>
      </div>
    );
  }

  return (
    <div 
      ref={setContentRef}
      className={styles.content}
    >
      {selectedPolicy && (
        <DynamicLegalContent policySlug={selectedPolicy.slug} />
      )}
    </div>
  );
};

export default LegalPage;
