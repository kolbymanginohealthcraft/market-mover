import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Plus, Search as SearchIcon, Tag, ChevronDown } from 'lucide-react';
import ControlsRow from '../../../components/Layouts/ControlsRow';
import Dropdown from '../../../components/Buttons/Dropdown';
import styles from './Metrics.module.css';

export default function MetricsBrowseView() {
  const [kpiTags, setKpiTags] = useState([]);
  const [referenceKpis, setReferenceKpis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter state
  const [filterOptions, setFilterOptions] = useState({ settings: [], sources: [] });
  const [selectedSetting, setSelectedSetting] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [settingDropdownOpen, setSettingDropdownOpen] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);

  async function fetchKpiTags() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) {
        setKpiTags([]);
        return;
      }

      const { data } = await supabase
        .from('team_kpi_tags')
        .select('*')
        .eq('team_id', profile.team_id);

      setKpiTags(data || []);
    } catch (err) {
      console.error('Error fetching metric tags:', err);
    }
  }

  async function fetchFilterOptions() {
    try {
      const response = await fetch('/api/kpis-filters');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch filter options: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setFilterOptions(result.data);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }

  const fetchReferenceKpis = useCallback(async () => {
    try {
      setSearchLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        search: searchTerm,
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        setting: selectedSetting !== 'all' ? selectedSetting : '',
        source: selectedSource !== 'all' ? selectedSource : ''
      });
      
      const response = await fetch(`/api/kpis-reference?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reference metrics: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch metrics');
      }
      
      setTotalCount(result.pagination.total);
      setReferenceKpis(result.data || []);
    } catch (err) {
      console.error('Error fetching reference metrics:', err);
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm, currentPage, itemsPerPage, selectedSetting, selectedSource]);

  useEffect(() => {
    fetchKpiTags();
    fetchFilterOptions();
  }, []);
  
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 when search term changes
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSetting, selectedSource]);

  useEffect(() => {
    fetchReferenceKpis();
  }, [fetchReferenceKpis]);

  async function handleToggleTag(code) {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) throw new Error('No team found');

      const { data: existing } = await supabase
        .from('team_kpi_tags')
        .select('id')
        .eq('team_id', profile.team_id)
        .eq('kpi_code', code)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('team_kpi_tags')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_kpi_tags')
          .insert({
            team_id: profile.team_id,
            kpi_code: code
          });

        if (error) throw error;
      }

      await fetchKpiTags();
    } catch (err) {
      console.error('Error toggling metric tag:', err);
      setError(err.message);
    }
  }

  function isTagged(code) {
    return kpiTags.some(tag => tag.kpi_code === code);
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <>
      {/* Search and Pagination Controls */}
      <ControlsRow
        leftContent={
          <div className="searchBarContainer">
            <div className="searchIcon">
              <SearchIcon size={16} />
            </div>
            <input
              type="text"
              placeholder="Search by code, name, label, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onInput={(e) => setSearchTerm(e.target.value)}
              className="searchInput"
            />
          </div>
        }
        rightContent={
          totalCount > 0 && (
            <div className={styles.paginationControls}>
              <span className={styles.resultsCount}>
                Showing {referenceKpis.length} of {totalCount.toLocaleString()}
              </span>
              <button 
                className={styles.paginationButton}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || searchLoading}
              >
                Previous
              </button>
              <span className={styles.paginationPage}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className={styles.paginationButton}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || searchLoading}
              >
                Next
              </button>
            </div>
          )
        }
      />

      {/* Filter Controls */}
      <ControlsRow
        leftContent={
          <>
            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  {selectedSetting === 'all' ? 'All Settings' : selectedSetting}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={settingDropdownOpen}
              onToggle={setSettingDropdownOpen}
              className={styles.dropdownMenu}
            >
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  setSelectedSetting('all');
                  setSettingDropdownOpen(false);
                }}
              >
                All Settings
              </div>
              {filterOptions.settings.map(setting => (
                <div 
                  key={setting} 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setSelectedSetting(setting);
                    setSettingDropdownOpen(false);
                  }}
                >
                  {setting}
                </div>
              ))}
            </Dropdown>

            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  {selectedSource === 'all' ? 'All Sources' : selectedSource}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={sourceDropdownOpen}
              onToggle={setSourceDropdownOpen}
              className={styles.dropdownMenu}
            >
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  setSelectedSource('all');
                  setSourceDropdownOpen(false);
                }}
              >
                All Sources
              </div>
              {filterOptions.sources.map(source => (
                <div 
                  key={source} 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setSelectedSource(source);
                    setSourceDropdownOpen(false);
                  }}
                >
                  {source}
                </div>
              ))}
            </Dropdown>
          </>
        }
      />

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {searchLoading && referenceKpis.length === 0 ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading metrics...</p>
        </div>
      ) : referenceKpis.length === 0 ? (
        <div className={styles.emptyState}>
          <SearchIcon size={48} />
          <h3>No Metrics Found</h3>
          <p>Try adjusting your search terms or filters</p>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.kpiTable}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Label</th>
                  <th>Setting</th>
                  <th>Source</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {referenceKpis.map((kpi) => {
                  const tagged = isTagged(kpi.code);
                  return (
                    <tr key={kpi.code}>
                      <td className={styles.codeCell}>
                        <code>{kpi.code}</code>
                      </td>
                      <td className={styles.nameCell}>
                        {kpi.name || 'N/A'}
                      </td>
                      <td>{kpi.label || 'N/A'}</td>
                      <td>
                        <span className={styles.settingBadge}>
                          {kpi.setting || 'N/A'}
                        </span>
                      </td>
                      <td>{kpi.source || 'N/A'}</td>
                      <td className={styles.descriptionCell}>
                        {kpi.description || 'N/A'}
                      </td>
                      <td>
                        <button
                          className={`sectionHeaderButton ${tagged ? 'primary' : ''}`}
                          onClick={() => handleToggleTag(kpi.code)}
                          title={tagged ? 'Remove from My Metrics' : 'Add to My Metrics'}
                        >
                          {tagged ? (
                            <>
                              <Tag size={14} />
                              Tagged
                            </>
                          ) : (
                            <>
                              <Plus size={14} />
                              Add
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

