import { useState } from 'react';

export const useCMSEnrollmentViews = () => {
  const [selectedView, setSelectedView] = useState('overview'); // 'overview', 'trends', 'demographics', 'payers'
  const [selectedTimeframe, setSelectedTimeframe] = useState('latest'); // 'latest', 'monthly', 'yearly'
  const [selectedMetric, setSelectedMetric] = useState('ma_and_other');

  return {
    selectedView,
    setSelectedView,
    selectedTimeframe,
    setSelectedTimeframe,
    selectedMetric,
    setSelectedMetric
  };
}; 