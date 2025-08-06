import { useMemo } from 'react';

export const useAdminAuth = (profile) => {
  const isTeamAdmin = useMemo(() => {
    return profile.role === "Team Admin" || 
           profile.role === "Platform Admin" || 
           profile.role === "Platform Support";
  }, [profile.role]);

  const hasTeam = useMemo(() => {
    return !!profile.team_id;
  }, [profile.team_id]);

  return {
    isTeamAdmin,
    hasTeam
  };
}; 