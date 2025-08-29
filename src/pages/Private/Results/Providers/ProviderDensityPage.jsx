import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useProviderDensity, useProviderDensityDetails } from '../../../../hooks/useProviderDensity';
import useProviderInfo from '../../../../hooks/useProviderInfo';
import { useUserTeam } from '../../../../hooks/useUserTeam';
import styles from './ProviderDensityPage.module.css';
import Banner from '../../../../components/Buttons/Banner';
import ButtonGroup from '../../../../components/Buttons/ButtonGroup';
import Button from '../../../../components/Buttons/Button';
import ControlsRow from '../../../../components/Layouts/ControlsRow';
import SectionHeader from '../../../../components/Layouts/SectionHeader';
import { Lock, ChevronDown } from 'lucide-react';

export default function ProviderDensityPage({ radius, latitude, longitude, provider }) {
  const { dhc } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasTeam, loading: teamLoading } = useUserTeam();
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

  // Get provider info to use its location (only if dhc is available and no props provided)
  const { provider: providerInfo, loading: providerLoading } = useProviderInfo(dhc && !latitude && !longitude ? dhc : null);

  // Use provided location props or fall back to provider info
  const lat = latitude || providerInfo?.latitude;
  const lon = longitude || providerInfo?.longitude;

  const { data: densityData, loading: densityLoading, error: densityError } = useProviderDensity(lat, lon, radius);
  const { data: detailsData, loading: detailsLoading, error: detailsError } = useProviderDensityDetails(lat, lon, radius, selectedSpecialty);

  // Get all providers data (not filtered by specialty)
  const { data: allProvidersData, loading: allProvidersLoading, error: allProvidersError } = useProviderDensityDetails(lat, lon, radius, null);

  // Check if user has team access
  if (!hasTeam && !teamLoading) {
    return (
      <div className={styles.teamRequiredState}>
        <Lock size={48} className={styles.teamRequiredIcon} />
        <h3>Team Required</h3>
        <p>Join or create a team to access provider density analysis.</p>
        <div className={styles.teamRequiredActions}>
          <Button onClick={() => window.location.href = '/app/settings/company'}>
            Create a Team
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/app/settings/company'}>
            Join a Team
          </Button>
        </div>
      </div>
    );
  }

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

  if ((providerLoading && !latitude && !longitude) || densityLoading) {
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
    <div onKeyDown={handleEscapeKey}>
      <ControlsRow
        leftContent={
          <div className={styles.controlGroup}>
            <label>Filter Specialties:</label>
            <div
              className={`${styles.multiSelectContainer} ${showDropdown ? styles.isOpen : ''}`}
              ref={dropdownRef}
            >
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
                <button
                  className={styles.dropdownButton}
                  onClick={() => setShowDropdown(prev => !prev)}
                >
                  <ChevronDown size={16} />
                </button>
              </div>

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
                    <div className={styles.noResults}>No specialties found</div>
                  )}
                </div>
              )}
            </div>


          </div>
        }
        rightContent={
          <div className={styles.resultCount}>
            Showing {totalProviders.toLocaleString()} provider{totalProviders !== 1 ? 's' : ''} across {filteredData.length.toLocaleString()} specialt{filteredData.length !== 1 ? 'ies' : 'y'}
          </div>
        }
      />

      <div className={styles.twoColumnLayout}>
        <div className={styles.leftColumn}>
          <div className={styles.specialtySection}>
            <div className={styles.sectionHeader}>
              <div className={styles.headerContent}>
                <div className={styles.leftSection}>
                  <span className={styles.headerTitle}>Provider Count by Specialty</span>
                </div>
                <button
                  className={styles.sortButton}
                  onClick={() => setSortBy(sortBy === 'count' ? 'name' : 'count')}
                >
                  {sortBy === 'count' ? 'Sorted by Count' : 'Sorted by Specialty'}
                </button>
              </div>
              <div className={styles.separator} />
            </div>
            <div className={styles.sectionContent}>
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
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.providerDetailsSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.headerContent}>
                <div className={styles.leftSection}>
                  <span className={styles.headerTitle}>Provider Details</span>
                </div>
                <div className={styles.rightSection}>
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
                      <button
                        className={styles.paginationButton}
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        title="Previous page"
                      >
                        ←
                      </button>
                      <span className={styles.pageInfo}>
                        Page {currentPage}/{totalPages}
                      </span>
                      <button
                        className={styles.paginationButton}
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        title="Next page"
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.separator} />
            </div>
            <div className={styles.sectionContent}>

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
    </div>
  );
}