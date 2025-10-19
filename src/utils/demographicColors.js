/**
 * Demographic Color Utilities
 * Color schemes and formatting functions for demographic choropleth maps
 */

// Color schemes using ColorBrewer palettes (accessible and print-friendly)
export const COLOR_SCHEMES = {
  // Sequential schemes (light to dark = low to high)
  median_income: {
    name: 'Income',
    colors: ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#de2d26', '#a50f15'],
    noDataColor: '#e0e0e0'
  },
  per_capita_income: {
    name: 'Per Capita Income',
    colors: ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#de2d26', '#a50f15'],
    noDataColor: '#e0e0e0'
  },
  median_home_value: {
    name: 'Home Value',
    colors: ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'],
    noDataColor: '#e0e0e0'
  },
  median_rent: {
    name: 'Rent',
    colors: ['#edf8e9', '#c7e9c0', '#a1d99b', '#74c476', '#31a354', '#006d2c'],
    noDataColor: '#e0e0e0'
  },
  total_population: {
    name: 'Population',
    colors: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd'],
    noDataColor: '#e0e0e0'
  },
  population_65_plus_pct: {
    name: '% Population 65+',
    colors: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#d7301f'],
    noDataColor: '#e0e0e0'
  },
  poverty_rate: {
    name: 'Poverty Rate',
    colors: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#238b45'],
    noDataColor: '#e0e0e0'
  },
  uninsured_rate: {
    name: 'Uninsured Rate',
    colors: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#cb181d'],
    noDataColor: '#e0e0e0'
  },
  disability_rate: {
    name: 'Disability Rate',
    colors: ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#2ca25f'],
    noDataColor: '#e0e0e0'
  },
  bachelors_plus_rate: {
    name: "Bachelor's+ Rate",
    colors: ['#f7f4f9', '#e7e1ef', '#d4b9da', '#c994c7', '#df65b0', '#ce1256'],
    noDataColor: '#e0e0e0'
  }
};

/**
 * Get the color for a value based on quantile breaks
 * @param {number} value - The metric value
 * @param {Array<number>} breaks - Quantile break points [min, q20, q40, q60, q80, max]
 * @param {string} metric - The metric name to determine color scheme
 * @returns {string} Hex color code
 */
export function getColorForValue(value, breaks, metric) {
  const scheme = COLOR_SCHEMES[metric] || COLOR_SCHEMES.median_income;
  
  if (value === null || value === undefined || isNaN(value)) {
    return scheme.noDataColor;
  }

  // Handle edge cases
  if (breaks.length < 2 || value < breaks[0]) {
    return scheme.colors[0];
  }
  if (value >= breaks[breaks.length - 1]) {
    return scheme.colors[scheme.colors.length - 1];
  }

  // Find which quantile the value falls into
  for (let i = 0; i < breaks.length - 1; i++) {
    if (value >= breaks[i] && value < breaks[i + 1]) {
      return scheme.colors[Math.min(i, scheme.colors.length - 1)];
    }
  }

  return scheme.colors[scheme.colors.length - 1];
}

/**
 * Format a metric value for display
 * @param {number} value - The value to format
 * @param {string} metric - The metric name
 * @returns {string} Formatted string
 */
export function formatMetricValue(value, metric) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'No data';
  }

  // Percentage metrics
  if (metric.endsWith('_rate') || metric.endsWith('_pct')) {
    return `${(value * 100).toFixed(1)}%`;
  }

  // Currency metrics
  if (metric.includes('income') || metric.includes('rent') || metric.includes('value')) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  // Population metrics
  if (metric.includes('population')) {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  }

  // Default number formatting
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1
  }).format(value);
}

/**
 * Get a human-friendly label for a metric
 * @param {string} metric - The metric name
 * @returns {string} Display label
 */
export function getMetricLabel(metric) {
  const labels = {
    median_income: 'Median Household Income',
    per_capita_income: 'Per Capita Income',
    median_home_value: 'Median Home Value',
    median_rent: 'Median Gross Rent',
    total_population: 'Total Population',
    population_65_plus: 'Population 65+',
    population_65_plus_pct: '% Population 65+',
    poverty_rate: 'Poverty Rate',
    uninsured_rate: 'Uninsured Rate',
    disability_rate: 'Disability Rate',
    bachelors_plus_rate: "Bachelor's Degree or Higher"
  };

  return labels[metric] || metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get metric description/tooltip
 * @param {string} metric - The metric name
 * @returns {string} Description
 */
export function getMetricDescription(metric) {
  const descriptions = {
    median_income: 'Median household income in the past 12 months (inflation-adjusted)',
    per_capita_income: 'Per capita income in the past 12 months (inflation-adjusted)',
    median_home_value: 'Median value of owner-occupied housing units',
    median_rent: 'Median gross rent (contract rent plus utilities)',
    total_population: 'Total population count',
    population_65_plus: 'Population aged 65 years and older',
    population_65_plus_pct: 'Percentage of population aged 65 years and older',
    poverty_rate: 'Percentage of population with income below poverty level',
    uninsured_rate: 'Percentage of population without health insurance coverage',
    disability_rate: 'Percentage of civilian noninstitutionalized population with a disability',
    bachelors_plus_rate: "Percentage of population 25+ with bachelor's degree or higher"
  };

  return descriptions[metric] || '';
}

/**
 * Available demographic metrics for selection
 */
export const DEMOGRAPHIC_METRICS = [
  {
    id: 'median_income',
    label: 'Median Income',
    category: 'Economic',
    description: 'Median household income'
  },
  {
    id: 'per_capita_income',
    label: 'Per Capita Income',
    category: 'Economic',
    description: 'Average income per person'
  },
  {
    id: 'poverty_rate',
    label: 'Poverty Rate',
    category: 'Economic',
    description: '% below poverty level'
  },
  {
    id: 'population_65_plus_pct',
    label: '% Population 65+',
    category: 'Age',
    description: 'Senior population percentage'
  },
  {
    id: 'total_population',
    label: 'Total Population',
    category: 'Population',
    description: 'Total population count'
  },
  {
    id: 'median_home_value',
    label: 'Median Home Value',
    category: 'Housing',
    description: 'Median owner-occupied home value'
  },
  {
    id: 'median_rent',
    label: 'Median Rent',
    category: 'Housing',
    description: 'Median gross rent'
  },
  {
    id: 'uninsured_rate',
    label: 'Uninsured Rate',
    category: 'Health',
    description: '% without health insurance'
  },
  {
    id: 'disability_rate',
    label: 'Disability Rate',
    category: 'Health',
    description: '% with a disability'
  },
  {
    id: 'bachelors_plus_rate',
    label: "Bachelor's+ Rate",
    category: 'Education',
    description: "% with bachelor's degree or higher"
  }
];

/**
 * Group metrics by category
 */
export function getMetricsByCategory() {
  const grouped = {};
  DEMOGRAPHIC_METRICS.forEach(metric => {
    if (!grouped[metric.category]) {
      grouped[metric.category] = [];
    }
    grouped[metric.category].push(metric);
  });
  return grouped;
}

