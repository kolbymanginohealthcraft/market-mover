import React from 'react';

// Lazy loading utility to reduce memory usage
export const lazyLoadComponent = (importFunc, fallback = null) => {
  const LazyComponent = React.lazy(importFunc);
  
  return (props) => (
    <React.Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Preload heavy libraries only when needed
export const preloadMapLibrary = () => {
  return import('maplibre-gl');
};

export const preloadChartLibrary = () => {
  return import('recharts');
};

export const preloadD3Library = () => {
  return import('d3');
};

// Memory cleanup utility
export const cleanupMemory = () => {
  if (typeof window !== 'undefined') {
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Clear any cached data
    if (window.caches) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  }
}; 