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
  const [selectedView, setSelectedView] = useState(defaultView); // 'overview', 'demographics', 'payers'
  
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

  // Calculate demographic data
  const demographicData = useMemo(() => {
    if (!data || !latestMonth) return null;
    
    const latestData = data.filter(r => r.month === latestMonth);
    if (latestData.length === 0) return null;
    
    const total = latestData.reduce((sum, r) => sum + (r.total_benes || 0), 0);
    
    if (total === 0) return null;
    
    return {
      ageGroups: {
        '65-69': latestData.reduce((sum, r) => sum + (r.age_65_to_69 || 0), 0),
        '70-74': latestData.reduce((sum, r) => sum + (r.age_70_to_74 || 0), 0),
        '75-79': latestData.reduce((sum, r) => sum + (r.age_75_to_79 || 0), 0),
        '80-84': latestData.reduce((sum, r) => sum + (r.age_80_to_84 || 0), 0),
        '85-89': latestData.reduce((sum, r) => sum + (r.age_85_to_89 || 0), 0),
        '90-94': latestData.reduce((sum, r) => sum + (r.age_90_to_94 || 0), 0),
        '95+': latestData.reduce((sum, r) => sum + (r.age_gt_94 || 0), 0),
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



        {selectedView === 'demographics' && (
          <div className={styles.demographicsSection}>
            <div className={styles.demographicGrid}>
              <div className={styles.demographicCard}>
                <h3>Age Distribution</h3>
                <div className={styles.ageChart}>
                  {Object.entries(demographicData?.ageGroups || {}).map(([age, count]) => {
                    const percentage = summaryStats?.totalBenes > 0 ? ((count / summaryStats.totalBenes) * 100).toFixed(1) : 0;
                    return (
                      <div key={age} className={styles.ageItem}>
                        <div className={styles.ageLabel}>{age}</div>
                        <div className={styles.ageBar}>
                          <div 
                            className={styles.ageBarFill} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className={styles.ageValue}>
                          {count.toLocaleString()} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.demographicCard}>
                <h3>Gender Distribution</h3>
                <div className={styles.genderChart}>
                  <div className={styles.genderItem}>
                    <div className={styles.genderLabel}>Male</div>
                    <div className={styles.genderBar}>
                      <div 
                        className={styles.genderBarFill} 
                        style={{ 
                          width: `${summaryStats?.totalBenes > 0 ? (demographicData?.gender.male / summaryStats.totalBenes * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className={styles.genderValue}>
                      {demographicData?.gender.male.toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.genderItem}>
                    <div className={styles.genderLabel}>Female</div>
                    <div className={styles.genderBar}>
                      <div 
                        className={styles.genderBarFill} 
                        style={{ 
                          width: `${summaryStats?.totalBenes > 0 ? (demographicData?.gender.female / summaryStats.totalBenes * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className={styles.genderValue}>
                      {demographicData?.gender.female.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.demographicCard}>
                <h3>Race & Ethnicity</h3>
                <div className={styles.raceChart}>
                  {Object.entries(demographicData?.race || {}).map(([race, count]) => {
                    const percentage = summaryStats?.totalBenes > 0 ? ((count / summaryStats.totalBenes) * 100).toFixed(1) : 0;
                    return (
                      <div key={race} className={styles.raceItem}>
                        <div className={styles.raceLabel}>
                          {race.charAt(0).toUpperCase() + race.slice(1)}
                        </div>
                        <div className={styles.raceBar}>
                          <div 
                            className={styles.raceBarFill} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className={styles.raceValue}>
                          {count.toLocaleString()} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
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