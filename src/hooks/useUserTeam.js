import { useState, useEffect } from 'react';
import { supabase } from '../app/supabaseClient';

export const useUserTeam = () => {
  const [hasTeam, setHasTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamInfo, setTeamInfo] = useState(null);

  useEffect(() => {
    checkUserTeam();
  }, []);

  const checkUserTeam = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setHasTeam(false);
        setLoading(false);
        return;
      }

      // Get user's profile to check team_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.team_id) {
        setHasTeam(false);
        setLoading(false);
        return;
      }

      // Get team information
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name, tier')
        .eq('id', profile.team_id)
        .single();

      if (teamError || !team) {
        setHasTeam(false);
        setLoading(false);
        return;
      }

      setHasTeam(true);
      setTeamInfo(team);
    } catch (error) {
      console.error('Error checking user team:', error);
      setHasTeam(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    hasTeam,
    teamInfo,
    loading,
    checkUserTeam
  };
};
