import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../app/supabaseClient';
import { hasPlatformAccess, isTeamAdmin } from '../../utils/roleHelpers';
import { sessionSync, getStoredSession, isSessionValid } from '../../utils/sessionSync';
import { apiUrl } from '../../utils/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUserId, setOriginalUserId] = useState(null);
  const [permissions, setPermissions] = useState({
    isTeamAdmin: false,
    isPlatformAdmin: false,
    hasTeam: false,
    canAccessPlatform: false,
    canAccessUsers: false
  });

  // Fetch user profile data
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setPermissions({
        isTeamAdmin: false,
        isPlatformAdmin: false,
        hasTeam: false,
        canAccessPlatform: false,
        canAccessUsers: false
      });
      return;
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, team_id, title')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setProfile(null);
        setPermissions({
          isTeamAdmin: false,
          isPlatformAdmin: false,
          hasTeam: false,
          canAccessPlatform: false,
          canAccessUsers: false
        });
        return;
      }

      setProfile(profileData);

      // Calculate permissions based on role
      const role = profileData?.role;
      const hasTeam = !!profileData?.team_id;
      
      const newPermissions = {
        isTeamAdmin: isTeamAdmin(role),
        isPlatformAdmin: hasPlatformAccess(role),
        hasTeam,
        canAccessPlatform: hasPlatformAccess(role),
        canAccessUsers: isTeamAdmin(role)
      };

      setPermissions(newPermissions);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      
      // Set a default profile so the app can still work
      setProfile({
        first_name: 'User',
        last_name: '',
        email: '',
        role: 'user',
        team_id: null,
        title: ''
      });
      
      setPermissions({
        isTeamAdmin: false,
        isPlatformAdmin: false,
        hasTeam: false,
        canAccessPlatform: false,
        canAccessUsers: false
      });
    }
  }, []);

  // Refresh user data (useful when permissions change)
  const refreshUserData = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  // Force refresh user data (useful when permissions change externally)
  const forceRefreshUserData = useCallback(async () => {
    if (user?.id) {
      setLoading(true);
      try {
        await fetchUserProfile(user.id);
      } finally {
        setLoading(false);
      }
    }
  }, [user?.id, fetchUserProfile]);

  // Check for stored impersonation state on mount
  useEffect(() => {
    const storedOriginalUserId = localStorage.getItem('impersonation_original_user_id');
    if (storedOriginalUserId) {
      setOriginalUserId(storedOriginalUserId);
      setIsImpersonating(true);
    }
  }, []);

  // Start impersonation
  const startImpersonation = useCallback(async (targetUserId) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('No active session');
      }

      const currentUserId = currentSession.user.id;
      
      // Store original user ID
      localStorage.setItem('impersonation_original_user_id', currentUserId);
      setOriginalUserId(currentUserId);
      
      // Call server endpoint to get impersonation session
      const response = await fetch(apiUrl('/api/impersonate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({ target_user_id: targetUserId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start impersonation');
      }

      const { session } = await response.json();
      
      // Set the new session
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });

      if (setSessionError) {
        throw setSessionError;
      }

      setIsImpersonating(true);
      return { success: true };
    } catch (error) {
      console.error('Error starting impersonation:', error);
      localStorage.removeItem('impersonation_original_user_id');
      setOriginalUserId(null);
      setIsImpersonating(false);
      return { success: false, error: error.message };
    }
  }, []);

  // Stop impersonation
  const stopImpersonation = useCallback(async () => {
    try {
      const storedOriginalUserId = localStorage.getItem('impersonation_original_user_id');
      if (!storedOriginalUserId) {
        throw new Error('No original user ID found');
      }

      // Call server endpoint to get original user session
      const response = await fetch(apiUrl('/api/stop-impersonate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ original_user_id: storedOriginalUserId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to stop impersonation');
      }

      const { session } = await response.json();
      
      // Set the original session
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });

      if (setSessionError) {
        throw setSessionError;
      }

      // Clear impersonation state
      localStorage.removeItem('impersonation_original_user_id');
      setOriginalUserId(null);
      setIsImpersonating(false);
      return { success: true };
    } catch (error) {
      console.error('Error stopping impersonation:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Check for profile update parameter and refresh profile data
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('profile_updated') === 'true' && user?.id) {
      console.log('🔄 Profile update detected, refreshing profile data...');
      fetchUserProfile(user.id);
      
      // Clean up the URL parameter to prevent repeated refreshes
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search, user?.id, fetchUserProfile]);

  // Initialize auth state - self-sufficient, doesn't depend on App.jsx
  useEffect(() => {
    let mounted = true;

    // Initialize session immediately
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setProfile(null);
          setPermissions({
            isTeamAdmin: false,
            isPlatformAdmin: false,
            hasTeam: false,
            canAccessPlatform: false,
            canAccessUsers: false
          });
          setLoading(false);
          return;
        }

        setUser(session?.user || null);
        
        if (session?.user) {
          // Don't await profile fetch - let it happen in background
          fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setPermissions({
            isTeamAdmin: false,
            isPlatformAdmin: false,
            hasTeam: false,
            canAccessPlatform: false,
            canAccessUsers: false
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setPermissions({
            isTeamAdmin: false,
            isPlatformAdmin: false,
            hasTeam: false,
            canAccessPlatform: false,
            canAccessUsers: false
          });
          setLoading(false);
        }
      }
    };

    // Initialize immediately
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setUser(session?.user || null);
      
      if (session?.user) {
        // Don't await profile fetch - let it happen in background
        fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
        setPermissions({
          isTeamAdmin: false,
          isPlatformAdmin: false,
          hasTeam: false,
          canAccessPlatform: false,
          canAccessUsers: false
        });
      }
      
      setLoading(false);
    });

    // Listen for cross-tab session updates
    const unsubscribeSync = sessionSync.subscribe(async (event, data) => {
      if (!mounted) return;
      
      if (event === 'sessionUpdate' && data?.user) {
        setUser(data.user);
        await fetchUserProfile(data.user.id);
      } else if (event === 'sessionClear') {
        setUser(null);
        setProfile(null);
        setPermissions({
          isTeamAdmin: false,
          isPlatformAdmin: false,
          hasTeam: false,
          canAccessPlatform: false,
          canAccessUsers: false
        });
      } else if (event === 'authStateChange' && data?.session) {
        setUser(data.session.user);
        if (data.session.user) {
          await fetchUserProfile(data.session.user.id);
        } else {
          setProfile(null);
          setPermissions({
            isTeamAdmin: false,
            isPlatformAdmin: false,
            hasTeam: false,
            canAccessPlatform: false,
            canAccessUsers: false
          });
        }
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      unsubscribeSync();
    };
  }, [fetchUserProfile]);

  const value = {
    user,
    profile,
    loading,
    permissions,
    refreshUserData,
    forceRefreshUserData,
    isImpersonating,
    originalUserId,
    startImpersonation,
    stopImpersonation
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
