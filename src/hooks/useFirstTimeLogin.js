import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../app/supabaseClient';

export const useFirstTimeLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    checkFirstTimeLogin();
  }, []);

  const checkFirstTimeLogin = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setIsChecking(false);
        return;
      }

      console.log("🔍 useFirstTimeLogin - User state:", {
        email: user.email,
        provider: user.app_metadata?.provider,
        emailConfirmed: user.email_confirmed_at,
        userMetadata: user.user_metadata
      });

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

      console.log("🔍 useFirstTimeLogin - Profile state:", {
        hasTeam: !!profile.team_id,
        hasFirstName: !!profile.first_name,
        hasLastName: !!profile.last_name
      });

      // Check if user needs to set password first (new invited user with team but no password)
      if (profile.team_id && user.app_metadata?.provider === 'email' && !user.email_confirmed_at) {
        // User has a team but needs to set password first
        console.log("🔍 useFirstTimeLogin - User needs to set password");
        navigate('/set-password');
        setIsChecking(false);
        return;
      }

      // If user has a team but incomplete profile, redirect to onboarding
      if (profile.team_id && (!profile.first_name || !profile.last_name)) {
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
    }
  };

  return {
    isChecking,
    needsOnboarding,
    checkFirstTimeLogin
  };
};
