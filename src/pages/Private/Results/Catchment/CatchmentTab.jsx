import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Target, MapPin, Users, TrendingUp, Calendar, Filter, Download } from 'lucide-react';
import { apiUrl } from '../../../../utils/api';
import Spinner from '../../../../components/Buttons/Spinner';
import Banner from '../../../../components/Buttons/Banner';
import { useProviderAnalysis } from '../../../../components/Context/ProviderAnalysisContext';
import styles from './CatchmentTab.module.css';

export default function CatchmentTab({ providerInfo, marketInfo }) {
  const { dhc, marketId } = useParams();
  const [catchmentData, setCatchmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  const isProviderMode = !!dhc;
  const isMarketMode = !!marketId;
  const contextInfo = isProviderMode ? providerInfo : marketInfo;
  
  // Get all CCNs from the provider analysis context
  const { getAllCcns } = useProviderAnalysis();

  useEffect(() => {
    if (!contextInfo) return;

    console.log('🔍 ContextInfo:', contextInfo);
    console.log('🔍 Provider mode:', isProviderMode);
    console.log('🔍 Market mode:', isMarketMode);

    async function fetchCatchmentData() {
      setLoading(true);
      setError(null);

      try {
        const allCcns = getAllCcns();
        console.log('🔍 Using all CCNs from context:', allCcns);
        console.log('🔍 Total CCNs available:', allCcns.length);

        const response = await fetch(apiUrl("/api/catchment-data"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ccn: allCcns,
            marketId: isMarketMode ? marketId : null,
            filters
          })
        });

        const result = await response.json();
        
        if (result.success) {
          setCatchmentData(result.data);
        } else {
          setError(result.message || 'Failed to fetch catchment data');
        }
      } catch (err) {
        console.error('Error fetching catchment data:', err);
        setError('Failed to fetch catchment data');
      } finally {
        setLoading(false);
      }
    }

    fetchCatchmentData();
  }, [contextInfo, filters, isProviderMode, isMarketMode, marketId, getAllCcns]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportData = () => {
    if (!catchmentData) return;
    
    const csvContent = [
      ['ZIP Code', 'Total Cases', 'Total Days of Care', 'Total Charges'],
      ...catchmentData.map(row => [
        row.ZIP_CD_OF_RESIDENCE,
        row.TOTAL_CASES,
        row.TOTAL_DAYS_OF_CARE,
        row.TOTAL_CHARGES
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catchment-data-2024.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <Banner 
          title="Hospital Service Area Analysis"
          description="Geographic distribution of patient discharges, days of care, and charges"
          icon={Target}
        />
        <div className={styles.loadingContainer}>
          <Spinner />
          <p>Loading catchment data...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Banner 
          title="Hospital Service Area Analysis"
          description="Geographic distribution of patient discharges, days of care, and charges"
          icon={Target}
        />
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Banner 
        title="Hospital Service Area Analysis"
        description="Geographic distribution of patient discharges, days of care, and charges - Under Construction"
        icon={Target}
      />

      <div className={styles.controls}>
        <button onClick={exportData} className={styles.exportButton} disabled={!catchmentData}>
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {catchmentData && (
        <div className={styles.content}>
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>
                <MapPin size={20} />
              </div>
              <div className={styles.summaryContent}>
                <h3>Service Areas</h3>
                <p>{catchmentData.length} ZIP codes</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>
                <Users size={20} />
              </div>
              <div className={styles.summaryContent}>
                <h3>Total Cases</h3>
                <p>{catchmentData.reduce((sum, row) => sum + (parseInt(row.TOTAL_CASES) || 0), 0).toLocaleString()}</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>
                <Calendar size={20} />
              </div>
              <div className={styles.summaryContent}>
                <h3>Total Days</h3>
                <p>{catchmentData.reduce((sum, row) => sum + (parseInt(row.TOTAL_DAYS_OF_CARE) || 0), 0).toLocaleString()}</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>
                <TrendingUp size={20} />
              </div>
              <div className={styles.summaryContent}>
                <h3>Total Charges</h3>
                <p>${catchmentData.reduce((sum, row) => sum + (parseInt(row.TOTAL_CHARGES) || 0), 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ZIP Code</th>
                  <th>Total Cases</th>
                  <th>Total Days of Care</th>
                  <th>Total Charges</th>
                  <th>Avg Days per Case</th>
                  <th>Avg Charge per Case</th>
                </tr>
              </thead>
              <tbody>
                {catchmentData.map((row, index) => {
                  const cases = parseInt(row.TOTAL_CASES) || 0;
                  const days = parseInt(row.TOTAL_DAYS_OF_CARE) || 0;
                  const charges = parseInt(row.TOTAL_CHARGES) || 0;
                  const avgDays = cases > 0 ? (days / cases).toFixed(1) : '0';
                  const avgCharges = cases > 0 ? (charges / cases).toFixed(0) : '0';

                  return (
                    <tr key={index}>
                      <td>{row.ZIP_CD_OF_RESIDENCE}</td>
                      <td>{cases.toLocaleString()}</td>
                      <td>{days.toLocaleString()}</td>
                      <td>${charges.toLocaleString()}</td>
                      <td>{avgDays}</td>
                      <td>${avgCharges}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
