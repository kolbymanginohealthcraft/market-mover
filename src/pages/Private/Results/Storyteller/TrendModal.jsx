import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import MetricTrendChart from './MetricTrendChart';
import Spinner from '../../../../components/Buttons/Spinner';
import { apiUrl } from '../../../../utils/api';
import styles from './TrendModal.module.css';

// Cache for trend data (key: `${providerDhc}_${measureCode}_${ccnsString}`)
const trendDataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(providerDhc, measureCode, ccns) {
  const sortedCcns = [...ccns].sort().join(',');
  return `trend_${providerDhc}_${measureCode}_${sortedCcns}`;
}

function getCachedTrendData(cacheKey) {
  const cached = trendDataCache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (cached.expiresAt && now > cached.expiresAt) {
    trendDataCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

function setCachedTrendData(cacheKey, data) {
  const expiresAt = Date.now() + CACHE_TTL;
  trendDataCache.set(cacheKey, {
    data,
    expiresAt
  });
  
  // Limit cache size (keep last 20 entries)
  if (trendDataCache.size > 20) {
    const firstKey = trendDataCache.keys().next().value;
    trendDataCache.delete(firstKey);
  }
}

export default function TrendModal({ 
  isOpen, 
  onClose, 
  providerDhc, 
  providerName, 
  measureCode, 
  measureName,
  measureLabel,
  measureDescription,
  measureSource,
  measureDirection,
  nearbyDhcCcns,
  measures = [] // Array of all measures to get source info
}) {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get provider CCNs for the clicked provider
  const providerCcns = useMemo(() => {
    if (!providerDhc || !nearbyDhcCcns) return [];
    return nearbyDhcCcns
      .filter(row => String(row.dhc) === String(providerDhc))
      .map(row => String(row.ccn))
      .filter(Boolean);
  }, [providerDhc, nearbyDhcCcns]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Fetch trend data when modal opens
  useEffect(() => {
    if (!isOpen || !providerDhc || !measureCode || providerCcns.length === 0) {
      setTrendData([]);
      setError(null);
      return;
    }

    // Clear any stale data when modal opens with new parameters
    setTrendData([]);
    setError(null);

    async function fetchTrendData() {
      setLoading(true);
      setError(null);

      try {
        // Check cache first - but verify the cache key matches exactly
        const cacheKey = getCacheKey(providerDhc, measureCode, providerCcns);
        const cachedData = getCachedTrendData(cacheKey);
        
        if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
          // Verify cached data is valid
          const isValidCache = cachedData.every(item => 
            item.publishDate && 
            (item.value !== null && item.value !== undefined) &&
            !isNaN(item.value)
          );
          
          if (isValidCache) {
            console.log('✅ Using cached trend data for', measureCode, 'provider', providerDhc);
            setTrendData(cachedData);
            setLoading(false);
            return;
          } else {
            console.log('⚠️ Invalid cached data, fetching fresh');
            // Clear invalid cache
            trendDataCache.delete(cacheKey);
          }
        }

        // First, get available dates (don't filter by measure code here to get all available dates)
        const datesResponse = await fetch(apiUrl('/api/qm_combined'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ccns: providerCcns, 
            publish_date: 'latest'
          })
        });

        if (!datesResponse.ok) {
          throw new Error('Failed to fetch available dates');
        }

        const datesResult = await datesResponse.json();
        if (!datesResult.success) {
          throw new Error(datesResult.error || 'Failed to fetch available dates');
        }

        const availableDates = datesResult.data.availableDates || [];
        if (availableDates.length === 0) {
          throw new Error('No historical data available');
        }

        // Limit to last 6 periods
        const datesToFetch = availableDates.slice(0, 6);

        // Fetch data for all date periods in parallel, filtering by measure code
        const fetchPromises = datesToFetch.map(async (publishDate) => {
          try {
            const dataResponse = await fetch(apiUrl('/api/qm_combined'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                ccns: providerCcns,
                publish_date: publishDate,
                measures: [measureCode] // Only fetch this specific measure
              })
            });

            if (!dataResponse.ok) return null;

            const dataResult = await dataResponse.json();
            if (!dataResult.success) return null;

            return { publishDate, data: dataResult.data };
          } catch (err) {
            console.error(`Error fetching data for ${publishDate}:`, err);
            return null;
          }
        });

        const results = await Promise.all(fetchPromises);
        const allTrendData = [];

        results.forEach((result) => {
          if (!result || !result.data) return;

          const { publishDate, data } = result;
          const { providerData: rawProviderData, nationalAverages } = data;

          // Filter to ensure we only use data for this specific measure code
          const measureData = rawProviderData.filter(
            row => row.code && String(row.code).trim() === String(measureCode).trim()
          );

          if (measureData.length > 0) {
            // Average across CCNs if multiple
            const avgScore = measureData.reduce((sum, d) => sum + (d.score || 0), 0) / measureData.length;
            const nationalAverage = nationalAverages[measureCode]?.score || null;

            if (avgScore !== null && avgScore !== undefined && !isNaN(avgScore)) {
              allTrendData.push({
                publishDate,
                value: avgScore,
                nationalAverage
              });
            }
          }
        });

        // Sort by date ascending
        allTrendData.sort((a, b) => a.publishDate.localeCompare(b.publishDate));

        console.log('📊 Fetched trend data for', measureCode, 'provider', providerDhc, ':', {
          periods: allTrendData.length,
          values: allTrendData.map(d => ({ 
            period: d.publishDate, 
            value: d.value, 
            national: d.nationalAverage 
          }))
        });

        // Cache the result only if we have valid data
        if (allTrendData.length > 0) {
          setCachedTrendData(cacheKey, allTrendData);
        }
        
        setTrendData(allTrendData);
      } catch (err) {
        console.error('Error fetching trend data:', err);
        setError(err.message);
        setTrendData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTrendData();
  }, [isOpen, providerDhc, measureCode, providerCcns]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Storyteller Trend</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spinner />
              <p>Loading trend data...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          ) : trendData.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p>No trend data available for this metric.</p>
            </div>
          ) : (
            <MetricTrendChart 
              periods={trendData} 
              measureName={measures.find(m => m.code === measureCode)?.name || measureName || measureCode}
              measureLabel={measureLabel || measures.find(m => m.code === measureCode)?.label}
              measureDescription={measureDescription || measures.find(m => m.code === measureCode)?.description}
              measureSource={measureSource || measures.find(m => m.code === measureCode)?.source}
              measureDirection={measureDirection || measures.find(m => m.code === measureCode)?.direction}
              providerName={providerName}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

