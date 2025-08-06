import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../app/supabaseClient';
import styles from './MyProvidersPage.module.css';
import Button from '../../components/Buttons/Button';
import Spinner from '../../components/Buttons/Spinner';
import Banner from '../../components/Banner';
import useUserProviders from '../../hooks/useUserProviders';
import { apiUrl } from '../../utils/api';

export default function MyProvidersPage() {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const {
    userProviders,
    loading,
    error,
    addingProvider,
    removingProvider,
    addUserProvider,
    removeUserProvider,
    isUserProvider,
    refreshUserProviders
  } = useUserProviders();

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };

  const handleSortChange = (e) => {
    const [field, direction] = e.target.value.split('-');
    setSortBy(field);
    setSortDirection(direction);
  };

  const handleRemoveProvider = async (providerDhc) => {
    if (confirm('Are you sure you want to remove this provider from your list?')) {
      await removeUserProvider(providerDhc);
    }
  };

  const handleViewProvider = (providerDhc) => {
    navigate(`/app/provider/${providerDhc}/overview`);
  };

  // Filter and sort providers
  const filteredAndSortedProviders = userProviders
    .filter(provider => {
      // Search filter
      if (searchTerm && !provider.provider_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filterType !== 'all' && provider.provider_type !== filterType) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.provider_name || '';
          bValue = b.provider_name || '';
          break;
        case 'type':
          aValue = a.provider_type || '';
          bValue = b.provider_type || '';
          break;
        case 'network':
          aValue = a.provider_network || '';
          bValue = b.provider_network || '';
          break;
        case 'location':
          aValue = `${a.provider_city || ''} ${a.provider_state || ''}`;
          bValue = `${b.provider_city || ''} ${b.provider_state || ''}`;
          break;
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a.provider_name || '';
          bValue = b.provider_name || '';
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getUniqueTypes = () => {
    const types = [...new Set(userProviders.map(p => p.provider_type).filter(Boolean))];
    return types.sort();
  };

  if (loading) {
    return <Spinner message="Loading your providers..." />;
  }

  return (
    <div className={styles.container}>
      <Banner
        title="My Providers"
        message="Manage your network of tagged providers. These providers will be automatically marked as 'My Locations' when you create markets."
        icon="🏥"
        onClose={handleCloseBanner}
      />

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>My Providers</h1>
          <p>Manage your network of tagged providers across all markets</p>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search providers..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filters}>
            <select
              value={filterType}
              onChange={handleFilterChange}
              className={styles.filterSelect}
            >
              <option value="all">All Types</option>
              {getUniqueTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={handleSortChange}
              className={styles.sortSelect}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="type-asc">Type (A-Z)</option>
              <option value="type-desc">Type (Z-A)</option>
              <option value="network-asc">Network (A-Z)</option>
              <option value="network-desc">Network (Z-A)</option>
              <option value="location-asc">Location (A-Z)</option>
              <option value="location-desc">Location (Z-A)</option>
              <option value="date-desc">Date Added (Newest)</option>
              <option value="date-asc">Date Added (Oldest)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>Error: {error}</p>
        </div>
      )}

      <div className={styles.content}>
        {filteredAndSortedProviders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏥</div>
            <h3>No providers found</h3>
            <p>
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Start by tagging providers as "My Providers" from any provider detail page.'
              }
            </p>
            <Button
              variant="blue"
              onClick={() => navigate('/app/search')}
            >
              Search Providers
            </Button>
          </div>
        ) : (
          <div className={styles.providersGrid}>
            {filteredAndSortedProviders.map(provider => (
              <div key={provider.id} className={styles.providerCard}>
                <div className={styles.providerHeader}>
                  <h3>{provider.provider_name}</h3>
                  <div className={styles.providerBadge}>
                    {provider.provider_type || 'Unknown Type'}
                  </div>
                </div>
                
                <div className={styles.providerDetails}>
                  {provider.provider_network && (
                    <p className={styles.network}>
                      <strong>Network:</strong> {provider.provider_network}
                    </p>
                  )}
                  
                  <p className={styles.location}>
                    <strong>Location:</strong> {provider.provider_city}, {provider.provider_state}
                  </p>
                  
                  <p className={styles.dateAdded}>
                    <strong>Added:</strong> {new Date(provider.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className={styles.providerActions}>
                  <Button
                    size="sm"
                    variant="blue"
                    onClick={() => handleViewProvider(provider.provider_dhc)}
                  >
                    View Details
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="red"
                    outline
                    onClick={() => handleRemoveProvider(provider.provider_dhc)}
                    disabled={removingProvider === provider.provider_dhc}
                  >
                    {removingProvider === provider.provider_dhc ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredAndSortedProviders.length > 0 && (
        <div className={styles.summary}>
          <p>
            Showing {filteredAndSortedProviders.length} of {userProviders.length} providers
            {searchTerm && ` matching "${searchTerm}"`}
            {filterType !== 'all' && ` of type "${filterType}"`}
          </p>
        </div>
      )}
    </div>
  );
} 