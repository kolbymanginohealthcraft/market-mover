import { useMemo } from 'react';

export const useCensusFormatters = () => {
  const formatters = useMemo(() => ({
    formatNumber: (num) => {
      if (num === null || num === undefined) return 'N/A';
      return new Intl.NumberFormat().format(Math.round(num));
    },

    formatCurrency: (num) => {
      if (num === null || num === undefined) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num);
    },

    formatPercent: (num) => {
      if (num === null || num === undefined) return 'N/A';
      return `${(num * 100).toFixed(1)}%`;
    }
  }), []);

  return formatters;
}; 