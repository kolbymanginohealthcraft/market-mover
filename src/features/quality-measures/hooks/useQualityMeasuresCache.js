import { useMemo } from 'react';

// Simple cache for API responses
const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useQualityMeasuresCache = () => {
  const cache = useMemo(() => ({
    getCacheKey: (endpoint, params = {}) => {
      return `${endpoint}:${JSON.stringify(params)}`;
    },

    getCachedData: (key) => {
      const cached = apiCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      return null;
    },

    setCachedData: (key, data) => {
      apiCache.set(key, {
        data,
        timestamp: Date.now()
      });
    },

    clearCache: () => {
      apiCache.clear();
      console.log('🧹 Client-side cache cleared');
    }
  }), []);

  return cache;
}; 