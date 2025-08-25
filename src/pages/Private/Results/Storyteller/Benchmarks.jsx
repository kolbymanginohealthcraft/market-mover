import React, { useState, useEffect } from 'react';
import BenchmarkChart from './BenchmarkChart';
import { apiUrl } from '../../../../utils/api';
import styles from './Benchmarks.module.css';

export default function Benchmarks({ 
  provider, 
  radiusInMiles, 
  nearbyProviders, 
  nearbyDhcCcns, 
  prefetchedData,
  providerTypeFilter,
  setProviderTypeFilter,
  selectedPublishDate,
  setSelectedPublishDate,
  availableProviderTypes
}) {
  const [availableMeasures, setAvailableMeasures] = useState([]);
  const [selectedMeasure, setSelectedMeasure] = useState(null);
  const [measuresLoading, setMeasuresLoading] = useState(false);
  const [measuresError, setMeasuresError] = useState(null);
  // Helper function for SelectInput component
  function SelectInput({ id, value, onChange, options, size = 'sm', formatOptions = false, ...props }) {
    return (
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={size === 'sm' ? styles.selectSm : ''}
        {...props}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {formatOptions ? formatPublishDate(opt) : opt}
          </option>
        ))}
      </select>
    );
  }

  // Helper function to format publish date
  const formatPublishDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    return `${year}-${month}`;
  };

  // Fetch quality measures based on selected setting
  useEffect(() => {
    async function fetchQualityMeasures() {
      if (!providerTypeFilter) {
        setAvailableMeasures([]);
        setSelectedMeasure(null);
        return;
      }

      setMeasuresLoading(true);
      setMeasuresError(null);

      try {
        const response = await fetch(apiUrl('/api/qm_dictionary'));
        if (!response.ok) throw new Error('Failed to fetch quality measures');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch quality measures');

        // Filter measures by the selected setting
        const filteredMeasures = result.data.filter(measure => 
          measure.setting === providerTypeFilter && measure.active === true
        );

        // Sort by sort_order if available, otherwise by name
        filteredMeasures.sort((a, b) => {
          if (a.sort_order !== undefined && b.sort_order !== undefined) {
            return a.sort_order - b.sort_order;
          }
          return (a.name || '').localeCompare(b.name || '');
        });

        setAvailableMeasures(filteredMeasures);
        
        // Auto-select the first measure if none is selected
        if (filteredMeasures.length > 0 && !selectedMeasure) {
          setSelectedMeasure(filteredMeasures[0].code);
        }
      } catch (err) {
        console.error('Error fetching quality measures:', err);
        setMeasuresError(err.message);
        setAvailableMeasures([]);
      } finally {
        setMeasuresLoading(false);
      }
    }

    fetchQualityMeasures();
  }, [providerTypeFilter, selectedMeasure]);

  return (
    <div className={styles.benchmarksContainer}>
      {/* Date Display Banner */}
      <div className={styles.dataPeriodBanner}>
        <div className={styles.bannerLeft}>
          <strong>Current Data Period:</strong>
          <span className={styles.dateDisplay}>
            {selectedPublishDate || 'Not set'}
          </span>
          {providerTypeFilter && (
            <>
              <span>•</span>
              <strong>Setting:</strong>
              <span>{providerTypeFilter}</span>
            </>
          )}
        </div>
        
        {/* Measure Setting Filter */}
        {typeof window !== 'undefined' && availableProviderTypes && availableProviderTypes.length > 0 && (
          <div className={styles.filterGroup}>
            <label htmlFor="provider-type-select" className={styles.filterLabel}>Measure Setting:</label>
            <SelectInput
              id="provider-type-select"
              value={providerTypeFilter || ''}
              onChange={e => setProviderTypeFilter(e.target.value)}
              options={availableProviderTypes}
              size="sm"
            />
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className={styles.benchmarksLayout}>
          {/* Left Column - Measures List */}
          <div className={styles.measuresPanel}>
            <h3 className={styles.measuresTitle}>Quality Measures</h3>
                         <div className={styles.measuresList}>
               {measuresLoading ? (
                 <div className={styles.loadingMessage}>Loading measures...</div>
               ) : measuresError ? (
                 <div className={styles.errorMessage}>Error: {measuresError}</div>
               ) : availableMeasures.length === 0 ? (
                 <div className={styles.noDataMessage}>
                   {providerTypeFilter ? 'No measures available for this setting' : 'Select a measure setting to view available measures'}
                 </div>
               ) : (
                 availableMeasures.map((measure) => (
                   <div key={measure.code} className={styles.measureItem}>
                     <label className={styles.measureRadio}>
                       <input
                         type="radio"
                         name="selectedMeasure"
                         value={measure.code}
                         checked={selectedMeasure === measure.code}
                         onChange={(e) => setSelectedMeasure(e.target.value)}
                         className={styles.radioInput}
                       />
                       <div className={styles.measureContent}>
                         <div className={styles.measureName}>{measure.name}</div>
                         <div className={styles.measureDescription}>{measure.description}</div>
                       </div>
                     </label>
                   </div>
                 ))
               )}
             </div>
          </div>
          
                           {/* Right Column - Chart */}
                 <div className={styles.chartPanel}>
                   <BenchmarkChart 
                     provider={provider}
                     radiusInMiles={radiusInMiles}
                     nearbyProviders={nearbyProviders}
                     nearbyDhcCcns={nearbyDhcCcns}
                     selectedPublishDate={selectedPublishDate}
                     providerTypeFilter={providerTypeFilter}
                     selectedMeasure={selectedMeasure}
                   />
                 </div>
        </div>
      </div>
    </div>
  );
}
