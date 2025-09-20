// Session synchronization utility for cross-tab communication
class SessionSync {
  constructor() {
    this.channel = null;
    this.listeners = new Set();
    this.isInitialized = false;
    
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('market-mover-session');
      this.setupChannel();
    }
  }

  setupChannel() {
    if (!this.channel) return;

    this.channel.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'SESSION_UPDATE':
          this.notifyListeners('sessionUpdate', data);
          break;
        case 'SESSION_CLEAR':
          this.notifyListeners('sessionClear');
          break;
        case 'AUTH_STATE_CHANGE':
          this.notifyListeners('authStateChange', data);
          break;
        default:
          break;
      }
    };
  }

  // Subscribe to session changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in session sync listener:', error);
      }
    });
  }

  // Broadcast session update to other tabs
  broadcastSessionUpdate(sessionData) {
    if (this.channel) {
      this.channel.postMessage({
        type: 'SESSION_UPDATE',
        data: sessionData,
        timestamp: Date.now()
      });
    }
  }

  // Broadcast session clear to other tabs
  broadcastSessionClear() {
    if (this.channel) {
      this.channel.postMessage({
        type: 'SESSION_CLEAR',
        timestamp: Date.now()
      });
    }
  }

  // Broadcast auth state change to other tabs
  broadcastAuthStateChange(event, session) {
    if (this.channel) {
      this.channel.postMessage({
        type: 'AUTH_STATE_CHANGE',
        data: { event, session },
        timestamp: Date.now()
      });
    }
  }

  // Clean up
  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

// Create singleton instance
export const sessionSync = new SessionSync();

// Helper function to check if session exists in localStorage
export const getStoredSession = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('supabase.auth.token');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.currentSession || null;
    }
  } catch (error) {
    console.error('Error reading stored session:', error);
  }
  return null;
};

// Helper function to validate session freshness
export const isSessionValid = (session) => {
  if (!session) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  
  // Consider session valid if it expires in more than 5 minutes
  const isValid = expiresAt && (expiresAt - now) > 300;
  
  console.log('🔍 Session validation:', {
    hasSession: !!session,
    expiresAt,
    now,
    timeUntilExpiry: expiresAt ? expiresAt - now : 'N/A',
    isValid
  });
  
  return isValid;
};
