import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useProviderDensity, useProviderDensityDetails } from '../../hooks/useProviderDensity';
import useProviderInfo from '../../hooks/useProviderInfo';
import styles from './ProviderDensityPage.module.css';
import Banner from '../../components/Banner';
import ButtonGroup from '../../components/Buttons/ButtonGroup';
import Button from '../../components/Buttons/Button';

export default function ProviderDensityPage({ radius }) {
  const { dhc } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [showBanner, setShowBanner] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [sortBy, setSortBy] = useState('count'); // 'count', 'name'
  const [providerSearch, setProviderSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [providersPerPage] = useState(10);
  const dropdownRef = useRef(null);

  // Get provider info to use its location
  const { provider: providerInfo, loading: providerLoading } = useProviderInfo(dhc);
  
  // Use provider's location
  const lat = providerInfo?.latitude;
  const lon = providerInfo?.longitude;

  const { data: densityData, loading: densityLoading, error: densityError } = useProviderDensity(lat, lon, radius);
  const { data: detailsData, loading: detailsLoading, error: detailsError } = useProviderDensityDetails(lat, lon, radius, selectedSpecialty);

  // Get all providers data (not filtered by specialty)
  const { data: allProvidersData, loading: allProvidersLoading, error: allProvidersError } = useProviderDensityDetails(lat, lon, radius, null);

  // Debug logging
  useEffect(() => {
    if (densityData) {
      console.log('Provider density data received:', {
        totalItems: densityData.length,
        totalProviders: densityData.reduce((sum, item) => sum + item.provider_count, 0),
        sampleSpecialties: densityData.slice(0, 3).map(item => ({ specialty: item.specialty, count: item.provider_count })),
        hasNullSpecialties: densityData.some(item => !item.specialty)
      });
    }
  }, [densityData]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setDropdownSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter data based on selected specialties - handle null specialty values
  const filteredData = densityData?.filter(item => {
    // Skip items with null, undefined, or empty specialty
    if (!item.specialty || item.specialty.trim() === '') {
      console.warn('Found item with null/undefined/empty specialty:', item);
      return false;
    }
    // If no specialties selected, show all
    if (selectedSpecialties.length === 0) {
      return true;
    }
    // Show only selected specialties
    return selectedSpecialties.includes(item.specialty);
  }) || [];

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!filteredData) return [];
    
    return [...filteredData].sort((a, b) => {
      switch (sortBy) {
        case 'count':
          return b.provider_count - a.provider_count;
        case 'name':
          return a.specialty.localeCompare(b.specialty);
        default:
          return b.provider_count - a.provider_count;
      }
    });
  }, [filteredData, sortBy]);

  const handleSpecialtyClick = (specialty) => {
    setSelectedSpecialty(selectedSpecialty === specialty ? null : specialty);
  };

  const handleSpecialtyFilterChange = (specialty) => {
    setSelectedSpecialties(prev => {
      if (prev.includes(specialty)) {
        return prev.filter(s => s !== specialty);
      } else {
        return [...prev, specialty];
      }
    });
  };

  const handleClearAll = () => {
    setSelectedSpecialties([]);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleProviderSearch = (e) => {
    setProviderSearch(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setDropdownSearch('');
    }
  };

  // Get sorted and filtered specialties for dropdown
  const dropdownSpecialties = densityData
    ?.filter(item => item.specialty && item.specialty.trim() !== '')
    .filter(item => dropdownSearch === '' || item.specialty.toLowerCase().includes(dropdownSearch.toLowerCase()))
    .map(item => item.specialty)
    .sort((a, b) => a.localeCompare(b)) || [];

  const totalProviders = filteredData?.reduce((sum, item) => sum + (item.provider_count || 0), 0) || 0;

  // Filter and paginate providers
  const filteredProviders = useMemo(() => {
    const providers = selectedSpecialty ? detailsData : allProvidersData;
    if (!providers) return [];
    
    return providers.filter(provider => {
      const searchTerm = providerSearch.toLowerCase();
      const name = (provider.provider_name || '').toLowerCase();
      const npi = provider.npi.toString();
      
      return name.includes(searchTerm) || npi.includes(searchTerm);
    });
  }, [selectedSpecialty, detailsData, allProvidersData, providerSearch]);

  const totalPages = Math.ceil(filteredProviders.length / providersPerPage);
  const startIndex = (currentPage - 1) * providersPerPage;
  const endIndex = startIndex + providersPerPage;
  const currentProviders = filteredProviders.slice(startIndex, endIndex);



  if (providerLoading || densityLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading provider density data...</p>
        </div>
      </div>
    );
  }

  if (densityError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error Loading Data</h3>
          <p>{densityError}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} onKeyDown={handleEscapeKey}>


      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Filter Specialties:</label>
          <div className={styles.multiSelectContainer} ref={dropdownRef}>
            <div className={styles.selectedSpecialties}>
              {selectedSpecialties.length === 0 ? (
                <span className={styles.placeholder}>All specialties</span>
              ) : (
                <>
                  {selectedSpecialties.map(specialty => (
                    <span key={specialty} className={styles.selectedTag}>
                      {specialty}
                      <button 
                        className={styles.removeTag}
                        onClick={() => handleSpecialtyFilterChange(specialty)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button 
                    className={styles.clearAllButton}
                    onClick={handleClearAll}
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
            <div className={styles.dropdownContainer}>
              <button 
                className={styles.dropdownButton}
                onClick={() => setShowDropdown(prev => !prev)}
              >
                ▼
              </button>
              {showDropdown && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownSearch}>
                    <input
                      type="text"
                      placeholder="Search specialties..."
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      className={styles.dropdownSearchInput}
                      autoFocus
                    />
                  </div>
                  {dropdownSpecialties.map(specialty => (
                    <label key={specialty} className={styles.dropdownItem}>
                      <input
                        type="checkbox"
                        checked={selectedSpecialties.includes(specialty)}
                        onChange={() => handleSpecialtyFilterChange(specialty)}
                      />
                      <span>{specialty}</span>
                    </label>
                  ))}
                  {dropdownSpecialties.length === 0 && (
                    <div className={styles.noResults}>
                      No specialties found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.resultCount}>
          Showing {totalProviders.toLocaleString()} provider{totalProviders !== 1 ? 's' : ''} across {filteredData.length.toLocaleString()} specialt{filteredData.length !== 1 ? 'ies' : 'y'}
        </div>
      </div>

      <div className={styles.twoColumnLayout}>
                    <div className={styles.leftColumn}>
              <div className={styles.specialtySection}>
                <div className={styles.sectionHeader}>
                  <h3>Provider Count by Specialty</h3>
                  <ButtonGroup
                    options={[
                      { label: 'Sort by Count', value: 'count' },
                      { label: 'Sort by Specialty', value: 'name' }
                    ]}
                    selected={sortBy}
                    onSelect={setSortBy}
                    size="sm"
                    variant="blue"
                  />
                </div>
                {sortedData && sortedData.length > 0 ? (
              <div className={styles.specialtyTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.rankColumn}>#</div>
                  <div className={styles.specialtyColumn}>Specialty</div>
                  <div className={styles.countColumn}>Providers</div>
                </div>
                                  <div className={styles.tableBody}>
                    {sortedData.map((item, index) => (
                    <div key={item.specialty} className={`${styles.tableRow} ${selectedSpecialty === item.specialty ? styles.selected : ''}`} onClick={() => handleSpecialtyClick(item.specialty)}>
                      <div className={styles.rankColumn}>{index + 1}</div>
                      <div className={styles.specialtyColumn}>{item.specialty}</div>
                      <div className={styles.countColumn}>{item.provider_count.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.noData}>
                <h3>No Data Available</h3>
                <p>No provider data found for the selected location and radius.</p>
              </div>
            )}
          </div>
        </div>

                    <div className={styles.rightColumn}>
              <div className={styles.providerDetailsSection}>
                <div className={styles.sectionHeader}>
                  <h3>Provider Details</h3>
                  <div className={styles.providerSearchContainer}>
                    <input
                      type="text"
                      placeholder="Search providers..."
                      value={providerSearch}
                      onChange={handleProviderSearch}
                      className={styles.providerSearchInput}
                    />
                  </div>
                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      <Button
                        outline
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        Previous
                      </Button>
                      <span className={styles.pageInfo}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        outline
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
                
                {(detailsLoading || allProvidersLoading) ? (
                  <div className={styles.loading}>Loading provider details...</div>
                ) : (detailsError || allProvidersError) ? (
                  <div className={styles.error}>Error loading details: {detailsError || allProvidersError}</div>
                ) : (
                  <div className={styles.providerList}>
                    <div className={styles.providerTable}>
                      <div className={styles.providerTableHeader}>
                        <div className={styles.npiColumn}>NPI</div>
                        <div className={styles.providerNameColumn}>Provider Name</div>
                        <div className={styles.distanceColumn}>Distance</div>
                      </div>
                      <div className={styles.providerTableBody}>
                        {currentProviders.map((provider) => (
                          <div key={provider.npi} className={styles.providerTableRow}>
                            <div className={styles.npiColumn}>{provider.npi}</div>
                            <div className={styles.providerNameColumn}>{provider.provider_name || 'N/A'}</div>
                            <div className={styles.distanceColumn}>{provider.distance_miles} mi</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {filteredProviders.length === 0 && (
                      <div className={styles.noData}>
                        {providerSearch ? 'No providers found matching your search' : 'No providers found'}
                      </div>
                    )}
                    

                  </div>
                )}
              </div>
            </div>
      </div>
    </div>
  );
}