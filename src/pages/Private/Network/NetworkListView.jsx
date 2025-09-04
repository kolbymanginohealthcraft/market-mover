import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network as NetworkIcon, Lock, Search, X, ChevronDown } from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import SectionHeader from '../../../components/Layouts/SectionHeader';
import ControlsRow from '../../../components/Layouts/ControlsRow';
import Dropdown from '../../../components/Buttons/Dropdown';
import useTaggedProviders from '../../../hooks/useTaggedProviders';
import { useUserTeam } from '../../../hooks/useUserTeam';
import { getTagColor, getTagLabel } from '../../../utils/tagColors';
import styles from './Network.module.css';

import controlsStyles from '../../../components/Layouts/ControlsRow.module.css';

export default function NetworkListView() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
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
  const [filterTypeDropdownOpen, setFilterTypeDropdownOpen] = useState(false);
  const [filterTagDropdownOpen, setFilterTagDropdownOpen] = useState(false);
  const [bulkEditDropdownOpen, setBulkEditDropdownOpen] = useState(false);
  const {
    taggedProviders,
    loading,
    error,
    removingTag,
    removeAllProviderTags,
    changeProviderTag,
  } = useTaggedProviders();

  // Check if user has a team
  const { hasTeam } = useUserTeam();



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

  // Handle global search behavior integration
  useEffect(() => {
    if (searchInputRef.current) {
      const handleInputChange = (e) => {
        // Sync with global script changes
        if (e.target.value !== searchTerm) {
          setSearchTerm(e.target.value);
        }
      };
      
      searchInputRef.current.addEventListener('input', handleInputChange);
      
      return () => {
        if (searchInputRef.current) {
          searchInputRef.current.removeEventListener('input', handleInputChange);
        }
      };
    }
  }, [searchTerm]);



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

  const handleTagClick = (providerDhc, tag) => {
    setEditingTag({ 
      providerDhc, 
      currentTag: tag
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
    if (selectedProviders.size === 0 || !bulkEditTag) return;
    
    try {
      const editCount = selectedProviders.size;
      for (const providerDhc of selectedProviders) {
        // Find the first tag for this provider to change
        const provider = taggedProviders.find(p => p.provider_dhc === providerDhc);
        if (provider && provider.tags.length > 0) {
          await changeProviderTag(providerDhc, provider.tags[0], bulkEditTag);
        }
      }
      setSelectedProviders(new Set());
      setBulkEditTag('');
      setBulkMessage(`✅ Successfully updated ${editCount} provider${editCount !== 1 ? 's' : ''}`);
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

  const handleEditNetwork = () => {
    // For now, just show a message. This could open a modal or navigate to an edit page
    alert('Edit network functionality coming soon!');
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



  if (loading) return <Spinner message="Loading your network..." />;

  return (
    <div className={styles.networkListPage}>
      {/* Controls Row */}
      <ControlsRow
        leftContent={
                    <>
            <div className="searchBarContainer">
              <div className="searchIcon">
                <Search size={16} />
              </div>
                                           <input
                ref={searchInputRef}
                type="text"
                placeholder="Search providers in this list..."
                value={searchTerm}
                onChange={handleSearch}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchTerm('');
                  }
                }}
                className="searchInput"
              />
            </div>
            
            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  {filterType === 'all' ? 'All Types' : filterType}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={filterTypeDropdownOpen}
              onToggle={setFilterTypeDropdownOpen}
              className={styles.dropdownMenu}
            >
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  handleFilterChange({ target: { value: 'all' } });
                  setFilterTypeDropdownOpen(false);
                }}
              >
                All Types
              </div>
              {getUniqueTypes().map(type => (
                <div 
                  key={type} 
                  className={styles.dropdownItem}
                  onClick={() => {
                    handleFilterChange({ target: { value: type } });
                    setFilterTypeDropdownOpen(false);
                  }}
                >
                  {type}
                </div>
              ))}
            </Dropdown>
            
            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  {filterTag === 'all' ? 'All Tags' : getTagLabel(filterTag)}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={filterTagDropdownOpen}
              onToggle={setFilterTagDropdownOpen}
              className={styles.dropdownMenu}
            >
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  handleTagFilterChange('all');
                  setFilterTagDropdownOpen(false);
                }}
              >
                All Tags
              </div>
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  handleTagFilterChange('me');
                  setFilterTagDropdownOpen(false);
                }}
              >
                Me
              </div>
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  handleTagFilterChange('partner');
                  setFilterTagDropdownOpen(false);
                }}
              >
                Partner
              </div>
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  handleTagFilterChange('competitor');
                  setFilterTagDropdownOpen(false);
                }}
              >
                Competitor
              </div>
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  handleTagFilterChange('target');
                  setFilterTagDropdownOpen(false);
                }}
              >
                Target
              </div>
            </Dropdown>
          </>
        }
        rightContent={
          <span className={controlsStyles.summaryText}>
            Showing {filteredAndSortedProviders.length} of {taggedProviders.length} providers
          </span>
        }
      />



      {/* Content Container */}
      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {filteredAndSortedProviders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏥</div>
            <h3>No providers found</h3>
            <p>Try adjusting your search or filters to find providers in your network.</p>
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
                              <Dropdown
                                trigger={
                                  <span 
                                    className={styles.tag} 
                                    style={{ backgroundColor: getTagColor(tag) }}
                                  >
                                    {getTagLabel(tag)}
                                  </span>
                                }
                                isOpen={editingTag?.providerDhc === provider.provider_dhc && editingTag?.currentTag === tag}
                                onToggle={(isOpen) => {
                                  if (isOpen) {
                                    handleTagClick(provider.provider_dhc, tag);
                                  } else {
                                    setEditingTag(null);
                                  }
                                }}
                                className={styles.dropdownMenu}
                                key={`${provider.provider_dhc}-${tag}`}
                              >
                                <div 
                                  className={styles.dropdownItem}
                                  onClick={() => handleTagChange(provider.provider_dhc, 'me')}
                                >
                                  Me
                                </div>
                                <div 
                                  className={styles.dropdownItem}
                                  onClick={() => handleTagChange(provider.provider_dhc, 'partner')}
                                >
                                  Partner
                                </div>
                                <div 
                                  className={styles.dropdownItem}
                                  onClick={() => handleTagChange(provider.provider_dhc, 'competitor')}
                                >
                                  Competitor
                                </div>
                                <div 
                                  className={styles.dropdownItem}
                                  onClick={() => handleTagChange(provider.provider_dhc, 'target')}
                                >
                                  Target
                                </div>
                                <div className={styles.dropdownDivider}></div>
                                <div 
                                  className={styles.dropdownItem}
                                  onClick={() => handleTagChange(provider.provider_dhc, 'remove')}
                                >
                                  Remove
                                </div>
                              </Dropdown>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className={styles.noTags}>No tags</span>
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

        {/* Bulk Actions Footer */}
        {footerVisible && (
          <div className={`${styles.bottomDrawer} ${footerVisible ? styles.drawerVisible : ''}`}>
            <div className={styles.drawerContent}>
              <div className={styles.drawerLeft}>
                <span className={styles.selectionCount}>
                  {selectedProviders.size} provider{selectedProviders.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              <div className={styles.drawerRight}>
                {bulkMessage && (
                  <div className={`${styles.bulkMessage} ${styles[bulkMessageType]}`}>
                    {bulkMessage}
                  </div>
                )}
                
                {selectedProviders.size > 0 && hasTeam && (
                  <div className={styles.bulkActions}>
                    <Dropdown
                      trigger={
                        <button className="sectionHeaderButton">
                          {bulkEditTag ? getTagLabel(bulkEditTag) : 'Change tag to...'}
                          <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                        </button>
                      }
                      isOpen={bulkEditDropdownOpen}
                      onToggle={setBulkEditDropdownOpen}
                      className={styles.dropdownMenu}
                    >
                      <div 
                        className={styles.dropdownItem}
                        onClick={() => {
                          setBulkEditTag('me');
                          setBulkEditDropdownOpen(false);
                        }}
                      >
                        Me
                      </div>
                      <div 
                        className={styles.dropdownItem}
                        onClick={() => {
                          setBulkEditTag('partner');
                          setBulkEditDropdownOpen(false);
                        }}
                      >
                        Partner
                      </div>
                      <div 
                        className={styles.dropdownItem}
                        onClick={() => {
                          setBulkEditTag('competitor');
                          setBulkEditDropdownOpen(false);
                        }}
                      >
                        Competitor
                      </div>
                      <div 
                        className={styles.dropdownItem}
                        onClick={() => {
                          setBulkEditTag('target');
                          setBulkEditDropdownOpen(false);
                        }}
                      >
                        Target
                      </div>
                    </Dropdown>
                    
                    <button 
                      className={styles.cancelButton}
                      onClick={() => {
                        setSelectedProviders(new Set());
                        setBulkEditTag('');
                      }}
                    >
                      Cancel
                    </button>
                    
                    <button 
                      className={styles.saveButton}
                      onClick={handleBulkEdit}
                      disabled={!bulkEditTag}
                    >
                      Apply
                    </button>
                  </div>
                )}
                {selectedProviders.size > 0 && !hasTeam && (
                  <div className={styles.bulkActions}>
                    <div className={styles.teamRequiredMessage}>
                      <Lock size={14} />
                      Join or create a team to edit tags
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
