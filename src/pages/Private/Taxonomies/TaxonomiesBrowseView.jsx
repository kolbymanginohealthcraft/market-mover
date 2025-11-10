import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Search as SearchIcon, ChevronDown } from 'lucide-react';
import ControlsRow from '../../../components/Layouts/ControlsRow';
import Dropdown from '../../../components/Buttons/Dropdown';
import TaxonomyTooltip from '../../../components/UI/TaxonomyTooltip';
import styles from './Taxonomies.module.css';
import { ensureSingleTeamTaxonomyTag } from '../../../utils/taxonomyTagUtils';

const TAG_TYPES = [
  { value: 'staff', label: 'Staff' },
  { value: 'my_setting', label: 'My Setting' },
  { value: 'upstream', label: 'Upstream' },
  { value: 'downstream', label: 'Downstream' }
];

export default function TaxonomiesBrowseView() {
  const [taxonomyTags, setTaxonomyTags] = useState([]);
  const [referenceCodes, setReferenceCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  const [hierarchyData, setHierarchyData] = useState([]);
  const [selectedGrouping, setSelectedGrouping] = useState('all');
  const [selectedClassification, setSelectedClassification] = useState('all');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [groupingDropdownOpen, setGroupingDropdownOpen] = useState(false);
  const [classificationDropdownOpen, setClassificationDropdownOpen] = useState(false);
  const [specializationDropdownOpen, setSpecializationDropdownOpen] = useState(false);
  
  // Tag type dropdown state
  const [taggingCode, setTaggingCode] = useState(null);
  
  // Search states for each dropdown
  const [groupingSearch, setGroupingSearch] = useState('');
  const [classificationSearch, setClassificationSearch] = useState('');
  const [specializationSearch, setSpecializationSearch] = useState('');

  async function fetchTaxonomyTags() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) {
        setTaxonomyTags([]);
        return;
      }

      const { data } = await supabase
        .from('team_taxonomy_tags')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      const uniqueTags = await ensureSingleTeamTaxonomyTag(
        supabase,
        profile.team_id,
        data || []
      );

      setTaxonomyTags(uniqueTags);
    } catch (err) {
      console.error('Error fetching taxonomy tags:', err);
    }
  }

  async function fetchHierarchyData() {
    try {
      const response = await fetch('/api/taxonomies-hierarchy');
      const result = await response.json();
      
      if (result.success) {
        setHierarchyData(result.data);
      }
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
    }
  }

  // Build filter options from hierarchy data
  const groupingOptions = useMemo(() => {
    const groupings = new Set();
    hierarchyData.forEach(item => {
      if (item.grouping) {
        groupings.add(item.grouping);
      }
    });
    const allGroupings = Array.from(groupings).sort();
    
    // Filter by search
    if (groupingSearch.trim()) {
      return allGroupings.filter(grouping =>
        grouping.toLowerCase().includes(groupingSearch.toLowerCase())
      );
    }
    return allGroupings;
  }, [hierarchyData, groupingSearch]);

  const classificationOptions = useMemo(() => {
    if (selectedGrouping === 'all') return [];
    
    const classifications = new Set();
    hierarchyData
      .filter(item => item.grouping === selectedGrouping)
      .forEach(item => {
        if (item.classification) {
          classifications.add(item.classification);
        }
      });
    const allClassifications = Array.from(classifications).sort();
    
    // Filter by search
    if (classificationSearch.trim()) {
      return allClassifications.filter(classification =>
        classification.toLowerCase().includes(classificationSearch.toLowerCase())
      );
    }
    return allClassifications;
  }, [hierarchyData, selectedGrouping, classificationSearch]);

  const specializationOptions = useMemo(() => {
    if (selectedClassification === 'all') return [];
    
    const specializations = new Set();
    hierarchyData
      .filter(item => 
        item.grouping === selectedGrouping &&
        item.classification === selectedClassification
      )
      .forEach(item => {
        if (item.specialization) {
          specializations.add(item.specialization);
        }
      });
    const allSpecializations = Array.from(specializations).sort();
    
    // Filter by search
    if (specializationSearch.trim()) {
      return allSpecializations.filter(specialization =>
        specialization.toLowerCase().includes(specializationSearch.toLowerCase())
      );
    }
    return allSpecializations;
  }, [hierarchyData, selectedGrouping, selectedClassification, specializationSearch]);

  const fetchReferenceCodes = useCallback(async () => {
    try {
      setSearchLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        search: debouncedSearchTerm,
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        grouping: selectedGrouping !== 'all' ? selectedGrouping : '',
        classification: selectedClassification !== 'all' ? selectedClassification : '',
        specialization: selectedSpecialization !== 'all' ? selectedSpecialization : ''
      });
      
      const response = await fetch(`/api/taxonomies-reference?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch taxonomy codes');
      }
      
      setTotalCount(result.pagination.total);
      setReferenceCodes(result.data);
    } catch (err) {
      console.error('Error fetching reference codes:', err);
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }, [debouncedSearchTerm, currentPage, itemsPerPage, selectedGrouping, selectedClassification, selectedSpecialization]);

  useEffect(() => {
    fetchTaxonomyTags();
    fetchHierarchyData();
  }, []);
  
  useEffect(() => {
    fetchReferenceCodes();
  }, [debouncedSearchTerm, currentPage, itemsPerPage, selectedGrouping, selectedClassification, selectedSpecialization]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedClassification('all');
    setSelectedSpecialization('all');
  }, [selectedGrouping]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedSpecialization('all');
  }, [selectedClassification]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSpecialization]);

  async function handleAddTag(code, tagType) {
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

      const { data: existingTags, error: fetchError } = await supabase
        .from('team_taxonomy_tags')
        .select('id, tag_type, created_at, updated_at')
        .eq('team_id', profile.team_id)
        .eq('taxonomy_code', code)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (existingTags && existingTags.length > 0) {
        const [primaryTag, ...duplicates] = existingTags;

        if (primaryTag.tag_type === tagType) {
          setTaggingCode(null);
          return;
        }

        if (duplicates.length > 0) {
          const duplicateIds = duplicates.map(tag => tag.id);
          const { error: cleanupError } = await supabase
            .from('team_taxonomy_tags')
            .delete()
            .in('id', duplicateIds);

          if (cleanupError) throw cleanupError;
        }

        const { error: updateError } = await supabase
          .from('team_taxonomy_tags')
          .update({
            tag_type: tagType,
            updated_at: new Date().toISOString()
          })
          .eq('id', primaryTag.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('team_taxonomy_tags')
          .insert({
            team_id: profile.team_id,
            taxonomy_code: code,
            tag_type: tagType
          });

        if (insertError) throw insertError;
      }

      setTaggingCode(null);
      await fetchTaxonomyTags();
    } catch (err) {
      console.error('Error adding taxonomy tag:', err);
      setError(err.message);
    }
  }

  async function handleRemoveTag(code) {
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

      const { error } = await supabase
        .from('team_taxonomy_tags')
        .delete()
        .eq('team_id', profile.team_id)
        .eq('taxonomy_code', code);

      if (error) throw error;

      setTaggingCode(null);
      await fetchTaxonomyTags();
    } catch (err) {
      console.error('Error removing taxonomy tag:', err);
      setError(err.message);
    }
  }

  function getTagForCode(code) {
    return taxonomyTags.find(tag => tag.taxonomy_code === code) || null;
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <>
      <ControlsRow
        leftContent={
          <div className="searchBarContainer">
            <div className="searchIcon">
              <SearchIcon size={16} />
            </div>
            <input
              type="text"
              placeholder="Search by code, classification, or specialization..."
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
                Showing {referenceCodes.length} of {totalCount.toLocaleString()}
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

      <ControlsRow
        leftContent={
          <>
            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  {selectedGrouping === 'all' ? 'All Groupings' : selectedGrouping}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={groupingDropdownOpen}
              onToggle={setGroupingDropdownOpen}
              className={styles.dropdownMenu}
            >
              <div className={styles.dropdownSearch}>
                <input
                  type="text"
                  placeholder="Search groupings..."
                  value={groupingSearch}
                  onChange={(e) => setGroupingSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  setSelectedGrouping('all');
                  setGroupingDropdownOpen(false);
                }}
              >
                All Groupings
              </div>
              {groupingOptions.map(grouping => (
                <div 
                  key={grouping} 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setSelectedGrouping(grouping);
                    setGroupingDropdownOpen(false);
                  }}
                >
                  {grouping}
                </div>
              ))}
            </Dropdown>

            {selectedGrouping !== 'all' && (
              <Dropdown
                trigger={
                  <button className="sectionHeaderButton">
                    {selectedClassification === 'all' ? 'All Classifications' : selectedClassification}
                    <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                  </button>
                }
                isOpen={classificationDropdownOpen}
                onToggle={setClassificationDropdownOpen}
                className={styles.dropdownMenu}
              >
                <div className={styles.dropdownSearch}>
                  <input
                    type="text"
                    placeholder="Search classifications..."
                    value={classificationSearch}
                    onChange={(e) => setClassificationSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setSelectedClassification('all');
                    setClassificationDropdownOpen(false);
                  }}
                >
                  All Classifications
                </div>
                {classificationOptions.map(classification => (
                  <div 
                    key={classification} 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setSelectedClassification(classification);
                      setClassificationDropdownOpen(false);
                    }}
                  >
                    {classification}
                  </div>
                ))}
              </Dropdown>
            )}

            {selectedClassification !== 'all' && (
              <Dropdown
                trigger={
                  <button className="sectionHeaderButton">
                    {selectedSpecialization === 'all' ? 'All Specializations' : selectedSpecialization}
                    <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                  </button>
                }
                isOpen={specializationDropdownOpen}
                onToggle={setSpecializationDropdownOpen}
                className={styles.dropdownMenu}
              >
                <div className={styles.dropdownSearch}>
                  <input
                    type="text"
                    placeholder="Search specializations..."
                    value={specializationSearch}
                    onChange={(e) => setSpecializationSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setSelectedSpecialization('all');
                    setSpecializationDropdownOpen(false);
                  }}
                >
                  All Specializations
                </div>
                {specializationOptions.map(specialization => (
                  <div 
                    key={specialization} 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setSelectedSpecialization(specialization);
                      setSpecializationDropdownOpen(false);
                    }}
                  >
                    {specialization || 'N/A'}
                  </div>
                ))}
              </Dropdown>
            )}
          </>
        }
      />

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {searchLoading && referenceCodes.length === 0 ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading taxonomy codes...</p>
        </div>
      ) : referenceCodes.length === 0 ? (
        <div className={styles.emptyState}>
          <SearchIcon size={48} />
          <h3>No Taxonomies Found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.taxonomyTable}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Grouping</th>
                  <th>Classification</th>
                  <th>Specialization</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {referenceCodes.map((tax) => {
                  const currentTag = getTagForCode(tax.code);
                  return (
                    <tr key={tax.code}>
                      <td className={styles.codeCell}>
                        <code>{tax.code}</code>
                      </td>
                      <td>{tax.grouping || 'N/A'}</td>
                      <td className={styles.summaryCell}>
                        <TaxonomyTooltip
                          code={tax.code}
                          grouping={tax.grouping}
                          classification={tax.classification}
                          specialization={tax.specialization}
                          definition={tax.definition}
                          notes={tax.notes}
                        >
                          {tax.classification || 'N/A'}
                        </TaxonomyTooltip>
                      </td>
                      <td>{tax.specialization || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <Dropdown
                            trigger={
                              <button
                                className={`sectionHeaderButton ${currentTag ? 'primary' : ''}`}
                              >
                                {currentTag
                                  ? (TAG_TYPES.find(t => t.value === currentTag.tag_type)?.label || currentTag.tag_type)
                                  : 'Select Tag'}
                                <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                              </button>
                            }
                            isOpen={taggingCode === tax.code}
                            onToggle={(open) => setTaggingCode(open ? tax.code : null)}
                            className={styles.dropdownMenu}
                          >
                            {currentTag ? (
                              <div
                                className={styles.dropdownItem}
                                onClick={() => handleRemoveTag(tax.code)}
                                style={{ color: '#dc2626' }}
                              >
                                Remove Tag
                              </div>
                            ) : (
                              TAG_TYPES.map(tagType => (
                                <div
                                  key={tagType.value}
                                  className={styles.dropdownItem}
                                  onClick={() => handleAddTag(tax.code, tagType.value)}
                                >
                                  {tagType.label}
                                </div>
                              ))
                            )}
                          </Dropdown>
                        </div>
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

