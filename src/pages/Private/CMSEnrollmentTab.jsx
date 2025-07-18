import React, { useState, useMemo } from 'react';
import styles from "./CMSEnrollmentTab.module.css";
import CMSEnrollmentPanel from "../../components/CMSEnrollmentPanel";
import CMSEnrollmentTrendChart from "../../components/CMSEnrollmentTrendChart";
import useCMSEnrollmentData from "../../hooks/useCMSEnrollmentData";
import ButtonGroup from "../../components/Buttons/ButtonGroup";
import Button from "../../components/Buttons/Button";

export default function CMSEnrollmentTab({ provider, radiusInMiles }) {
  const [selectedView, setSelectedView] = useState('overview'); // 'overview', 'trends', 'demographics'
  const [selectedTimeframe, setSelectedTimeframe] = useState('latest'); // 'latest', 'monthly', 'yearly'
  const [selectedMetric, setSelectedMetric] = useState('ma_and_other');
  
  // Fetch CMS enrollment data
  const { data, loading, error, latestMonth, months } = useCMSEnrollmentData(provider, radiusInMiles);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data || !latestMonth) return null;
    
    const latestData = data.filter(r => r.month === latestMonth);
    const totalBenes = latestData.reduce((sum, r) => sum + (r.total_benes || 0), 0);
    const maOther = latestData.reduce((sum, r) => sum + (r.ma_and_other || 0), 0);
    const originalMedicare = latestData.reduce((sum, r) => sum + (r.original_medicare || 0), 0);
    const dualEligible = latestData.reduce((sum, r) => sum + (r.dual_total || 0), 0);
    
    return {
      totalBenes,
      maOther,
      originalMedicare,
      dualEligible,
      maPercentage: totalBenes > 0 ? ((maOther / totalBenes) * 100).toFixed(1) : 0,
      dualPercentage: totalBenes > 0 ? ((dualEligible / totalBenes) * 100).toFixed(1) : 0
    };
  }, [data, latestMonth]);

  // Get trend data for selected metric
  const trendData = useMemo(() => {
    if (!data) return [];
    
    const byMonth = {};
    data.forEach(row => {
      if (!row.month) return;
      if (!byMonth[row.month]) {
        byMonth[row.month] = { month: row.month };
      }
      byMonth[row.month][selectedMetric] = (byMonth[row.month][selectedMetric] || 0) + (row[selectedMetric] || 0);
    });
    
    return Object.values(byMonth).sort((a, b) => {
      const [ay, am] = a.month.split('-').map(Number);
      const [by, bm] = b.month.split('-').map(Number);
      return ay !== by ? ay - by : am - bm;
    });
  }, [data, selectedMetric]);

  // Get demographic breakdown for latest month
  const demographicData = useMemo(() => {
    if (!data || !latestMonth) return null;
    
    const latestData = data.filter(r => r.month === latestMonth);
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
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading CMS enrollment data...</p>
        </div>
      </div>
    );
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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1>CMS Medicare Enrollment</h1>
            <p>Comprehensive Medicare enrollment data from the Centers for Medicare & Medicaid Services</p>
          </div>
          <div className={styles.headerStats}>
            {summaryStats && (
              <>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{summaryStats.totalBenes.toLocaleString()}</span>
                  <span className={styles.statLabel}>Total Beneficiaries</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{summaryStats.maPercentage}%</span>
                  <span className={styles.statLabel}>Medicare Advantage</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{summaryStats.dualPercentage}%</span>
                  <span className={styles.statLabel}>Dual Eligible</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.viewControls}>
          <ButtonGroup
            options={[
              { label: 'Overview', value: 'overview' },
              { label: 'Trends', value: 'trends' },
              { label: 'Demographics', value: 'demographics' }
            ]}
            selected={selectedView}
            onSelect={setSelectedView}
            size="md"
            variant="blue"
          />
        </div>
        
        {selectedView === 'trends' && (
          <div className={styles.trendControls}>
            <div className={styles.controlGroup}>
              <label>Metric:</label>
              <select 
                value={selectedMetric} 
                onChange={(e) => setSelectedMetric(e.target.value)}
                className={styles.select}
              >
                <option value="ma_and_other">Medicare Advantage & Other</option>
                <option value="original_medicare">Original Medicare</option>
                <option value="dual_total">Dual Eligible</option>
                <option value="aged_total">Aged (65+)</option>
                <option value="disabled_total">Disabled</option>
                <option value="prescription_drug_total">With Drug Coverage</option>
              </select>
            </div>
            <div className={styles.controlGroup}>
              <label>Timeframe:</label>
              <select 
                value={selectedTimeframe} 
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className={styles.select}
              >
                <option value="latest">Latest Month</option>
                <option value="monthly">Monthly Trends</option>
                <option value="yearly">Yearly Trends</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {selectedView === 'overview' && (
          <div className={styles.overviewSection}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <h3>Coverage Type</h3>
                <div className={styles.metricGroup}>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Medicare Advantage & Other</span>
                    <div className={styles.metricValue}>
                      <span className={styles.value}>{summaryStats?.maOther.toLocaleString()}</span>
                      <span className={styles.percentage}>({summaryStats?.maPercentage}%)</span>
                    </div>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Original Medicare</span>
                    <div className={styles.metricValue}>
                      <span className={styles.value}>{summaryStats?.originalMedicare.toLocaleString()}</span>
                      <span className={styles.percentage}>({summaryStats?.originalMedicare > 0 && summaryStats?.totalBenes > 0 ? ((summaryStats.originalMedicare / summaryStats.totalBenes) * 100).toFixed(1) : 0}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.metricCard}>
                <h3>Eligibility</h3>
                <div className={styles.metricGroup}>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Aged (65+)</span>
                    <div className={styles.metricValue}>
                      <span className={styles.value}>{demographicData ? Object.values(demographicData.ageGroups).reduce((sum, count) => sum + count, 0).toLocaleString() : '0'}</span>
                      <span className={styles.percentage}>(100%)</span>
                    </div>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Disabled</span>
                    <div className={styles.metricValue}>
                      <span className={styles.value}>{summaryStats?.totalBenes > 0 ? (summaryStats.totalBenes - Object.values(demographicData?.ageGroups || {}).reduce((sum, count) => sum + count, 0)).toLocaleString() : '0'}</span>
                      <span className={styles.percentage}>({summaryStats?.totalBenes > 0 ? ((summaryStats.totalBenes - Object.values(demographicData?.ageGroups || {}).reduce((sum, count) => sum + count, 0)) / summaryStats.totalBenes * 100).toFixed(1) : 0}%)</span>
                    </div>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Dual Eligible</span>
                    <div className={styles.metricValue}>
                      <span className={styles.value}>{summaryStats?.dualEligible.toLocaleString()}</span>
                      <span className={styles.percentage}>({summaryStats?.dualPercentage}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.metricCard}>
                <h3>Prescription Drug Coverage</h3>
                <div className={styles.metricGroup}>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>With Drug Coverage</span>
                    <div className={styles.metricValue}>
                      <span className={styles.value}>{data?.filter(r => r.month === latestMonth).reduce((sum, r) => sum + (r.prescription_drug_total || 0), 0).toLocaleString()}</span>
                      <span className={styles.percentage}>({summaryStats?.totalBenes > 0 ? ((data?.filter(r => r.month === latestMonth).reduce((sum, r) => sum + (r.prescription_drug_total || 0), 0) / summaryStats.totalBenes) * 100).toFixed(1) : 0}%)</span>
                    </div>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>PDP Only</span>
                    <div className={styles.metricValue}>
                      <span className={styles.value}>{data?.filter(r => r.month === latestMonth).reduce((sum, r) => sum + (r.prescription_drug_pdp || 0), 0).toLocaleString()}</span>
                      <span className={styles.percentage}>({summaryStats?.totalBenes > 0 ? ((data?.filter(r => r.month === latestMonth).reduce((sum, r) => sum + (r.prescription_drug_pdp || 0), 0) / summaryStats.totalBenes) * 100).toFixed(1) : 0}%)</span>
                    </div>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>MAPD</span>
                    <div className={styles.metricValue}>
                      <span className={styles.value}>{data?.filter(r => r.month === latestMonth).reduce((sum, r) => sum + (r.prescription_drug_mapd || 0), 0).toLocaleString()}</span>
                      <span className={styles.percentage}>({summaryStats?.totalBenes > 0 ? ((data?.filter(r => r.month === latestMonth).reduce((sum, r) => sum + (r.prescription_drug_mapd || 0), 0) / summaryStats.totalBenes) * 100).toFixed(1) : 0}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'trends' && (
          <div className={styles.trendsSection}>
            <div className={styles.trendChart}>
              <h3>{selectedMetric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Trends</h3>
              <CMSEnrollmentTrendChart
                data={trendData}
                metric={selectedMetric}
              />
            </div>
          </div>
        )}

        {selectedView === 'demographics' && demographicData && (
          <div className={styles.demographicsSection}>
            <div className={styles.demographicsGrid}>
              <div className={styles.demographicCard}>
                <h3>Age Distribution</h3>
                <div className={styles.ageChart}>
                  {Object.entries(demographicData.ageGroups).map(([age, count]) => {
                    const percentage = summaryStats.totalBenes > 0 ? ((count / summaryStats.totalBenes) * 100).toFixed(1) : 0;
                    return (
                      <div key={age} className={styles.ageBar}>
                        <div className={styles.ageLabel}>{age}</div>
                        <div className={styles.ageBarContainer}>
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
                          width: `${summaryStats.totalBenes > 0 ? (demographicData.gender.male / summaryStats.totalBenes * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className={styles.genderValue}>
                      {demographicData.gender.male.toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.genderItem}>
                    <div className={styles.genderLabel}>Female</div>
                    <div className={styles.genderBar}>
                      <div 
                        className={styles.genderBarFill} 
                        style={{ 
                          width: `${summaryStats.totalBenes > 0 ? (demographicData.gender.female / summaryStats.totalBenes * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className={styles.genderValue}>
                      {demographicData.gender.female.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.demographicCard}>
                <h3>Race & Ethnicity</h3>
                <div className={styles.raceChart}>
                  {Object.entries(demographicData.race).map(([race, count]) => {
                    const percentage = summaryStats.totalBenes > 0 ? ((count / summaryStats.totalBenes) * 100).toFixed(1) : 0;
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
      </div>

      <div className={styles.info}>
        <h4>About This Data</h4>
        <p>
          This tab provides comprehensive Medicare enrollment data directly from the Centers for Medicare & Medicaid Services (CMS). 
          The data includes detailed demographic breakdowns by county, including age distribution, race/ethnicity, 
          dual eligibility status, and prescription drug coverage.
        </p>
        <div className={styles.dataSource}>
          <strong>Data Source:</strong> CMS Medicare Enrollment Data API<br/>
          <strong>Coverage:</strong> All Medicare beneficiaries by county<br/>
          <strong>Updates:</strong> Annual and monthly data releases<br/>
          <strong>Latest Data:</strong> {latestMonth || 'N/A'}
        </div>
      </div>
    </div>
  );
} 