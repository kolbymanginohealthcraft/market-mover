import { useState, useEffect, useMemo } from 'react';
import useCMSEnrollmentData from '../../../hooks/useCMSEnrollmentData';
import { useCMSEnrollmentDataByLevel, useCMSEnrollmentYears } from '../../../hooks/useCMSEnrollmentData';

export const useCMSEnrollmentData = (provider, radiusInMiles) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch CMS enrollment data
  const { 
    data: enrollmentData, 
    loading: enrollmentLoading, 
    error: enrollmentError, 
    latestMonth, 
    months 
  } = useCMSEnrollmentData(provider, radiusInMiles);

  // Fetch available years
  const { data: availableYears } = useCMSEnrollmentYears();

  // Get the latest year for benchmarks
  const latestYear = availableYears && availableYears.length > 0 ? availableYears[0] : '2023';

  useEffect(() => {
    if (enrollmentLoading) {
      setLoading(true);
      return;
    }

    if (enrollmentError) {
      setError(enrollmentError);
      setLoading(false);
      return;
    }

    if (enrollmentData) {
      setData(enrollmentData);
      setLoading(false);
    }
  }, [enrollmentData, enrollmentLoading, enrollmentError]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data || !latestMonth) return null;

    const latestData = data.filter(r => r.month === latestMonth);
    if (latestData.length === 0) return null;

    const totalBenes = latestData.reduce((sum, r) => sum + (r.total_benes || 0), 0);
    const maOther = latestData.reduce((sum, r) => sum + (r.ma_and_other || 0), 0);
    const originalMedicare = latestData.reduce((sum, r) => sum + (r.original_medicare || 0), 0);
    const dualTotal = latestData.reduce((sum, r) => sum + (r.dual_total || 0), 0);

    return {
      totalBenes,
      maOther,
      originalMedicare,
      dualTotal,
      maPercentage: totalBenes > 0 ? ((maOther / totalBenes) * 100).toFixed(1) : 0,
      dualPercentage: totalBenes > 0 ? ((dualTotal / totalBenes) * 100).toFixed(1) : 0
    };
  }, [data, latestMonth]);

  // Calculate demographic data
  const demographicData = useMemo(() => {
    if (!data || !latestMonth) return null;

    const latestData = data.filter(r => r.month === latestMonth);
    if (latestData.length === 0) return null;

    return {
      ageGroups: {
        '65-74': latestData.reduce((sum, r) => sum + (r.age_65_74 || 0), 0),
        '75-84': latestData.reduce((sum, r) => sum + (r.age_75_84 || 0), 0),
        '85+': latestData.reduce((sum, r) => sum + (r.age_85_plus || 0), 0),
      },
      gender: {
        male: latestData.reduce((sum, r) => sum + (r.male_total || 0), 0),
        female: latestData.reduce((sum, r) => sum + (r.female_total || 0), 0),
      },
      race: {
        white: latestData.reduce((sum, r) => sum + (r.white_total || 0), 0),
        black: latestData.reduce((sum, r) => sum + (r.black_total || 0), 0),
        hispanic: latestData.reduce((sum, r) => sum + (r.hispanic_total || 0), 0),
        api: latestData.reduce((sum, r) => sum + (r.api_total || 0), 0),
        native: latestData.reduce((sum, r) => sum + (r.native_indian_total || 0), 0),
        other: latestData.reduce((sum, r) => sum + (r.other_total || 0), 0),
      }
    };
  }, [data, latestMonth]);

  return {
    data,
    loading,
    error,
    latestMonth,
    months,
    summaryStats,
    demographicData
  };
}; 