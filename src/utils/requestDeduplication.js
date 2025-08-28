/**
 * Request deduplication utility
 * Prevents duplicate API calls by tracking ongoing requests
 */

class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
    this.requestTimeouts = new Map();
    this.defaultTimeout = 30000; // 30 seconds
  }

  // Generate a unique key for a request
  generateKey(method, url, body = null) {
    const bodyString = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyString}`;
  }

  // Execute a request with deduplication
  async execute(key, requestFunction, timeout = this.defaultTimeout) {
    // Check if there's already a pending request
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 Request deduplicated: ${key}`);
      return this.pendingRequests.get(key);
    }

    // Create a promise for this request
    const requestPromise = this.executeRequest(requestFunction, timeout);
    
    // Store the promise
    this.pendingRequests.set(key, requestPromise);
    
    // Set up cleanup
    const timeoutId = setTimeout(() => {
      this.pendingRequests.delete(key);
      this.requestTimeouts.delete(key);
    }, timeout);
    
    this.requestTimeouts.set(key, timeoutId);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up
      this.pendingRequests.delete(key);
      if (this.requestTimeouts.has(key)) {
        clearTimeout(this.requestTimeouts.get(key));
        this.requestTimeouts.delete(key);
      }
    }
  }

  // Execute the actual request
  async executeRequest(requestFunction, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await requestFunction(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw error;
    }
  }

  // Cancel a pending request
  cancel(key) {
    if (this.pendingRequests.has(key)) {
      console.log(`❌ Cancelling request: ${key}`);
      this.pendingRequests.delete(key);
      
      if (this.requestTimeouts.has(key)) {
        clearTimeout(this.requestTimeouts.get(key));
        this.requestTimeouts.delete(key);
      }
    }
  }

  // Cancel all pending requests
  cancelAll() {
    console.log(`❌ Cancelling ${this.pendingRequests.size} pending requests`);
    this.pendingRequests.clear();
    
    for (const timeoutId of this.requestTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.requestTimeouts.clear();
  }

  // Get stats
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      activeTimeouts: this.requestTimeouts.size
    };
  }
}

// Create a singleton instance
const requestDeduplicator = new RequestDeduplicator();

// Helper function for fetch with deduplication
export const fetchWithDeduplication = async (url, options = {}, timeout = 30000) => {
  const method = options.method || 'GET';
  const body = options.body || null;
  const key = requestDeduplicator.generateKey(method, url, body);
  
  return requestDeduplicator.execute(key, async (signal) => {
    const response = await fetch(url, {
      ...options,
      signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }, timeout);
};

// Helper function for API calls with deduplication
export const apiCallWithDeduplication = async (endpoint, options = {}, timeout = 30000) => {
  const { apiUrl } = await import('./api.js');
  const url = apiUrl(endpoint);
  
  return fetchWithDeduplication(url, options, timeout);
};

export default requestDeduplicator;
