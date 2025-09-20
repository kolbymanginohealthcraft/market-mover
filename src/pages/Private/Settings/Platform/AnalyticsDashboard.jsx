import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../app/supabaseClient';
import { 
  Users, 
  Calendar, 
  Building, 
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import Button from '../../../../components/Buttons/Button';
import Spinner from '../../../../components/Buttons/Spinner';
import SectionHeader from '../../../../components/Layouts/SectionHeader';
import styles from './AnalyticsDashboard.module.css';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    userMetrics: {},
    loginHistory: {},
    teamAnalytics: {}
  });
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [teamUsers, setTeamUsers] = useState({});

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        userMetrics,
        loginHistory,
        teamAnalytics
      ] = await Promise.all([
        fetchUserMetrics(),
        fetchLoginHistory(),
        fetchTeamAnalytics()
      ]);

      setAnalytics({
        userMetrics,
        loginHistory,
        teamAnalytics
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMetrics = async () => {
    try {
      // Get total users
      const { count: totalUsers, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;
      console.log('Total users:', totalUsers);

      // Get monthly active users (users with activity in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentActivities, error: activityError } = await supabase
        .from('user_activities')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (activityError) throw activityError;
      console.log('Recent activities:', recentActivities?.length || 0);

      const monthlyActiveUsers = new Set(recentActivities?.map(a => a.user_id) || []).size;
      console.log('Monthly active users:', monthlyActiveUsers);

      // Get users by role
      const { data: usersByRole, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .not('role', 'is', null);

      if (roleError) throw roleError;
      console.log('Users by role:', usersByRole?.length || 0);

      const roleCounts = {};
      usersByRole?.forEach(user => {
        const role = user.role || 'No Role';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      // Get users by team
      const { data: usersByTeam, error: teamError } = await supabase
        .from('profiles')
        .select('team_id, teams(name)')
        .not('team_id', 'is', null);

      if (teamError) throw teamError;
      console.log('Users by team:', usersByTeam?.length || 0);

      const teamCounts = {};
      usersByTeam?.forEach(user => {
        const teamName = user.teams?.name || 'Unknown Team';
        teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
      });

      const result = {
        totalUsers: totalUsers || 0,
        monthlyActiveUsers,
        roleCounts,
        teamCounts,
        activeUserPercentage: totalUsers > 0 ? Math.round((monthlyActiveUsers / totalUsers) * 100) : 0
      };
      
      console.log('User metrics result:', result);
      return result;
    } catch (err) {
      console.error('Error fetching user metrics:', err);
      return {};
    }
  };

  const fetchLoginHistory = async () => {
    try {
      // First, let's see what columns exist in user_activities
      const { data: sampleActivities, error: sampleError } = await supabase
        .from('user_activities')
        .select('*')
        .limit(5);

      if (sampleError) {
        console.error('Error checking user_activities structure:', sampleError);
        return { totalLogins: 0, uniqueLogins: 0, loginByDate: {}, recentLogins: [] };
      }

      console.log('Sample activity records:', sampleActivities);

      // Get all activities from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: allActivities, error } = await supabase
        .from('user_activities')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('All activities found:', allActivities?.length || 0);

      // For now, let's treat all activities as "logins" since we don't know the exact structure
      // This will show all user activity in the last 30 days
      const loginActivities = allActivities || [];

      // Get unique user IDs from login activities
      const uniqueUserIds = [...new Set(loginActivities.map(a => a.user_id))];
      
      // Fetch user details for the unique users
      let userDetails = {};
      if (uniqueUserIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', uniqueUserIds);
        
        if (!usersError && users) {
          users.forEach(user => {
            userDetails[user.id] = user;
          });
        }
      }

      // Group by date
      const loginByDate = {};
      loginActivities.forEach(activity => {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        if (!loginByDate[date]) {
          loginByDate[date] = [];
        }
        loginByDate[date].push({
          userId: activity.user_id,
          timestamp: activity.created_at,
          user: userDetails[activity.user_id]
        });
      });

      // Get unique users who logged in
      const uniqueLogins = uniqueUserIds.length;

      const result = {
        totalLogins: loginActivities.length,
        uniqueLogins,
        loginByDate,
        recentLogins: loginActivities.slice(0, 10).map(activity => ({
          userId: activity.user_id,
          timestamp: activity.created_at,
          user: userDetails[activity.user_id]
        }))
      };
      
      console.log('Login history result:', result);
      return result;
    } catch (err) {
      console.error('Error fetching login history:', err);
      return { totalLogins: 0, uniqueLogins: 0, loginByDate: {}, recentLogins: [] };
    }
  };

  const fetchTeamAnalytics = async () => {
    try {
      // Get all teams with their member counts
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          created_at,
          profiles(count)
        `);

      if (teamsError) throw teamsError;
      console.log('Teams found:', teams?.length || 0);

      // Get active subscriptions for license quantities
      const teamIds = teams?.map(team => team.id) || [];
      let subscriptions = [];
      
      if (teamIds.length > 0) {
        const { data: subsData, error: subsError } = await supabase
          .from('subscriptions')
          .select('team_id, license_quantity')
          .in('team_id', teamIds)
          .eq('status', 'active')
          .is('expires_at', null);

        if (subsError) {
          console.error('Error fetching subscriptions:', subsError);
        } else {
          subscriptions = subsData || [];
        }
      }

      // Get team activity (simplified query)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: teamActivities, error: activityError } = await supabase
        .from('user_activities')
        .select('user_id, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (activityError) {
        console.error('Error fetching team activities:', activityError);
        // Continue without team activities
        const teamAnalytics = teams?.map(team => {
          const activeSubscription = subscriptions.find(sub => sub.team_id === team.id);
          const licenseQuantity = activeSubscription?.license_quantity || 0;
          return {
            id: team.id,
            name: team.name,
            maxUsers: licenseQuantity,
            currentUsers: team.profiles?.[0]?.count || 0,
            createdAt: team.created_at,
            activityCount: 0,
            utilizationRate: licenseQuantity > 0 ? Math.round((team.profiles?.[0]?.count / licenseQuantity) * 100) : 0
          };
        }) || [];

        const result = {
          totalTeams: teamAnalytics.length,
          teamAnalytics: teamAnalytics.sort((a, b) => b.activityCount - a.activityCount)
        };
        
        console.log('Team analytics result (no activities):', result);
        return result;
      }

      console.log('Team activities found:', teamActivities?.length || 0);

      // Get unique user IDs from team activities
      const uniqueUserIds = [...new Set(teamActivities?.map(a => a.user_id) || [])];
      
      // Fetch user team assignments
      let userTeamMap = {};
      if (uniqueUserIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, team_id')
          .in('id', uniqueUserIds);
        
        if (!usersError && users) {
          users.forEach(user => {
            if (user.team_id) {
              userTeamMap[user.id] = user.team_id;
            }
          });
        }
      }

      // Calculate team activity
      const teamActivityCounts = {};
      teamActivities?.forEach(activity => {
        const teamId = userTeamMap[activity.user_id];
        if (teamId) {
          if (!teamActivityCounts[teamId]) {
            teamActivityCounts[teamId] = 0;
          }
          teamActivityCounts[teamId]++;
        }
      });

      const teamAnalytics = teams?.map(team => {
        const activeSubscription = subscriptions.find(sub => sub.team_id === team.id);
        const licenseQuantity = activeSubscription?.license_quantity || 0;
        return {
          id: team.id,
          name: team.name,
          maxUsers: licenseQuantity,
          currentUsers: team.profiles?.[0]?.count || 0,
          createdAt: team.created_at,
          activityCount: teamActivityCounts[team.id] || 0,
          utilizationRate: licenseQuantity > 0 ? Math.round((team.profiles?.[0]?.count / licenseQuantity) * 100) : 0
        };
      }) || [];

      const result = {
        totalTeams: teamAnalytics.length,
        teamAnalytics: teamAnalytics.sort((a, b) => b.activityCount - a.activityCount)
      };
      
      console.log('Team analytics result:', result);
      return result;
    } catch (err) {
      console.error('Error fetching team analytics:', err);
      return { totalTeams: 0, teamAnalytics: [] };
    }
  };

  const fetchTeamUsers = async (teamId) => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, updated_at')
        .eq('team_id', teamId)
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching team users:', error);
        throw error;
      }
      
      return users || [];
    } catch (err) {
      console.error('Error fetching team users:', err);
      return [];
    }
  };

  const toggleTeamExpansion = async (teamId) => {
    const newExpandedTeams = new Set(expandedTeams);
    
    if (newExpandedTeams.has(teamId)) {
      newExpandedTeams.delete(teamId);
    } else {
      newExpandedTeams.add(teamId);
      
      // Fetch team users if not already loaded
      if (!teamUsers[teamId]) {
        const users = await fetchTeamUsers(teamId);
        setTeamUsers(prev => ({ ...prev, [teamId]: users }));
      }
    }
    
    setExpandedTeams(newExpandedTeams);
  };



  // Helper functions
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Spinner size="lg" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Analytics</h2>
          <p>{error}</p>
          <Button onClick={fetchAnalytics} variant="accent">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Analytics Dashboard</h1>
        <p className={styles.subtitle}>
            Platform analytics and user insights
        </p>
        </div>
      </div>

             <div className={styles.analyticsGrid}>
                   {/* User Metrics Overview */}
          <div className={styles.section}>
            <SectionHeader 
              title="User Metrics" 
              icon={Users}
              showActionButton={false}
            />
            <div className={styles.sectionContent}>
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>
                    {formatNumber(analytics.userMetrics.totalUsers || 0)}
                  </div>
                  <div className={styles.metricLabel}>Total Users</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>
                    {formatNumber(analytics.userMetrics.monthlyActiveUsers || 0)}
                  </div>
                  <div className={styles.metricLabel}>Monthly Active Users</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>
                    {analytics.userMetrics.activeUserPercentage || 0}%
                  </div>
                  <div className={styles.metricLabel}>Active User Rate</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>
                    {formatNumber(analytics.loginHistory.uniqueLogins || 0)}
                  </div>
                  <div className={styles.metricLabel}>Unique Logins (30d)</div>
                </div>
              </div>
            </div>
          </div>

                                       {/* User Activity */}
           <div className={styles.section}>
             <SectionHeader 
               title="User Activity" 
               icon={Calendar}
               showActionButton={false}
             />
            <div className={styles.sectionContent}>
              <div className={styles.metricsGrid}>
                                 <div className={styles.metricCard}>
                   <div className={styles.metricValue}>
                     {formatNumber(analytics.loginHistory.totalLogins || 0)}
                   </div>
                   <div className={styles.metricLabel}>Total Activities (30d)</div>
                 </div>
                 <div className={styles.metricCard}>
                   <div className={styles.metricValue}>
                     {formatNumber(analytics.loginHistory.uniqueLogins || 0)}
                   </div>
                   <div className={styles.metricLabel}>Active Users</div>
                 </div>
              </div>

                             {analytics.loginHistory.recentLogins?.length > 0 && (
                 <div className={styles.loginHistory}>
                   <h3>Recent Activity</h3>
                   <div className={styles.loginList}>
                     {analytics.loginHistory.recentLogins.map((login, index) => (
                       <div key={index} className={styles.loginItem}>
                         <span className={styles.loginUser}>
                           {login.user?.first_name} {login.user?.last_name}
                         </span>
                         <span className={styles.loginTime}>
                           <Clock size={14} />
                           {formatDate(login.timestamp)}
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>

                   {/* Team Analytics */}
          <div className={styles.section}>
            <SectionHeader 
              title="Team Analytics" 
              icon={Building}
              showActionButton={false}
            />
            <div className={styles.sectionContent}>
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>
                    {analytics.teamAnalytics.totalTeams || 0}
                  </div>
                  <div className={styles.metricLabel}>Total Teams</div>
                </div>
              </div>

                             {analytics.teamAnalytics.teamAnalytics?.length > 0 && (
                 <div className={styles.teamBreakdown}>
                   <h3>All Teams</h3>
                   <div className={styles.teamList}>
                     {analytics.teamAnalytics.teamAnalytics.map((team) => (
                       <div key={team.id} className={styles.teamItem}>
                         <div 
                           className={styles.teamHeader}
                           onClick={() => toggleTeamExpansion(team.id)}
                         >
                           <div className={styles.teamInfo}>
                             <div className={styles.teamExpandIcon}>
                               {expandedTeams.has(team.id) ? (
                                 <ChevronDown size={16} />
                               ) : (
                                 <ChevronRight size={16} />
                               )}
                             </div>
                             <div className={styles.teamDetails}>
                               <span className={styles.teamName}>{team.name}</span>
                             </div>
                           </div>
                           <div className={styles.teamStats}>
                             <span className={styles.teamUsers}>
                               {team.currentUsers}/{team.maxUsers} users
                             </span>
                             <span className={styles.teamActivity}>
                               {team.activityCount} activities
                             </span>
                           </div>
                         </div>
                         
                                                   {expandedTeams.has(team.id) && (
                            <div className={styles.teamMembers}>
                              {teamUsers[team.id] ? (
                                teamUsers[team.id].map((user) => (
                                  <div key={user.id} className={styles.teamMember}>
                                    <div className={styles.memberInfo}>
                                      <span className={styles.memberName}>
                                        {user.first_name} {user.last_name}
                                      </span>
                                      <span className={styles.memberEmail}>{user.email}</span>
                                    </div>
                                    <div className={styles.memberRole}>
                                      <span className={styles.roleBadge}>{user.role || 'No Role'}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className={styles.loadingMembers}>
                                  <Spinner size="sm" />
                                  <span>Loading team members...</span>
                                </div>
                              )}
                            </div>
                          )}
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>
       </div>
    </div>
  );
} 