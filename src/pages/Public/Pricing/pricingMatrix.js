// Feature matrix data - easy to add/remove/modify
export const featureMatrix = [
  {
    feature: 'Price',
    starter: 'price', // Special type that will be handled by the component
    advanced: 'price',
    pro: 'price',
    type: 'price'
  },
  {
    feature: 'Team Members',
    starter: 'dynamic', // Will be handled by the component using Supabase data
    advanced: 'dynamic',
    pro: 'dynamic',
    type: 'text'
  },
  {
    feature: 'Saved Markets',
    starter: 'dynamic', // Will be handled by the component using Supabase data
    advanced: 'dynamic',
    pro: 'dynamic',
    type: 'text'
  },
  {
    feature: 'Available Filters',
    starter: 'Basic',
    advanced: 'Advanced',
    pro: 'Custom',
    type: 'text'
  },
  {
    feature: 'Provider Contact Info',
    starter: '-',
    advanced: 'Limited',
    pro: 'Full',
    type: 'text'
  },
  // {
  //   feature: 'AI Marketing Assistant',
  //   starter: '-',
  //   advanced: 'Basic',
  //   pro: 'Advanced',
  //   type: 'text'
  // }
];

// Plan descriptions for the header
export const planDescriptions = {
  starter: {
    name: 'Starter',
    description: 'Best for small teams focused on a specific region or service area'
  },
  advanced: {
    name: 'Advanced',
    description: 'A solid fit for growing teams working across multiple markets or regions'
  },
  pro: {
    name: 'Pro',
    description: 'For large, distributed teams needing broad access and full market visibility'
  }
};
