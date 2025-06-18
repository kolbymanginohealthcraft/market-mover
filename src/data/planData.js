export const PLANS = [
  {
    id: 1,
    name: 'Starter',
    basePrice: 2500,
    features: [
      'Includes 5 users',
      'Basic provider search',
      'Summary analytics',
      'Email support',
      'Extra 5 users: +$250/mo',
    ],
    badge: null,
  },
  {
    id: 2,
    name: 'Advanced',
    basePrice: 3750,
    features: [
      'Includes 10 users',
      'Full provider profiles',
      'Save & export data',
      'Priority support',
      'Extra 5 users: +$250/mo',
    ],
    badge: 'Most Popular',
  },
  {
    id: 3,
    name: 'Pro',
    basePrice: 5750,
    features: [
      'Includes 10 users',
      'Custom analytics dashboard',
      'Team collaboration tools',
      'Dedicated account manager',
      'Extra 5 users: +$250/mo',
    ],
    badge: null,
  },
];


export function calculatePrice(amount, billingCycle) {
  if (!amount) return '$0';
  if (billingCycle === 'monthly') return `$${amount.toLocaleString()}/mo`;
  const annual = amount * 12 * 0.8;
  return `$${annual.toLocaleString()}/yr`;
}

export function calculateSavings(amount) {
  if (!amount) return null;
  const savings = amount * 12 * 0.2;
  return `$${savings.toLocaleString()} saved`;
}
