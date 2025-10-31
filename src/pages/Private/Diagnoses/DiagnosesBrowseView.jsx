import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Plus, Search as SearchIcon, Tag, ChevronDown, Search } from 'lucide-react';
import ControlsRow from '../../../components/Layouts/ControlsRow';
import Dropdown from '../../../components/Buttons/Dropdown';
import DiagnosisTooltip from '../../../components/UI/DiagnosisTooltip';
import styles from './Diagnoses.module.css';

export default function DiagnosesBrowseView() {
  const [diagnosisTags, setDiagnosisTags] = useState([]);
  const [referenceCodes, setReferenceCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter state
  const [hierarchyData, setHierarchyData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLine, setSelectedLine] = useState('all');
  const [selectedSubservice, setSelectedSubservice] = useState('all');
  const [selectedCodeSystem, setSelectedCodeSystem] = useState('all');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [lineDropdownOpen, setLineDropdownOpen] = useState(false);
  const [subserviceDropdownOpen, setSubserviceDropdownOpen] = useState(false);
  const [codeSystemDropdownOpen, setCodeSystemDropdownOpen] = useState(false);
  
  // Search states for each dropdown
  const [codeSystemSearch, setCodeSystemSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [lineSearch, setLineSearch] = useState('');
  const [subserviceSearch, setSubserviceSearch] = useState('');

  async function fetchDiagnosisTags() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) {
        setDiagnosisTags([]);
        return;
      }

      const { data } = await supabase
        .from('team_diagnosis_tags')
        .select('*')
        .eq('team_id', profile.team_id);

      setDiagnosisTags(data || []);
    } catch (err) {
      console.error('Error fetching diagnosis tags:', err);
    }
  }

  async function fetchHierarchyData() {
    try {
      const response = await fetch('/api/diagnoses-hierarchy');
      const result = await response.json();
      
      if (result.success) {
        setHierarchyData(result.data);
      }
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
    }
  }

  // Get unique code systems from hierarchy data
  const codeSystemOptions = useMemo(() => {
    const systems = new Map();
    hierarchyData.forEach(item => {
      if (item.code_system) {
        systems.set(item.code_system, item.code_system);
      }
    });
    const allSystems = Array.from(systems.keys()).sort();
    
    // Filter by search
    if (codeSystemSearch.trim()) {
      return allSystems.filter(system =>
        system.toLowerCase().includes(codeSystemSearch.toLowerCase())
      );
    }
    return allSystems;
  }, [hierarchyData, codeSystemSearch]);

  // Build filter options from hierarchy data
  const categoryOptions = useMemo(() => {
    const categories = new Map();
    hierarchyData.forEach(item => {
      if (item.service_category_code && item.service_category_description) {
        categories.set(item.service_category_code, item.service_category_description);
      }
    });
    const allCategories = Array.from(categories.entries())
      .map(([code, desc]) => ({ code, description: desc }))
      .sort((a, b) => a.description.localeCompare(b.description));
    
    // Filter by search
    if (categorySearch.trim()) {
      return allCategories.filter(cat =>
        cat.description.toLowerCase().includes(categorySearch.toLowerCase())
      );
    }
    return allCategories;
  }, [hierarchyData, categorySearch]);

  const lineOptions = useMemo(() => {
    const lines = new Map();
    hierarchyData
      .filter(item => {
        // If category is selected, filter by it
        if (selectedCategory !== 'all') {
          return item.service_category_code === selectedCategory;
        }
        // If subservice is selected, filter by relationships
        if (selectedSubservice !== 'all') {
          return item.subservice_line_code === selectedSubservice;
        }
        return true;
      })
      .forEach(item => {
        if (item.service_line_code && item.service_line_description) {
          lines.set(item.service_line_code, item.service_line_description);
        }
      });
    const allLines = Array.from(lines.entries())
      .map(([code, desc]) => ({ code, description: desc }))
      .sort((a, b) => a.description.localeCompare(b.description));
    
    // Filter by search
    if (lineSearch.trim()) {
      return allLines.filter(line =>
        line.description.toLowerCase().includes(lineSearch.toLowerCase())
      );
    }
    return allLines;
  }, [hierarchyData, selectedCategory, selectedSubservice, lineSearch]);

  const subserviceOptions = useMemo(() => {
    const subservices = new Map();
    hierarchyData
      .filter(item => {
        // If both category and line are selected, filter by both
        if (selectedCategory !== 'all' && selectedLine !== 'all') {
          return item.service_category_code === selectedCategory &&
                 item.service_line_code === selectedLine;
        }
        // If only line is selected, filter by it
        if (selectedLine !== 'all') {
          return item.service_line_code === selectedLine;
        }
        // If only category is selected, filter by it
        if (selectedCategory !== 'all') {
          return item.service_category_code === selectedCategory;
        }
        return true;
      })
      .forEach(item => {
        if (item.subservice_line_code && item.subservice_line_description) {
          subservices.set(item.subservice_line_code, item.subservice_line_description);
        }
      });
    const allSubservices = Array.from(subservices.entries())
      .map(([code, desc]) => ({ code, description: desc }))
      .sort((a, b) => a.description.localeCompare(b.description));
    
    // Filter by search
    if (subserviceSearch.trim()) {
      return allSubservices.filter(sub =>
        sub.description.toLowerCase().includes(subserviceSearch.toLowerCase())
      );
    }
    return allSubservices;
  }, [hierarchyData, selectedCategory, selectedLine, subserviceSearch]);

  const fetchReferenceCodes = useCallback(async () => {
    try {
      setSearchLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        search: debouncedSearchTerm,
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        category: selectedCategory !== 'all' ? selectedCategory : '',
        line: selectedLine !== 'all' ? selectedLine : '',
        subservice: selectedSubservice !== 'all' ? selectedSubservice : '',
        code_system: selectedCodeSystem !== 'all' ? selectedCodeSystem : ''
      });
      
      const response = await fetch(`/api/diagnoses-reference?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch diagnosis codes');
      }
      
      setTotalCount(result.pagination.total);
      
      // Fetch volume data for the visible codes
      if (result.data.length > 0) {
        await enrichWithVolumeData(result.data);
      } else {
        setReferenceCodes([]);
      }
    } catch (err) {
      console.error('Error fetching reference codes:', err);
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }, [debouncedSearchTerm, currentPage, itemsPerPage, selectedCategory, selectedLine, selectedSubservice, selectedCodeSystem]);

  async function enrichWithVolumeData(codes) {
    try {
      const codeList = codes.map(c => c.code);
      
      console.log('🔍 Fetching volume for codes:', codeList.slice(0, 10));
      
      const volumeResponse = await fetch('/api/diagnoses-volume-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: codeList })
      });

      const volumeResult = await volumeResponse.json();
      
      console.log('📊 Volume API response:', volumeResult);

      if (volumeResult.success) {
        console.log(`✅ Received volume data for ${volumeResult.data.length} codes`);
        if (volumeResult.data.length > 0) {
          console.log('📋 Sample volume data:', volumeResult.data.slice(0, 5));
        }
        
        const volumeMap = {};
        volumeResult.data.forEach(vol => {
          volumeMap[vol.code] = {
            total_volume: vol.total_volume
          };
        });

        // Merge reference codes with volume data
        const enriched = codes.map(diag => ({
          ...diag,
          annual_volume: volumeMap[diag.code]?.total_volume || 0
        }));
        
        console.log('📈 Enriched codes sample:', enriched.slice(0, 3));

        setReferenceCodes(enriched);
      } else {
        console.warn('⚠️ Volume API returned success:false');
        // If volume fetch fails, just use codes without volume
        setReferenceCodes(codes.map(diag => ({ ...diag, annual_volume: 0 })));
      }
    } catch (err) {
      console.error('❌ Error fetching volume data:', err);
      // If fetch fails, just use codes without volume
      setReferenceCodes(codes.map(diag => ({ ...diag, annual_volume: 0 })));
    }
  }

  useEffect(() => {
    fetchDiagnosisTags();
    fetchHierarchyData();
  }, []);
  
  // Debounce search term
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to page 1 when search term changes
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  // Auto-populate upstream filters when downstream filter is selected
  useEffect(() => {
    if (selectedSubservice !== 'all') {
      // Find the parent line and category for this subservice
      const matchingItem = hierarchyData.find(
        item => item.subservice_line_code === selectedSubservice
      );
      if (matchingItem) {
        if (selectedLine !== matchingItem.service_line_code) {
          setSelectedLine(matchingItem.service_line_code);
        }
        if (selectedCategory !== matchingItem.service_category_code) {
          setSelectedCategory(matchingItem.service_category_code);
        }
      }
    }
    setCurrentPage(1);
  }, [selectedSubservice, hierarchyData]);

  useEffect(() => {
    if (selectedLine !== 'all') {
      // Find the parent category for this line
      const matchingItem = hierarchyData.find(
        item => item.service_line_code === selectedLine
      );
      if (matchingItem && selectedCategory !== matchingItem.service_category_code) {
        setSelectedCategory(matchingItem.service_category_code);
      }
    }
    setCurrentPage(1);
  }, [selectedLine, hierarchyData]);

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchReferenceCodes();
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [fetchReferenceCodes]);

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
        .from('team_diagnosis_tags')
        .select('id')
        .eq('team_id', profile.team_id)
        .eq('diagnosis_code', code)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('team_diagnosis_tags')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_diagnosis_tags')
          .insert({
            team_id: profile.team_id,
            diagnosis_code: code
          });

        if (error) throw error;
      }

      await fetchDiagnosisTags();
    } catch (err) {
      console.error('Error toggling diagnosis tag:', err);
      setError(err.message);
    }
  }

  function isTagged(code) {
    return diagnosisTags.some(tag => tag.diagnosis_code === code);
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
              placeholder="Search by code, description, or service line..."
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

      {/* Hierarchy Filter Controls */}
      <ControlsRow
        leftContent={
          <>
            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  {selectedCodeSystem === 'all' ? 'All Code Systems' : selectedCodeSystem}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={codeSystemDropdownOpen}
              onToggle={setCodeSystemDropdownOpen}
              className={`${styles.dropdownMenu} dropdown`}
              searchQuery={codeSystemSearch}
              onSearchClear={setCodeSystemSearch}
            >
              <div className={styles.dropdownHeader}>
                <div className="searchBarContainer" style={{ width: '100%' }}>
                  <div className="searchIcon">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search code systems..."
                    className="searchInput"
                    value={codeSystemSearch}
                    onChange={(e) => setCodeSystemSearch(e.target.value)}
                    autoFocus={codeSystemDropdownOpen}
                  />
                </div>
              </div>
              <div className={styles.dropdownContent}>
                <div 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setSelectedCodeSystem('all');
                    setCodeSystemDropdownOpen(false);
                    setCodeSystemSearch('');
                  }}
                >
                  All Code Systems
                </div>
                {codeSystemOptions.map(system => (
                  <div 
                    key={system} 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setSelectedCodeSystem(system);
                      setCodeSystemDropdownOpen(false);
                      setCodeSystemSearch('');
                    }}
                  >
                    {system}
                  </div>
                ))}
              </div>
            </Dropdown>

            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  {selectedCategory === 'all' ? 'All Categories' : 
                    categoryOptions.find(c => c.code === selectedCategory)?.description || 'Category'}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={categoryDropdownOpen}
              onToggle={setCategoryDropdownOpen}
              className={`${styles.dropdownMenu} dropdown`}
              searchQuery={categorySearch}
              onSearchClear={setCategorySearch}
            >
              <div className={styles.dropdownHeader}>
                <div className="searchBarContainer" style={{ width: '100%' }}>
                  <div className="searchIcon">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search categories..."
                    className="searchInput"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    autoFocus={categoryDropdownOpen}
                  />
                </div>
              </div>
              <div className={styles.dropdownContent}>
                <div 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setSelectedCategory('all');
                    setCategoryDropdownOpen(false);
                    setCategorySearch('');
                  }}
                >
                  All Categories
                </div>
                {categoryOptions.map(cat => (
                  <div 
                    key={cat.code} 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setSelectedCategory(cat.code);
                      setCategoryDropdownOpen(false);
                      setCategorySearch('');
                    }}
                  >
                    {cat.description}
                  </div>
                ))}
              </div>
            </Dropdown>

            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  {selectedLine === 'all' ? 'All Lines' : 
                    lineOptions.find(l => l.code === selectedLine)?.description || 'Service Line'}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={lineDropdownOpen}
              onToggle={setLineDropdownOpen}
              className={`${styles.dropdownMenu} dropdown`}
              searchQuery={lineSearch}
              onSearchClear={setLineSearch}
            >
              <div className={styles.dropdownHeader}>
                <div className="searchBarContainer" style={{ width: '100%' }}>
                  <div className="searchIcon">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search lines..."
                    className="searchInput"
                    value={lineSearch}
                    onChange={(e) => setLineSearch(e.target.value)}
                    autoFocus={lineDropdownOpen}
                  />
                </div>
              </div>
              <div className={styles.dropdownContent}>
                <div 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setSelectedLine('all');
                    setLineDropdownOpen(false);
                    setLineSearch('');
                  }}
                >
                  All Lines
                </div>
                {lineOptions.map(line => (
                  <div 
                    key={line.code} 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setSelectedLine(line.code);
                      setLineDropdownOpen(false);
                      setLineSearch('');
                    }}
                  >
                    {line.description}
                  </div>
                ))}
              </div>
            </Dropdown>

            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  {selectedSubservice === 'all' ? 'All Subservices' : 
                    subserviceOptions.find(s => s.code === selectedSubservice)?.description || 'Subservice'}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={subserviceDropdownOpen}
              onToggle={setSubserviceDropdownOpen}
              className={`${styles.dropdownMenu} dropdown`}
              searchQuery={subserviceSearch}
              onSearchClear={setSubserviceSearch}
            >
              <div className={styles.dropdownHeader}>
                <div className="searchBarContainer" style={{ width: '100%' }}>
                  <div className="searchIcon">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search subservices..."
                    className="searchInput"
                    value={subserviceSearch}
                    onChange={(e) => setSubserviceSearch(e.target.value)}
                    autoFocus={subserviceDropdownOpen}
                  />
                </div>
              </div>
              <div className={styles.dropdownContent}>
                <div 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setSelectedSubservice('all');
                    setSubserviceDropdownOpen(false);
                    setSubserviceSearch('');
                  }}
                >
                  All Subservices
                </div>
                {subserviceOptions.map(sub => (
                  <div 
                    key={sub.code} 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setSelectedSubservice(sub.code);
                      setSubserviceDropdownOpen(false);
                      setSubserviceSearch('');
                    }}
                  >
                    {sub.description}
                  </div>
                ))}
              </div>
            </Dropdown>
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
          <p>Loading diagnosis codes...</p>
        </div>
      ) : referenceCodes.length === 0 ? (
        <div className={styles.emptyState}>
          <SearchIcon size={48} />
          <h3>No Diagnoses Found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.diagnosisTable}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Code System</th>
                  <th>Summary</th>
                  <th>Service Category</th>
                  <th>Service Line</th>
                  <th>Subservice Line</th>
                  <th>Annual Volume</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {referenceCodes.map((diag) => {
                  const tagged = isTagged(diag.code);
                  return (
                    <tr key={diag.code}>
                      <td className={styles.codeCell}>
                        <code>{diag.code}</code>
                      </td>
                      <td>{diag.code_system || 'N/A'}</td>
                      <td className={styles.summaryCell}>
                        <DiagnosisTooltip
                          code={diag.code}
                          summary={diag.code_summary}
                          description={diag.code_description}
                          category={diag.service_category_description}
                          serviceLine={diag.service_line_description}
                          subserviceLine={diag.subservice_line_description}
                        >
                          {diag.code_summary || 'N/A'}
                        </DiagnosisTooltip>
                      </td>
                      <td>{diag.service_category_description || 'N/A'}</td>
                      <td>{diag.service_line_description || 'N/A'}</td>
                      <td>{diag.subservice_line_description || 'N/A'}</td>
                      <td className={styles.volumeCell}>
                        {diag.annual_volume ? diag.annual_volume.toLocaleString() : '0'}
                      </td>
                      <td>
                        <button
                          className={`sectionHeaderButton ${tagged ? 'primary' : ''}`}
                          onClick={() => handleToggleTag(diag.code)}
                          title={tagged ? 'Remove from my diagnoses' : 'Add to my diagnoses'}
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

