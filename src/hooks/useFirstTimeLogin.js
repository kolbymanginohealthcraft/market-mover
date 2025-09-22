import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../app/supabaseClient';
import { useUser } from '../components/Context/UserContext';

export const useFirstTimeLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const [isChecking, setIsChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const checkInProgress = useRef(false);

  const checkFirstTimeLogin = useCallback(async () => {
    // Prevent duplicate requests
    if (checkInProgress.current) {
      return;
    }

    try {
      checkInProgress.current = true;
      
      // Don't redirect if user is currently on set-password or team-onboarding pages
      if (location.pathname === '/set-password' || location.pathname === '/team-onboarding') {
        console.log("🔍 useFirstTimeLogin - User is on auth page, not redirecting:", location.pathname);
        setIsChecking(false);
        return;
      }
      
      // Use user from UserContext instead of fetching directly
      if (!user) {
        setIsChecking(false);
        return;
      }


      // Check if user just joined a team (from URL param)
      const teamJoined = searchParams.get('team_joined');
      
      if (teamJoined === 'true') {
        // User just accepted team invitation
        setNeedsOnboarding(true);
        navigate('/team-onboarding');
        setIsChecking(false);
        return;
      }

      // Check if user has incomplete profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, team_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setIsChecking(false);
        return;
      }

      // Check if user needs to set password first (new invited user with team but no password)
      // Only redirect to set-password if user is not already on set-password or team-onboarding pages
      // and if they haven't confirmed their email yet (which happens after password is set)
      if (profile.team_id && user.app_metadata?.provider === 'email' && !user.email_confirmed_at && 
          location.pathname !== '/set-password' && location.pathname !== '/team-onboarding' &&
          !profile.first_name && !profile.last_name) {
        // User has a team but needs to set password first (indicated by missing profile data)
        console.log("🔍 useFirstTimeLogin - User needs to set password");
        navigate('/set-password');
        setIsChecking(false);
        return;
      }

      // If user has a team but incomplete profile, redirect to onboarding
      // Only redirect if user is not already on team-onboarding page
      if (profile.team_id && (!profile.first_name || !profile.last_name) && location.pathname !== '/team-onboarding') {
        console.log("🔍 useFirstTimeLogin - User needs team onboarding");
        setNeedsOnboarding(true);
        navigate('/team-onboarding');
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
    } catch (err) {
      console.error("Error checking first time login:", err);
      setIsChecking(false);
    } finally {
      checkInProgress.current = false;
    }
  }, [navigate, location.pathname, searchParams, user]);

  useEffect(() => {
    // Wait for UserContext to finish loading
    if (userLoading) {
      return;
    }

    // Don't run the hook if user is on auth pages
    if (location.pathname === '/set-password' || location.pathname === '/team-onboarding' || 
        location.pathname === '/login' || location.pathname === '/signup' || 
        location.pathname === '/forgot-password' || location.pathname === '/reset-password') {
      console.log("🔍 useFirstTimeLogin - Skipping hook on auth page:", location.pathname);
      setIsChecking(false);
      return;
    }
    checkFirstTimeLogin();
  }, [checkFirstTimeLogin, location.pathname, userLoading]);

  return {
    isChecking,
    needsOnboarding,
    checkFirstTimeLogin
  };
};
