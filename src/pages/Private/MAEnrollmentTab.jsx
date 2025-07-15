import React, { useEffect, useState } from 'react';
import styles from "./MAEnrollmentTab.module.css";
import MAEnrollmentPanel from "../../components/MAEnrollmentPanel";
import MAEnrollmentTrendChart from "../../components/MAEnrollmentTrendChart";
import useMAEnrollmentData, { useMAEnrollmentTrendData } from "../../hooks/useMAEnrollmentData";
import { apiUrl } from "../../utils/api";

export default function MAEnrollmentTab({ provider, radiusInMiles }) {
  const [publishDates, setPublishDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [errorDates, setErrorDates] = useState(null);
  const [selectedType, setSelectedType] = useState("ALL");

  useEffect(() => {
    async function fetchDates() {
      setLoadingDates(true);
      setErrorDates(null);
      try {
        const resp = await fetch(apiUrl('/api/ma-enrollment-dates'));
        if (!resp.ok) throw new Error('Failed to fetch publish dates');
        const result = await resp.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch publish dates');
        setPublishDates(result.data || []);
      } catch (err) {
        setErrorDates(err.message);
        setPublishDates([]);
      } finally {
        setLoadingDates(false);
      }
    }
    fetchDates();
  }, []);

  // Always call hooks in the same order
  const publishDate = publishDates[publishDates.length - 1];
  const startDate = publishDates[0];
  const endDate = publishDate;

  const { data, loading, error } = useMAEnrollmentData(provider, radiusInMiles, publishDate, selectedType);
  const { data: trendData, loading: trendLoading, error: trendError } = useMAEnrollmentTrendData(provider, radiusInMiles, startDate, endDate, selectedType);

  // Only render loading/error/empty UI here
  if (loadingDates) return <div>Loading available dates...</div>;
  if (errorDates) return <div>Error loading dates: {errorDates}</div>;
  if (!publishDates.length) return <div>No enrollment dates available.</div>;

  const getTypeLabel = (type) => {
    switch (type) {
      case "MA": return "Medicare Advantage";
      case "PDP": return "Prescription Drug Plans";
      case "ALL": return "All Plans";
      default: return "All Plans";
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Medicare Enrollment</h2>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>
              Medicare enrollment data for {publishDate}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="type-select" style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                Plan Type:
              </label>
              <select
                id="type-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '0.9rem',
                  width: 'auto',
                  minWidth: '120px'
                }}
              >
                <option value="ALL">All Plans (MA + PDP)</option>
                <option value="MA">Medicare Advantage Only</option>
                <option value="PDP">Prescription Drug Plans Only</option>
              </select>
            </div>
          </div>
        </div>
        
        <MAEnrollmentPanel 
          data={data} 
          loading={loading} 
          error={error}
          type={selectedType}
        />
        
        <MAEnrollmentTrendChart
          data={trendData}
          loading={trendLoading}
          error={trendError}
          startDate={startDate}
          endDate={endDate}
          type={selectedType}
        />
      </div>
    </div>
  );
} 