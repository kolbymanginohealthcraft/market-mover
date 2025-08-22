import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Scorecard from "./Scorecard";
import styles from "./Storyteller.module.css";

export default function Storyteller({ provider, radiusInMiles, nearbyProviders, nearbyDhcCcns, mainProviderCcns, prefetchedData, allCcns, allProviderDhcs }) {
  const location = useLocation();
  
  // Check if we're on the benchmarks route
  const isBenchmarksRoute = location.pathname.includes('/benchmarks');
  
  // Set body attribute for CSS overrides
  useEffect(() => {
    document.body.setAttribute('data-page', 'storyteller');
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);
  
  // Move state management to this level so it can be shared between tabs
  const [providerTypeFilter, setProviderTypeFilter] = useState(null);
  const [selectedPublishDate, setSelectedPublishDate] = useState('');
  const [chartMode, setChartMode] = useState('snapshot');

  // Extract available options from prefetched data
  const availableProviderTypes = prefetchedData?.providerTypes || [];
  const availablePublishDates = prefetchedData?.publishDates || [];
  const currentPublishDate = prefetchedData?.currentDate || null;



  // Set default provider type filter when available types change
  useEffect(() => {
    if (availableProviderTypes.length > 0 && !providerTypeFilter) {
      // Default to SNF
      setProviderTypeFilter('SNF');
    }
  }, [availableProviderTypes]);

  // Set default publish date when available dates change
  useEffect(() => {
    if (availablePublishDates.length > 0 && !selectedPublishDate) {
      // Always use the most recent available date (availableDates is sorted chronologically)
      const defaultDate = availablePublishDates[0];
      setSelectedPublishDate(defaultDate);
    }
  }, [availablePublishDates]);



  // Helper function to format publish date
  const formatPublishDate = (dateStr) => {
    if (!dateStr) return '';
    // Parse the date string directly to avoid timezone issues
    const [year, month] = dateStr.split('-');
    return `${year}-${month}`;
  };

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

  // Helper function to get proper navigation paths
  function getNavigationPaths() {
    const pathSegments = location.pathname.split('/');
    const storytellerIndex = pathSegments.findIndex(segment => segment === 'storyteller');
    const basePath = pathSegments.slice(0, storytellerIndex + 1).join('/');
    
    return {
      scorecard: `${basePath}/scorecard`,
      benchmarks: `${basePath}/benchmarks`
    };
  }

    const paths = getNavigationPaths();

  return (
    <>
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          <NavLink 
            to={paths.scorecard}
            className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
          >
            Scorecard
          </NavLink>
          <NavLink 
            to={paths.benchmarks}
            className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
          >
            Benchmarks
          </NavLink>
        </div>
        
        <div className={styles.navRight}>
          {/* Measure Setting Filter */}
          {typeof window !== 'undefined' && (
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
      </nav>
      
      <div className={styles.container}>
        {isBenchmarksRoute ? (
          <div className={styles.benchmarksPlaceholder}>
            <div className={styles.placeholderContent}>
              <h2>Benchmarks</h2>
              <p>This section is being redesigned. Coming soon.</p>
            </div>
          </div>
        ) : (
          <Scorecard 
            provider={provider} 
            radiusInMiles={radiusInMiles} 
            nearbyProviders={nearbyProviders} 
            nearbyDhcCcns={nearbyDhcCcns} 
            mainProviderCcns={mainProviderCcns}
            prefetchedData={prefetchedData}
            providerTypeFilter={providerTypeFilter}
            setProviderTypeFilter={setProviderTypeFilter}
            selectedPublishDate={selectedPublishDate}
            setSelectedPublishDate={setSelectedPublishDate}
            chartMode={chartMode}
            setChartMode={setChartMode}
            allCcns={allCcns}
            allProviderDhcs={allProviderDhcs}
          />
        )}
      </div>
    </>
  );
}