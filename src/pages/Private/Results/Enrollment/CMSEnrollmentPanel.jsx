import React, { useState, useMemo } from 'react';
import styles from './CMSEnrollmentPanel.module.css';
import CMSEnrollmentTrendChart from './CMSEnrollmentTrendChart';
import Spinner from '../../../../components/Buttons/Spinner';
import { useNationalCMSEnrollmentData } from '../../../../hooks/useCMSEnrollmentData';

const METRIC_GROUPS = [
  {
    title: 'Summary',
    metrics: [
      { key: 'total_benes', label: 'Total Beneficiaries' },
    ]
  },
  {
    title: 'Coverage Type',
    metrics: [
      { key: 'ma_and_other', label: 'Medicare Advantage & Other' },
      { key: 'original_medicare', label: 'Original Medicare' },
    ]
  },
  {
    title: 'Eligibility',
    metrics: [
      { key: 'aged_total', label: 'Aged (65+)' },
      { key: 'disabled_total', label: 'Disabled' },
      { key: 'dual_total', label: 'Dual Eligible' },
    ]
  },
  {
    title: 'Age Distribution',
    metrics: [
      { key: 'age_65_to_69', label: 'Age 65-69' },
      { key: 'age_70_to_74', label: 'Age 70-74' },
      { key: 'age_75_to_79', label: 'Age 75-79' },
      { key: 'age_80_to_84', label: 'Age 80-84' },
      { key: 'age_85_to_89', label: 'Age 85-89' },
      { key: 'age_90_to_94', label: 'Age 90-94' },
      { key: 'age_gt_94', label: 'Age 95+' },
    ]
  },
  {
    title: 'Gender',
    metrics: [
      { key: 'male_total', label: 'Male' },
      { key: 'female_total', label: 'Female' },
    ]
  },
  {
    title: 'Race & Ethnicity',
    metrics: [
      { key: 'white_total', label: 'White' },
      { key: 'black_total', label: 'Black' },
      { key: 'hispanic_total', label: 'Hispanic' },
      { key: 'api_total', label: 'Asian/Pacific Islander' },
      { key: 'native_indian_total', label: 'Native American' },
      { key: 'other_total', label: 'Other' },
    ]
  },
  {
    title: 'Prescription Drug Coverage',
    metrics: [
      { key: 'prescription_drug_total', label: 'With Drug Coverage' },
      { key: 'prescription_drug_pdp', label: 'PDP Only' },
      { key: 'prescription_drug_mapd', label: 'MAPD' },
    ]
  }
];

export default function CMSEnrollmentPanel({ data, loading, error, latestMonth }) {
  const [selectedMetric, setSelectedMetric] = useState('ma_and_other');
  const [displayMode, setDisplayMode] = useState('percentage'); // 'count' or 'percentage'

  // Auto-switch display mode based on selected metric
  const handleMetricChange = (metricKey) => {
    setSelectedMetric(metricKey);
    if (metricKey === 'total_benes') {
      // Switch to count mode for Total Beneficiaries
      setDisplayMode('count');
    } else {
      // Switch to percentage mode for all other metrics
      setDisplayMode('percentage');
    }
  };

  // Fetch national data for comparison
  const { data: nationalData } = useNationalCMSEnrollmentData();

  // Filter to latest month for summary cards
  const latestMonthData = useMemo(() => {
    if (!data || !latestMonth) return [];
    return data.filter(r => r.month === latestMonth);
  }, [data, latestMonth]);

  // Aggregate for summary cards
  const summary = useMemo(() => {
    const agg = {};
    METRIC_GROUPS.forEach(group => {
      group.metrics.forEach(m => { agg[m.key] = 0; });
    });
    latestMonthData.forEach(row => {
      METRIC_GROUPS.forEach(group => {
        group.metrics.forEach(m => { agg[m.key] += row[m.key] || 0; });
      });
    });
    return agg;
  }, [latestMonthData]);

  // Calculate percentages
  const percentages = useMemo(() => {
    const total = summary.total_benes || 0;
    const percs = {};
    METRIC_GROUPS.forEach(group => {
      group.metrics.forEach(m => {
        percs[m.key] = total > 0 ? ((summary[m.key] || 0) / total * 100).toFixed(1) : '0.0';
      });
    });
    return percs;
  }, [summary]);

  // Prepare monthly trend data for the selected metric
  const monthlyTrend = useMemo(() => {
    if (!data) return [];
    // Group by month, aggregate across counties
    const byMonth = {};
    data.forEach(row => {
      if (!row.month) return;
      if (!byMonth[row.month]) {
        byMonth[row.month] = { month: row.month };
        METRIC_GROUPS.forEach(group => {
          group.metrics.forEach(m => { byMonth[row.month][m.key] = 0; });
        });
      }
      METRIC_GROUPS.forEach(group => {
        group.metrics.forEach(m => { byMonth[row.month][m.key] += row[m.key] || 0; });
      });
    });
    
    // Calculate percentages for each month
    Object.values(byMonth).forEach(monthData => {
      const totalBenes = monthData.total_benes || 0;
      METRIC_GROUPS.forEach(group => {
        group.metrics.forEach(m => {
          if (m.key !== 'total_benes') {
            monthData[`${m.key}_percentage`] = totalBenes > 0 ? 
              ((monthData[m.key] || 0) / totalBenes * 100) : 0;
          }
        });
      });
    });
    
    // Sort by month ascending
    return Object.values(byMonth).sort((a, b) => {
      const [ay, am] = a.month.split('-').map(Number);
      const [by, bm] = b.month.split('-').map(Number);
      return ay !== by ? ay - by : am - bm;
    });
  }, [data]);

  // Prepare national average data for comparison
  const nationalTrend = useMemo(() => {
    if (!nationalData || !Array.isArray(nationalData)) {
      console.log('🔍 No national data available');
      return [];
    }
    
         const monthFieldAnalysis = {
       hasMonth: nationalData.filter(d => d.month).length,
       hasMonthRaw: nationalData.filter(d => d.month_raw).length,
       hasMONTH: nationalData.filter(d => d.MONTH).length,
       hasMONTH_RAW: nationalData.filter(d => d.MONTH_RAW).length,
       monthValues: [...new Set(nationalData.map(d => d.month).filter(Boolean))].slice(0, 10),
       monthRawValues: [...new Set(nationalData.map(d => d.month_raw).filter(Boolean))].slice(0, 10)
     };
     
     console.log('🔍 Processing national data:', { 
       nationalDataLength: nationalData.length, 
       sampleData: nationalData.slice(0, 2),
       sampleMonths: nationalData.slice(0, 5).map(d => d.month),
       allMonths: [...new Set(nationalData.map(d => d.month))].sort(),
       sampleKeys: Object.keys(nationalData[0] || {}),
       monthRawValues: [...new Set(nationalData.map(d => d.month_raw))].sort(),
       uniqueMonthsCount: [...new Set(nationalData.map(d => d.month))].length,
       monthRawCount: [...new Set(nationalData.map(d => d.month_raw))].length,
       years: [...new Set(nationalData.map(d => d.year))].sort()
     });
     
     console.log('🔍 Month field analysis:', monthFieldAnalysis);
     console.log('🔍 Actual month values:', monthFieldAnalysis.monthValues);
     console.log('🔍 Actual month_raw values:', monthFieldAnalysis.monthRawValues);
    
         // Group national data by month and calculate percentages
     const byMonth = {};
           console.log('🔍 Processing national data rows:', nationalData.slice(0, 3).map(d => ({ 
        month: d.month, 
        MONTH: d.MONTH,
        month_raw: d.month_raw, 
        MONTH_RAW: d.MONTH_RAW,
        year: d.year,
        YEAR: d.YEAR,
        sampleKeys: Object.keys(d)
      })));
     
                       let processedCount = 0;
            let skippedCount = 0;
            let yearSkippedCount = 0;
            let monthParseFailedCount = 0;
            
            nationalData.forEach(row => {
         // Check for different possible month field formats
         let monthKey = row.month || row.MONTH || row.month_raw || row.MONTH_RAW;
         
         if (!monthKey) {
           skippedCount++;
           if (skippedCount <= 5) {
             console.log('🔍 Skipping row with no month field:', row);
           }
           return;
         }
        
        // Convert month to YYYY-MM format if needed
        let formattedMonth = monthKey;
        if (row.year && row.YEAR) {
          const year = row.year || row.YEAR;
                     if (monthKey === 'Year' || monthKey === 'YEAR') {
             // Skip yearly totals, we want monthly data
             yearSkippedCount++;
             if (yearSkippedCount <= 5) {
               console.log('🔍 Skipping yearly total row:', row);
             }
             return;
           }
          // If month is just a number (1-12), format it as YYYY-MM
          if (/^\d{1,2}$/.test(monthKey)) {
            formattedMonth = `${year}-${monthKey.padStart(2, '0')}`;
          } else if (/^\d{4}-\d{1,2}$/.test(monthKey)) {
            // Already in YYYY-MM format
            formattedMonth = monthKey;
          } else {
            // Try to parse month name to number
            const monthNames = {
              'January': '01', 'February': '02', 'March': '03', 'April': '04',
              'May': '05', 'June': '06', 'July': '07', 'August': '08',
              'September': '09', 'October': '10', 'November': '11', 'December': '12'
            };
            const monthNum = monthNames[monthKey];
            if (monthNum) {
              formattedMonth = `${year}-${monthNum}`;
                         } else {
               monthParseFailedCount++;
               if (monthParseFailedCount <= 5) {
                 console.log('🔍 Could not parse month:', monthKey, 'from row:', row);
               }
               return;
             }
          }
        }
        
        if (!byMonth[formattedMonth]) {
          byMonth[formattedMonth] = { month: formattedMonth };
          METRIC_GROUPS.forEach(group => {
            group.metrics.forEach(m => { byMonth[formattedMonth][m.key] = 0; });
          });
        }
        
                 METRIC_GROUPS.forEach(group => {
           group.metrics.forEach(m => { 
             byMonth[formattedMonth][m.key] += row[m.key] || 0; 
           });
         });
         
         processedCount++;
       });
       
       console.log('🔍 Processing summary:', {
         totalRecords: nationalData.length,
         processedCount,
         skippedCount,
         yearSkippedCount,
         monthParseFailedCount
       });
    
    // Calculate percentages for each month
    Object.values(byMonth).forEach(monthData => {
      const totalBenes = monthData.total_benes || 0;
      METRIC_GROUPS.forEach(group => {
        group.metrics.forEach(m => {
          if (m.key !== 'total_benes') {
            monthData[`${m.key}_percentage`] = totalBenes > 0 ? 
              ((monthData[m.key] || 0) / totalBenes * 100) : 0;
          }
        });
      });
    });
    
         // Sort by month ascending
     const sortedData = Object.values(byMonth).sort((a, b) => {
       const [ay, am] = a.month.split('-').map(Number);
       const [by, bm] = b.month.split('-').map(Number);
       return ay !== by ? ay - by : am - bm;
     });
     
     console.log('🔍 National trend data sample:', sortedData.slice(0, 2));
     console.log('🔍 National trend data months:', sortedData.map(d => d.month));
     console.log('🔍 National trend data count:', sortedData.length);
     return sortedData;
  }, [nationalData]);

  if (loading) return <div className={styles.panel}><Spinner message="Loading CMS enrollment data..." /></div>;
  if (error) return <div className={styles.panel}>Error: {error}</div>;
  if (!data || !latestMonth) return <div className={styles.panel}><Spinner message="Loading CMS enrollment data..." /></div>;

    return (
    <div className={styles.twoColumnLayout}>
             {/* Left Column - Scrollable Metrics */}
           <div className={styles.metricsColumn}>
        {latestMonth && (
          <div className={styles.timeframeInfo}>
            Latest data: {latestMonth}
          </div>
        )}
        <div className={styles.metricsListContainer}>
          {METRIC_GROUPS.map(group => (
           <div key={group.title} className={styles.metricGroup}>
             <h4 className={styles.groupTitle}>{group.title}</h4>
             <div className={styles.metricsList}>
               {group.metrics.map(metric => (
                 <div
                   key={metric.key}
                   className={
                     styles.metricItem +
                     (selectedMetric === metric.key ? ' ' + styles.selected : '')
                   }
                                       onClick={() => handleMetricChange(metric.key)}
                   tabIndex={0}
                   role="button"
                   aria-pressed={selectedMetric === metric.key}
                   title={`Show monthly trend for ${metric.label}`}
                 >
                   <span className={styles.metricLabel}>{metric.label}</span>
                   <div className={styles.metricValues}>
                     <span className={styles.metricValue}>
                       {summary[metric.key]?.toLocaleString()}
                     </span>
                     <span className={styles.metricPercentage}>
                       ({percentages[metric.key]}%)
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         ))}
       </div>
     </div>

             {/* Right Column - Sticky Chart */}
     <div className={styles.chartColumn}>
       <div className={styles.chartContainer}>
                   <CMSEnrollmentTrendChart
            data={monthlyTrend}
            nationalData={nationalTrend}
            metric={selectedMetric}
            displayMode={displayMode}
                         displayModeToggle={
               <div className={styles.displayModeToggle}>
                 <button
                   className={`${styles.toggleButton} ${displayMode === 'percentage' ? styles.active : ''} ${selectedMetric === 'total_benes' ? styles.disabled : ''}`}
                   onClick={() => selectedMetric !== 'total_benes' && setDisplayMode('percentage')}
                   disabled={selectedMetric === 'total_benes'}
                   title={selectedMetric === 'total_benes' ? 'Percent of Total is not available for Total Beneficiaries' : 'Show as percentage of total'}
                 >
                   Percent of Total
                 </button>
                 <button
                   className={`${styles.toggleButton} ${displayMode === 'count' ? styles.active : ''}`}
                   onClick={() => setDisplayMode('count')}
                 >
                   Beneficiary Count
                 </button>
               </div>
             }
          />
       </div>
     </div>
    </div>
  );
} 