// Enhanced in-memory cache for BigQuery results with priority-based eviction
class QueryCache {
  constructor() {
    this.cache = new Map();
    this.accessOrder = new Map(); // Track access frequency
    this.maxSize = 1000; // Maximum cache entries
    this.defaultTtl = 5 * 60 * 1000; // 5 minutes default TTL
    
    // Priority-based TTL for different data types
    this.ttlConfig = {
      // Core data - longer cache times
      'census_acs': 30 * 60 * 1000, // 30 minutes
      'provider-density': 15 * 60 * 1000, // 15 minutes
      'nearby-providers': 10 * 60 * 1000, // 10 minutes
      'related-ccns': 15 * 60 * 1000, // 15 minutes
      'related-npis': 15 * 60 * 1000, // 15 minutes
      
      // Quality measures - shorter cache times
      'qm_dictionary': 5 * 60 * 1000, // 5 minutes
      'qm_combined': 3 * 60 * 1000, // 3 minutes
      'qm_post': 3 * 60 * 1000, // 3 minutes
      'qm_provider': 3 * 60 * 1000, // 3 minutes
      
      // Enrollment data - medium cache times
      'cms_enrollment': 10 * 60 * 1000, // 10 minutes
      'ma_enrollment': 10 * 60 * 1000, // 10 minutes
      
      // Claims data - shorter cache times
      'diagnoses-volume': 2 * 60 * 1000, // 2 minutes
      'procedures-volume': 2 * 60 * 1000, // 2 minutes
    };
  }

  // Generate cache key from query parameters
  generateKey(endpoint, params) {
    const sortedParams = Object.keys(params || {})
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${endpoint}:${sortedParams}`;
  }

  // Get TTL for specific endpoint
  getTtl(endpoint) {
    return this.ttlConfig[endpoint] || this.defaultTtl;
  }

  // Get cached result with access tracking
  get(endpoint, params) {
    const key = this.generateKey(endpoint, params);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.getTtl(endpoint)) {
      // Update access order for LRU eviction
      this.accessOrder.set(key, Date.now());
      console.log(`📦 Cache hit for ${endpoint}`);
      return cached.data;
    }
    
    if (cached) {
      console.log(`🗑️ Cache expired for ${endpoint}`);
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }
    
    return null;
  }

  // Set cached result with size management
  set(endpoint, params, data) {
    const key = this.generateKey(endpoint, params);
    
    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size: this.estimateSize(data)
    });
    
    this.accessOrder.set(key, Date.now());
    console.log(`💾 Cached result for ${endpoint}`);
  }

  // Estimate data size in bytes
  estimateSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1000; // Default estimate
    }
  }

  // Evict oldest accessed entries
  evictOldest() {
    if (this.accessOrder.size === 0) return;
    
    // Find oldest accessed entry
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      console.log(`🗑️ Evicting oldest cache entry: ${oldestKey}`);
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }

  // Clear cache
  clear() {
    this.cache.clear();
    this.accessOrder.clear();
    console.log('🧹 Cache cleared');
  }

  // Get cache stats
  getStats() {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + (entry.size || 0), 0);
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalSizeBytes: totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      keys: Array.from(this.cache.keys()).slice(0, 10), // First 10 keys
      hitRate: this.calculateHitRate()
    };
  }

  // Calculate cache hit rate (simplified)
  calculateHitRate() {
    // This would need to be implemented with hit/miss tracking
    return 'N/A';
  }

  // Preload common data patterns
  async preloadCommonData() {
    console.log('🔥 Preloading common data patterns...');
    
    const commonPatterns = [
      { endpoint: 'census_acs', params: { lat: 38.6592, lon: -90.358, radius: 10 } }, // St. Louis
      { endpoint: 'census_acs', params: { lat: 40.7128, lon: -74.0060, radius: 10 } }, // NYC
      { endpoint: 'census_acs', params: { lat: 34.0522, lon: -118.2437, radius: 10 } }, // LA
    ];
    
    // This would integrate with your actual API endpoints
    // For now, just log the intention
    console.log(`📋 Preloading ${commonPatterns.length} common patterns`);
  }
}

export default new QueryCache(); 