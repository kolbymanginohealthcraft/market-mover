import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useProviderDensity, useProviderDensityDetails } from '../../hooks/useProviderDensity';
import useProviderInfo from '../../hooks/useProviderInfo';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styles from './ProviderDensityPage.module.css';
import Banner from '../../components/Banner';

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000',
  '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#800080', '#008000', '#000080', '#808000', '#800080'
];

export default function ProviderDensityPage({ radius = 25 }) {
  const { dhc } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [viewMode, setViewMode] = useState('chart');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showBanner, setShowBanner] = useState(true);

  // Get provider info to use its location
  const { provider: providerInfo, loading: providerLoading } = useProviderInfo(dhc);
  
  // Use provider's location if available, otherwise use defaults
  const lat = providerInfo?.latitude || searchParams.get('lat') || '32.4324';
  const lon = providerInfo?.longitude || searchParams.get('lon') || '-86.6577';

  const { data: densityData, loading: densityLoading, error: densityError } = useProviderDensity(lat, lon, radius);
  const { data: detailsData, loading: detailsLoading, error: detailsError } = useProviderDensityDetails(lat, lon, radius, selectedSpecialty);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload(); // Force a complete refresh
  };

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

  // Filter data based on search term - handle null specialty values
  const filteredData = densityData?.filter(item => {
    // Skip items with null, undefined, or empty specialty
    if (!item.specialty || item.specialty.trim() === '') {
      console.warn('Found item with null/undefined/empty specialty:', item);
      return false;
    }
    return item.specialty.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const handleSpecialtyClick = (specialty) => {
    setSelectedSpecialty(selectedSpecialty === specialty ? null : specialty);
  };

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
    <div className={styles.container}>
      {/* Enhanced Banner - Early Adopter Excitement */}
      <Banner
        title="Provider Density & Network Analysis"
        message="This tool helps you understand the prevalence of licensed professionals in your area, directly impacting your ability to staff and seek additional resources for your provider network. As we continue developing, you'll see enhanced analytics and deeper competitive intelligence that will help you approach network expansion and recruitment strategies."
        icon="🏥"
        onClose={handleCloseBanner}
      />

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Search Specialties:</label>
          <input
            type="text"
            placeholder="Type to filter specialties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.controlGroup}>
          <label>View Mode:</label>
          <div className={styles.viewToggle}>
            <button className={`${styles.toggleButton} ${viewMode === 'chart' ? styles.active : ''}`} onClick={() => setViewMode('chart')}>Chart View</button>
            <button className={`${styles.toggleButton} ${viewMode === 'list' ? styles.active : ''}`} onClick={() => setViewMode('list')}>List View</button>
          </div>
        </div>
        <div className={styles.controlGroup}>
          <button 
            className={styles.refreshButton} 
            onClick={handleRefresh}
            disabled={densityLoading}
          >
            {densityLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <h3>Total Providers</h3>
          <p className={styles.summaryNumber}>{totalProviders.toLocaleString()}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Specialties</h3>
          <p className={styles.summaryNumber}>{filteredData?.length || 0}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Top Specialty</h3>
          <p className={styles.summaryText}>{filteredData?.[0]?.specialty || 'N/A'}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Data Quality</h3>
          <p className={styles.summaryText}>{densityData ? `${densityData.length} specialties` : 'Loading...'}</p>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className={styles.chartContainer}>
          {filteredData && filteredData.length > 0 ? (
            <>
              <div className={styles.chartSection}>
                <h3>Provider Count by Specialty</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="specialty" angle={-45} textAnchor="end" height={100} interval={0} tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip formatter={(value) => [value.toLocaleString(), 'Providers']} labelFormatter={label => `Specialty: ${label}`} />
                    <Bar dataKey="provider_count" fill="#8884d8" onClick={data => handleSpecialtyClick(data.specialty)} style={{ cursor: 'pointer' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.chartSection}>
                <h3>Distribution by Specialty</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={filteredData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ specialty, percent }) => `${specialty} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="provider_count"
                      onClick={data => handleSpecialtyClick(data.specialty)}
                      style={{ cursor: 'pointer' }}
                    >
                      {filteredData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toLocaleString(), 'Providers']} labelFormatter={label => `Specialty: ${label}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className={styles.noData}>
              <h3>No Data Available</h3>
              <p>No provider data found for the selected location and radius.</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.listContainer}>
          <h3>Provider Count by Specialty</h3>
          {filteredData && filteredData.length > 0 ? (
            <div className={styles.specialtyList}>
              {filteredData.map((item, index) => (
                <div key={item.specialty} className={`${styles.specialtyItem} ${selectedSpecialty === item.specialty ? styles.selected : ''}`} onClick={() => handleSpecialtyClick(item.specialty)}>
                  <div className={styles.specialtyRank}>#{index + 1}</div>
                  <div className={styles.specialtyInfo}>
                    <h4>{item.specialty}</h4>
                    <p>{item.provider_count.toLocaleString()} providers</p>
                  </div>
                  <div className={styles.specialtyPercentage}>{((item.provider_count / totalProviders) * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noData}>
              <h3>No Data Available</h3>
              <p>No provider data found for the selected location and radius.</p>
            </div>
          )}
        </div>
      )}

      {selectedSpecialty && (
        <div className={styles.detailsSection}>
          <h3>Provider Details: {selectedSpecialty}</h3>
          {detailsLoading ? (
            <div className={styles.loading}>Loading provider details...</div>
          ) : detailsError ? (
            <div className={styles.error}>Error loading details: {detailsError}</div>
          ) : (
            <div className={styles.providerList}>
              <div className={styles.providerHeader}>
                <span className={styles.npi}>NPI</span>
                <span className={styles.providerName}>Provider Name</span>
                <span className={styles.distance}>Distance</span>
              </div>
              {detailsData?.map((provider) => (
                <div key={provider.npi} className={styles.providerItem}>
                  <span className={styles.npi}>{provider.npi}</span>
                  <span className={styles.providerName}>{provider.provider_name || 'N/A'}</span>
                  <span className={styles.distance}>{provider.distance_miles} mi</span>
                </div>
              ))}
              {detailsData?.length === 0 && (
                <div className={styles.noData}>No providers found for this specialty</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}