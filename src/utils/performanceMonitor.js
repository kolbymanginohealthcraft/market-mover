// Performance monitoring utility for development
class PerformanceMonitor {
  constructor() {
    this.memorySnapshots = [];
    this.isMonitoring = false;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Performance monitoring started');
    
    // Monitor memory usage
    this.memoryInterval = setInterval(() => {
      this.takeMemorySnapshot();
    }, 10000); // Every 10 seconds
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    clearInterval(this.memoryInterval);
    console.log('🔍 Performance monitoring stopped');
  }

  takeMemorySnapshot() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory;
      const snapshot = {
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
      
      this.memorySnapshots.push(snapshot);
      
      // Log if memory usage is high
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      if (usedMB > 100) {
        console.warn(`⚠️ High memory usage: ${usedMB.toFixed(2)}MB`);
      }
    }
  }

  getMemoryReport() {
    if (this.memorySnapshots.length === 0) {
      return 'No memory data available';
    }
    
    const latest = this.memorySnapshots[this.memorySnapshots.length - 1];
    const usedMB = latest.usedJSHeapSize / 1024 / 1024;
    const totalMB = latest.totalJSHeapSize / 1024 / 1024;
    
    return {
      currentUsage: `${usedMB.toFixed(2)}MB`,
      totalAllocated: `${totalMB.toFixed(2)}MB`,
      snapshots: this.memorySnapshots.length
    };
  }

  clearSnapshots() {
    this.memorySnapshots = [];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();
}

export default performanceMonitor; 