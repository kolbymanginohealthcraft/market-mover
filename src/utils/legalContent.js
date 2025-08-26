// Legal content loader utility using Supabase API
import { supabase } from '../app/supabaseClient';

export const getLegalContent = async (type) => {
  try {
    const { data, error } = await supabase
      .rpc('get_latest_approved_policy', { policy_slug: type });

    if (error) {
      console.error(`Error loading ${type} content:`, error);
      return getFallbackContent(type);
    }

    if (!data || data.length === 0) {
      console.error(`No approved policy found for ${type}`);
      return getFallbackContent(type);
    }

    return data[0].content || '';
  } catch (error) {
    console.error(`Error loading ${type} content:`, error);
    // Return fallback content
    return getFallbackContent(type);
  }
};

export const getAllApprovedPolicies = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_approved_policies');

    if (error) {
      console.error('Error loading approved policies:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading approved policies:', error);
    return [];
  }
};

const getFallbackContent = (type) => {
  switch (type) {
    case 'terms':
      return `# Terms and Conditions

## Overview

These Terms and Conditions ("Terms") govern your use of Market Mover, a data analytics platform operated by Healthcraft Creative Solutions ("we", "our", or "us"). By accessing or using the platform, you agree to be bound by these Terms.

## Contact

For questions about these Terms, contact us at support@healthcraftsolutions.com.`;
    
    case 'privacy':
      return `# Privacy Policy

## Overview

Healthcraft Creative Solutions ("we", "our", or "us") operates the Market Mover platform. This Privacy Policy explains how we collect, use, and protect your information.

## Contact

For privacy-related questions, contact us at support@healthcraftsolutions.com.`;
    
    case 'refund':
      return `# Refund Policy

## Free 7-Day Trial Terms

- This is an auto-renewing subscription.
- If you do not cancel during your 7-day trial, your payment method will automatically be charged **$2,500** for the Starter level plan.
- You may cancel your trial or subscription at any time from the Account page.

## Contact

For questions about refunds or billing, contact us at support@healthcraftsolutions.com.`;
    
    default:
      return '# Content Not Available\n\nPlease contact support for assistance.';
  }
};

export const getAvailableLegalTypes = () => {
  return ['terms', 'privacy', 'refund'];
}; 