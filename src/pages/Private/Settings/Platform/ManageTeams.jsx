import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Building2, UserCheck, CreditCard, Calendar, DollarSign, X } from 'lucide-react';
import { supabase } from '../../../../app/supabaseClient';
import Button from '../../../../components/Buttons/Button';
import Spinner from '../../../../components/Buttons/Spinner';
import SectionHeader from '../../../../components/Layouts/SectionHeader';
import styles from './ManageTeams.module.css';

export default function ManageTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchEscapeCount, setSearchEscapeCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState(new Set());

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    max_users: 5,
    company_type: 'Provider',
    industry_vertical: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  // Handle search bar escape key behavior
  const handleSearchEscape = (e) => {
    if (e.key === 'Escape') {
      if (searchTerm && searchEscapeCount === 0) {
        // First escape: clear the search
        setSearchTerm('');
        setSearchEscapeCount(1);
        // Reset the count after a short delay
        setTimeout(() => setSearchEscapeCount(0), 100);
      } else {
        // Second escape (or first if no value): exit focus
        e.target.blur();
        setSearchEscapeCount(0);
      }
    }
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      // Use the same query structure as AnalyticsDashboard
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          max_users,
          company_type,
          industry_vertical,
          created_at,
          created_by,
          profiles(count)
        `)
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;
      console.log('Teams found:', teams?.length || 0);

      // Get creator info separately
      const creatorIds = [...new Set(teams?.map(team => team.created_by).filter(Boolean) || [])];
      let creators = {};
      
      if (creatorIds.length > 0) {
        const { data: creatorData, error: creatorError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', creatorIds);

        if (!creatorError && creatorData) {
          creatorData.forEach(creator => {
            creators[creator.id] = creator;
          });
        }
      }

      // Get subscriptions for each team
      const teamIds = teams?.map(team => team.id) || [];
      let subscriptions = [];
      
      if (teamIds.length > 0) {
        const { data: subsData, error: subsError } = await supabase
          .from('subscriptions')
          .select('*')
          .in('team_id', teamIds);

        if (subsError) {
          console.error('Error fetching subscriptions:', subsError);
        } else {
          subscriptions = subsData || [];
        }
      }

      // Combine teams with their subscriptions and creator info
      const teamsWithSubs = teams?.map(team => ({
        ...team,
        currentUsers: team.profiles?.[0]?.count || 0,
        subscriptions: subscriptions.filter(sub => sub.team_id === team.id),
        creator: creators[team.created_by] || null
      })) || [];

      setTeams(teamsWithSubs);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: formData.name,
          max_users: formData.max_users,
          company_type: formData.company_type,
          industry_vertical: formData.industry_vertical,
          created_by: user.id,
          tier: 'starter' // Single tier
        })
        .select()
        .single();

      if (error) throw error;

      setShowCreateModal(false);
      resetForm();
      await fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Error creating team. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateTeam = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: formData.name,
          max_users: formData.max_users,
          company_type: formData.company_type,
          industry_vertical: formData.industry_vertical
        })
        .eq('id', editingTeam.id);

      if (error) throw error;

      setEditingTeam(null);
      resetForm();
      await fetchTeams();
    } catch (error) {
      console.error('Error updating team:', error);
      alert('Error updating team. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      await fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Error deleting team. Please try again.');
    }
  };

  const handleCreateSubscription = async (teamId) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          team_id: teamId,
          status: 'active',
          license_quantity: 3,
          billing_interval: 'monthly',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      await fetchTeams();
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Error creating subscription. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const startEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      max_users: team.max_users,
      company_type: team.company_type || 'Provider',
      industry_vertical: team.industry_vertical || ''
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      max_users: 5,
      company_type: 'Provider',
      industry_vertical: ''
    });
  };

  const toggleExpanded = (teamId) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "–";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'trialing': return '#f59e0b';
      case 'past_due': return '#ef4444';
      case 'canceled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.company_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Spinner message="Loading teams..." />;

  return (
    <div className={styles.section}>
      <SectionHeader 
        title="Manage Teams" 
        icon={Users} 
        showEditButton={false}
        customElement={
          <div className={styles.headerControls}>
            {/* Team Count */}
            <div className={styles.teamCount}>
              {filteredTeams.length} teams
            </div>
            
            {/* Search */}
            <div className="searchBarContainer">
              <div className="searchIcon">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchEscape}
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
            
            {/* Create Team Button */}
            <button
              className="sectionHeaderButton"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={14} />
              <span>Create Team</span>
            </button>
          </div>
        }
      />

      <div className={styles.content}>

      {/* Teams List */}
      <div className={styles.teamsList}>
        {filteredTeams.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} style={{ width: '48px', height: '48px' }} />
            <h3>No teams found</h3>
            <p>Create your first team to get started</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowCreateModal(true)}
            >
              Create Team
            </Button>
          </div>
        ) : (
          filteredTeams.map((team) => (
            <div key={team.id} className={styles.teamCard}>
              <div className={styles.teamHeader}>
                <div className={styles.teamInfo}>
                  <div className={styles.teamName}>
                    <Building2 size={20} style={{ width: 'var(--icon-size-lg)', height: 'var(--icon-size-lg)' }} />
                    <h3>{team.name}</h3>
                  </div>
                  <div className={styles.teamMeta}>
                    <span className={styles.companyType}>{team.company_type}</span>
                    <span className={styles.memberCount}>
                      <UserCheck size={14} style={{ width: 'var(--icon-size-sm)', height: 'var(--icon-size-sm)' }} />
                      {team.currentUsers}/{team.max_users} users
                      <span className={styles.utilizationRate}>
                        ({Math.round((team.currentUsers / team.max_users) * 100)}% full)
                      </span>
                    </span>
                    <span className={styles.createdDate}>
                      Created {formatDate(team.created_at)}
                    </span>
                  </div>
                </div>
                
                <div className={styles.teamActions}>
                  <Button
                    variant="gray"
                    size="sm"
                    onClick={() => startEdit(team)}
                  >
                    <Edit size={14} style={{ width: 'var(--icon-size-sm)', height: 'var(--icon-size-sm)' }} />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    <Trash2 size={14} style={{ width: 'var(--icon-size-sm)', height: 'var(--icon-size-sm)' }} />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Team Details */}
              <div className={styles.teamDetails}>
                {team.industry_vertical && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Industry:</span>
                    <span className={styles.detailValue}>{team.industry_vertical}</span>
                  </div>
                )}
                {team.creator && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Created by:</span>
                    <span className={styles.detailValue}>
                      {team.creator.first_name} {team.creator.last_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Subscriptions Section */}
              <div className={styles.subscriptionsSection}>
                <div className={styles.subscriptionsHeader}>
                  <h4>Subscriptions</h4>
                  {team.subscriptions?.length === 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCreateSubscription(team.id)}
                      disabled={processing}
                    >
                      <Plus size={14} style={{ width: 'var(--icon-size-sm)', height: 'var(--icon-size-sm)' }} />
                      Create Subscription
                    </Button>
                  )}
                </div>

                {team.subscriptions?.length === 0 ? (
                  <div className={styles.noSubscriptions}>
                    <CreditCard size={24} style={{ width: '24px', height: '24px' }} />
                    <p>No active subscription</p>
                  </div>
                ) : (
                  <div className={styles.subscriptionsList}>
                    {team.subscriptions.map((subscription) => (
                      <div key={subscription.id} className={styles.subscriptionCard}>
                        <div className={styles.subscriptionInfo}>
                          <div className={styles.subscriptionStatus}>
                            <span 
                              className={styles.statusBadge}
                              style={{ backgroundColor: getStatusColor(subscription.status) }}
                            >
                              {subscription.status}
                            </span>
                            <span className={styles.licenseCount}>
                              {subscription.license_quantity} licenses
                            </span>
                            <span className={styles.billingInterval}>
                              {subscription.billing_interval === 'annual' ? 'Annual' : 'Monthly'} billing
                            </span>
                          </div>
                          <div className={styles.subscriptionDates}>
                            <span>Started: {formatDate(subscription.started_at)}</span>
                            {subscription.expires_at && (
                              <span>Expires: {formatDate(subscription.expires_at)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTeam) && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingTeam ? 'Edit Team' : 'Create New Team'}</h3>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTeam(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label htmlFor="teamName">Team Name *</label>
                <input
                  id="teamName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter team name"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="maxUsers">Max Users *</label>
                  <input
                    id="maxUsers"
                    type="number"
                    min="1"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="companyType">Company Type *</label>
                  <select
                    id="companyType"
                    value={formData.company_type}
                    onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
                  >
                    <option value="Provider">Provider</option>
                    <option value="Supplier">Supplier</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="industry">Industry Vertical</label>
                <input
                  id="industry"
                  type="text"
                  value={formData.industry_vertical}
                  onChange={(e) => setFormData({ ...formData, industry_vertical: e.target.value })}
                  placeholder="e.g., Healthcare, Technology"
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="gray"
                size="md"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTeam(null);
                  resetForm();
                }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                disabled={processing || !formData.name.trim()}
              >
                {processing ? (
                  <>
                    <Spinner size="sm" />
                    {editingTeam ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingTeam ? 'Update Team' : 'Create Team'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
