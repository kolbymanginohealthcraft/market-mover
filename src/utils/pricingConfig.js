// Hardcoded pricing configuration for the one-tier system
// This file centralizes all pricing information for easy updates

export const PRICING_CONFIG = {
  // Base subscription price
  basePrice: 2000, // $2000 per month
  
  // Additional license pricing (unchanged from existing system)
  additionalLicensePrice: 250, // $250 per month per block of 5 users
  licenseBlockSize: 5, // Licenses are sold in blocks of 5
  
  // Annual billing discount
  annualDiscount: 0.2, // 20% discount for annual payments
  
  // Plan details
  planName: 'Premium',
  planDescription: 'Full access to all features with unlimited market analysis',
  
  // Features included
  features: [
    'Unlimited access to all features',
    'Advanced market analysis tools',
    'Provider contact information',
    'AI-powered insights',
    'Custom reporting',
    'Team collaboration tools',
    'Priority support',
    'Data export capabilities'
  ],
  
  // Billing cycles
  billingCycles: {
    monthly: {
      name: 'Monthly',
      discount: 0,
      description: 'Billed monthly'
    },
    annual: {
      name: 'Annual',
      discount: 0.2,
      description: 'Billed annually (20% off)'
    }
  }
};

// Helper functions for pricing calculations
export const calculateBasePrice = (billingCycle = 'monthly') => {
  if (billingCycle === 'annual') {
    return PRICING_CONFIG.basePrice * 12 * (1 - PRICING_CONFIG.annualDiscount);
  }
  return PRICING_CONFIG.basePrice;
};

export const calculateAdditionalCost = (additionalLicenses = 0, billingCycle = 'monthly') => {
  if (additionalLicenses === 0) return 0;
  
  const licenseBlocks = Math.ceil(additionalLicenses / PRICING_CONFIG.licenseBlockSize);
  const cost = licenseBlocks * PRICING_CONFIG.additionalLicensePrice;
  
  if (billingCycle === 'annual') {
    return cost * 12 * (1 - PRICING_CONFIG.annualDiscount);
  }
  return cost;
};

export const calculateTotal = (additionalLicenses = 0, billingCycle = 'monthly') => {
  return calculateBasePrice(billingCycle) + calculateAdditionalCost(additionalLicenses, billingCycle);
};

export const calculateSavings = (additionalLicenses = 0) => {
  const monthlySavings = PRICING_CONFIG.basePrice * PRICING_CONFIG.annualDiscount;
  const licenseSavings = additionalLicenses > 0 
    ? Math.ceil(additionalLicenses / PRICING_CONFIG.licenseBlockSize) * PRICING_CONFIG.additionalLicensePrice * PRICING_CONFIG.annualDiscount
    : 0;
  return (monthlySavings + licenseSavings) * 12;
};

// Format currency for display
export const formatCurrency = (amount, billingCycle = 'monthly') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return formatter.format(amount);
};

// Get display price with period
export const getDisplayPrice = (amount, billingCycle = 'monthly') => {
  const period = billingCycle === 'annual' ? 'year' : 'month';
  return `${formatCurrency(amount)}/${period}`;
};
