/**
 * Optimization configuration for provider analysis data fetching
 * Allows fine-tuning of prefetching, caching, and loading strategies
 */

export const OPTIMIZATION_CONFIG = {
  // Progressive loading tiers
  TIERS: {
    TIER_1: {
      name: 'Core Data',
      includes: ['providers', 'census', 'ccns', 'npis'],
      priority: 'high',
      maxLoadTime: 3000, // 3 seconds
      enableLazyLoading: false
    },
    TIER_2: {
      name: 'Quality Measures',
      includes: ['qualityMeasuresDates', 'qualityMeasuresData'],
      priority: 'medium',
      maxLoadTime: 5000, // 5 seconds
      enableLazyLoading: true
    },
    TIER_3: {
      name: 'Advanced Analytics',
      includes: ['marketAverages', 'trends', 'comparisons'],
      priority: 'low',
      maxLoadTime: 8000, // 8 seconds
      enableLazyLoading: true
    }
  },

  // Prefetching strategies
  PREFETCH: {
    enabled: true,
    maxConcurrent: 2,
    maxCacheSize: 50, // MB
    ttl: 5 * 60 * 1000, // 5 minutes
    networkSpeedThreshold: 2000, // ms - skip prefetch if slower
    predictionConfidence: 0.7, // minimum confidence for predictions
  },

  // Caching strategies
  CACHE: {
    enabled: true,
    maxSize: 100, // entries
    ttl: {
      providers: 10 * 60 * 1000, // 10 minutes
      census: 30 * 60 * 1000, // 30 minutes
      qualityMeasures: 5 * 60 * 1000, // 5 minutes
      ccns: 15 * 60 * 1000, // 15 minutes
      npis: 15 * 60 * 1000, // 15 minutes
    },
    warmupPatterns: [
      { lat: 38.6592, lon: -90.358, radius: 10, weight: 0.8 }, // St. Louis
      { lat: 40.7128, lon: -74.0060, radius: 10, weight: 0.6 }, // NYC
      { lat: 34.0522, lon: -118.2437, radius: 10, weight: 0.6 }, // LA
      { lat: 41.8781, lon: -87.6298, radius: 10, weight: 0.5 }, // Chicago
      { lat: 29.7604, lon: -95.3698, radius: 10, weight: 0.4 }, // Houston
    ]
  },

  // Network optimization
  NETWORK: {
    retryAttempts: 3,
    retryDelay: 1000, // ms
    timeout: 10000, // 10 seconds
    concurrentRequests: 4,
    adaptiveLoading: true, // adjust based on network speed
  },

  // User experience
  UX: {
    showLoadingProgress: true,
    enableSkeletonScreens: true,
    progressiveEnhancement: true,
    fallbackToLazyLoading: true,
  },

  // Performance monitoring
  MONITORING: {
    enabled: true,
    trackLoadTimes: true,
    trackCacheHits: true,
    trackUserBehavior: true,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  }
};

// Environment-specific overrides
export const getOptimizationConfig = (environment = 'production') => {
  const config = { ...OPTIMIZATION_CONFIG };
  
  switch (environment) {
    case 'development':
      config.PREFETCH.enabled = false;
      config.CACHE.enabled = false;
      config.MONITORING.logLevel = 'debug';
      break;
      
    case 'staging':
      config.PREFETCH.maxConcurrent = 1;
      config.CACHE.maxSize = 20;
      break;
      
    case 'production':
      // Use default config
      break;
      
    default:
      // Use default config
      break;
  }
  
  return config;
};

// Adaptive configuration based on user's device/network
export const getAdaptiveConfig = (networkSpeed, deviceType) => {
  const config = { ...OPTIMIZATION_CONFIG };
  
  // Adjust based on network speed
  if (networkSpeed > 3000) { // Slow network
    config.PREFETCH.enabled = false;
    config.CACHE.ttl.providers = 30 * 60 * 1000; // Longer cache
    config.NETWORK.concurrentRequests = 2;
  } else if (networkSpeed < 500) { // Fast network
    config.PREFETCH.maxConcurrent = 3;
    config.CACHE.maxSize = 150;
  }
  
  // Adjust based on device type
  if (deviceType === 'mobile') {
    config.PREFETCH.maxConcurrent = 1;
    config.CACHE.maxSize = 30;
    config.NETWORK.concurrentRequests = 2;
  }
  
  return config;
};
