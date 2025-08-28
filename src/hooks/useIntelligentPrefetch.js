import { useEffect, useRef, useCallback } from 'react';
import { apiUrl } from '../utils/api';

/**
 * Intelligent prefetching hook for provider analysis data
 * Implements several optimization strategies:
 * 1. Predictive prefetching based on user behavior
 * 2. Background prefetching for likely next providers
 * 3. Cache warming for common data patterns
 * 4. Adaptive loading based on network conditions
 */
export default function useIntelligentPrefetch() {
  const prefetchCache = useRef(new Map());
  const networkSpeedRef = useRef(null);
  const userBehaviorRef = useRef({
    viewedProviders: new Set(),
    commonRadius: 10,
    averageSessionTime: 0
  });

  // Measure network speed
  const measureNetworkSpeed = useCallback(async () => {
    const startTime = performance.now();
    try {
      await fetch(apiUrl('/api/census-acs-api?lat=38.6592&lon=-90.358&radius=1'), {
        method: 'HEAD'
      });
      const endTime = performance.now();
      networkSpeedRef.current = endTime - startTime;
      console.log('🌐 Network speed measured:', networkSpeedRef.current, 'ms');
    } catch (error) {
      console.warn('Could not measure network speed:', error);
    }
  }, []);

  // Predict next likely providers based on user behavior
  const predictNextProviders = useCallback((currentProvider) => {
    const predictions = [];
    
    // If user has viewed multiple providers in same area, predict nearby providers
    if (userBehaviorRef.current.viewedProviders.size > 1) {
      // This would integrate with your existing nearby providers logic
      // For now, return empty array - would need to implement actual prediction
    }
    
    return predictions;
  }, []);

  // Prefetch data for predicted providers
  const prefetchForPredictions = useCallback(async (predictions) => {
    if (!predictions.length || networkSpeedRef.current > 2000) return; // Skip if slow network
    
    console.log('🔮 Prefetching data for', predictions.length, 'predicted providers');
    
    for (const prediction of predictions.slice(0, 2)) { // Limit to 2 concurrent prefetches
      try {
        // Prefetch core data only (providers, census)
        const [providersResponse, censusResponse] = await Promise.all([
          fetch(apiUrl(`/api/nearby-providers?lat=${prediction.lat}&lon=${prediction.lon}&radius=10`)),
          fetch(apiUrl(`/api/census-acs-api?lat=${prediction.lat}&lon=${prediction.lon}&radius=10`))
        ]);
        
        if (providersResponse.ok && censusResponse.ok) {
          const [providersData, censusData] = await Promise.all([
            providersResponse.json(),
            censusResponse.json()
          ]);
          
          // Store in prefetch cache
          const cacheKey = `prefetch_${prediction.dhc}`;
          prefetchCache.current.set(cacheKey, {
            providers: providersData,
            census: censusData,
            timestamp: Date.now()
          });
          
          console.log('✅ Prefetched data for provider:', prediction.dhc);
        }
      } catch (error) {
        console.warn('Prefetch failed for provider:', prediction.dhc, error);
      }
    }
  }, []);

  // Warm cache for common data patterns
  const warmCache = useCallback(async () => {
    const commonPatterns = [
      { lat: 38.6592, lon: -90.358, radius: 10 }, // St. Louis
      { lat: 40.7128, lon: -74.0060, radius: 10 }, // NYC
      { lat: 34.0522, lon: -118.2437, radius: 10 }, // LA
    ];
    
    console.log('🔥 Warming cache for common patterns');
    
    for (const pattern of commonPatterns) {
      try {
        const response = await fetch(apiUrl(`/api/census-acs-api?lat=${pattern.lat}&lon=${pattern.lon}&radius=${pattern.radius}`));
        if (response.ok) {
          const data = await response.json();
          const cacheKey = `warm_${pattern.lat}_${pattern.lon}_${pattern.radius}`;
          prefetchCache.current.set(cacheKey, {
            data,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.warn('Cache warming failed for pattern:', pattern, error);
      }
    }
  }, []);

  // Get prefetched data if available
  const getPrefetchedData = useCallback((providerDhc) => {
    const cacheKey = `prefetch_${providerDhc}`;
    const cached = prefetchCache.current.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minute TTL
      prefetchCache.current.delete(cacheKey); // Remove after use
      return cached;
    }
    
    return null;
  }, []);

  // Track user behavior for better predictions
  const trackUserBehavior = useCallback((providerDhc, radius, sessionTime) => {
    userBehaviorRef.current.viewedProviders.add(providerDhc);
    userBehaviorRef.current.commonRadius = radius;
    userBehaviorRef.current.averageSessionTime = 
      (userBehaviorRef.current.averageSessionTime + sessionTime) / 2;
  }, []);

  // Initialize network measurement and cache warming
  useEffect(() => {
    measureNetworkSpeed();
    warmCache();
    
    // Re-measure network speed periodically
    const interval = setInterval(measureNetworkSpeed, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, [measureNetworkSpeed, warmCache]);

  return {
    predictNextProviders,
    prefetchForPredictions,
    getPrefetchedData,
    trackUserBehavior,
    networkSpeed: networkSpeedRef.current,
    prefetchCache: prefetchCache.current
  };
}
