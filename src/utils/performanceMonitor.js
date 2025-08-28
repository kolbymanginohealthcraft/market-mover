/**
 * Performance monitoring utility for provider analysis
 * Tracks load times, cache performance, and user interactions
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTimes: new Map(),
      cacheHits: 0,
      cacheMisses: 0,
      userInteractions: [],
      errors: []
    };
    
    this.startTimes = new Map();
    this.observers = new Set();
  }

  // Start timing an operation
  startTimer(operationId, metadata = {}) {
    const startTime = performance.now();
    this.startTimes.set(operationId, { startTime, metadata });
    console.log(`⏱️ Started timing: ${operationId}`, metadata);
  }

  // End timing an operation
  endTimer(operationId, success = true) {
    const timerData = this.startTimes.get(operationId);
    if (!timerData) {
      console.warn(`⚠️ No timer found for: ${operationId}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - timerData.startTime;
    
    this.metrics.loadTimes.set(operationId, {
      duration,
      success,
      metadata: timerData.metadata,
      timestamp: Date.now()
    });

    this.startTimes.delete(operationId);
    
    console.log(`⏱️ Completed: ${operationId} in ${duration.toFixed(2)}ms`);
    
    // Notify observers
    this.notifyObservers('loadTime', { operationId, duration, success });
  }

  // Record cache hit/miss
  recordCacheHit(operationId) {
    this.metrics.cacheHits++;
    console.log(`📦 Cache hit: ${operationId}`);
    this.notifyObservers('cacheHit', { operationId });
  }

  recordCacheMiss(operationId) {
    this.metrics.cacheMisses++;
    console.log(`❌ Cache miss: ${operationId}`);
    this.notifyObservers('cacheMiss', { operationId });
  }

  // Record user interaction
  recordUserInteraction(type, data = {}) {
    const interaction = {
      type,
      data,
      timestamp: Date.now()
    };
    
    this.metrics.userInteractions.push(interaction);
    console.log(`👤 User interaction: ${type}`, data);
    this.notifyObservers('userInteraction', interaction);
  }

  // Record error
  recordError(operationId, error, context = {}) {
    const errorRecord = {
      operationId,
      error: error.message || error,
      context,
      timestamp: Date.now()
    };
    
    this.metrics.errors.push(errorRecord);
    console.error(`❌ Error recorded: ${operationId}`, errorRecord);
    this.notifyObservers('error', errorRecord);
  }

  // Calculate cache hit rate
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? (this.metrics.cacheHits / total * 100).toFixed(1) : 0;
  }

  // Get average load time for an operation type
  getAverageLoadTime(operationType) {
    const times = Array.from(this.metrics.loadTimes.values())
      .filter(metric => metric.metadata.type === operationType)
      .map(metric => metric.duration);
    
    if (times.length === 0) return 0;
    
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    return average.toFixed(2);
  }

  // Get performance summary
  getPerformanceSummary() {
    const cacheHitRate = this.getCacheHitRate();
    const totalLoadTimes = Array.from(this.metrics.loadTimes.values());
    const averageLoadTime = totalLoadTimes.length > 0 
      ? totalLoadTimes.reduce((sum, metric) => sum + metric.duration, 0) / totalLoadTimes.length 
      : 0;

    return {
      cacheHitRate: `${cacheHitRate}%`,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      totalOperations: totalLoadTimes.length,
      averageLoadTime: `${averageLoadTime.toFixed(2)}ms`,
      errors: this.metrics.errors.length,
      userInteractions: this.metrics.userInteractions.length,
      recentLoadTimes: totalLoadTimes
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .map(metric => ({
          operationId: metric.metadata.operationId || 'unknown',
          duration: `${metric.duration.toFixed(2)}ms`,
          success: metric.success,
          timestamp: new Date(metric.timestamp).toLocaleTimeString()
        }))
    };
  }

  // Add observer for performance events
  addObserver(callback) {
    this.observers.add(callback);
  }

  // Remove observer
  removeObserver(callback) {
    this.observers.delete(callback);
  }

  // Notify all observers
  notifyObservers(eventType, data) {
    this.observers.forEach(callback => {
      try {
        callback(eventType, data);
      } catch (error) {
        console.error('Observer callback error:', error);
      }
    });
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      summary: this.getPerformanceSummary(),
      detailedMetrics: {
        loadTimes: Array.from(this.metrics.loadTimes.entries()),
        userInteractions: this.metrics.userInteractions,
        errors: this.metrics.errors
      },
      timestamp: Date.now()
    };
  }

  // Clear old metrics (keep last 1000 entries)
  cleanup() {
    const maxEntries = 1000;
    
    if (this.metrics.loadTimes.size > maxEntries) {
      const entries = Array.from(this.metrics.loadTimes.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, maxEntries);
      
      this.metrics.loadTimes = new Map(entries);
    }
    
    if (this.metrics.userInteractions.length > maxEntries) {
      this.metrics.userInteractions = this.metrics.userInteractions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxEntries);
    }
    
    if (this.metrics.errors.length > maxEntries) {
      this.metrics.errors = this.metrics.errors
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxEntries);
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-cleanup every 5 minutes
setInterval(() => {
  performanceMonitor.cleanup();
}, 5 * 60 * 1000);

// Helper functions for common operations
export const monitorOperation = async (operationId, operation, metadata = {}) => {
  performanceMonitor.startTimer(operationId, metadata);
  
  try {
    const result = await operation();
    performanceMonitor.endTimer(operationId, true);
    return result;
  } catch (error) {
    performanceMonitor.endTimer(operationId, false);
    performanceMonitor.recordError(operationId, error, metadata);
    throw error;
  }
};

export const monitorCacheOperation = (operationId, hasCache) => {
  if (hasCache) {
    performanceMonitor.recordCacheHit(operationId);
  } else {
    performanceMonitor.recordCacheMiss(operationId);
  }
};

export default performanceMonitor; 