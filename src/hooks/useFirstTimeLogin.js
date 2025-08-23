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

      // If user has a team but incomplete profile, redirect to onboarding
      if (profile.team_id && (!profile.first_name || !profile.last_name)) {
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
