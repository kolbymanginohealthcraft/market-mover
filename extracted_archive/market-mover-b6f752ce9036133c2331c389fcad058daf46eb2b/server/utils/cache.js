// Simple in-memory cache for BigQuery results
class QueryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 2 * 60 * 1000; // 2 minutes default TTL
  }

  // Generate cache key from query parameters
  generateKey(endpoint, params) {
    const sortedParams = Object.keys(params || {})
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${endpoint}:${sortedParams}`;
  }

  // Get cached result
  get(endpoint, params) {
    const key = this.generateKey(endpoint, params);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`📦 Cache hit for ${endpoint}`);
      return cached.data;
    }
    
    if (cached) {
      console.log(`🗑️ Cache expired for ${endpoint}`);
      this.cache.delete(key);
    }
    
    return null;
  }

  // Set cached result
  set(endpoint, params, data) {
    const key = this.generateKey(endpoint, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 Cached result for ${endpoint}`);
  }

  // Clear cache
  clear() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default new QueryCache(); 