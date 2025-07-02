import { useState, useEffect, useRef } from "react";
import { Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import Scorecard from "./Scorecard";
import Benchmarks from "./Benchmarks";
import Button from "../../../components/Buttons/Button";
import ButtonGroup from "../../../components/Buttons/ButtonGroup";
import styles from "./Storyteller.module.css";

export default function Storyteller({ provider, radiusInMiles, nearbyProviders, nearbyDhcCcns, mainProviderCcns, prefetchedData }) {
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
  const [chartMode, setChartMode] = useState('snapshot');
  const [showSnapshotDropdown, setShowSnapshotDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  // Handle click outside dropdown and escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSnapshotDropdown(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowSnapshotDropdown(false);
      }
    };

    if (showSnapshotDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showSnapshotDropdown]);

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
          
          {/* Snapshot/Trend Toggle with Dropdown */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>View:</label>
            <div className={styles.viewToggleContainer}>
              <div className={styles.toggleButton}>
                <Button
                  variant={chartMode === "snapshot" ? "accent" : "gray"}
                  size="sm"
                  outline={chartMode !== "snapshot"}
                  onClick={() => {
                    setChartMode("snapshot");
                    setShowSnapshotDropdown(!showSnapshotDropdown);
                  }}
                  className={styles.snapshotButton}
                >
                  Snapshot
                  {selectedPublishDate && chartMode === "snapshot" && (
                    <span className={styles.selectedDate}>
                      ({formatPublishDate(selectedPublishDate)})
                    </span>
                  )}
                  {chartMode === "snapshot" && availablePublishDates.length > 1 && (
                    <span className={styles.dropdownArrow}>▼</span>
                  )}
                </Button>
                {chartMode === "snapshot" && showSnapshotDropdown && availablePublishDates.length > 1 && (
                  <div className={styles.snapshotDropdown} ref={dropdownRef}>
                    <div className={styles.dropdownHeader}>Select Publish Date:</div>
                    {availablePublishDates.map(date => (
                      <Button
                        key={date}
                        variant={selectedPublishDate === date ? "accent" : "gray"}
                        size="sm"
                        ghost={selectedPublishDate !== date}
                        onClick={() => {
                          setSelectedPublishDate(date);
                          setShowSnapshotDropdown(false);
                        }}
                        className={styles.dropdownItem}
                      >
                        {formatPublishDate(date)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant={chartMode === "trend" ? "accent" : "gray"}
                size="sm"
                outline={chartMode !== "trend"}
                onClick={() => {
                  setChartMode("trend");
                  setShowSnapshotDropdown(false);
                }}
              >
                Trend
              </Button>
            </div>
          </div>
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
              mainProviderCcns={mainProviderCcns}
              prefetchedData={prefetchedData}
              providerTypeFilter={providerTypeFilter}
              setProviderTypeFilter={setProviderTypeFilter}
              selectedPublishDate={selectedPublishDate}
              setSelectedPublishDate={setSelectedPublishDate}
              chartMode={chartMode}
              setChartMode={setChartMode}
            />
          } />
          <Route path="benchmarks" element={
            <Benchmarks 
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
            />
          } />
          <Route path="*" element={<Navigate to="scorecard" replace />} />
        </Routes>
      </div>
    </div>
  );
}