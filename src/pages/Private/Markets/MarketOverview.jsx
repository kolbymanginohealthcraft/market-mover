import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../app/supabaseClient';
import styles from './MarketOverview.module.css';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import Banner from '../../../components//Buttons/Banner';
import SidePanel from '../../../components/Overlays/SidePanel';

import { apiUrl } from '../../../utils/api';
import { useProviderTagging } from '../../../hooks/useProviderTagging';
import { InlineTagging } from '../../../components/Tagging/InlineTagging';
import { useUserTeam } from '../../../hooks/useUserTeam';

export default function MarketOverview({ market: marketProp, providers: providersProp }) {
  const { marketId } = useParams();
  const navigate = useNavigate();
  const [market, setMarket] = useState(marketProp || null);
  const [providers, setProviders] = useState(providersProp || []);
  const [loading, setLoading] = useState(!marketProp);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Team functionality
  const { hasTeam, loading: teamLoading } = useUserTeam();
  const [providerTypeFilter, setProviderTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState(null);
  const [editingMarket, setEditingMarket] = useState(false);
  const [marketName, setMarketName] = useState('');
  const [marketRadius, setMarketRadius] = useState(10);
  const [tagUpdateTrigger, setTagUpdateTrigger] = useState(0);
  
  const marketNameInputRef = useRef(null);

  // Team provider tags functionality
  const { 
    teamProviderTags, 
    loading: tagsLoading, 
    taggingProviderId,
    dropdownPosition,
    getPrimaryTag,
    handleAddTag,
    handleRemoveTag,
    openTaggingDropdown,
    closeTaggingDropdown,
    hasTeamProviderTag, 
    getProviderTags 
  } = useProviderTagging();



  // Update state when props change
  useEffect(() => {
    if (marketProp) {
      setMarket(marketProp);
      setMarketName(marketProp.name);
      setMarketRadius(marketProp.radius_miles);
      setResolvedLocation({ city: marketProp.city, state: marketProp.state });
      setLoading(false);
    }
  }, [marketProp]);

  useEffect(() => {
    if (providersProp) {
      setProviders(providersProp);
    }
  }, [providersProp]);

  useEffect(() => {
    // Only fetch data if props are not provided
    if (!marketProp) {
      fetchMarketData();
    }
  }, [marketId, marketProp]);

  // Force re-render when team provider tags change
  useEffect(() => {
    console.log('🔄 Team provider tags updated:', teamProviderTags.length, teamProviderTags);
    setTagUpdateTrigger(prev => prev + 1);
  }, [teamProviderTags]);

  // Auto-focus input when sidebar opens
  useEffect(() => {
    if (showSettings && editingMarket && marketNameInputRef.current) {
      // Small delay to ensure the sidebar is fully rendered
      setTimeout(() => {
        marketNameInputRef.current?.focus();
      }, 100);
    }
  }, [showSettings, editingMarket]);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch market details
      const { data: marketData, error: marketError } = await supabase
        .from('markets')
        .select('*')
        .eq('id', marketId)
        .single();

      if (marketError) {
        throw new Error('Market not found');
      }

      setMarket(marketData);
      
      // Initialize form data
      setMarketName(marketData.name);
      setMarketRadius(marketData.radius_miles);

      // Use stored city/state from database instead of reverse geocoding
      setResolvedLocation({ city: marketData.city, state: marketData.state });

      // Fetch nearby providers
      const providersResponse = await fetch(apiUrl(`/api/nearby-providers?lat=${marketData.latitude}&lon=${marketData.longitude}&radius=${marketData.radius_miles}`));

      if (!providersResponse.ok) {
        throw new Error('Failed to fetch providers');
      }

      const providersResult = await providersResponse.json();
      if (providersResult.success) {
        setProviders(providersResult.data || []);
      }

    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };







  const getFilteredProviders = () => {
    let filtered = providers;
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(provider => 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply provider type filter
    if (providerTypeFilter !== 'all') {
      filtered = filtered.filter(provider => provider.type === providerTypeFilter);
    }
    
    if (activeFilter === 'all') {
      return filtered;
    }
    if (activeFilter === 'untagged') {
      return filtered.filter(provider => getProviderTags(provider.dhc).length === 0);
    }
    return filtered.filter(provider => hasTeamProviderTag(provider.dhc, activeFilter));
  };

  const getFilteredCount = (filterType) => {
    if (filterType === 'all') {
      return providers.length;
    }
    if (filterType === 'untagged') {
      return providers.filter(provider => getProviderTags(provider.dhc).length === 0).length;
    }
    // Count providers with specific tag
    return providers.filter(provider => hasTeamProviderTag(provider.dhc, filterType)).length;
  };

  const getProviderTypeCounts = () => {
    const typeCounts = {};
    providers.forEach(provider => {
      if (provider.type) {
        typeCounts[provider.type] = (typeCounts[provider.type] || 0) + 1;
      }
    });
    return typeCounts;
  };

  const getUniqueProviderTypes = () => {
    const types = [...new Set(providers.map(provider => provider.type).filter(Boolean))];
    return types.sort();
  };

  const handleUpdateMarket = async () => {
    try {
      const { error } = await supabase
        .from('markets')
        .update({
          name: marketName,
          radius_miles: marketRadius
        })
        .eq('id', marketId);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setMarket(prev => ({
        ...prev,
        name: marketName,
        radius_miles: marketRadius
      }));

      setEditingMarket(false);
    } catch (err) {
      console.error('Error updating market:', err);
      setError(err.message);
    }
  };



  if (loading || tagsLoading) {
    return (
      <div className={styles.loading}>
        <Spinner message="Loading market data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error Loading Market</h2>
        <p>{error}</p>
        <Button onClick={() => navigate('/app/markets')}>
          Back to Markets
        </Button>
      </div>
    );
  }

  if (!market) {
    return (
      <div className={styles.error}>
        <h2>Market Not Found</h2>
        <p>The requested market could not be found.</p>
        <Button onClick={() => navigate('/app/markets')}>
          Back to Markets
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Banner Component */}
      <Banner
        title={market.name}
        subtitle={`${resolvedLocation ? `${resolvedLocation.city}, ${resolvedLocation.state}` : `${market.city}, ${market.state}`} • ${market.radius_miles} mile radius`}
        gradient="blue"
        buttonsUnderText={true}
        cards={[
          {
            value: getFilteredCount('all'),
            label: 'All Providers',
            onClick: () => setActiveFilter('all')
          },
          {
            value: getFilteredCount('untagged'),
            label: 'Untagged',
            onClick: () => setActiveFilter('untagged')
          },
          {
            value: getFilteredCount('me'),
            label: 'My Locations',
            onClick: () => setActiveFilter('me')
          },
          {
            value: getFilteredCount('partner'),
            label: 'Partners',
            onClick: () => setActiveFilter('partner')
          },
          {
            value: getFilteredCount('competitor'),
            label: 'Competitors',
            onClick: () => setActiveFilter('competitor')
          },
          {
            value: getFilteredCount('target'),
            label: 'Targets',
            onClick: () => setActiveFilter('target')
          }
        ]}
        activeCard={activeFilter === 'all' ? 'All Providers' : 
                   activeFilter === 'untagged' ? 'Untagged' :
                   activeFilter === 'me' ? 'My Locations' :
                   activeFilter === 'partner' ? 'Partners' :
                   activeFilter === 'competitor' ? 'Competitors' :
                   activeFilter === 'target' ? 'Targets' : null}
        buttons={[
          {
            text: 'Settings',
            onClick: () => setShowSettings(!showSettings),
            variant: 'default'
          },
          {
            text: 'Back to Markets',
            onClick: () => navigate('/app/markets'),
            variant: 'default'
          }
        ]}
      />

      <div className={styles.providersSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Providers in Market</h2>
            <span className={styles.sectionSubtitle}>
              Tag providers to organize your market analysis. Tags are shared across all team members and markets.
            </span>
          </div>
        </div>

        <div className={styles.providerFilters}>
          <div className={styles.filterGroup}>
            <label htmlFor="searchTerm">Search:</label>
            <input
              type="text"
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search providers in this list..."
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="providerTypeFilter">Provider Type:</label>
            <select
              id="providerTypeFilter"
              value={providerTypeFilter}
              onChange={(e) => setProviderTypeFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Types</option>
              {getUniqueProviderTypes().map((type) => {
                const typeCounts = getProviderTypeCounts();
                return (
                  <option key={type} value={type}>
                    {type} ({typeCounts[type]})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className={styles.providersTable}>
          <table>
            <thead>
              <tr>
                <th>Provider Name</th>
                <th>Address</th>
                <th>Type</th>
                <th>Network</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody key={`providers-${tagUpdateTrigger}`}>
              {getFilteredProviders().map((provider) => {
                const providerTags = getProviderTags(provider.dhc);
                return (
                  <tr key={`${provider.dhc}-${tagUpdateTrigger}`}>
                    <td className={styles.providerName}>{provider.name}</td>
                    <td className={styles.providerAddress}>
                      {provider.street}, {provider.city}, {provider.state} {provider.zip}
                    </td>
                    <td className={styles.providerType}>{provider.type || 'Unknown'}</td>
                    <td className={styles.providerNetwork}>{provider.network || '-'}</td>
                    <td className={styles.providerActions}>
                      <InlineTagging
                        providerId={provider.dhc}
                        hasTeam={hasTeam}
                        teamLoading={teamLoading}
                        taggingProviderId={taggingProviderId}
                        dropdownPosition={dropdownPosition}
                        primaryTag={getPrimaryTag(provider.dhc)}
                        isSaving={tagsLoading}
                        onOpenDropdown={openTaggingDropdown}
                        onCloseDropdown={closeTaggingDropdown}
                        onAddTag={handleAddTag}
                        onRemoveTag={handleRemoveTag}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {getFilteredProviders().length === 0 && (
          <div className={styles.emptyState}>
            <h3>No Providers Found</h3>
            <p>
              {activeFilter === 'all' 
                ? `No providers were found within the ${market.radius_miles} mile radius of ${market.city}, ${market.state}.`
                : `No ${activeFilter} providers found. Try tagging some providers or switch to "All Providers".`
              }
            </p>
          </div>
        )}
      </div>

      {/* Settings Panel */}
             <SidePanel
         isOpen={showSettings}
         onClose={() => setShowSettings(false)}
         title={editingMarket ? 'Edit Market' : 'Market Settings'}
       >
                 {editingMarket ? (
           <div>
             <div style={{ marginBottom: '1rem' }}>
               <label htmlFor="marketName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                 Market Name:
               </label>
               <input
                 ref={marketNameInputRef}
                 type="text"
                 id="marketName"
                 value={marketName}
                 onChange={(e) => setMarketName(e.target.value)}
                 className="form-input"
               />
             </div>

             <div style={{ marginBottom: '1rem' }}>
               <label htmlFor="marketRadius" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                 Radius (miles): {marketRadius}
               </label>
               <input
                 type="range"
                 id="marketRadius"
                 min="1"
                 max="100"
                 value={marketRadius}
                 onChange={(e) => setMarketRadius(parseInt(e.target.value))}
                 style={{ width: '100%' }}
               />
             </div>
             <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
               <Button onClick={handleUpdateMarket}>Save Changes</Button>
               <Button outline onClick={() => setEditingMarket(false)}>Cancel</Button>
             </div>
           </div>
         ) : (
           <div>
             <p style={{ margin: '0.5rem 0' }}><strong>Name:</strong> {market.name}</p>
             <p style={{ margin: '0.5rem 0' }}><strong>Location:</strong> {market.city}, {market.state}</p>
             <p style={{ margin: '0.5rem 0' }}><strong>Radius:</strong> {market.radius_miles} miles</p>
             <p style={{ margin: '0.5rem 0' }}><strong>Created:</strong> {new Date(market.created_at).toLocaleDateString()}</p>
             <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
               <Button onClick={() => setEditingMarket(true)}>Edit Market</Button>
             </div>
           </div>
         )}
      </SidePanel>
    </>
  );
} 