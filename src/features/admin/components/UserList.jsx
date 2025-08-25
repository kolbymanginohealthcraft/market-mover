import React, { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Users, Search, Filter, Calendar, Building, Shield } from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import styles from './UserList.module.css';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchUsers();
  }, [sortBy, sortOrder]);

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
          created_at,
          updated_at,
          team_id,
          teams(name, tier),
          user_activities(count)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;

      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesTeam = teamFilter === 'all' || user.teams?.name === teamFilter;

    return matchesSearch && matchesRole && matchesTeam;
  });

  const getUniqueRoles = () => {
    const roles = users.map(user => user.role).filter(Boolean);
    return ['all', ...new Set(roles)];
  };

  const getUniqueTeams = () => {
    const teams = users.map(user => user.teams?.name).filter(Boolean);
    return ['all', ...new Set(teams)];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityStatus = (user) => {
    const activityCount = user.user_activities?.[0]?.count || 0;
    if (activityCount > 10) return { status: 'Very Active', color: '#10b981' };
    if (activityCount > 5) return { status: 'Active', color: '#3b82f6' };
    if (activityCount > 0) return { status: 'Some Activity', color: '#f59e0b' };
    return { status: 'No Activity', color: '#6b7280' };
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
                  {role === 'all' ? 'All Roles' : role}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Team:</label>
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              {getUniqueTeams().map(team => (
                <option key={team} value={team}>
                  {team === 'all' ? 'All Teams' : team}
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
              <th onClick={() => handleSort('first_name')} className={styles.sortable}>
                Name
                {sortBy === 'first_name' && (
                  <span className={styles.sortIndicator}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>Email</th>
              <th>Role</th>
              <th>Team</th>
              <th onClick={() => handleSort('created_at')} className={styles.sortable}>
                Joined
                {sortBy === 'created_at' && (
                  <span className={styles.sortIndicator}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const activityStatus = getActivityStatus(user);
              return (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>
                        {user.first_name} {user.last_name}
                      </div>
                      {user.title && (
                        <div className={styles.userTitle}>{user.title}</div>
                      )}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={styles.roleBadge}>
                      <Shield className={styles.roleIcon} />
                      {user.role || 'No Role'}
                    </span>
                  </td>
                  <td>
                    {user.teams ? (
                      <span className={styles.teamBadge}>
                        <Building className={styles.teamIcon} />
                        {user.teams.name} ({user.teams.tier})
                      </span>
                    ) : (
                      <span className={styles.noTeam}>No Team</span>
                    )}
                  </td>
                  <td>
                    <span className={styles.dateInfo}>
                      <Calendar className={styles.dateIcon} />
                      {formatDate(user.created_at)}
                    </span>
                  </td>
                  <td>
                    <span 
                      className={styles.activityBadge}
                      style={{ backgroundColor: activityStatus.color }}
                    >
                      {activityStatus.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
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
  );
}
