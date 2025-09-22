import { useState, useEffect } from 'react';
import { supabase } from '../app/supabaseClient';
import { useUser } from '../components/Context/UserContext';

export const useUserTeam = () => {
  const [hasTeam, setHasTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamInfo, setTeamInfo] = useState(null);
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading) {
      checkUserTeam();
    }
  }, [user, userLoading]);

  const checkUserTeam = async () => {
    try {
      setLoading(true);
      
      if (!user) {
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
        .select('id, name')
        .eq('id', profile.team_id)
        .single();

      if (teamError) {
        console.error('Team query error:', teamError);
        setHasTeam(false);
        setLoading(false);
        return;
      }

      if (!team) {
        console.error('Team not found for team_id:', profile.team_id);
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
