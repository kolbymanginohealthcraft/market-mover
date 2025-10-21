import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Plus, Search as SearchIcon, Tag, ChevronDown } from 'lucide-react';
import ControlsRow from '../../../components/Layouts/ControlsRow';
import Dropdown from '../../../components/Buttons/Dropdown';
import ProcedureTooltip from '../../../components/UI/ProcedureTooltip';
import styles from './Procedures.module.css';

export default function ProceduresBrowseView() {
  const [procedureTags, setProcedureTags] = useState([]);
  const [referenceCodes, setReferenceCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
  const [isSurgery, setIsSurgery] = useState('all');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [lineDropdownOpen, setLineDropdownOpen] = useState(false);
  const [subserviceDropdownOpen, setSubserviceDropdownOpen] = useState(false);
  const [surgeryDropdownOpen, setSurgeryDropdownOpen] = useState(false);

  async function fetchProcedureTags() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) {
        setProcedureTags([]);
        return;
      }

      const { data } = await supabase
        .from('team_procedure_tags')
        .select('*')
        .eq('team_id', profile.team_id);

      setProcedureTags(data || []);
    } catch (err) {
      console.error('Error fetching procedure tags:', err);
    }
  }

  async function fetchHierarchyData() {
    try {
      const response = await fetch('/api/procedures-hierarchy');
      const result = await response.json();
      
      if (result.success) {
        setHierarchyData(result.data);
      }
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
    }
  }

  // Build filter options from hierarchy data
  const categoryOptions = useMemo(() => {
    const categories = new Map();
    hierarchyData.forEach(item => {
      if (item.service_category_code && item.service_category_description) {
        categories.set(item.service_category_code, item.service_category_description);
      }
    });
    return Array.from(categories.entries())
      .map(([code, desc]) => ({ code, description: desc }))
      .sort((a, b) => a.description.localeCompare(b.description));
  }, [hierarchyData]);

  const lineOptions = useMemo(() => {
    if (selectedCategory === 'all') return [];
    
    const lines = new Map();
    hierarchyData
      .filter(item => item.service_category_code === selectedCategory)
      .forEach(item => {
        if (item.service_line_code && item.service_line_description) {
          lines.set(item.service_line_code, item.service_line_description);
        }
      });
    return Array.from(lines.entries())
      .map(([code, desc]) => ({ code, description: desc }))
      .sort((a, b) => a.description.localeCompare(b.description));
  }, [hierarchyData, selectedCategory]);

  const subserviceOptions = useMemo(() => {
    if (selectedLine === 'all') return [];
    
    const subservices = new Map();
    hierarchyData
      .filter(item => 
        item.service_category_code === selectedCategory &&
        item.service_line_code === selectedLine
      )
      .forEach(item => {
        if (item.subservice_line_code && item.subservice_line_description) {
          subservices.set(item.subservice_line_code, item.subservice_line_description);
        }
      });
    return Array.from(subservices.entries())
      .map(([code, desc]) => ({ code, description: desc }))
      .sort((a, b) => a.description.localeCompare(b.description));
  }, [hierarchyData, selectedCategory, selectedLine]);

  const fetchReferenceCodes = useCallback(async () => {
    try {
      setSearchLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        search: searchTerm,
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        category: selectedCategory !== 'all' ? selectedCategory : '',
        line: selectedLine !== 'all' ? selectedLine : '',
        subservice: selectedSubservice !== 'all' ? selectedSubservice : '',
        is_surgery: isSurgery !== 'all' ? isSurgery : ''
      });
      
      const response = await fetch(`/api/procedures-reference?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch procedure codes');
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
  }, [searchTerm, currentPage, itemsPerPage, selectedCategory, selectedLine, selectedSubservice, isSurgery]);

  async function enrichWithVolumeData(codes) {
    try {
      const codeList = codes.map(c => c.code);
      
      const volumeResponse = await fetch('/api/procedures-volume-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: codeList })
      });

      const volumeResult = await volumeResponse.json();

      if (volumeResult.success) {
        const volumeMap = {};
        volumeResult.data.forEach(vol => {
          volumeMap[vol.code] = {
            total_volume: vol.total_volume,
            avg_charge: vol.avg_charge
          };
        });

        // Merge reference codes with volume data
        const enriched = codes.map(proc => ({
          ...proc,
          annual_volume: volumeMap[proc.code]?.total_volume || 0,
          avg_charge: volumeMap[proc.code]?.avg_charge || 0
        }));

        setReferenceCodes(enriched);
      } else {
        // If volume fetch fails, just use codes without volume
        setReferenceCodes(codes.map(proc => ({ ...proc, annual_volume: 0, avg_charge: 0 })));
      }
    } catch (err) {
      console.error('Error fetching volume data:', err);
      // If fetch fails, just use codes without volume
      setReferenceCodes(codes.map(proc => ({ ...proc, annual_volume: 0, avg_charge: 0 })));
    }
  }

  useEffect(() => {
    fetchProcedureTags();
    fetchHierarchyData();
  }, []);
  
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 when search term changes
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  // Reset dependent filters when parent filter changes
  useEffect(() => {
    setSelectedLine('all');
    setSelectedSubservice('all');
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    setSelectedSubservice('all');
    setCurrentPage(1);
  }, [selectedLine]);

  useEffect(() => {
    setCurrentPage(1);
  }, [isSurgery]);

  useEffect(() => {
    fetchReferenceCodes();
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
        .from('team_procedure_tags')
        .select('id')
        .eq('team_id', profile.team_id)
        .eq('procedure_code', code)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('team_procedure_tags')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_procedure_tags')
          .insert({
            team_id: profile.team_id,
            procedure_code: code
          });

        if (error) throw error;
      }

      await fetchProcedureTags();
    } catch (err) {
      console.error('Error toggling procedure tag:', err);
      setError(err.message);
    }
  }

  function isTagged(code) {
    return procedureTags.some(tag => tag.procedure_code === code);
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
                  {selectedCategory === 'all' ? 'All Categories' : 
                    categoryOptions.find(c => c.code === selectedCategory)?.description || 'Category'}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={categoryDropdownOpen}
              onToggle={setCategoryDropdownOpen}
              className={styles.dropdownMenu}
            >
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  setSelectedCategory('all');
                  setCategoryDropdownOpen(false);
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
                  }}
                >
                  {cat.description}
                </div>
              ))}
            </Dropdown>

            <Dropdown
              trigger={
                <button 
                  className="sectionHeaderButton"
                  disabled={selectedCategory === 'all'}
                >
                  {selectedLine === 'all' ? 'All Lines' : 
                    lineOptions.find(l => l.code === selectedLine)?.description || 'Service Line'}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={lineDropdownOpen}
              onToggle={setLineDropdownOpen}
              className={styles.dropdownMenu}
            >
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  setSelectedLine('all');
                  setLineDropdownOpen(false);
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
                  }}
                >
                  {line.description}
                </div>
              ))}
            </Dropdown>

            <Dropdown
              trigger={
                <button 
                  className="sectionHeaderButton"
                  disabled={selectedLine === 'all'}
                >
                  {selectedSubservice === 'all' ? 'All Subservices' : 
                    subserviceOptions.find(s => s.code === selectedSubservice)?.description || 'Subservice'}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={subserviceDropdownOpen}
              onToggle={setSubserviceDropdownOpen}
              className={styles.dropdownMenu}
            >
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  setSelectedSubservice('all');
                  setSubserviceDropdownOpen(false);
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
                  }}
                >
                  {sub.description}
                </div>
              ))}
            </Dropdown>

            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  {isSurgery === 'all' ? 'All Types' : isSurgery === 'true' ? 'Surgery Only' : 'Non-Surgery Only'}
                  <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                </button>
              }
              isOpen={surgeryDropdownOpen}
              onToggle={setSurgeryDropdownOpen}
              className={styles.dropdownMenu}
            >
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  setIsSurgery('all');
                  setSurgeryDropdownOpen(false);
                }}
              >
                All Types
              </div>
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  setIsSurgery('true');
                  setSurgeryDropdownOpen(false);
                }}
              >
                Surgery Only
              </div>
              <div 
                className={styles.dropdownItem}
                onClick={() => {
                  setIsSurgery('false');
                  setSurgeryDropdownOpen(false);
                }}
              >
                Non-Surgery Only
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
          <p>Loading procedure codes...</p>
        </div>
      ) : referenceCodes.length === 0 ? (
        <div className={styles.emptyState}>
          <SearchIcon size={48} />
          <h3>No Procedures Found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.procedureTable}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Code System</th>
                  <th>Summary</th>
                  <th>Service Category</th>
                  <th>Service Line</th>
                  <th>Subservice Line</th>
                  <th>Annual Volume</th>
                  <th>Avg Charge</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {referenceCodes.map((proc) => {
                  const tagged = isTagged(proc.code);
                  return (
                    <tr key={proc.code}>
                      <td className={styles.codeCell}>
                        <code>{proc.code}</code>
                      </td>
                      <td>{proc.code_system || 'N/A'}</td>
                      <td className={styles.summaryCell}>
                        <ProcedureTooltip
                          code={proc.code}
                          summary={proc.code_summary}
                          description={proc.code_description}
                          category={proc.service_category_description}
                          serviceLine={proc.service_line_description}
                          subserviceLine={proc.subservice_line_description}
                          isSurgery={proc.is_surgery}
                        >
                          {proc.code_summary || 'N/A'}
                        </ProcedureTooltip>
                      </td>
                      <td>{proc.service_category_description || 'N/A'}</td>
                      <td>{proc.service_line_description || 'N/A'}</td>
                      <td>{proc.subservice_line_description || 'N/A'}</td>
                      <td className={styles.volumeCell}>
                        {proc.annual_volume ? proc.annual_volume.toLocaleString() : '0'}
                      </td>
                      <td className={styles.chargeCell}>
                        ${Number(proc.avg_charge || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td>
                        <button
                          className={`sectionHeaderButton ${tagged ? 'primary' : ''}`}
                          onClick={() => handleToggleTag(proc.code)}
                          title={tagged ? 'Remove from my procedures' : 'Add to my procedures'}
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

