import React, { useState, useMemo, useEffect } from 'react';
import styles from "./CMSEnrollmentTab.module.css";
import CMSEnrollmentPanel from "./CMSEnrollmentPanel";
import MAEnrollmentPanel from "./MAEnrollmentPanel";

import useCMSEnrollmentData from "../../../../hooks/useCMSEnrollmentData";
import useMAEnrollmentData from "../../../../hooks/useMAEnrollmentData";
import { apiUrl } from "../../../../utils/api";

import Button from "../../../../components/Buttons/Button";
import Spinner from "../../../../components/Buttons/Spinner";

export default function CMSEnrollmentTab({ provider, radiusInMiles, defaultView = 'overview' }) {
  const [selectedView, setSelectedView] = useState(defaultView); // 'overview', 'payers'
  
  // Update selectedView when defaultView prop changes (URL navigation)
  useEffect(() => {
    setSelectedView(defaultView);
  }, [defaultView]);
  
  // MA Enrollment state
  const [publishDates, setPublishDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [errorDates, setErrorDates] = useState(null);
  const [selectedType, setSelectedType] = useState("MA");
  
  // Fetch CMS enrollment data
  const { data, loading, error, latestMonth } = useCMSEnrollmentData(provider, radiusInMiles);

  // Fetch MA enrollment dates
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

  // MA Enrollment data
  const publishDate = publishDates[publishDates.length - 1];
  const { data: maData, loading: maLoading, error: maError } = useMAEnrollmentData(provider, radiusInMiles, publishDate, selectedType);
  
  console.log('🔍 Main data sample:', data?.slice(0, 2));
  console.log('🔍 Latest month:', latestMonth);



  // Calculate summary statistics for the main data
  const summaryStats = useMemo(() => {
    if (!data || !latestMonth) return null;
    
    const latestData = data.filter(r => r.month === latestMonth);
    if (latestData.length === 0) return null;
    
    const totalBenes = latestData.reduce((sum, r) => sum + (r.total_benes || 0), 0);
    const maOther = latestData.reduce((sum, r) => sum + (r.ma_and_other || 0), 0);
    const originalMedicare = latestData.reduce((sum, r) => sum + (r.original_medicare || 0), 0);
    const dualEligible = latestData.reduce((sum, r) => sum + (r.dual_total || 0), 0);
    const agedTotal = latestData.reduce((sum, r) => sum + (r.aged_total || 0), 0);
    const disabledTotal = latestData.reduce((sum, r) => sum + (r.disabled_total || 0), 0);
    const drugTotal = latestData.reduce((sum, r) => sum + (r.prescription_drug_total || 0), 0);
    const drugPdp = latestData.reduce((sum, r) => sum + (r.prescription_drug_pdp || 0), 0);
    const drugMapd = latestData.reduce((sum, r) => sum + (r.prescription_drug_mapd || 0), 0);
    
    return {
      totalBenes,
      maOther,
      originalMedicare,
      dualEligible,
      agedTotal,
      disabledTotal,
      drugTotal,
      drugPdp,
      drugMapd,
      maPercentage: totalBenes > 0 ? ((maOther / totalBenes) * 100).toFixed(1) : '0.0',
      originalMedicarePercentage: totalBenes > 0 ? ((originalMedicare / totalBenes) * 100).toFixed(1) : '0.0',
      dualPercentage: totalBenes > 0 ? ((dualEligible / totalBenes) * 100).toFixed(1) : '0.0',
      agedPercentage: totalBenes > 0 ? ((agedTotal / totalBenes) * 100).toFixed(1) : '0.0',
      disabledPercentage: totalBenes > 0 ? ((disabledTotal / totalBenes) * 100).toFixed(1) : '0.0',
      drugPercentage: totalBenes > 0 ? ((drugTotal / totalBenes) * 100).toFixed(1) : '0.0',
      pdpPercentage: totalBenes > 0 ? ((drugPdp / totalBenes) * 100).toFixed(1) : '0.0',
      mapdPercentage: totalBenes > 0 ? ((drugMapd / totalBenes) * 100).toFixed(1) : '0.0'
    };
  }, [data, latestMonth]);



  if (loading) {
    return <Spinner message="Loading CMS enrollment data..." />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
                         {selectedView === 'overview' && (
          <CMSEnrollmentPanel 
            data={data} 
            loading={loading} 
            error={error}
            latestMonth={latestMonth}
          />
        )}





        {selectedView === 'payers' && (
          <>
            {loadingDates ? (
              <div>Loading available dates...</div>
            ) : errorDates ? (
              <div>Error loading dates: {errorDates}</div>
            ) : !publishDates.length ? (
              <div>No enrollment dates available.</div>
            ) : (
              <div className={styles.payersLayout}>
                {/* Left Panel - Controls and Summary Cards */}
                <div className={styles.payersLeftPanel}>
                  <div className={styles.payersHeader}>
                    <h3>Medicare Advantage Enrollment</h3>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                      Medicare enrollment data for {publishDate}
                    </span>
                  </div>
                  
                  <div className={styles.planTypeControls}>
                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                      Plan Type:
                    </span>
                    <div className={styles.planTypeButtons}>
                      <button
                        className={`${styles.planTypeButton} ${selectedType === "MA" ? styles.active : ""}`}
                        onClick={() => setSelectedType("MA")}
                      >
                        Medicare Advantage
                      </button>
                      <button
                        className={`${styles.planTypeButton} ${selectedType === "PDP" ? styles.active : ""}`}
                        onClick={() => setSelectedType("PDP")}
                      >
                        Prescription Drug Plans
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.summaryCards}>
                    <MAEnrollmentPanel 
                      data={maData} 
                      loading={maLoading} 
                      error={maError}
                      type={selectedType}
                    />
                  </div>
                </div>
                
                {/* Right Panel - Organization List */}
                <div className={styles.payersRightPanel}>
                  <div className={styles.organizationList}>
                    <MAEnrollmentPanel 
                      data={maData} 
                      loading={maLoading} 
                      error={maError}
                      type={selectedType}
                      showTableOnly={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 