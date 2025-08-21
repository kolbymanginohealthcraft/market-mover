import React, { useState } from 'react'
import { 
  BarChart3, 
  Plus, 
  MapPin, 
  Bookmark, 
  Calendar,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  Search,
  Users,
  Building2,
  DollarSign
} from 'lucide-react'

const SavedMarkets = ({ selectedClient, onMarketSelect, hideHeader = false }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateMarket, setShowCreateMarket] = useState(false)
  const [newMarket, setNewMarket] = useState({
    name: '',
    location: '',
    radius: 10,
    description: ''
  })

  const savedMarkets = [
    {
      id: 1,
      name: 'Dallas Metro',
      location: 'Dallas, TX',
      radius: 25,
      description: 'Dallas metropolitan area including surrounding suburbs',
      providers: 456,
      population: 2800000,
      marketValue: 8500000000,
      lastUpdated: '2024-01-15',
      tags: ['high-growth', 'competitive']
    },
    {
      id: 2,
      name: 'Atlanta Healthcare Hub',
      location: 'Atlanta, GA',
      radius: 15,
      description: 'Central Atlanta healthcare corridor',
      providers: 234,
      population: 1200000,
      marketValue: 4200000000,
      lastUpdated: '2024-01-12',
      tags: ['established', 'diverse']
    },
    {
      id: 3,
      name: 'Newark Medical District',
      location: 'Newark, NJ',
      radius: 8,
      description: 'Newark medical center and surrounding facilities',
      providers: 189,
      population: 850000,
      marketValue: 3100000000,
      lastUpdated: '2024-01-10',
      tags: ['urban', 'specialized']
    },
    {
      id: 4,
      name: 'Miami Beach Area',
      location: 'Miami Beach, FL',
      radius: 12,
      description: 'Miami Beach and coastal healthcare facilities',
      providers: 167,
      population: 650000,
      marketValue: 2800000000,
      lastUpdated: '2024-01-08',
      tags: ['coastal', 'retirement']
    }
  ]

  const filteredMarkets = savedMarkets.filter(market =>
    market.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    market.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateMarket = () => {
    if (newMarket.name && newMarket.location) {
      // In a real app, this would save to the database
      console.log('Creating new market:', newMarket)
      setShowCreateMarket(false)
      setNewMarket({ name: '', location: '', radius: 10, description: '' })
    }
  }

  const handleDeleteMarket = (marketId) => {
    // In a real app, this would delete from the database
    console.log('Deleting market:', marketId)
  }

  const handleMarketClick = (market) => {
    if (onMarketSelect) {
      onMarketSelect(market)
    }
  }

  return (
          <div className="page-content-area">
      {/* Page Header */}
      {!hideHeader && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            Saved Markets
          </h2>
          <p style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
            Manage your saved market areas and view market intelligence data for each region.
          </p>
        </div>
      )}

      {/* Search and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem 0.5rem 2.5rem',
              border: '1px solid var(--gray-300)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              width: '100%',
              backgroundColor: 'var(--white)'
            }}
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateMarket(true)}
        >
          <Plus size={16} />
          Create Market
        </button>
      </div>

      {/* Markets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {filteredMarkets.map((market) => (
          <div key={market.id} className="widget" style={{ cursor: 'pointer' }} onClick={() => handleMarketClick(market)}>
            <div className="widget-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} color="var(--primary-teal)" />
                <div>
                  <div className="widget-title">{market.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                    {market.location} • {market.radius} mile radius
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMarketClick(market)
                  }}
                >
                  <Eye size={12} />
                  View Data
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle edit
                  }}
                >
                  <Edit size={12} />
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteMarket(market.id)
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className="widget-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                {market.description}
              </p>
              
              {/* Market Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
                    {market.providers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Providers</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
                    {(market.population / 1000000).toFixed(1)}M
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Population</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
                    ${(market.marketValue / 1000000000).toFixed(1)}B
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Market Value</div>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {market.tags.map((tag, index) => (
                  <span key={index} style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                Last updated: {market.lastUpdated}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Market Modal */}
      {showCreateMarket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                Create New Market
              </h3>
              <button 
                onClick={() => setShowCreateMarket(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Market Name
                </label>
                <input
                  type="text"
                  value={newMarket.name}
                  onChange={(e) => setNewMarket({ ...newMarket, name: e.target.value })}
                  placeholder="e.g., Dallas Metro"
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Location
                </label>
                <input
                  type="text"
                  value={newMarket.location}
                  onChange={(e) => setNewMarket({ ...newMarket, location: e.target.value })}
                  placeholder="e.g., Dallas, TX"
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Radius (miles)
                </label>
                <input
                  type="number"
                  value={newMarket.radius}
                  onChange={(e) => setNewMarket({ ...newMarket, radius: parseInt(e.target.value) })}
                  min="1"
                  max="100"
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Description
                </label>
                <textarea
                  value={newMarket.description}
                  onChange={(e) => setNewMarket({ ...newMarket, description: e.target.value })}
                  placeholder="Describe this market area..."
                  rows="3"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateMarket}
                  style={{ flex: 1 }}
                >
                  Create Market
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateMarket(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SavedMarkets
