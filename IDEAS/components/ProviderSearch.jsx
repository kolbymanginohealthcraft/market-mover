import React, { useState } from 'react'
import { Search, MapPin, Filter, Building2, Users, TrendingUp, Star, Phone, Mail, Globe } from 'lucide-react'

const ProviderSearch = ({ selectedClient, hideHeader = false }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    providerType: 'all',
    radius: '10',
    qualityScore: 'all',
    specialFocus: false
  })
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Mock provider data - in real implementation this would come from Market Mover API
  const mockProviders = [
    {
      id: 1,
      name: 'Sunrise Rehabilitation Center',
      type: 'SNF',
      address: '1234 Miami Beach Blvd, Miami, FL 33139',
      phone: '(305) 555-0123',
      email: 'info@sunriserehab.com',
      website: 'www.sunriserehab.com',
      qualityScore: 4.2,
      readmissionRate: 12.5,
      specialFocus: false,
      bedCount: 120,
      distance: 2.3,
      coordinates: { lat: 25.7617, lng: -80.1918 }
    },
    {
      id: 2,
      name: 'Coral Gables Care Center',
      type: 'SNF',
      address: '5678 Coral Way, Coral Gables, FL 33134',
      phone: '(305) 555-0456',
      email: 'contact@coralgablescare.com',
      website: 'www.coralgablescare.com',
      qualityScore: 3.8,
      readmissionRate: 18.2,
      specialFocus: true,
      bedCount: 85,
      distance: 5.7,
      coordinates: { lat: 25.7215, lng: -80.2684 }
    },
    {
      id: 3,
      name: 'Miami Dade Medical Center',
      type: 'Hospital',
      address: '9010 SW 8th St, Miami, FL 33174',
      phone: '(305) 555-0789',
      email: 'info@miamidademedical.com',
      website: 'www.miamidademedical.com',
      qualityScore: 4.5,
      readmissionRate: 8.9,
      specialFocus: false,
      bedCount: 350,
      distance: 8.1,
      coordinates: { lat: 25.7617, lng: -80.1918 }
    },
    {
      id: 4,
      name: 'Hialeah Nursing Home',
      type: 'SNF',
      address: '3456 W 20th Ave, Hialeah, FL 33012',
      phone: '(305) 555-0321',
      email: 'admin@hialeahnursing.com',
      website: 'www.hialeahnursing.com',
      qualityScore: 3.2,
      readmissionRate: 22.1,
      specialFocus: true,
      bedCount: 95,
      distance: 12.4,
      coordinates: { lat: 25.8576, lng: -80.2781 }
    }
  ]

  const handleSearch = () => {
    setIsSearching(true)
    // Simulate API call
    setTimeout(() => {
      const filtered = mockProviders.filter(provider => {
        const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            provider.address.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesType = selectedFilters.providerType === 'all' || 
                           provider.type === selectedFilters.providerType
        
        const matchesRadius = provider.distance <= parseInt(selectedFilters.radius)
        
        const matchesQuality = selectedFilters.qualityScore === 'all' ||
                              (selectedFilters.qualityScore === 'high' && provider.qualityScore >= 4.0) ||
                              (selectedFilters.qualityScore === 'medium' && provider.qualityScore >= 3.0 && provider.qualityScore < 4.0) ||
                              (selectedFilters.qualityScore === 'low' && provider.qualityScore < 3.0)
        
        const matchesSpecialFocus = !selectedFilters.specialFocus || provider.specialFocus
        
        return matchesSearch && matchesType && matchesRadius && matchesQuality && matchesSpecialFocus
      })
      
      setSearchResults(filtered)
      setIsSearching(false)
    }, 1000)
  }

  const getQualityColor = (score) => {
    if (score >= 4.0) return 'var(--success-green)'
    if (score >= 3.0) return 'var(--warning-orange)'
    return 'var(--error-red)'
  }

  const getReadmissionColor = (rate) => {
    if (rate <= 10) return 'var(--success-green)'
    if (rate <= 15) return 'var(--warning-orange)'
    return 'var(--error-red)'
  }

  return (
    <div className="provider-search">
      {!hideHeader && (
        <div className="page-header">
          <div>
            <h1>Provider Search</h1>
            <p>Search and analyze healthcare providers with market intelligence data</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary">
              <MapPin size={16} />
              Export Results
            </button>
            <button className="btn btn-primary">
              <TrendingUp size={16} />
              Market Analysis
            </button>
          </div>
        </div>
      )}

      {/* Search Filters */}
      <div className="search-filters">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search providers by name, address, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="filter-options">
          <div className="filter-group">
            <label>Provider Type</label>
            <select 
              value={selectedFilters.providerType}
              onChange={(e) => setSelectedFilters({...selectedFilters, providerType: e.target.value})}
            >
              <option value="all">All Types</option>
              <option value="SNF">Skilled Nursing Facilities</option>
              <option value="Hospital">Hospitals</option>
              <option value="ALF">Assisted Living</option>
              <option value="Home Health">Home Health</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Radius (miles)</label>
            <select 
              value={selectedFilters.radius}
              onChange={(e) => setSelectedFilters({...selectedFilters, radius: e.target.value})}
            >
              <option value="5">5 miles</option>
              <option value="10">10 miles</option>
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Quality Score</label>
            <select 
              value={selectedFilters.qualityScore}
              onChange={(e) => setSelectedFilters({...selectedFilters, qualityScore: e.target.value})}
            >
              <option value="all">All Scores</option>
              <option value="high">High (4.0+)</option>
              <option value="medium">Medium (3.0-3.9)</option>
              <option value="low">Low (&lt;3.0)</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedFilters.specialFocus}
                onChange={(e) => setSelectedFilters({...selectedFilters, specialFocus: e.target.checked})}
              />
              Special Focus Facilities Only
            </label>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="search-results">
        <div className="results-header">
          <h3>Search Results ({searchResults.length} providers)</h3>
          <div className="results-actions">
            <button className="btn btn-outline">Save Search</button>
            <button className="btn btn-outline">Create Segment</button>
          </div>
        </div>

        {searchResults.length === 0 && !isSearching && (
          <div className="empty-state">
            <Building2 size={48} />
            <h3>No providers found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        )}

        <div className="providers-grid">
          {searchResults.map(provider => (
            <div key={provider.id} className="provider-card">
              <div className="provider-header">
                <div className="provider-info">
                  <h4>{provider.name}</h4>
                  <span className="provider-type">{provider.type}</span>
                </div>
                <div className="provider-score">
                  <Star size={16} style={{ color: getQualityColor(provider.qualityScore) }} />
                  <span style={{ color: getQualityColor(provider.qualityScore) }}>
                    {provider.qualityScore}
                  </span>
                </div>
              </div>

              <div className="provider-details">
                <div className="detail-item">
                  <MapPin size={14} />
                  <span>{provider.address}</span>
                </div>
                <div className="detail-item">
                  <Phone size={14} />
                  <span>{provider.phone}</span>
                </div>
                <div className="detail-item">
                  <Mail size={14} />
                  <span>{provider.email}</span>
                </div>
                <div className="detail-item">
                  <Globe size={14} />
                  <span>{provider.website}</span>
                </div>
              </div>

              <div className="provider-metrics">
                <div className="metric">
                  <span className="metric-label">Distance</span>
                  <span className="metric-value">{provider.distance} mi</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Beds</span>
                  <span className="metric-value">{provider.bedCount}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Readmission Rate</span>
                  <span 
                    className="metric-value"
                    style={{ color: getReadmissionColor(provider.readmissionRate) }}
                  >
                    {provider.readmissionRate}%
                  </span>
                </div>
                {provider.specialFocus && (
                  <div className="metric">
                    <span className="metric-label">Special Focus</span>
                    <span className="metric-value warning">Yes</span>
                  </div>
                )}
              </div>

              <div className="provider-actions">
                <button className="btn btn-outline btn-sm">View Details</button>
                <button className="btn btn-outline btn-sm">Add to Segment</button>
                <button className="btn btn-outline btn-sm">Contact</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .provider-search {
          padding: 2rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          margin: 0 0 0.5rem 0;
          color: var(--gray-900);
        }

        .page-header p {
          margin: 0;
          color: var(--gray-600);
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .search-filters {
          background: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .search-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
        }

        .search-input-wrapper svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
        }

        .search-input-wrapper input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid var(--gray-300);
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .filter-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--gray-700);
        }

        .filter-group select {
          padding: 0.5rem;
          border: 1px solid var(--gray-300);
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          margin: 0;
        }

        .search-results {
          background: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .results-header h3 {
          margin: 0;
          color: var(--gray-900);
        }

        .results-actions {
          display: flex;
          gap: 0.75rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: var(--gray-500);
        }

        .empty-state svg {
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
        }

        .empty-state p {
          margin: 0;
        }

        .providers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .provider-card {
          border: 1px solid var(--gray-200);
          border-radius: 0.5rem;
          padding: 1.5rem;
          transition: all 0.2s ease;
        }

        .provider-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .provider-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .provider-info h4 {
          margin: 0 0 0.25rem 0;
          color: var(--gray-900);
        }

        .provider-type {
          background: var(--primary-teal);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .provider-score {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
        }

        .provider-details {
          margin-bottom: 1rem;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        .detail-item svg {
          color: var(--gray-400);
        }

        .provider-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: var(--gray-50);
          border-radius: 0.375rem;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-label {
          font-size: 0.75rem;
          color: var(--gray-600);
        }

        .metric-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--gray-900);
        }

        .metric-value.warning {
          color: var(--warning-orange);
        }

        .provider-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  )
}

export default ProviderSearch
