import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../app/supabaseClient';
import { hasPlatformAccess, isTeamAdmin } from '../../utils/roleHelpers';
import { sessionSync, getStoredSession, isSessionValid } from '../../utils/sessionSync';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
        .select('first_name, last_name, email, role, team_id, title')
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
      setProfile(null);
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
      console.log('🔄 Refreshing user data due to permission change');
      await fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  // Force refresh user data (useful when permissions change externally)
  const forceRefreshUserData = useCallback(async () => {
    if (user?.id) {
      console.log('🔄 Force refreshing user data');
      setLoading(true);
      try {
        await fetchUserProfile(user.id);
      } finally {
        setLoading(false);
      }
    }
  }, [user?.id, fetchUserProfile]);

  // Initialize user state
  useEffect(() => {
    let mounted = true;

    const initializeUser = async () => {
      try {
        setLoading(true);
        
        // First check for stored session to handle tab duplication
        const storedSession = getStoredSession();
        if (storedSession && isSessionValid(storedSession)) {
          console.log('🔄 UserContext - Found valid stored session');
          if (mounted) {
            setUser(storedSession.user);
            if (storedSession.user) {
              await fetchUserProfile(storedSession.user.id);
            }
            setLoading(false);
          }
        }
        
        // Get current session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setUser(session?.user || null);
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initializeUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.email);
      
      setUser(session?.user || null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
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
    });

    // Listen for cross-tab session updates
    const unsubscribeSync = sessionSync.subscribe(async (event, data) => {
      if (!mounted) return;
      
      console.log('🔄 UserContext - Cross-tab session update:', event);
      
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
    forceRefreshUserData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
