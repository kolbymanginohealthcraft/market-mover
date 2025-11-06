import React, { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Users, Search } from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import UserDetailModal from './UserDetailModal';
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
  const [sortBy, setSortBy] = useState('email');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      // Re-sort when login history loads if we're sorting by last login
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
    }
  }, [loginHistory, sortBy, sortOrder]);

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
      } else if (sortBy === 'last_login') {
        // Can't sort by login history in query, will sort in JS
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'no_role' ? !user.role : user.role === roleFilter);
    
    const matchesTeam = teamFilter === 'all' || 
      (teamFilter === 'no_team' ? !user.teams : user.teams?.name === teamFilter);

    return matchesSearch && matchesRole && matchesTeam;
  });

  const getUniqueRoles = () => {
    const roles = users.map(user => user.role).filter(Boolean);
    const uniqueRoles = [...new Set(roles)];
    const hasNoRole = users.some(user => !user.role);
    return ['all', ...uniqueRoles, ...(hasNoRole ? ['no_role'] : [])];
  };

  const getUniqueTeams = () => {
    const teams = users.map(user => user.teams?.name).filter(Boolean);
    const uniqueTeams = [...new Set(teams)];
    const hasNoTeam = users.some(user => !user.teams);
    return ['all', ...uniqueTeams, ...(hasNoTeam ? ['no_team'] : [])];
  };

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


  if (loading) {
    return (
      <div className={styles.container}>
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1><Users className={styles.headerIcon} /> User Management</h1>
        <p className={styles.subtitle}>
          View and manage all platform users
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchSection}>
          <div className={styles.searchInput}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Role:</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              {getUniqueRoles().map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role === 'no_role' ? 'No Role' : role}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Team:</label>
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              {getUniqueTeams().map(team => (
                <option key={team} value={team}>
                  {team === 'all' ? 'All Teams' : team === 'no_team' ? 'No Team' : team}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{users.length}</div>
          <div className={styles.statLabel}>Total Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {users.filter(user => user.role === 'Platform Admin').length}
          </div>
          <div className={styles.statLabel}>Admins</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {users.filter(user => user.role === 'Team Admin').length}
          </div>
          <div className={styles.statLabel}>Team Admins</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {users.filter(user => user.role === 'Team Member').length}
          </div>
          <div className={styles.statLabel}>Team Members</div>
        </div>
      </div>

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
              <th>Total Activities</th>
              <th>Activities (7 Days)</th>
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
