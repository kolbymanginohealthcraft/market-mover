import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Users, X, List, Search, ChevronDown } from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import UserDetailModal from './UserDetailModal';
import ManageTeams from '../../../pages/Private/Settings/Platform/ManageTeams';
import Dropdown from '../../../components/Buttons/Dropdown';
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
  const [activeTab, setActiveTab] = useState('listing');
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const metadataUserIdsKey = useRef(null);

  const fetchUsers = useCallback(async () => {
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
      
      query = query.order('email', { ascending: true });

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

      const userIds = sortedData.map((user) => user.id);

      setUsers(sortedData);
      setLoading(false);

      loadUserMetadata(userIds);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
      setLoading(false);
    } finally {
      // noop
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const loadUserMetadata = async (userIds) => {
    if (!userIds || userIds.length === 0) {
      setLoginHistory({});
      setActivityCounts({});
      setActivityCounts7Days({});
      metadataUserIdsKey.current = null;
      setMetadataLoading(false);
      return;
    }

    const sortedKey = JSON.stringify([...userIds].sort());
    if (
      metadataUserIdsKey.current === sortedKey &&
      Object.keys(loginHistory).length > 0 &&
      Object.keys(activityCounts).length > 0 &&
      Object.keys(activityCounts7Days).length > 0
    ) {
      setMetadataLoading(false);
      return;
    }

    metadataUserIdsKey.current = sortedKey;
    setMetadataLoading(true);

    try {
      const [history, counts, counts7Days] = await Promise.all([
        fetchLoginHistory(),
        fetchActivityCounts(),
        fetchActivityCounts7Days(userIds),
      ]);

      setLoginHistory(history || {});
      setActivityCounts(counts || {});
      setActivityCounts7Days(counts7Days || {});
    } catch (err) {
      console.error('Error loading user metadata:', err);
    } finally {
      setMetadataLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return {};

      const response = await fetch('/api/users/login-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const history = await response.json();
        return history;
      }
      return {};
    } catch (err) {
      console.error('Error fetching login history:', err);
      return {};
    }
  };

  const fetchActivityCounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return {};

      const response = await fetch('/api/users/activity-counts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const counts = await response.json();
        return counts;
      } else {
        console.error('Error fetching activity counts:', await response.text());
        return {};
      }
    } catch (err) {
      console.error('Error fetching activity counts:', err);
      return {};
    }
  };

  const fetchActivityCounts7Days = async (userIds) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return {};

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      if (!userIds || userIds.length === 0) return {};

      const { data: activities, error } = await supabase
        .from('user_activities')
        .select('user_id')
        .in('user_id', userIds)
        .gte('created_at', sevenDaysAgoISO);

      if (error) {
        if (error.code === '42P01') {
          return {};
        }
        throw error;
      }

      const counts = {};
      activities?.forEach(activity => {
        counts[activity.user_id] = (counts[activity.user_id] || 0) + 1;
      });

      return counts;
    } catch (err) {
      console.error('Error fetching 7-day activity counts:', err);
      return {};
    }
  };

  const handleRowFilter = (filterType, filterValue) => {
    if (filterType === 'role') {
      setRoleFilter((prev) => (prev === filterValue ? 'all' : filterValue));
    } else if (filterType === 'team') {
      setTeamFilter((prev) => (prev === filterValue ? 'all' : filterValue));
    } else if (filterType === 'activityLevel') {
      setActivityLevelFilter((prev) => (prev === filterValue ? 'all' : filterValue));
    } else if (filterType === 'activityLevel7Days') {
      setActivityLevel7DaysFilter((prev) => (prev === filterValue ? 'all' : filterValue));
    } else if (filterType === 'loginStatus') {
      const normalizedFilter = filterValue === 'Never Logged In' ? 'never_logged_in' : filterValue;
      setLoginStatusFilter((prev) => (prev === normalizedFilter ? 'all' : normalizedFilter));
    }
  };
  const stats = useMemo(() => {
    if (users.length === 0) {
      return { total: 0, active: 0, never: 0 };
    }

    let active = 0;
    let never = 0;

    users.forEach((user) => {
      if (loginHistory[user.id]?.lastSignIn) {
        active += 1;
      } else {
        never += 1;
      }
    });

    return { total: users.length, active, never };
  }, [users, loginHistory]);

  const roleOptions = useMemo(() => {
    if (users.length === 0) return [];

    const groups = {};

    users.forEach((user) => {
      const value = user.role ?? 'no_role';
      if (!groups[value]) {
        groups[value] = {
          value,
          label: user.role ?? 'No Role',
          count: 0,
        };
      }
      groups[value].count += 1;
    });

    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [users]);

  const teamOptions = useMemo(() => {
    if (users.length === 0) {
      return [{ value: 'all', label: 'All teams', count: 0 }];
    }

    const groups = users.reduce((acc, user) => {
      const key = user.teams?.name ?? 'no_team';
      if (!acc[key]) {
        acc[key] = {
          value: key,
          label: user.teams?.name ?? 'No Team',
          count: 0,
        };
      }
      acc[key].count += 1;
      return acc;
    }, {});

    const sortedOptions = Object.values(groups).sort((a, b) =>
      a.label.localeCompare(b.label)
    );

    return [
      { value: 'all', label: 'All teams', count: users.length },
      ...sortedOptions,
    ];
  }, [users]);

  useEffect(() => {
    if (teamFilter !== 'all' && !teamOptions.some((option) => option.value === teamFilter)) {
      setTeamFilter('all');
    }
  }, [teamOptions, teamFilter]);

  const selectedTeamOption = useMemo(() => {
    return teamOptions.find((option) => option.value === teamFilter) ?? teamOptions[0];
  }, [teamOptions, teamFilter]);

  const usageOptions = useMemo(() => {
    if (users.length === 0) return [];

    const ranges = [
      { value: 'Very Active (100+)', label: 'Very Active (100+)', min: 100 },
      { value: 'Active (50-99)', label: 'Active (50-99)', min: 50, max: 99 },
      { value: 'Moderate (10-49)', label: 'Moderate (10-49)', min: 10, max: 49 },
      { value: 'Low (1-9)', label: 'Low (1-9)', min: 1, max: 9 },
      { value: 'No Activity', label: 'No Activity', min: 0, max: 0 },
    ];

    return ranges.map((range) => {
      const count = users.reduce((acc, user) => {
        const total = activityCounts[user.id] || 0;
        if (range.max == null) {
          return total >= range.min ? acc + 1 : acc;
        }
        if (total >= range.min && total <= range.max) {
          return acc + 1;
        }
        return acc;
      }, 0);

      return { ...range, count };
    });
  }, [users, activityCounts]);

  const recentActivityOptions = useMemo(() => {
    if (users.length === 0) return [];

    const ranges = [
      { value: 'Very Active (20+)', label: 'Very Active (20+)', min: 20 },
      { value: 'Active (10-19)', label: 'Active (10-19)', min: 10, max: 19 },
      { value: 'Moderate (5-9)', label: 'Moderate (5-9)', min: 5, max: 9 },
      { value: 'Low (1-4)', label: 'Low (1-4)', min: 1, max: 4 },
      { value: 'No Activity', label: 'No Activity', min: 0, max: 0 },
    ];

    return ranges.map((range) => {
      const count = users.reduce((acc, user) => {
        const total = activityCounts7Days[user.id] || 0;
        if (range.max == null) {
          return total >= range.min ? acc + 1 : acc;
        }
        if (total >= range.min && total <= range.max) {
          return acc + 1;
        }
        return acc;
      }, 0);

      return { ...range, count };
    });
  }, [users, activityCounts7Days]);

  const loginStatusOptions = useMemo(() => {
    if (users.length === 0) return [];

    const now = new Date();
    const groups = [
      {
        value: 'Active (Last 7 days)',
        label: 'Active (Last 7 days)',
        matches: (daysSince, hasLogin) => hasLogin && daysSince <= 7,
      },
      {
        value: 'Recent (8-30 days)',
        label: 'Recent (8-30 days)',
        matches: (daysSince, hasLogin) => hasLogin && daysSince >= 8 && daysSince <= 30,
      },
      {
        value: 'Inactive (31-90 days)',
        label: 'Inactive (31-90 days)',
        matches: (daysSince, hasLogin) => hasLogin && daysSince >= 31 && daysSince <= 90,
      },
      {
        value: 'Very Inactive (90+ days)',
        label: 'Very Inactive (90+ days)',
        matches: (daysSince, hasLogin) => hasLogin && daysSince > 90,
      },
      {
        value: 'never_logged_in',
        label: 'Never Logged In',
        matches: (_, hasLogin) => !hasLogin,
      },
    ];

    return groups.map((group) => {
      const count = users.reduce((acc, user) => {
        const lastSignIn = loginHistory[user.id]?.lastSignIn;
        if (!lastSignIn) {
          return group.matches(null, false) ? acc + 1 : acc;
        }
        const daysSince = Math.floor((now - new Date(lastSignIn)) / (1000 * 60 * 60 * 24));
        return group.matches(daysSince, true) ? acc + 1 : acc;
      }, 0);

      return { value: group.value, label: group.label, count };
    });
  }, [users, loginHistory]);

  const sortedUsers = useMemo(() => {
    if (users.length === 0) return [];

    const sorted = [...users];

    const sortStrings = (getter) => {
      sorted.sort((a, b) => {
        const aVal = (getter(a) || '').toLowerCase();
        const bVal = (getter(b) || '').toLowerCase();
        if (aVal === bVal) return 0;
        const comparison = aVal.localeCompare(bVal);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      return sorted;
    };

    if (sortBy === 'email') {
      return sortStrings((user) => user.email);
    }

    if (sortBy === 'name') {
      return sortStrings((user) => `${user.last_name || ''} ${user.first_name || ''}`.trim());
    }

    if (sortBy === 'role') {
      return sortStrings((user) => user.role || '');
    }

    if (sortBy === 'team') {
      return sortStrings((user) => user.teams?.name || '');
    }

    if (sortBy === 'last_login' && Object.keys(loginHistory).length > 0) {
      sorted.sort((a, b) => {
        const aLogin = loginHistory[a.id]?.lastSignIn;
        const bLogin = loginHistory[b.id]?.lastSignIn;
        if (!aLogin && !bLogin) return 0;
        if (!aLogin) return sortOrder === 'asc' ? -1 : 1;
        if (!bLogin) return sortOrder === 'asc' ? 1 : -1;
        const comparison = new Date(aLogin) - new Date(bLogin);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      return sorted;
    }

    if (sortBy === 'created_at' && Object.keys(loginHistory).length > 0) {
      sorted.sort((a, b) => {
        const aCreated = loginHistory[a.id]?.createdAt;
        const bCreated = loginHistory[b.id]?.createdAt;
        if (!aCreated && !bCreated) return 0;
        if (!aCreated) return sortOrder === 'asc' ? -1 : 1;
        if (!bCreated) return sortOrder === 'asc' ? 1 : -1;
        const comparison = new Date(aCreated) - new Date(bCreated);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      return sorted;
    }

    if (sortBy === 'total_activities' && Object.keys(activityCounts).length > 0) {
      sorted.sort((a, b) => {
        const aCount = activityCounts[a.id] || 0;
        const bCount = activityCounts[b.id] || 0;
        const comparison = aCount - bCount;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      return sorted;
    }

    if (sortBy === 'activities_7days' && Object.keys(activityCounts7Days).length > 0) {
      sorted.sort((a, b) => {
        const aCount = activityCounts7Days[a.id] || 0;
        const bCount = activityCounts7Days[b.id] || 0;
        const comparison = aCount - bCount;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      return sorted;
    }

    return sorted;
  }, [users, sortBy, sortOrder, loginHistory, activityCounts, activityCounts7Days]);

  const filteredUsers = sortedUsers.filter(user => {
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
        return loginStatusFilter === 'never_logged_in';
      }
      const now = new Date();
      const daysSince = Math.floor((now - new Date(lastSignIn)) / (1000 * 60 * 60 * 24));
      if (loginStatusFilter === 'Active (Last 7 days)') return daysSince <= 7;
      if (loginStatusFilter === 'Recent (8-30 days)') return daysSince >= 8 && daysSince <= 30;
      if (loginStatusFilter === 'Inactive (31-90 days)') return daysSince >= 31 && daysSince <= 90;
      if (loginStatusFilter === 'Very Inactive (90+ days)') return daysSince > 90;
      return false;
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
      const label = loginStatusFilter === 'never_logged_in' ? 'Never Logged In' : loginStatusFilter;
      filters.push({ type: 'loginStatus', label: `Login Status: ${label}`, value: loginStatusFilter });
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

      <div className={styles.mainLayout}>
        {activeTab === 'listing' ? (
          <>
            <aside className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <h3>Filters</h3>
                <p>Use categories to refine the listing</p>
              </div>

              <div className={styles.sidebarStats}>
                <div className={styles.sidebarMetricRow}>
                  <span>Total Users</span>
                  <span className={styles.sidebarTableCount}>{stats.total}</span>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <div className={styles.filterSectionPadding}>
                  <span className={styles.filterSectionLabel}>Roles</span>
                  <div className={styles.filterList}>
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`${styles.filterOption} ${roleFilter === option.value ? styles.filterOptionActive : ''}`}
                        onClick={() => handleRowFilter('role', option.value)}
                      >
                        <span className={styles.filterOptionLabel}>{option.label}</span>
                        <span className={styles.filterOptionCount}>{option.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <div className={styles.filterSectionPadding}>
                  <span className={styles.filterSectionLabel}>Total Activity</span>
                  <div className={styles.filterList}>
                    {metadataLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className={styles.filterPlaceholder} />
                      ))
                    ) : (
                      usageOptions.map((option) => (
                        <button
                          key={option.value}
                          className={`${styles.filterOption} ${activityLevelFilter === option.value ? styles.filterOptionActive : ''}`}
                          onClick={() => handleRowFilter('activityLevel', option.value)}
                        >
                          <span className={styles.filterOptionLabel}>{option.label}</span>
                          <span className={styles.filterOptionCount}>{option.count}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <div className={styles.filterSectionPadding}>
                  <span className={styles.filterSectionLabel}>7-Day Activity</span>
                  <div className={styles.filterList}>
                    {metadataLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className={styles.filterPlaceholder} />
                      ))
                    ) : (
                      recentActivityOptions.map((option) => (
                        <button
                          key={option.value}
                          className={`${styles.filterOption} ${activityLevel7DaysFilter === option.value ? styles.filterOptionActive : ''}`}
                          onClick={() => handleRowFilter('activityLevel7Days', option.value)}
                        >
                          <span className={styles.filterOptionLabel}>{option.label}</span>
                          <span className={styles.filterOptionCount}>{option.count}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <div className={styles.filterSectionPadding}>
                  <span className={styles.filterSectionLabel}>Login Status</span>
                  <div className={styles.filterList}>
                    {metadataLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className={styles.filterPlaceholder} />
                      ))
                    ) : (
                      loginStatusOptions.map((option) => (
                        <button
                          key={option.value}
                          className={`${styles.filterOption} ${loginStatusFilter === option.value ? styles.filterOptionActive : ''}`}
                          onClick={() => handleRowFilter('loginStatus', option.value)}
                        >
                          <span className={styles.filterOptionLabel}>{option.label}</span>
                          <span className={styles.filterOptionCount}>{option.count}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.filterFooter}>
                <Button onClick={clearFilters} variant="gray" disabled={!hasActiveFilters()}>
                  Clear filters
                </Button>
              </div>
            </aside>

            <div className={styles.contentArea}>
              <div className={styles.listingTab}>
                <div className={styles.tableControls}>
                  <div className={styles.tableSearchRow}>
                    <div className={styles.searchAndFilters}>
                      <div className={styles.tableSearch}>
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
                      <div className={styles.teamFilterWrapper}>
                        <Dropdown
                          trigger={
                            <button
                              type="button"
                              className={`sectionHeaderButton ${styles.teamFilterTrigger}`}
                            >
                              <span className={styles.teamFilterText}>
                                Team: {selectedTeamOption?.label ?? 'All teams'}
                              </span>
                              <ChevronDown className={styles.teamFilterCaret} />
                            </button>
                          }
                          isOpen={teamDropdownOpen}
                          onToggle={setTeamDropdownOpen}
                          className={styles.teamFilterDropdown}
                        >
                          <ul className={styles.teamFilterList}>
                            {teamOptions.map((option) => (
                              <li key={option.value}>
                                <button
                                  type="button"
                                  className={`${styles.teamFilterItem} ${
                                    teamFilter === option.value ? styles.teamFilterItemActive : ''
                                  }`}
                                  onClick={() => {
                                    setTeamFilter(option.value);
                                    setTeamDropdownOpen(false);
                                  }}
                                >
                                  <span className={styles.teamFilterItemLabel}>
                                    {option.label}
                                  </span>
                                  <span className={styles.teamFilterCount}>
                                    {option.count}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </Dropdown>
                      </div>
                    </div>
                    {hasActiveFilters() && (
                      <div className={styles.tableFilterChips}>
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
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.tableContainer}>
                  {filteredUsers.length > 0 ? (
                    <div className={styles.tableScroll}>
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
                            <th onClick={() => handleSort('created_at')} className={styles.sortable}>
                              Created
                              {sortBy === 'created_at' && (
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
                                  {metadataLoading ? (
                                    <span className={styles.loadingText}>Loading…</span>
                                  ) : loginHistory[user.id]?.createdAt ? (
                                    formatDate(loginHistory[user.id].createdAt)
                                  ) : (
                                    <span className={styles.noTeam}>—</span>
                                  )}
                                </td>
                                <td>
                                  {metadataLoading ? (
                                    <span className={styles.loadingText}>Loading…</span>
                                  ) : loginHistory[user.id]?.lastSignIn ? (
                                    formatDate(loginHistory[user.id].lastSignIn)
                                  ) : (
                                    <span className={styles.noTeam}>Never</span>
                                  )}
                                </td>
                                <td>
                                  {metadataLoading ? (
                                    <span className={styles.loadingText}>Loading…</span>
                                  ) : (
                                    activityCounts[user.id] ?? 0
                                  )}
                                </td>
                                <td>
                                  {metadataLoading ? (
                                    <span className={styles.loadingText}>Loading…</span>
                                  ) : (
                                    activityCounts7Days[user.id] ?? 0
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <Users className={styles.emptyIcon} />
                      <h3>No users found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.contentArea}>
            <div className={styles.teamsTab}>
              <ManageTeams />
            </div>
          </div>
        )}
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
