import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Button from '../../components/Buttons/Button';
import ButtonGroup from '../../components/Buttons/ButtonGroup';
import MarkdownEditor from '../../components/MarkdownEditor';
import styles from './PolicyManagement.module.css';
import { marked } from 'marked';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const PolicyManagement = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [activeTab, setActiveTab] = useState('policies');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  // Message display logic
  const displayMessage = (msg) => {
    setMessage(msg);
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 3000); // Hide after 3 seconds
  };

  // Form states
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [viewingContent, setViewingContent] = useState('');
  const [viewingVersion, setViewingVersion] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [isEditingNewVersion, setIsEditingNewVersion] = useState(false);
  const [newVersionData, setNewVersionData] = useState(null);
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [editingPolicyData, setEditingPolicyData] = useState(null);
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [editingVersionData, setEditingVersionData] = useState(null);
  const [newPolicyForm, setNewPolicyForm] = useState({
    slug: '',
    nickname: '',
    full_name: '',
    description: ''
  });
  const [newVersionForm, setNewVersionForm] = useState({
    title: '',
    summary: '',
    effective_date: '',
    clone_from_version: null
  });

  useEffect(() => {
    loadPolicies();
    loadDrafts();
    if (activeTab === 'approvals') {
      loadPendingApprovals();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedPolicy) {
      loadVersions(selectedPolicy.slug);
    }
  }, [selectedPolicy]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setUserRole(profile?.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);

  const loadPolicies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('policy_definitions')
        .select('*')
        .eq('is_active', true)
        .order('nickname');

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error('Error loading policies:', error);
      displayMessage('Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVersions = async (slug) => {
    try {
      const { data, error } = await supabase
        .from('policy_versions')
        .select(`
          *,
          policy_definitions!inner(slug, nickname, full_name)
        `)
        .eq('policy_definitions.slug', slug)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const loadDrafts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('policy_versions')
        .select(`
          *,
          policy_definitions(slug, nickname, full_name)
        `)
        .eq('created_by', user.id)
        .in('status', ['draft', 'pending_approval'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('policy_versions')
        .select(`
          *,
          policy_definitions(slug, nickname, full_name),
          profiles(email)
        `)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error) {
      console.error('Error loading approvals:', error);
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('policy_definitions')
        .insert({
          ...newPolicyForm,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      displayMessage('Policy created successfully!');
      setShowCreatePolicy(false);
      setNewPolicyForm({ slug: '', nickname: '', full_name: '', description: '' });
      loadPolicies();
    } catch (error) {
      console.error('Error creating policy:', error);
      displayMessage('Failed to create policy: ' + error.message);
    }
  };

  const handleCreateVersion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get policy ID
      const { data: policyData, error: policyError } = await supabase
        .from('policy_definitions')
        .select('id')
        .eq('slug', selectedPolicy.slug)
        .single();

      if (policyError) throw policyError;

      // Get next version number
      const { data: maxVersion, error: versionError } = await supabase
        .from('policy_versions')
        .select('version_number')
        .eq('policy_id', policyData.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (maxVersion?.version_number || 0) + 1;

      // Create new version
      const { data, error } = await supabase
        .from('policy_versions')
        .insert({
          policy_id: policyData.id,
          version_number: nextVersion,
          content: editingContent,
          title: newVersionForm.title,
          summary: newVersionForm.summary,
          effective_date: newVersionForm.effective_date || null,
          status: 'draft',
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      displayMessage('Version created successfully!');
      setShowCreateVersion(false);
      setShowEditor(false);
      setNewVersionForm({ title: '', summary: '', effective_date: '', clone_from_version: null });
      setEditingContent('');
      loadVersions(selectedPolicy.slug);
      loadDrafts();
    } catch (error) {
      console.error('Error creating version:', error);
      displayMessage('Failed to create version: ' + error.message);
    }
  };

  const handleSubmitForApproval = async (versionId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('policy_versions')
        .update({ 
          status: 'pending_approval',
          updated_by: user.id
        })
        .eq('id', versionId);

      if (error) throw error;

      displayMessage('Version submitted for approval!');
      loadDrafts();
      loadPendingApprovals();
    } catch (error) {
      console.error('Error submitting version:', error);
      displayMessage('Failed to submit version: ' + error.message);
    }
  };

  const handleApproveVersion = async (versionId, action, comments = '') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('policy_versions')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          approved_at: action === 'approve' ? new Date().toISOString() : null,
          approved_by: user.id,
          rejection_reason: action === 'reject' ? comments : null,
          updated_by: user.id
        })
        .eq('id', versionId);

      if (error) throw error;

      // Add approval record
      await supabase
        .from('policy_approvals')
        .insert({
          version_id: versionId,
          approver_id: user.id,
          action: action,
          comments: comments
        });

      displayMessage(`Version ${action}ed successfully!`);
      loadPendingApprovals();
      loadDrafts();
    } catch (error) {
      console.error('Error processing approval:', error);
      displayMessage(`Failed to ${action} version: ` + error.message);
    }
  };

  const handleCloneVersion = async (versionId) => {
    try {
      const version = versions.find(v => v.id === parseInt(versionId));
      if (!version) throw new Error('Version not found');

      // Set up inline editing for the new version
      setIsEditingNewVersion(true);
      setNewVersionData({
        summary: 'Cloned from previous version',
        content: version.content,
        clone_from_version: versionId
      });
      
      // Clear the selected version to show the new version editor
      setSelectedVersion(null);
    } catch (error) {
      console.error('Error cloning version:', error);
      displayMessage('Failed to clone version: ' + error.message);
    }
  };

  const handleViewVersion = (version) => {
    setViewingContent(version.content);
    setViewingVersion(version);
    setShowViewer(true);
  };

  const handleDeleteVersion = async (versionId) => {
    try {
      const { error } = await supabase
        .from('policy_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;

      displayMessage('Version deleted successfully');
      
      // Reload versions and clear selection if the deleted version was selected
      if (selectedVersion && selectedVersion.id === versionId) {
        setSelectedVersion(null);
      }
      loadVersions(selectedPolicy.slug);
    } catch (error) {
      console.error('Error deleting version:', error);
      displayMessage('Failed to delete version: ' + error.message);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedVersion || selectedVersion.status !== 'draft') return;
    
    try {
      const { error } = await supabase
        .from('policy_versions')
        .update({
          content: selectedVersion.content,
          effective_date: selectedVersion.effective_date || null,
          summary: selectedVersion.summary || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedVersion.id);

      if (error) throw error;

      displayMessage('Draft saved successfully');
      
      // Reload versions to get the updated content from database
      loadVersions(selectedPolicy.slug);
    } catch (error) {
      console.error('Error saving draft:', error);
      displayMessage('Failed to save draft: ' + error.message);
    }
  };

  const handleEditVersion = () => {
    setIsEditingVersion(true);
    setEditingVersionData({
      id: selectedVersion.id,
      content: selectedVersion.content,
      effective_date: selectedVersion.effective_date || '',
      summary: selectedVersion.summary || ''
    });
  };

  const handleSaveVersion = async () => {
    if (!editingVersionData) return;
    
    try {
      const { error } = await supabase
        .from('policy_versions')
        .update({
          content: editingVersionData.content,
          effective_date: editingVersionData.effective_date || null,
          summary: editingVersionData.summary || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingVersionData.id);

      if (error) throw error;

      displayMessage('Version updated successfully');
      setIsEditingVersion(false);
      setEditingVersionData(null);
      
      // Reload versions to get the updated data
      loadVersions(selectedPolicy.slug);
      
      // Update the selected version with the new data
      setSelectedVersion({
        ...selectedVersion,
        content: editingVersionData.content,
        effective_date: editingVersionData.effective_date || null,
        summary: editingVersionData.summary || null
      });
    } catch (error) {
      console.error('Error saving version:', error);
      displayMessage('Failed to save version: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingVersion(false);
    setEditingVersionData(null);
  };

  const handleSaveNewVersion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: policyData, error: policyError } = await supabase
        .from('policy_definitions')
        .select('id')
        .eq('slug', selectedPolicy.slug)
        .single();

      if (policyError) throw policyError;

      const { data: maxVersion, error: versionError } = await supabase
        .from('policy_versions')
        .select('version_number')
        .eq('policy_id', policyData.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (maxVersion?.version_number || 0) + 1;

      const { data, error } = await supabase
        .from('policy_versions')
        .insert({
          policy_id: policyData.id,
          version_number: nextVersion,
          content: newVersionData.content,
          summary: newVersionData.summary,
          effective_date: newVersionData.effective_date || null,
          status: 'draft',
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      displayMessage('Version created successfully!');
      setIsEditingNewVersion(false);
      setNewVersionData(null);
      setSelectedVersion(null);
      loadVersions(selectedPolicy.slug);
      loadDrafts();
      
      // Clear any edit mode states
      setIsEditingVersion(false);
      setEditingVersionData(null);
    } catch (error) {
      console.error('Error saving new version:', error);
      displayMessage('Failed to save new version: ' + error.message);
    }
  };

  const handleEditPolicy = () => {
    setIsEditingPolicy(true);
    setEditingPolicyData({
      id: selectedPolicy.id,
      slug: selectedPolicy.slug,
      nickname: selectedPolicy.nickname,
      full_name: selectedPolicy.full_name,
      description: selectedPolicy.description || ''
    });
  };

  const handleSavePolicy = async () => {
    try {
      const { error } = await supabase
        .from('policy_definitions')
        .update({
          nickname: editingPolicyData.nickname,
          full_name: editingPolicyData.full_name,
          description: editingPolicyData.description
        })
        .eq('id', editingPolicyData.id);

      if (error) throw error;

      displayMessage('Policy updated successfully!');
      setIsEditingPolicy(false);
      setEditingPolicyData(null);
      loadPolicies();
    } catch (error) {
      console.error('Error saving policy:', error);
      displayMessage('Failed to save policy: ' + error.message);
    }
  };

  const handleDeletePolicy = async (policyId) => {
    try {
      // First check if there are any approved versions
      const { data: approvedVersions, error: checkError } = await supabase
        .from('policy_versions')
        .select('id, status')
        .eq('policy_id', policyId)
        .eq('status', 'approved');

      if (checkError) throw checkError;

      if (approvedVersions && approvedVersions.length > 0) {
        displayMessage('Cannot delete policy with approved versions. Please delete all approved versions first.');
        return;
      }

      // Delete all versions first
      const { error: versionsError } = await supabase
        .from('policy_versions')
        .delete()
        .eq('policy_id', policyId);

      if (versionsError) throw versionsError;

      // Then delete the policy
      const { error: policyError } = await supabase
        .from('policy_definitions')
        .delete()
        .eq('id', policyId);

      if (policyError) throw policyError;

      displayMessage('Policy deleted successfully');
      
      // Clear selections and reload
      if (selectedPolicy && selectedPolicy.id === policyId) {
        setSelectedPolicy(null);
        setSelectedVersion(null);
      }
      loadPolicies();
    } catch (error) {
      console.error('Error deleting policy:', error);
      displayMessage('Failed to delete policy: ' + error.message);
    }
  };

  const canCreatePolicies = () => {
    return userRole === 'Platform Admin' || userRole === 'Platform Support';
  };

  const canApproveVersions = () => {
    return userRole === 'Platform Admin';
  };

  const canCreateVersions = () => {
    return userRole === 'Platform Admin' || userRole === 'Platform Support';
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'gray',
      pending_approval: 'yellow',
      approved: 'green',
      rejected: 'red'
    };
    
    return (
      <span className={`${styles.badge} ${styles[statusColors[status]]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Consistent date formatting function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Ensure the date is treated as local time, not UTC
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button
          variant="gray"
          size="sm"
          onClick={() => navigate('/app/settings')}
          className={styles.backButton}
        >
          ← Back to Settings
        </Button>
        <h1>Policy Management</h1>
      </div>

      {showMessage && (
        <div className={`${styles.message} ${styles.show} ${message.includes('success') ? styles.success : styles.error}`}>
          {message}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.threeColumnLayout}>
          {/* Policies Column */}
          <div className={styles.policiesColumn}>
            <div className={styles.policiesSection}>
              <div className={styles.sectionHeader}>
                <h2>Policies</h2>
                {canCreatePolicies() && (
                  <Button
                    onClick={() => setShowCreatePolicy(true)}
                    variant="blue"
                    size="sm"
                  >
                    + New Policy
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className={styles.loading}>Loading policies...</div>
              ) : (
                <div className={styles.policyGrid}>
                  {policies.map(policy => (
                    <div
                      key={policy.id}
                      className={`${styles.policyCard} ${selectedPolicy?.id === policy.id ? styles.selected : ''}`}
                      onClick={() => {
                        setSelectedPolicy(policy);
                        setSelectedVersion(null); // Clear selected version when switching policies
                        setIsEditingNewVersion(false); // Clear new version editing mode
                        setNewVersionData(null); // Clear new version data
                        setIsEditingVersion(false); // Clear version edit mode
                        setEditingVersionData(null); // Clear editing version data
                      }}
                    >
                      <h3>{policy.nickname}</h3>
                      <p>{policy.full_name}</p>
                      {policy.description && <p className={styles.description}>{policy.description}</p>}
                      {canCreatePolicies() && (
                        <div className={styles.policyCardActions}>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePolicy(policy.id);
                            }}
                            variant="red"
                            size="sm"
                            className={styles.deleteButton}
                          >
                            Delete
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPolicy(policy);
                              handleEditPolicy();
                            }}
                            variant="gray"
                            size="sm"
                            className={styles.editButton}
                          >
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Versions Column */}
          <div className={styles.versionsColumn}>
            <div className={styles.versionsSection}>
              <div className={styles.sectionHeader}>
                <h3>Versions</h3>
                {selectedPolicy && canCreateVersions() && (
                  <Button
                    onClick={() => {
                      setIsEditingNewVersion(true);
                      setNewVersionData({
                        summary: '',
                        content: '',
                        effective_date: '',
                        clone_from_version: null
                      });
                      setSelectedVersion(null);
                    }}
                    variant="blue"
                    size="sm"
                  >
                    + New Version
                  </Button>
                )}
              </div>

              {selectedPolicy ? (
                <div className={styles.versionList}>
                  {versions.map(version => (
                    <div
                      key={version.id}
                      className={`${styles.versionCard} ${selectedVersion?.id === version.id ? styles.selected : ''}`}
                      onClick={() => {
                        setSelectedVersion(version);
                        setIsEditingVersion(false); // Clear version edit mode
                        setEditingVersionData(null); // Clear editing version data
                      }}
                    >
                      <div className={styles.versionHeader}>
                        <h4>Version {version.version_number}</h4>
                        {getStatusBadge(version.status)}
                      </div>
                      {version.summary && <p className={styles.versionDescription}>{version.summary}</p>}
                      {version.effective_date && (
                        <p className={styles.effectiveDate}>
                          Effective: {formatDate(version.effective_date)}
                        </p>
                      )}
                      <p className={styles.versionDate}>
                        Created: {new Date(version.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyViewer}>
                  <p>Select a policy to view versions</p>
                </div>
              )}
            </div>
          </div>

          {/* Viewer Column */}
          <div className={styles.viewerColumn}>
            <div className={styles.viewerSection}>
              {isEditingPolicy ? (
                <>
                  <div className={styles.viewerHeader}>
                    <h3>Edit Policy</h3>
                    <div className={styles.viewerMeta}>
                      <span>
                        <strong>Policy ID:</strong> {editingPolicyData?.slug}
                      </span>
                      <div className={styles.inlineActions}>
                        <Button
                          onClick={handleSavePolicy}
                          variant="blue"
                          size="sm"
                        >
                          Save Policy
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingPolicy(false);
                            setEditingPolicyData(null);
                          }}
                          variant="gray"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.newVersionForm}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Nickname *</label>
                        <input
                          type="text"
                          value={editingPolicyData?.nickname || ''}
                          onChange={(e) => setEditingPolicyData({
                            ...editingPolicyData,
                            nickname: e.target.value
                          })}
                          placeholder="e.g., Terms, Privacy, Refund"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Full Name *</label>
                        <input
                          type="text"
                          value={editingPolicyData?.full_name || ''}
                          onChange={(e) => setEditingPolicyData({
                            ...editingPolicyData,
                            full_name: e.target.value
                          })}
                          placeholder="e.g., Terms of Service"
                        />
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Description (optional)</label>
                      <textarea
                        value={editingPolicyData?.description || ''}
                        onChange={(e) => setEditingPolicyData({
                          ...editingPolicyData,
                          description: e.target.value
                        })}
                        placeholder="Brief description of this policy..."
                        rows={3}
                      />
                    </div>
                  </div>
                </>
              ) : isEditingNewVersion ? (
                  <>
                    <div className={styles.viewerHeader}>
                      <h3>{selectedPolicy.nickname} (New Version)</h3>
                      <div className={styles.viewerMeta}>
                        <span>
                          <strong>Created:</strong> {new Date().toLocaleDateString()}
                        </span>
                        <span>
                          <strong>Effective:</strong>
                          <input
                            type="date"
                            value={newVersionData?.effective_date || ''}
                            onChange={(e) => {
                              // Ensure the date is handled as local time, not UTC
                              const dateValue = e.target.value;
                              setNewVersionData({
                                ...newVersionData,
                                effective_date: dateValue
                              });
                            }}
                            placeholder="MM/DD/YYYY"
                            className={styles.inlineInput}
                          />
                        </span>
                        <div className={styles.inlineForm}>
                          <input
                            type="text"
                            value={newVersionData?.summary || ''}
                            onChange={(e) => setNewVersionData({
                              ...newVersionData,
                              summary: e.target.value
                            })}
                            placeholder="Description of changes (optional)"
                            className={styles.inlineInput}
                          />
                        </div>
                        <div className={styles.inlineActions}>
                          <Button
                            onClick={handleSaveNewVersion}
                            variant="blue"
                            size="sm"
                          >
                            Save Version
                          </Button>
                          <Button
                            onClick={() => {
                              if (newVersionData?.content && newVersionData.content.trim() !== '') {
                                // If there's content, ask for confirmation
                                if (window.confirm('Are you sure you want to cancel? Your changes will be lost.')) {
                                  setIsEditingNewVersion(false);
                                  setNewVersionData(null);
                                  setSelectedVersion(null);
                                }
                              } else {
                                // If no content, just cancel
                                setIsEditingNewVersion(false);
                                setNewVersionData(null);
                                setSelectedVersion(null);
                              }
                            }}
                            variant="gray"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className={styles.viewerContent}>
                      <MarkdownEditor
                        key="new-version-editor"
                        content={newVersionData?.content || ''}
                        onContentChange={(newContent) => {
                          setNewVersionData({
                            ...newVersionData,
                            content: newContent
                          });
                        }}
                        readOnly={false}
                        placeholder="Start typing your new version content..."
                      />
                    </div>
                  </>
                ) : selectedVersion ? (
                  <>
                    <div className={styles.viewerHeader}>
                      <div className={styles.headerRow}>
                        <h3>{selectedPolicy.nickname} (Version {selectedVersion.version_number})</h3>
                        <div className={styles.inlineActions}>
                          {isEditingVersion ? (
                            <>
                              <Button
                                onClick={handleSaveVersion}
                                variant="blue"
                                size="sm"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                variant="gray"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : selectedVersion.status === 'draft' ? (
                            <>
                              <Button
                                onClick={handleEditVersion}
                                variant="blue"
                                size="sm"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleSubmitForApproval(selectedVersion.id)}
                                variant="green"
                                size="sm"
                              >
                                Submit for Approval
                              </Button>
                              <Button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
                                    handleDeleteVersion(selectedVersion.id);
                                  }
                                }}
                                variant="red"
                                size="sm"
                              >
                                Delete
                              </Button>
                            </>
                          ) : selectedVersion.status === 'pending_approval' && canApproveVersions() ? (
                            <>
                              <Button
                                onClick={() => handleApproveVersion(selectedVersion.id, 'approve')}
                                variant="green"
                                size="sm"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => {
                                  const comments = window.prompt('Please provide a reason for rejection (optional):');
                                  if (comments !== null) {
                                    handleApproveVersion(selectedVersion.id, 'reject', comments);
                                  }
                                }}
                                variant="red"
                                size="sm"
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => handleCloneVersion(selectedVersion.id)}
                              variant="gray"
                              size="sm"
                            >
                              Clone
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className={styles.viewerMeta}>
                        <div className={styles.metaRow}>
                          <span>
                            <strong>Status:</strong> {getStatusBadge(selectedVersion.status)}
                          </span>
                          <span>
                            <strong>Created:</strong> {new Date(selectedVersion.created_at).toLocaleDateString()}
                          </span>
                          {isEditingVersion ? (
                            <span>
                              <strong>Effective:</strong>
                              <input
                                type="date"
                                value={editingVersionData?.effective_date || ''}
                                onChange={(e) => {
                                  setEditingVersionData({
                                    ...editingVersionData,
                                    effective_date: e.target.value
                                  });
                                }}
                                placeholder="MM/DD/YYYY"
                                className={styles.inlineInput}
                              />
                            </span>
                          ) : selectedVersion.effective_date ? (
                            <span>
                              <strong>Effective:</strong> {formatDate(selectedVersion.effective_date)}
                            </span>
                          ) : null}
                          {isEditingVersion ? (
                            <span>
                              <strong>Description:</strong>
                              <input
                                type="text"
                                value={editingVersionData?.summary || ''}
                                onChange={(e) => {
                                  setEditingVersionData({
                                    ...editingVersionData,
                                    summary: e.target.value
                                  });
                                }}
                                placeholder="Add description (optional)"
                                className={styles.inlineInput}
                              />
                            </span>
                          ) : selectedVersion.summary ? (
                            <span>
                              <strong>Description:</strong> {selectedVersion.summary}
                            </span>
                          ) : (
                            <span>
                              <strong>Description:</strong> <em>No description</em>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.viewerContent}>
                      {isEditingVersion ? (
                        <MarkdownEditor
                          key={`${selectedVersion.id}-${selectedVersion.status}-${isEditingVersion}`}
                          content={editingVersionData?.content}
                          onContentChange={(newContent) => {
                            setEditingVersionData({
                              ...editingVersionData,
                              content: newContent
                            });
                          }}
                          readOnly={false}
                          placeholder="Start editing your content..."
                        />
                      ) : (
                        <div className={styles.renderedContent}>
                          <div 
                            className={styles.markdownContent}
                            dangerouslySetInnerHTML={{ 
                              __html: marked(selectedVersion.content || '', { 
                                breaks: true, 
                                gfm: true 
                              }) 
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                <div className={styles.emptyViewer}>
                  <p>Select a version to view content</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Policy Modal */}
      {showCreatePolicy && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Create New Policy</h3>
            <form onSubmit={handleCreatePolicy}>
              <div className={styles.formGroup}>
                <label>Slug (unique identifier)</label>
                <input
                  type="text"
                  value={newPolicyForm.slug}
                  onChange={(e) => setNewPolicyForm({...newPolicyForm, slug: e.target.value})}
                  placeholder="e.g., trials"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nickname</label>
                <input
                  type="text"
                  value={newPolicyForm.nickname}
                  onChange={(e) => setNewPolicyForm({...newPolicyForm, nickname: e.target.value})}
                  placeholder="e.g., Trials"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input
                  type="text"
                  value={newPolicyForm.full_name}
                  onChange={(e) => setNewPolicyForm({...newPolicyForm, full_name: e.target.value})}
                  placeholder="e.g., Trial Account Policy"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={newPolicyForm.description}
                  onChange={(e) => setNewPolicyForm({...newPolicyForm, description: e.target.value})}
                  placeholder="Brief description of this policy"
                />
              </div>
              <div className={styles.modalActions}>
                <Button type="submit" variant="blue">Create Policy</Button>
                <Button
                  type="button"
                  variant="gray"
                  onClick={() => setShowCreatePolicy(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Version Modal */}
      {showCreateVersion && selectedPolicy && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Create New Version - {selectedPolicy.nickname}</h3>
            <div className={styles.formGroup}>
              <label>Clone from existing version (optional)</label>
              <select
                value={newVersionForm.clone_from_version || ''}
                onChange={(e) => setNewVersionForm({...newVersionForm, clone_from_version: e.target.value || null})}
              >
                <option value="">Start from scratch</option>
                {versions.filter(v => v.status === 'approved').map(version => (
                  <option key={version.id} value={version.id}>
                    Version {version.version_number} - {version.title || 'Untitled'}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Title (optional)</label>
              <input
                type="text"
                value={newVersionForm.title}
                onChange={(e) => setNewVersionForm({...newVersionForm, title: e.target.value})}
                placeholder="e.g., Updated Terms for 2024"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Summary (optional)</label>
              <textarea
                value={newVersionForm.summary}
                onChange={(e) => setNewVersionForm({...newVersionForm, summary: e.target.value})}
                placeholder="Brief summary of changes"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Effective Date (optional)</label>
              <input
                type="date"
                value={newVersionForm.effective_date}
                onChange={(e) => setNewVersionForm({...newVersionForm, effective_date: e.target.value})}
              />
            </div>
            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="blue"
                onClick={() => {
                  if (newVersionForm.clone_from_version) {
                    handleCloneVersion(newVersionForm.clone_from_version);
                  } else {
                    setShowCreateVersion(false);
                    setShowEditor(true);
                  }
                }}
              >
                Create & Edit
              </Button>
              <Button
                type="button"
                variant="gray"
                onClick={() => setShowCreateVersion(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rich Text Editor Modal */}
      {showEditor && (
        <div className={styles.modal}>
          <div className={styles.modalContent} style={{ width: '90vw', height: '80vh', maxWidth: '1200px' }}>
            <h3>Edit Policy Content</h3>
            <div style={{ height: 'calc(100% - 120px)', marginBottom: '1rem' }}>
              <MarkdownEditor
                content={editingContent}
                onContentChange={setEditingContent}
                placeholder="Start writing your policy content..."
              />
            </div>
            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="blue"
                onClick={handleCreateVersion}
              >
                Save Version
              </Button>
              <Button
                type="button"
                variant="gray"
                onClick={() => {
                  setShowEditor(false);
                  setEditingContent('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Version Viewer Modal */}
      {showViewer && viewingVersion && (
        <div className={styles.modal}>
          <div className={styles.modalContent} style={{ width: '90vw', height: '80vh', maxWidth: '1200px' }}>
            <div className={styles.viewerHeader}>
              <h3>
                {viewingVersion.policy_definitions?.nickname} - Version {viewingVersion.version_number}
                {viewingVersion.title && ` - ${viewingVersion.title}`}
              </h3>
              <div className={styles.viewerMeta}>
                <span>Status: {getStatusBadge(viewingVersion.status)}</span>
                <span>Created: {new Date(viewingVersion.created_at).toLocaleDateString()}</span>
                {viewingVersion.effective_date && (
                  <span>Effective: {formatDate(viewingVersion.effective_date)}</span>
                )}
              </div>
            </div>
            <div className={styles.viewerContent}>
              <div 
                className={styles.markdownContent}
                dangerouslySetInnerHTML={{ 
                  __html: marked(viewingContent, { breaks: true, gfm: true }) 
                }}
              />
            </div>
            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="gray"
                onClick={() => {
                  setShowViewer(false);
                  setViewingContent('');
                  setViewingVersion(null);
                }}
              >
                Close
              </Button>
              {viewingVersion.status === 'approved' && (
                <Button
                  type="button"
                  variant="blue"
                  onClick={() => {
                    setShowViewer(false);
                    setViewingContent('');
                    setViewingVersion(null);
                    handleCloneVersion(viewingVersion.id);
                  }}
                >
                  Clone This Version
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyManagement; 