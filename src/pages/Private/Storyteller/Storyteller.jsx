import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import Scorecard from "./Scorecard";
import Benchmarks from "./Benchmarks";
import styles from "./Storyteller.module.css";

export default function Storyteller({ provider, radiusInMiles, nearbyProviders, nearbyDhcCcns, prefetchedData }) {
  const location = useLocation();
  const base = location.pathname.replace(/\/storyteller.*/, "/storyteller");
  
  // Set body attribute for CSS overrides
  useEffect(() => {
    document.body.setAttribute('data-page', 'storyteller');
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);
  
  // Move state management to this level so it can be shared between tabs
  const [providerTypeFilter, setProviderTypeFilter] = useState('');
  const [selectedPublishDate, setSelectedPublishDate] = useState(null);

  // Extract available options from prefetched data
  const availableProviderTypes = prefetchedData?.providerTypes || [];
  const availablePublishDates = prefetchedData?.publishDates || [];
  const currentPublishDate = prefetchedData?.currentDate || null;

  // Set default provider type filter when available types change
  useEffect(() => {
    if (availableProviderTypes.length > 0 && !providerTypeFilter) {
      setProviderTypeFilter(availableProviderTypes[0]);
    }
  }, [availableProviderTypes, providerTypeFilter]);

  // Set default publish date when available dates change
  useEffect(() => {
    if (availablePublishDates.length > 0 && !selectedPublishDate) {
      setSelectedPublishDate(availablePublishDates[0]);
    }
  }, [availablePublishDates, selectedPublishDate]);

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
  
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <NavLink 
            to={`${base}/scorecard`} 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Scorecard
          </NavLink>
          <NavLink 
            to={`${base}/benchmarks`} 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Benchmarks
          </NavLink>
        </div>
        
        <div className={styles.navRight}>
          {/* Provider Type Filter */}
          {typeof window !== 'undefined' && availableProviderTypes.length > 0 && (
            <div className={styles.filterGroup}>
              <label htmlFor="provider-type-select" className={styles.filterLabel}>Provider Type:</label>
              <SelectInput
                id="provider-type-select"
                value={providerTypeFilter}
                onChange={e => setProviderTypeFilter(e.target.value)}
                options={availableProviderTypes}
                size="sm"
              />
            </div>
          )}
          
          {/* Publish Date Filter */}
          {availablePublishDates.length > 1 && (
            <div className={styles.filterGroup}>
              <label htmlFor="publish-date-select" className={styles.filterLabel}>
                Publish Date:
              </label>
              <SelectInput
                id="publish-date-select"
                value={selectedPublishDate || availablePublishDates[0]}
                onChange={(e) => setSelectedPublishDate(e.target.value)}
                options={availablePublishDates}
                formatOptions={true}
                size="sm"
              />
            </div>
          )}
        </div>
      </nav>
      
      <div className={styles.content}>
        <Routes>
          <Route path="scorecard" element={
            <Scorecard 
              provider={provider} 
              radiusInMiles={radiusInMiles} 
              nearbyProviders={nearbyProviders} 
              nearbyDhcCcns={nearbyDhcCcns} 
              prefetchedData={prefetchedData}
              providerTypeFilter={providerTypeFilter}
              setProviderTypeFilter={setProviderTypeFilter}
              selectedPublishDate={selectedPublishDate}
              setSelectedPublishDate={setSelectedPublishDate}
            />
          } />
          <Route path="benchmarks" element={
            <Benchmarks 
              provider={provider} 
              radiusInMiles={radiusInMiles} 
              nearbyProviders={nearbyProviders} 
              nearbyDhcCcns={nearbyDhcCcns} 
              prefetchedData={prefetchedData}
              providerTypeFilter={providerTypeFilter}
              setProviderTypeFilter={setProviderTypeFilter}
              selectedPublishDate={selectedPublishDate}
              setSelectedPublishDate={setSelectedPublishDate}
            />
          } />
          <Route path="*" element={<Navigate to="scorecard" replace />} />
        </Routes>
      </div>
    </div>
  );
}