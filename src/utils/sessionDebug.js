// Debug utility for session management
import { getStoredSession, isSessionValid } from './sessionSync';

export const debugSession = () => {
  console.log('🔍 Session Debug Information:');
  
  // Check localStorage
  const stored = localStorage.getItem('supabase.auth.token');
  console.log('📦 Raw localStorage data:', stored ? 'Present' : 'Not found');
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      console.log('📦 Parsed session data:', {
        hasCurrentSession: !!parsed.currentSession,
        hasUser: !!parsed.currentSession?.user,
        userEmail: parsed.currentSession?.user?.email,
        expiresAt: parsed.currentSession?.expires_at,
        accessToken: parsed.currentSession?.access_token ? 'Present' : 'Missing'
      });
    } catch (error) {
      console.error('❌ Error parsing stored session:', error);
    }
  }
  
  // Check session validity
  const session = getStoredSession();
  const isValid = isSessionValid(session);
  console.log('✅ Session validity check:', isValid);
  
  // Check BroadcastChannel support
  const hasBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window;
  console.log('📡 BroadcastChannel support:', hasBroadcastChannel);
  
  return {
    hasStoredSession: !!stored,
    hasValidSession: isValid,
    hasBroadcastChannel
  };
};

// Add to window for easy debugging
if (typeof window !== 'undefined') {
  window.debugSession = debugSession;
}
