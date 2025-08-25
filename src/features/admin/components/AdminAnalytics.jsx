import React from 'react';
import { useAdminAnalytics } from '../hooks/useAdminAnalytics';
import { 
  Users, 
  Activity, 
  Calendar, 
  Shield, 
  Building, 
  TrendingUp, 
  RefreshCw,
  BarChart3,
  UserCheck,
  Clock,
  Target,
  Zap,
  MessageSquare,
  Settings
} from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import SectionHeader from '../../../components/Layouts/SectionHeader';
import styles from './AdminAnalytics.module.css';

export default function AdminAnalytics() {
  const { analytics, loading, error, fetchAnalytics, formatNumber, formatDate, getActivityIcon } = useAdminAnalytics();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Spinner size="lg" />
          <p>Loading admin analytics...</p>
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
          <h1>Admin Analytics</h1>
          <p className={styles.subtitle}>
            Comprehensive platform analytics and user insights
          </p>
        </div>
        <div className={styles.actions}>
          <Button onClick={fetchAnalytics} variant="accent" size="sm">
            <RefreshCw size={16} />
            Refresh Data
          </Button>
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

                 {/* Login History */}
         <div className={styles.section}>
           <SectionHeader 
             title="Login History" 
             icon={Calendar}
             showActionButton={false}
           />
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>
                {formatNumber(analytics.loginHistory.totalLogins || 0)}
              </div>
              <div className={styles.metricLabel}>Total Logins (30d)</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>
                {formatNumber(analytics.loginHistory.uniqueLogins || 0)}
              </div>
              <div className={styles.metricLabel}>Unique Users</div>
            </div>
          </div>

          {analytics.loginHistory.recentLogins?.length > 0 && (
            <div className={styles.loginHistory}>
              <h3>Recent Logins</h3>
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

                 {/* Team Analytics */}
         <div className={styles.section}>
           <SectionHeader 
             title="Team Analytics" 
             icon={Building}
             showActionButton={false}
           />
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>
                {analytics.teamAnalytics.totalTeams || 0}
              </div>
              <div className={styles.metricLabel}>Total Teams</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>
                {Object.keys(analytics.teamAnalytics.teamsByTier || {}).length}
              </div>
              <div className={styles.metricLabel}>Active Tiers</div>
            </div>
          </div>

          {analytics.teamAnalytics.teamAnalytics?.length > 0 && (
            <div className={styles.teamBreakdown}>
              <h3>Most Active Teams</h3>
              <div className={styles.teamList}>
                {analytics.teamAnalytics.teamAnalytics.slice(0, 5).map((team) => (
                  <div key={team.id} className={styles.teamItem}>
                    <div className={styles.teamInfo}>
                      <span className={styles.teamName}>{team.name}</span>
                      <span className={styles.teamTier}>{team.tier}</span>
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
                ))}
              </div>
            </div>
          )}
        </div>

                 {/* Users by Role */}
         <div className={styles.section}>
           <SectionHeader 
             title="Users by Role" 
             icon={Shield}
             showActionButton={false}
           />
          <div className={styles.roleBreakdown}>
            {Object.entries(analytics.userMetrics.roleCounts || {}).map(([role, count]) => (
              <div key={role} className={styles.roleCard}>
                <div className={styles.roleHeader}>
                  <span className={styles.roleName}>{role}</span>
                  <span className={styles.roleCount}>{count}</span>
                </div>
                <div className={styles.roleBar}>
                  <div 
                    className={styles.roleBarFill}
                    style={{ 
                      width: `${analytics.userMetrics.totalUsers > 0 ? (count / analytics.userMetrics.totalUsers) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

                 {/* User Activity */}
         <div className={styles.section}>
           <SectionHeader 
             title="User Activity (Last 30 Days)" 
             icon={Activity}
             showActionButton={false}
           />
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>
                {formatNumber(analytics.userActivity.totalActivities || 0)}
              </div>
              <div className={styles.metricLabel}>Total Activities</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>
                {formatNumber(analytics.featureUsage.totalActiveUsers || 0)}
              </div>
              <div className={styles.metricLabel}>Active Users</div>
            </div>
          </div>

          {analytics.userActivity.topActivities?.length > 0 && (
            <div className={styles.activityBreakdown}>
              <h3>Top Activities</h3>
              <div className={styles.activityList}>
                {analytics.userActivity.topActivities.map(([activity, count]) => (
                  <div key={activity} className={styles.activityItem}>
                    <span className={styles.activityIcon}>
                      {getActivityIcon(activity)}
                    </span>
                    <span className={styles.activityName}>
                      {activity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className={styles.activityCount}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

                 {/* Feature Usage */}
         <div className={styles.section}>
           <SectionHeader 
             title="Feature Usage" 
             icon={TrendingUp}
             showActionButton={false}
           />
          <div className={styles.featureUsage}>
            {analytics.featureUsage.topFeatures?.map(([feature, data]) => (
              <div key={feature} className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <span className={styles.featureName}>
                    {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className={styles.featurePercentage}>{data.percentage}%</span>
                </div>
                <div className={styles.featureBar}>
                  <div 
                    className={styles.featureBarFill}
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
                <div className={styles.featureUsers}>
                  {data.uniqueUsers} users
                </div>
              </div>
            ))}
          </div>
        </div>

                 {/* Engagement Metrics */}
         <div className={styles.section}>
           <SectionHeader 
             title="Engagement" 
             icon={Zap}
             showActionButton={false}
           />
          <div className={styles.engagementGrid}>
            <div className={styles.engagementCard}>
              <div className={styles.engagementValue}>
                {analytics.engagement.activeStreaks || 0}
              </div>
              <div className={styles.engagementLabel}>Active Streaks</div>
            </div>
            <div className={styles.engagementCard}>
              <div className={styles.engagementValue}>
                {analytics.engagement.topStreak || 0}
              </div>
              <div className={styles.engagementLabel}>Longest Streak</div>
            </div>
          </div>
        </div>

                 {/* Feedback & Requests */}
         <div className={styles.section}>
           <SectionHeader 
             title="Feedback & Requests" 
             icon={MessageSquare}
             showActionButton={false}
           />
          <div className={styles.feedbackGrid}>
            <div className={styles.feedbackCard}>
              <h3>Testimonials</h3>
              <div className={styles.feedbackStats}>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.testimonials?.total || 0}
                  </span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.testimonials?.pending || 0}
                  </span>
                  <span className={styles.statLabel}>Pending</span>
                </div>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.testimonials?.approved || 0}
                  </span>
                  <span className={styles.statLabel}>Approved</span>
                </div>
              </div>
            </div>

            <div className={styles.feedbackCard}>
              <h3>Feature Requests</h3>
              <div className={styles.feedbackStats}>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.featureRequests?.total || 0}
                  </span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.featureRequests?.pending || 0}
                  </span>
                  <span className={styles.statLabel}>Pending</span>
                </div>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.featureRequests?.approved || 0}
                  </span>
                  <span className={styles.statLabel}>Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

                 {/* System Health */}
         <div className={styles.section}>
           <SectionHeader 
             title="System Health" 
             icon={Settings}
             showActionButton={false}
           />
          <div className={styles.systemHealth}>
            <div className={styles.healthCard}>
              <div className={styles.healthValue}>
                {analytics.systemHealth.activeAnnouncements || 0}
              </div>
              <div className={styles.healthLabel}>Active Announcements</div>
            </div>
            <div className={styles.healthCard}>
              <div className={styles.healthValue}>
                {analytics.systemHealth.totalAnnouncements || 0}
              </div>
              <div className={styles.healthLabel}>Total Announcements</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
