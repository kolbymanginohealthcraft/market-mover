import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';

export const useAdminData = () => {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    company: "",
    title: "",
    role: null,
    team_id: null,
  });

  const [teamInfo, setTeamInfo] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [licensesMaxedOut, setLicensesMaxedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Authentication failed.");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, title, role, team_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        setError("Failed to load profile.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch team data if user is part of a team
      if (profileData.team_id) {
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("name, created_at")
          .eq("id", profileData.team_id)
          .single();

        if (teamError || !team) {
          setError("Failed to load team info.");
          setLoading(false);
          return;
        }

        // Fetch current active subscription
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("team_id", profileData.team_id)
          .eq("status", "active")
          .is("expires_at", null)
          .order("started_at", { ascending: false })
          .limit(1)
          .single();

        if (subError || !subData) {
          setError("No active subscription found for this team.");
          setLoading(false);
          return;
        }

        setSubscription(subData);

        setTeamInfo({
          id: profileData.team_id,
          name: team.name,
          maxUsers: subData.license_quantity,
          createdAt: team.created_at,
        });

        // Fetch team members
        const { data: members, error: membersError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, title, email, role")
          .eq("team_id", profileData.team_id);

        if (membersError) {
          setError("Failed to load team members.");
          setLoading(false);
          return;
        }

        setTeamMembers(members || []);

        // Check if licenses are maxed out
        const currentMemberCount = members?.length || 0;
        setLicensesMaxedOut(currentMemberCount >= subData.license_quantity);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    profile,
    setProfile,
    teamInfo,
    setTeamInfo,
    teamMembers,
    setTeamMembers,
    subscription,
    setSubscription,
    currentUserId,
    licensesMaxedOut,
    loading,
    error,
    message,
    setMessage,
    setError,
    fetchData
  };
}; 