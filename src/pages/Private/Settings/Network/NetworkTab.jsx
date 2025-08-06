import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/Buttons/Button';
import ButtonGroup from '../../../../components/Buttons/ButtonGroup';
import Spinner from '../../../../components/Buttons/Spinner';
import useTaggedProviders from '../../../../hooks/useTaggedProviders';
import styles from './NetworkTab.module.css';

export default function NetworkTab() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingTag, setEditingTag] = useState(null);
  const [selectedProviders, setSelectedProviders] = useState(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditTag, setBulkEditTag] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkMessageType, setBulkMessageType] = useState('');
  const [footerVisible, setFooterVisible] = useState(false);
  const {
    taggedProviders,
    loading,
    error,
    removingTag,
    removeAllProviderTags,
    changeProviderTag,
  } = useTaggedProviders();

  // Close menu when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingTag && !event.target.closest(`.${styles.tagWrapper}`)) {
        setEditingTag(null);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && editingTag) {
        setEditingTag(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [editingTag]);

  // Handle footer visibility with animation
  useEffect(() => {
    const hasSelection = selectedProviders.size > 0;
    const hasMessage = bulkMessage.length > 0;
    
    if (hasSelection || hasMessage) {
      setFooterVisible(true);
    } else {
      // Delay hiding to allow for slide-down animation
      const timer = setTimeout(() => {
        setFooterVisible(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [selectedProviders.size, bulkMessage]);

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => setFilterType(e.target.value);
  const handleTagFilterChange = (tagType) => setFilterTag(tagType);
  const handleColumnSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const handleRemoveProvider = async (providerDhc) => {
    if (window.confirm('Remove all tags for this provider?')) {
      await removeAllProviderTags(providerDhc);
    }
  };
  
  const handleViewProvider = (providerDhc) => {
    navigate(`/app/provider/${providerDhc}/overview`);
  };

  const handleTagClick = (providerDhc, tag, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 150; // Approximate dropdown height
    
    // Check if dropdown would go below viewport
    const shouldGoUp = rect.bottom + dropdownHeight > viewportHeight;
    
    setEditingTag({ 
      providerDhc, 
      currentTag: tag, 
      shouldGoUp 
    });
  };

  const handleTagChange = async (providerDhc, newTagType) => {
    try {
      if (newTagType === 'remove') {
        await removeAllProviderTags(providerDhc);
      } else {
        // Change the tag to the new type
        const currentTag = editingTag.currentTag;
        await changeProviderTag(providerDhc, currentTag, newTagType);
      }
      
      setEditingTag(null);
    } catch (error) {
      console.error('Error changing tag:', error);
    }
  };

  const handleTagRemove = async (providerDhc) => {
    try {
      await removeAllProviderTags(providerDhc);
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const handleSelectProvider = (providerDhc) => {
    setSelectedProviders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerDhc)) {
        newSet.delete(providerDhc);
      } else {
        newSet.add(providerDhc);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProviders.size === filteredAndSortedProviders.length) {
      setSelectedProviders(new Set());
    } else {
      setSelectedProviders(new Set(filteredAndSortedProviders.map(p => p.provider_dhc)));
    }
  };

  const handleBulkEdit = async () => {
    if (!bulkEditTag || selectedProviders.size === 0) return;
    
    try {
      let updatedCount = 0;
      for (const providerDhc of selectedProviders) {
        const provider = filteredAndSortedProviders.find(p => p.provider_dhc === providerDhc);
        if (provider && provider.tags.length > 0) {
          const currentTag = provider.tags[0]; // Assuming single tag per provider
          await changeProviderTag(providerDhc, currentTag, bulkEditTag);
          updatedCount++;
        }
      }
      setBulkEditMode(false);
      setBulkEditTag('');
      setSelectedProviders(new Set());
      setBulkMessage(`✅ Successfully updated ${updatedCount} provider${updatedCount !== 1 ? 's' : ''} to "${getTagLabel(bulkEditTag)}" tag`);
      setBulkMessageType('success');
      setTimeout(() => {
        setBulkMessage('');
        setBulkMessageType('');
      }, 3000);
    } catch (error) {
      console.error('Error bulk editing tags:', error);
      setBulkMessage('❌ Error updating tags. Please try again.');
      setBulkMessageType('error');
      setTimeout(() => {
        setBulkMessage('');
        setBulkMessageType('');
      }, 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProviders.size === 0) return;
    
    if (window.confirm(`Remove all tags for ${selectedProviders.size} selected providers?`)) {
      try {
        const deleteCount = selectedProviders.size;
        for (const providerDhc of selectedProviders) {
          await removeAllProviderTags(providerDhc);
        }
        setSelectedProviders(new Set());
        setBulkMessage(`✅ Successfully removed tags from ${deleteCount} provider${deleteCount !== 1 ? 's' : ''}`);
        setBulkMessageType('success');
        setTimeout(() => {
          setBulkMessage('');
          setBulkMessageType('');
        }, 3000);
      } catch (error) {
        console.error('Error bulk deleting tags:', error);
        setBulkMessage('❌ Error removing tags. Please try again.');
        setBulkMessageType('error');
        setTimeout(() => {
          setBulkMessage('');
          setBulkMessageType('');
        }, 3000);
      }
    }
  };

  // Filter and sort providers
  const filteredAndSortedProviders = taggedProviders
    .filter(provider => {
      if (searchTerm && !provider.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterType !== 'all' && provider.type !== filterType) return false;
      if (filterTag !== 'all' && !provider.tags.includes(filterTag)) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name': 
          aValue = a.name || ''; 
          bValue = b.name || ''; 
          break;
        case 'type': 
          aValue = a.type || ''; 
          bValue = b.type || ''; 
          break;
        case 'network': 
          aValue = a.network || ''; 
          bValue = b.network || ''; 
          break;
        case 'location': 
          aValue = `${a.city || ''} ${a.state || ''}`; 
          bValue = `${b.city || ''} ${b.state || ''}`; 
          break;
        case 'date': 
          aValue = new Date(a.created_at); 
          bValue = new Date(b.created_at); 
          break;
        default: 
          aValue = a.name || ''; 
          bValue = b.name || '';
      }
      if (sortDirection === 'asc') return aValue > bValue ? 1 : -1;
      else return aValue < bValue ? 1 : -1;
    });

  const getUniqueTypes = () => {
    const types = new Set();
    taggedProviders.forEach(provider => {
      if (provider.type) types.add(provider.type);
    });
    return Array.from(types).sort();
  };

  // Helper functions for tag display
  const getTagColor = (tagType) => {
    switch (tagType) {
      case 'me': return '#265947'; // Green from palette
      case 'partner': return '#3599b8'; // Blue from palette
      case 'competitor': return '#d64550'; // Red from palette
      case 'target': return '#f1b62c'; // Gold from palette
      default: return '#5f6b6d'; // Gray from palette
    }
  };

  const getTagLabel = (tagType) => {
    switch (tagType) {
      case 'me': return 'Me';
      case 'partner': return 'Partner';
      case 'competitor': return 'Competitor';
      case 'target': return 'Target';
      default: return tagType;
    }
  };

  if (loading) return <Spinner message="Loading your network..." />;

  return (
    <div className={styles.section}>
      <div className={styles.headerRow}>
        <h3 className={styles.subsectionTitle}>Network Management</h3>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search providers..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        
        <select value={filterType} onChange={handleFilterChange} className={styles.filterSelect}>
          <option value="all">All Types</option>
          {getUniqueTypes().map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        
        <select value={filterTag} onChange={(e) => handleTagFilterChange(e.target.value)} className={styles.filterSelect}>
          <option value="all">All Tags</option>
          <option value="me">Me</option>
          <option value="partner">Partner</option>
          <option value="competitor">Competitor</option>
          <option value="target">Target</option>
        </select>
      </div>
    </div>

    {error && <div className={styles.error}>{error}</div>}



    <div className={styles.content}>
        {filteredAndSortedProviders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏥</div>
            <h3>No providers found</h3>
            <p>
              {searchTerm || filterType !== 'all' || filterTag !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Start by tagging providers from the search results page or provider detail pages.'
              }
            </p>
            <Button variant="blue" onClick={() => navigate('/app/search')}>
              Search Providers
            </Button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.providersTable}>
              <thead>
                <tr>
                  <th className={styles.checkboxHeader}>
                    <input
                      type="checkbox"
                      checked={selectedProviders.size === filteredAndSortedProviders.length && filteredAndSortedProviders.length > 0}
                      onChange={handleSelectAll}
                      className={styles.selectAllCheckbox}
                    />
                  </th>
                  <th 
                    className={styles.sortableHeader}
                    onClick={() => handleColumnSort('name')}
                  >
                    Provider Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Tags</th>
                  <th 
                    className={styles.sortableHeader}
                    onClick={() => handleColumnSort('type')}
                  >
                    Type {sortBy === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className={styles.sortableHeader}
                    onClick={() => handleColumnSort('network')}
                  >
                    Network {sortBy === 'network' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className={styles.sortableHeader}
                    onClick={() => handleColumnSort('location')}
                  >
                    Location {sortBy === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className={styles.sortableHeader}
                    onClick={() => handleColumnSort('date')}
                  >
                    Date Added {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProviders.map(provider => (
                  <tr 
                    key={provider.provider_dhc}
                    className={editingTag?.providerDhc === provider.provider_dhc ? styles.activeRow : ''}
                  >
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={selectedProviders.has(provider.provider_dhc)}
                        onChange={() => handleSelectProvider(provider.provider_dhc)}
                        className={styles.rowCheckbox}
                      />
                    </td>
                    <td>
                      <div 
                        className={styles.providerName}
                        onClick={() => handleViewProvider(provider.provider_dhc)}
                        style={{ cursor: 'pointer' }}
                      >
                        {provider.name}
                      </div>
                    </td>
                    <td>
                      {provider.tags.length > 0 ? (
                        <div className={styles.tagsContainer}>
                          {provider.tags.map(tag => (
                            <div key={tag} className={styles.tagWrapper}>
                              <>
                                <span 
                                  className={styles.tag} 
                                  style={{ backgroundColor: getTagColor(tag) }}
                                  onClick={(e) => handleTagClick(provider.provider_dhc, tag, e)}
                                >
                                  {getTagLabel(tag)}
                                </span>

                                {editingTag?.providerDhc === provider.provider_dhc && editingTag?.currentTag === tag && (
                                  <div className={`${styles.taggingMenu} ${editingTag.shouldGoUp ? styles.dropdownUp : ''}`}>
                                    <div 
                                      className={styles.tagOption}
                                      style={{ backgroundColor: getTagColor('me') }}
                                      onClick={() => handleTagChange(provider.provider_dhc, 'me')}
                                    >
                                      {getTagLabel('me')}
                                    </div>
                                    <div 
                                      className={styles.tagOption}
                                      style={{ backgroundColor: getTagColor('partner') }}
                                      onClick={() => handleTagChange(provider.provider_dhc, 'partner')}
                                    >
                                      {getTagLabel('partner')}
                                    </div>
                                    <div 
                                      className={styles.tagOption}
                                      style={{ backgroundColor: getTagColor('competitor') }}
                                      onClick={() => handleTagChange(provider.provider_dhc, 'competitor')}
                                    >
                                      {getTagLabel('competitor')}
                                    </div>
                                    <div 
                                      className={styles.tagOption}
                                      style={{ backgroundColor: getTagColor('target') }}
                                      onClick={() => handleTagChange(provider.provider_dhc, 'target')}
                                    >
                                      {getTagLabel('target')}
                                    </div>
                                  </div>
                                )}
                              </>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className={styles.noTags}>-</span>
                      )}
                    </td>
                    <td>{provider.type}</td>
                    <td>{provider.network}</td>
                    <td>{provider.city}, {provider.state}</td>
                    <td>{new Date(provider.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky Footer for Bulk Actions */}
      {footerVisible && (
        <div className={`${styles.stickyFooter} ${(selectedProviders.size > 0 || bulkMessage) ? styles.footerVisible : styles.footerHiding}`}>
          <div className={styles.stickyFooterContent}>
            {bulkMessage ? (
              <div className={`${styles.footerMessage} ${styles[bulkMessageType]}`}>
                {bulkMessage}
              </div>
            ) : (
              <>
                <div className={styles.bulkControls}>
                  {bulkEditMode ? (
                    <>
                      <select 
                        value={bulkEditTag} 
                        onChange={(e) => setBulkEditTag(e.target.value)}
                        className={styles.bulkTagSelect}
                      >
                        <option value="">Select tag...</option>
                        <option value="me">Me</option>
                        <option value="partner">Partner</option>
                        <option value="competitor">Competitor</option>
                        <option value="target">Target</option>
                      </select>
                      <Button 
                        size="sm" 
                        variant="blue" 
                        onClick={handleBulkEdit}
                        disabled={!bulkEditTag}
                      >
                        Apply
                      </Button>
                      <Button 
                        size="sm" 
                        variant="gray" 
                        onClick={() => {
                          setBulkEditMode(false);
                          setBulkEditTag('');
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="md" 
                        variant="blue" 
                        onClick={() => setBulkEditMode(true)}
                      >
                        Edit Tags
                      </Button>
                      <Button 
                        size="md" 
                        variant="red" 
                        onClick={handleBulkDelete}
                      >
                        Delete All
                      </Button>
                    </>
                  )}
                </div>
                <div className={styles.bulkInfo}>
                  {selectedProviders.size} provider{selectedProviders.size !== 1 ? 's' : ''} selected
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 