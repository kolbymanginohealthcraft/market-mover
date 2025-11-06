import React, { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Users, X, BarChart3, List, Search } from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import UserDetailModal from './UserDetailModal';
import ManageTeams from '../../../pages/Private/Settings/Platform/ManageTeams';
import styles from './UserList.module.css';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loginHistory, setLoginHistory] = useState({});
  const [activityCounts, setActivityCounts] = useState({});
  const [activityCounts7Days, setActivityCounts7Days] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [activityLevelFilter, setActivityLevelFilter] = useState('all');
  const [activityLevel7DaysFilter, setActivityLevel7DaysFilter] = useState('all');
  const [loginStatusFilter, setLoginStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('email');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUsers();
  }, [sortBy, sortOrder]);

  useEffect(() => {
    if (users.length > 0) {
      fetchLoginHistory();
      fetchActivityCounts();
      fetchActivityCounts7Days();
    }
  }, [users]);

  useEffect(() => {
    if (sortBy === 'last_login' && Object.keys(loginHistory).length > 0 && users.length > 0) {
      setUsers(prevUsers => {
        const sorted = [...prevUsers].sort((a, b) => {
          const aLogin = loginHistory[a.id]?.lastSignIn;
          const bLogin = loginHistory[b.id]?.lastSignIn;
          if (!aLogin && !bLogin) return 0;
          if (!aLogin) return 1;
          if (!bLogin) return -1;
          const comparison = new Date(aLogin) - new Date(bLogin);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        return sorted;
      });
    } else if (sortBy === 'total_activities' && Object.keys(activityCounts).length > 0 && users.length > 0) {
      setUsers(prevUsers => {
        const sorted = [...prevUsers].sort((a, b) => {
          const aCount = activityCounts[a.id] || 0;
          const bCount = activityCounts[b.id] || 0;
          const comparison = aCount - bCount;
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        return sorted;
      });
    } else if (sortBy === 'activities_7days' && Object.keys(activityCounts7Days).length > 0 && users.length > 0) {
      setUsers(prevUsers => {
        const sorted = [...prevUsers].sort((a, b) => {
          const aCount = activityCounts7Days[a.id] || 0;
          const bCount = activityCounts7Days[b.id] || 0;
          const comparison = aCount - bCount;
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        return sorted;
      });
    }
  }, [loginHistory, activityCounts, activityCounts7Days, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          role,
          title,
          team_id,
          teams(name)
        `);
      
      // Handle sorting - some fields need special handling
      if (sortBy === 'name') {
        query = query.order('last_name', { ascending: sortOrder === 'asc' });
      } else if (sortBy === 'team') {
        query = query.order('team_id', { ascending: sortOrder === 'asc' });
      } else if (sortBy === 'last_login' || sortBy === 'total_activities' || sortBy === 'activities_7days') {
        query = query.order('email', { ascending: true });
      } else if (sortBy === 'email') {
        query = query.order('email', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      const { data, error } = await query;

      if (error) throw error;

      let sortedData = data || [];
      
      // Handle client-side sorting for fields that can't be sorted in the query
      if (sortBy === 'name') {
        sortedData = [...sortedData].sort((a, b) => {
          const aName = `${a.last_name || ''} ${a.first_name || ''}`.trim();
          const bName = `${b.last_name || ''} ${b.first_name || ''}`.trim();
          const comparison = aName.localeCompare(bName);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      } else if (sortBy === 'team') {
        sortedData = [...sortedData].sort((a, b) => {
          const aTeam = a.teams?.name || '';
          const bTeam = b.teams?.name || '';
          const comparison = aTeam.localeCompare(bTeam);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }

      setUsers(sortedData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/users/login-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const history = await response.json();
        setLoginHistory(history);
      }
    } catch (err) {
      console.error('Error fetching login history:', err);
    }
  };

  const fetchActivityCounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/users/activity-counts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const counts = await response.json();
        setActivityCounts(counts);
      } else {
        console.error('Error fetching activity counts:', await response.text());
        setActivityCounts({});
      }
    } catch (err) {
      console.error('Error fetching activity counts:', err);
      setActivityCounts({});
    }
  };

  const fetchActivityCounts7Days = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      const userIds = users.map(u => u.id);
      if (userIds.length === 0) return;

      const { data: activities, error } = await supabase
        .from('user_activities')
        .select('user_id')
        .in('user_id', userIds)
        .gte('created_at', sevenDaysAgoISO);

      if (error) {
        if (error.code === '42P01') {
          setActivityCounts7Days({});
          return;
        }
        throw error;
      }

      const counts = {};
      activities?.forEach(activity => {
        counts[activity.user_id] = (counts[activity.user_id] || 0) + 1;
      });

      setActivityCounts7Days(counts);
    } catch (err) {
      console.error('Error fetching 7-day activity counts:', err);
      setActivityCounts7Days({});
    }
  };

  const handleRowFilter = (filterType, filterValue) => {
    if (filterType === 'role') {
      setRoleFilter(filterValue === 'No Role' ? 'no_role' : filterValue);
    } else if (filterType === 'team') {
      setTeamFilter(filterValue === 'No Team' ? 'no_team' : filterValue);
    } else if (filterType === 'activityLevel') {
      setActivityLevelFilter(filterValue);
    } else if (filterType === 'activityLevel7Days') {
      setActivityLevel7DaysFilter(filterValue);
    } else if (filterType === 'loginStatus') {
      setLoginStatusFilter(filterValue);
    }
    setActiveTab('listing');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'no_role' ? !user.role : user.role === roleFilter);
    
    const matchesTeam = teamFilter === 'all' || 
      (teamFilter === 'no_team' ? !user.teams : user.teams?.name === teamFilter);

    const matchesActivityLevel = (() => {
      if (activityLevelFilter === 'all') return true;
      const total = activityCounts[user.id] || 0;
      if (activityLevelFilter === 'Very Active (100+)') return total >= 100;
      if (activityLevelFilter === 'Active (50-99)') return total >= 50 && total <= 99;
      if (activityLevelFilter === 'Moderate (10-49)') return total >= 10 && total <= 49;
      if (activityLevelFilter === 'Low (1-9)') return total >= 1 && total <= 9;
      if (activityLevelFilter === 'No Activity') return total === 0;
      return true;
    })();

    const matchesActivityLevel7Days = (() => {
      if (activityLevel7DaysFilter === 'all') return true;
      const count = activityCounts7Days[user.id] || 0;
      if (activityLevel7DaysFilter === 'Very Active (20+)') return count >= 20;
      if (activityLevel7DaysFilter === 'Active (10-19)') return count >= 10 && count <= 19;
      if (activityLevel7DaysFilter === 'Moderate (5-9)') return count >= 5 && count <= 9;
      if (activityLevel7DaysFilter === 'Low (1-4)') return count >= 1 && count <= 4;
      if (activityLevel7DaysFilter === 'No Activity') return count === 0;
      return true;
    })();

    const matchesLoginStatus = (() => {
      if (loginStatusFilter === 'all') return true;
      const lastSignIn = loginHistory[user.id]?.lastSignIn;
      if (!lastSignIn) {
        return loginStatusFilter === 'Never Logged In';
      }
      const now = new Date();
      const daysSince = Math.floor((now - new Date(lastSignIn)) / (1000 * 60 * 60 * 24));
      if (loginStatusFilter === 'Active (Last 7 days)') return daysSince <= 7;
      if (loginStatusFilter === 'Recent (8-30 days)') return daysSince >= 8 && daysSince <= 30;
      if (loginStatusFilter === 'Inactive (31-90 days)') return daysSince >= 31 && daysSince <= 90;
      if (loginStatusFilter === 'Very Inactive (90+ days)') return daysSince > 90;
      return true;
    })();

    return matchesSearch && matchesRole && matchesTeam && matchesActivityLevel && matchesActivityLevel7Days && matchesLoginStatus;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setTeamFilter('all');
    setActivityLevelFilter('all');
    setActivityLevel7DaysFilter('all');
    setLoginStatusFilter('all');
  };

  const hasActiveFilters = () => {
    return searchTerm !== '' || roleFilter !== 'all' || teamFilter !== 'all' || 
           activityLevelFilter !== 'all' || activityLevel7DaysFilter !== 'all' || loginStatusFilter !== 'all';
  };

  const getActiveFilters = () => {
    const filters = [];
    if (searchTerm) {
      filters.push({ type: 'search', label: `Search: "${searchTerm}"`, value: searchTerm });
    }
    if (roleFilter !== 'all') {
      filters.push({ type: 'role', label: `Role: ${roleFilter === 'no_role' ? 'No Role' : roleFilter}`, value: roleFilter });
    }
    if (teamFilter !== 'all') {
      filters.push({ type: 'team', label: `Team: ${teamFilter === 'no_team' ? 'No Team' : teamFilter}`, value: teamFilter });
    }
    if (activityLevelFilter !== 'all') {
      filters.push({ type: 'activityLevel', label: `Activity: ${activityLevelFilter}`, value: activityLevelFilter });
    }
    if (activityLevel7DaysFilter !== 'all') {
      filters.push({ type: 'activityLevel7Days', label: `7-Day Activity: ${activityLevel7DaysFilter}`, value: activityLevel7DaysFilter });
    }
    if (loginStatusFilter !== 'all') {
      filters.push({ type: 'loginStatus', label: `Login Status: ${loginStatusFilter}`, value: loginStatusFilter });
    }
    return filters;
  };

  const removeFilter = (filterType) => {
    switch (filterType) {
      case 'search':
        setSearchTerm('');
        break;
      case 'role':
        setRoleFilter('all');
        break;
      case 'team':
        setTeamFilter('all');
        break;
      case 'activityLevel':
        setActivityLevelFilter('all');
        break;
      case 'activityLevel7Days':
        setActivityLevel7DaysFilter('all');
        break;
      case 'loginStatus':
        setLoginStatusFilter('all');
        break;
      default:
        break;
    }
  };


  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.tabNav}>
          <button 
            className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={16} />
            Overview
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'listing' ? styles.active : ''}`}
            onClick={() => setActiveTab('listing')}
          >
            <List size={16} />
            Listing
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'teams' ? styles.active : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            <Users size={16} />
            Teams
          </button>
        </div>
        <div className={styles.loading}>
          <Spinner size="lg" />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.tabNav}>
          <button 
            className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={16} />
            Overview
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'listing' ? styles.active : ''}`}
            onClick={() => setActiveTab('listing')}
          >
            <List size={16} />
            Listing
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'teams' ? styles.active : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            <Users size={16} />
            Teams
          </button>
        </div>
        <div className={styles.error}>
          <h2>Error Loading Users</h2>
          <p>{error}</p>
          <Button onClick={fetchUsers} variant="accent">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const activeFilters = getActiveFilters();

  return (
    <div className={styles.container}>
      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'listing' ? styles.active : ''}`}
          onClick={() => setActiveTab('listing')}
        >
          <List size={16} />
          Listing
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'teams' ? styles.active : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          <Users size={16} />
          Teams
        </button>
      </div>

      {/* Filter Chips Row with Search */}
      <div className={styles.filterChipsContainer}>
        <div className={styles.searchBarWrapper}>
          <div className="searchBarContainer">
            <div className="searchIcon">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchTerm('');
                }
              }}
              className="searchInput"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="clearButton"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        {activeFilters.length > 0 && (
          <>
            <div className={styles.filterChips}>
              {activeFilters.map((filter, index) => (
                <div key={index} className={styles.filterChip}>
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(filter.type)}
                    className={styles.filterChipRemove}
                    title="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={clearFilters} className={styles.clearAllButton}>
              Clear All
            </button>
          </>
        )}
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        {/* Main Content Area */}
        <div className={styles.contentArea}>
          {activeTab === 'overview' && (
            <div className={styles.overviewTab}>
              <div className={styles.stats}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{users.length}</div>
                  <div className={styles.statLabel}>Total Users</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>
                    {Object.keys(loginHistory).filter(id => loginHistory[id]?.lastSignIn).length}
                  </div>
                  <div className={styles.statLabel}>Active Users</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>
                    {users.filter(user => !loginHistory[user.id]?.lastSignIn).length}
                  </div>
                  <div className={styles.statLabel}>Never Logged In</div>
                </div>
              </div>

              {/* Role Breakdown Table */}
              <div className={styles.overviewTableSection}>
                <h3>Role Breakdown</h3>
                <div className={styles.tableContainer}>
                  <table className={styles.overviewTable}>
                    <thead>
                      <tr>
                        <th>Role</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const roleGroups = {};
                        users.forEach(user => {
                          const role = user.role || 'No Role';
                          if (!roleGroups[role]) {
                            roleGroups[role] = {
                              role,
                              users: []
                            };
                          }
                          roleGroups[role].users.push(user);
                        });
                        return Object.values(roleGroups).sort((a, b) => b.users.length - a.users.length);
                      })().map(group => (
                        <tr 
                          key={group.role}
                          className={styles.clickableRow}
                          onClick={() => handleRowFilter('role', group.role === 'No Role' ? 'No Role' : group.role)}
                        >
                          <td><strong>{group.role}</strong></td>
                          <td>{group.users.length}</td>
                          <td>{users.length > 0 ? Math.round((group.users.length / users.length) * 100) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Usage Breakdown Table */}
              <div className={styles.overviewTableSection}>
                <h3>Usage Breakdown</h3>
                <div className={styles.tableContainer}>
                  <table className={styles.overviewTable}>
                    <thead>
                      <tr>
                        <th>Activity Level</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const usageGroups = {
                          'Very Active (100+)': { min: 100, users: [] },
                          'Active (50-99)': { min: 50, max: 99, users: [] },
                          'Moderate (10-49)': { min: 10, max: 49, users: [] },
                          'Low (1-9)': { min: 1, max: 9, users: [] },
                          'No Activity': { min: 0, max: 0, users: [] }
                        };
                        
                        users.forEach(user => {
                          const total = activityCounts[user.id] || 0;
                          if (total >= 100) {
                            usageGroups['Very Active (100+)'].users.push(user);
                          } else if (total >= 50) {
                            usageGroups['Active (50-99)'].users.push(user);
                          } else if (total >= 10) {
                            usageGroups['Moderate (10-49)'].users.push(user);
                          } else if (total >= 1) {
                            usageGroups['Low (1-9)'].users.push(user);
                          } else {
                            usageGroups['No Activity'].users.push(user);
                          }
                        });
                        
                        return Object.entries(usageGroups).map(([label, group]) => ({
                          label,
                          count: group.users.length
                        }));
                      })().map(group => (
                        <tr 
                          key={group.label}
                          className={styles.clickableRow}
                          onClick={() => handleRowFilter('activityLevel', group.label)}
                        >
                          <td><strong>{group.label}</strong></td>
                          <td>{group.count}</td>
                          <td>{users.length > 0 ? Math.round((group.count / users.length) * 100) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Activity Table */}
              <div className={styles.overviewTableSection}>
                <h3>Recent Activity (Last 7 Days)</h3>
                <div className={styles.tableContainer}>
                  <table className={styles.overviewTable}>
                    <thead>
                      <tr>
                        <th>Activity Level</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const activityGroups = {
                          'Very Active (20+)': { min: 20, users: [] },
                          'Active (10-19)': { min: 10, max: 19, users: [] },
                          'Moderate (5-9)': { min: 5, max: 9, users: [] },
                          'Low (1-4)': { min: 1, max: 4, users: [] },
                          'No Activity': { min: 0, max: 0, users: [] }
                        };
                        
                        users.forEach(user => {
                          const count = activityCounts7Days[user.id] || 0;
                          if (count >= 20) {
                            activityGroups['Very Active (20+)'].users.push(user);
                          } else if (count >= 10) {
                            activityGroups['Active (10-19)'].users.push(user);
                          } else if (count >= 5) {
                            activityGroups['Moderate (5-9)'].users.push(user);
                          } else if (count >= 1) {
                            activityGroups['Low (1-4)'].users.push(user);
                          } else {
                            activityGroups['No Activity'].users.push(user);
                          }
                        });
                        
                        return Object.entries(activityGroups).map(([label, group]) => ({
                          label,
                          count: group.users.length
                        }));
                      })().map(group => (
                        <tr 
                          key={group.label}
                          className={styles.clickableRow}
                          onClick={() => handleRowFilter('activityLevel7Days', group.label)}
                        >
                          <td><strong>{group.label}</strong></td>
                          <td>{group.count}</td>
                          <td>{users.length > 0 ? Math.round((group.count / users.length) * 100) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Login Status Table */}
              <div className={styles.overviewTableSection}>
                <h3>Login Status</h3>
                <div className={styles.tableContainer}>
                  <table className={styles.overviewTable}>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const now = new Date();
                        const loginGroups = {
                          'Active (Last 7 days)': { users: [] },
                          'Recent (8-30 days)': { users: [] },
                          'Inactive (31-90 days)': { users: [] },
                          'Very Inactive (90+ days)': { users: [] },
                          'Never Logged In': { users: [] }
                        };
                        
                        users.forEach(user => {
                          const lastSignIn = loginHistory[user.id]?.lastSignIn;
                          if (!lastSignIn) {
                            loginGroups['Never Logged In'].users.push(user);
                          } else {
                            const daysSince = Math.floor((now - new Date(lastSignIn)) / (1000 * 60 * 60 * 24));
                            if (daysSince <= 7) {
                              loginGroups['Active (Last 7 days)'].users.push(user);
                            } else if (daysSince <= 30) {
                              loginGroups['Recent (8-30 days)'].users.push(user);
                            } else if (daysSince <= 90) {
                              loginGroups['Inactive (31-90 days)'].users.push(user);
                            } else {
                              loginGroups['Very Inactive (90+ days)'].users.push(user);
                            }
                          }
                        });
                        
                        return Object.entries(loginGroups).map(([label, group]) => ({
                          label,
                          count: group.users.length
                        }));
                      })().map(group => (
                        <tr 
                          key={group.label}
                          className={styles.clickableRow}
                          onClick={() => handleRowFilter('loginStatus', group.label)}
                        >
                          <td><strong>{group.label}</strong></td>
                          <td>{group.count}</td>
                          <td>{users.length > 0 ? Math.round((group.count / users.length) * 100) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'listing' && (
            <div className={styles.listingTab}>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('email')} className={styles.sortable}>
                        Email
                        {sortBy === 'email' && (
                          <span className={styles.sortIndicator}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort('name')} className={styles.sortable}>
                        Name
                        {sortBy === 'name' && (
                          <span className={styles.sortIndicator}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort('role')} className={styles.sortable}>
                        Role
                        {sortBy === 'role' && (
                          <span className={styles.sortIndicator}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort('team')} className={styles.sortable}>
                        Team
                        {sortBy === 'team' && (
                          <span className={styles.sortIndicator}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort('last_login')} className={styles.sortable}>
                        Last Login
                        {sortBy === 'last_login' && (
                          <span className={styles.sortIndicator}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort('total_activities')} className={styles.sortable}>
                        Total Activities
                        {sortBy === 'total_activities' && (
                          <span className={styles.sortIndicator}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort('activities_7days')} className={styles.sortable}>
                        Activities (7 Days)
                        {sortBy === 'activities_7days' && (
                          <span className={styles.sortIndicator}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => {
                      return (
                        <tr 
                          key={user.id}
                          className={styles.clickableRow}
                          onClick={() => {
                            setSelectedUser(user);
                            setIsModalOpen(true);
                          }}
                        >
                          <td>{user.email}</td>
                          <td>
                            <div className={styles.userName}>
                              {user.first_name} {user.last_name}
                            </div>
                          </td>
                          <td>
                            {user.role || 'No Role'}
                          </td>
                          <td>
                            {user.teams ? user.teams.name : <span className={styles.noTeam}>No Team</span>}
                          </td>
                          <td>
                            {loginHistory[user.id]?.lastSignIn ? (
                              formatDate(loginHistory[user.id].lastSignIn)
                            ) : (
                              <span className={styles.noTeam}>Never</span>
                            )}
                          </td>
                          <td>
                            {activityCounts[user.id] || 0}
                          </td>
                          <td>
                            {activityCounts7Days[user.id] || 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className={styles.emptyState}>
                    <Users className={styles.emptyIcon} />
                    <h3>No users found</h3>
                    <p>Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'teams' && (
            <div className={styles.teamsTab}>
              <ManageTeams />
            </div>
          )}
        </div>
      </div>

      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
