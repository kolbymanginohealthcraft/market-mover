import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useProviderDensity, useProviderDensityDetails } from '../../hooks/useProviderDensity';
import useProviderInfo from '../../hooks/useProviderInfo';
import styles from './ProviderDensityPage.module.css';
import Banner from '../../components/Banner';

export default function ProviderDensityPage({ radius }) {
  const { dhc } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [showBanner, setShowBanner] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef(null);

  // Get provider info to use its location
  const { provider: providerInfo, loading: providerLoading } = useProviderInfo(dhc);
  
  // Use provider's location
  const lat = providerInfo?.latitude;
  const lon = providerInfo?.longitude;

  const { data: densityData, loading: densityLoading, error: densityError } = useProviderDensity(lat, lon, radius);
  const { data: detailsData, loading: detailsLoading, error: detailsError } = useProviderDensityDetails(lat, lon, radius, selectedSpecialty);

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

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

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
      <Banner
        title="Provider Density & Network Analysis"
        message="This tool helps you understand the prevalence of licensed professionals in your area, directly impacting your ability to staff and seek additional resources for your provider network. As we continue developing, you'll see enhanced analytics and deeper competitive intelligence that will help you approach network expansion and recruitment strategies."
        icon="🏥"
        onClose={handleCloseBanner}
      />

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
            <h3>Provider Count by Specialty</h3>
            {filteredData && filteredData.length > 0 ? (
              <div className={styles.specialtyTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.rankColumn}>#</div>
                  <div className={styles.specialtyColumn}>Specialty</div>
                  <div className={styles.countColumn}>Providers</div>
                </div>
                <div className={styles.tableBody}>
                  {filteredData.map((item, index) => (
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
          {selectedSpecialty ? (
            <div className={styles.providerDetailsSection}>
              <h3>Provider Details: {selectedSpecialty}</h3>
              {detailsLoading ? (
                <div className={styles.loading}>Loading provider details...</div>
              ) : detailsError ? (
                <div className={styles.error}>Error loading details: {detailsError}</div>
              ) : (
                <div className={styles.providerList}>
                  <div className={styles.providerTable}>
                    <div className={styles.providerTableHeader}>
                      <div className={styles.npiColumn}>NPI</div>
                      <div className={styles.providerNameColumn}>Provider Name</div>
                      <div className={styles.distanceColumn}>Distance</div>
                    </div>
                    <div className={styles.providerTableBody}>
                      {detailsData?.map((provider) => (
                        <div key={provider.npi} className={styles.providerTableRow}>
                          <div className={styles.npiColumn}>{provider.npi}</div>
                          <div className={styles.providerNameColumn}>{provider.provider_name || 'N/A'}</div>
                          <div className={styles.distanceColumn}>{provider.distance_miles} mi</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {detailsData?.length === 0 && (
                    <div className={styles.noData}>No providers found for this specialty</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noSelection}>
              <h3>Select a Specialty</h3>
              <p>Click on a specialty from the list to view provider details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}