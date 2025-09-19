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
  const [showCreateSubscriptionModal, setShowCreateSubscriptionModal] = useState(false);
  const [selectedTeamForSubscription, setSelectedTeamForSubscription] = useState(null);
  const [newSubscriptionLicenses, setNewSubscriptionLicenses] = useState(10);
  const [subscriptionType, setSubscriptionType] = useState('regular');
  const [startedAt, setStartedAt] = useState(new Date().toISOString().split('T')[0]);
  const [trialEndDate, setTrialEndDate] = useState('');
  const [trialDays, setTrialDays] = useState(14);

  // Calculate trial end date based on days
  const calculateTrialEndDate = (startDate, days) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + days);
    return end.toISOString().split('T')[0];
  };

  // Update trial end date when trial days or start date changes
  useEffect(() => {
    if (subscriptionType === 'trial') {
      const calculatedEndDate = calculateTrialEndDate(startedAt, trialDays);
      setTrialEndDate(calculatedEndDate);
    }
  }, [trialDays, startedAt, subscriptionType]);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    max_users: 5
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

              // Get team members for each team
              let teamMembers = {};
              
              if (teamIds.length > 0) {
                const { data: membersData, error: membersError } = await supabase
                  .from('profiles')
                  .select('id, first_name, last_name, email, team_id, role, title, updated_at, accepted_terms')
                  .in('team_id', teamIds);

                if (membersError) {
                  console.error('Error fetching team members:', membersError);
                } else {
                  // Group members by team_id
                  membersData?.forEach(member => {
                    if (!teamMembers[member.team_id]) {
                      teamMembers[member.team_id] = [];
                    }
                    teamMembers[member.team_id].push(member);
                  });
                }
              }

      // Combine teams with their subscriptions, creator info, and members
      const teamsWithSubs = teams?.map(team => ({
        ...team,
        currentUsers: team.profiles?.[0]?.count || 0,
        subscriptions: subscriptions.filter(sub => sub.team_id === team.id),
        creator: creators[team.created_by] || null,
        members: teamMembers[team.id] || []
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
          created_by: user.id
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
          max_users: formData.max_users
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

    setProcessing(true);
    try {
      console.log('Attempting to delete team:', teamId);
      
      const { data, error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)
        .select();

      console.log('Delete result:', { data, error });

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Team deleted successfully');
      await fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      alert(`Error deleting team: ${error.message || 'Unknown error'}. Please check the console for details.`);
    } finally {
      setProcessing(false);
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

  const handleCreateSubscriptionFromModal = async () => {
    setProcessing(true);
    try {
      if (!selectedTeamForSubscription) {
        throw new Error('No team selected for subscription.');
      }

      const subscriptionData = {
        team_id: selectedTeamForSubscription.id,
        status: 'active',
        license_quantity: newSubscriptionLicenses,
        started_at: startedAt,
        expires_at: subscriptionType === 'trial' ? trialEndDate : null,
        canceled_at: null
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;

      setShowCreateSubscriptionModal(false);
      setSelectedTeamForSubscription(null);
      setNewSubscriptionLicenses(10);
      setSubscriptionType('regular');
      setStartedAt(new Date().toISOString().split('T')[0]);
      setTrialEndDate('');
      setTrialDays(14);
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
      max_users: team.max_users
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      max_users: 5
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
      case 'expired': return '#ef4444';
      case 'canceled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
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
              variant="blue"
              size="md"
              onClick={() => setShowCreateModal(true)}
            >
              Create Team
            </Button>
          </div>
        ) : (
          filteredTeams.map((team) => (
            <div 
              key={team.id} 
              className={styles.teamCard}
              onClick={() => {
                const newExpanded = new Set(expandedTeams);
                if (newExpanded.has(team.id)) {
                  newExpanded.delete(team.id);
                } else {
                  newExpanded.add(team.id);
                }
                setExpandedTeams(newExpanded);
              }}
            >
              {/* Compact Header */}
              <div className={styles.teamHeader}>
                <div className={styles.teamMain}>
                  <div className={styles.teamTitle}>
                    <Building2 size={16} style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)' }} />
                    <h3>{team.name}</h3>
                  </div>
                  <div className={styles.teamStats}>
                    <span className={styles.memberCount}>
                      <UserCheck size={12} style={{ width: 'var(--icon-size-sm)', height: 'var(--icon-size-sm)' }} />
                      {team.currentUsers}/{team.max_users}
                    </span>
                    <span className={styles.subscriptionCount}>
                      <CreditCard size={12} style={{ width: 'var(--icon-size-sm)', height: 'var(--icon-size-sm)' }} />
                      {team.subscriptions?.length || 0} subscription{team.subscriptions?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className={styles.teamActions}>
                  <button
                    className="sectionHeaderButton"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(team);
                    }}
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="sectionHeaderButton"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team.id);
                    }}
                    disabled={processing}
                  >
                    <Trash2 size={14} />
                    <span>{processing ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>

              {/* Expandable Details */}
              {expandedTeams.has(team.id) && (
                <div className={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                  {/* Team Summary Row */}
                  <div className={styles.teamSummary}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Created</span>
                      <span className={styles.summaryValue}>{formatDate(team.created_at)}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Created by</span>
                      <span className={styles.summaryValue}>
                        {team.creator ? `${team.creator.first_name} ${team.creator.last_name}` : 'Unknown'}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Members</span>
                      <span className={styles.summaryValue}>{team.currentUsers}/{team.max_users}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Subscription</span>
                      <span className={styles.summaryValue}>
                        {team.subscriptions && team.subscriptions.length > 0 ? (
                          <span className={`${styles.statusBadge} ${styles[team.subscriptions[0].status]}`}>
                            {team.subscriptions[0].status}
                          </span>
                        ) : (
                          <Button 
                            variant="blue" 
                            size="sm" 
                            onClick={() => {
                              setSelectedTeamForSubscription(team);
                              setShowCreateSubscriptionModal(true);
                            }}
                          >
                            Create Subscription
                          </Button>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Team Members Table */}
                  <div className={styles.membersSection}>
                    <h4 className={styles.sectionTitle}>Team Members ({team.members?.length || 0})</h4>
                    {team.members && team.members.length > 0 ? (
                      <div className={styles.membersTable}>
                        <div className={styles.tableHeader}>
                          <div className={styles.tableCell}>Name</div>
                          <div className={styles.tableCell}>Email</div>
                          <div className={styles.tableCell}>Title</div>
                          <div className={styles.tableCell}>Role</div>
                        </div>
                        <div className={styles.tableBody}>
                          {team.members.map(member => (
                            <div key={member.id} className={styles.tableRow}>
                              <div className={styles.tableCell}>
                                <div className={styles.memberName}>
                                  {member.first_name} {member.last_name}
                                </div>
                              </div>
                              <div className={styles.tableCell}>
                                <span className={styles.memberEmail}>{member.email}</span>
                              </div>
                              <div className={styles.tableCell}>
                                <span className={styles.memberTitle}>{member.title || '—'}</span>
                              </div>
                              <div className={styles.tableCell}>
                                <span className={`${styles.roleBadge} ${styles[member.role?.replace(' ', '')]}`}>
                                  {member.role}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.noMembers}>
                        <p>No team members found.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                variant="blue"
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

      {/* Create Subscription Modal */}
      {showCreateSubscriptionModal && selectedTeamForSubscription && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Create Subscription for {selectedTeamForSubscription.name}</h3>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowCreateSubscriptionModal(false);
                  setSelectedTeamForSubscription(null);
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label htmlFor="licenses">Number of Licenses</label>
                <input
                  id="licenses"
                  type="number"
                  value={newSubscriptionLicenses}
                  onChange={(e) => setNewSubscriptionLicenses(parseInt(e.target.value))}
                  min="1"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Subscription Type</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="subscriptionType"
                      value="regular"
                      checked={subscriptionType === 'regular'}
                      onChange={(e) => setSubscriptionType(e.target.value)}
                    />
                    <span className={styles.radioText}>Regular Subscription</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="subscriptionType"
                      value="trial"
                      checked={subscriptionType === 'trial'}
                      onChange={(e) => setSubscriptionType(e.target.value)}
                    />
                    <span className={styles.radioText}>Trial Subscription</span>
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="startedAt">Started Date</label>
                <input
                  id="startedAt"
                  type="date"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                />
              </div>

              {subscriptionType === 'trial' && (
                <div className={styles.formGroup}>
                  <label>Trial Duration</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="trialDays"
                        value="7"
                        checked={trialDays === 7}
                        onChange={(e) => setTrialDays(parseInt(e.target.value))}
                      />
                      <span className={styles.radioText}>7 days</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="trialDays"
                        value="14"
                        checked={trialDays === 14}
                        onChange={(e) => setTrialDays(parseInt(e.target.value))}
                      />
                      <span className={styles.radioText}>14 days</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="trialDays"
                        value="30"
                        checked={trialDays === 30}
                        onChange={(e) => setTrialDays(parseInt(e.target.value))}
                      />
                      <span className={styles.radioText}>30 days</span>
                    </label>
                  </div>
                  <div className={styles.trialInfo}>
                    <small>Trial will end on: {trialEndDate}</small>
                  </div>
                </div>
              )}

            </div>

            <div className={styles.modalActions}>
              <Button
                variant="gray"
                size="md"
                onClick={() => {
                  setShowCreateSubscriptionModal(false);
                  setSelectedTeamForSubscription(null);
                }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="blue"
                size="md"
                onClick={handleCreateSubscriptionFromModal}
                disabled={processing}
              >
                {processing ? 'Creating...' : 'Create Subscription'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
