import React, { useState } from 'react'
import {
  Building2,
  Search,
  Filter,
  Tag,
  Target,
  UserCheck,
  UserX,
  MapPin,
  Star,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload
} from 'lucide-react'

const OrganizationTagger = ({ selectedClient, hideHeader = false }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({ tag: null, type: null })
  const [showTagOrganization, setShowTagOrganization] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState(null)
  const [activeTab, setActiveTab] = useState('organizations')

  // Mock data for organizations (not individual contacts)
  const organizations = [
    {
      id: 1,
      name: 'Sunrise Rehabilitation Center',
      type: 'SNF',
      location: 'Dallas, TX',
      tag: 'target',
      contactCount: 12,
      lastContact: '2024-01-15',
      qualityScore: 4.2,
      rehospitalizationRate: '12.3%'
    },
    {
      id: 2,
      name: 'Kindred Healthcare - North Campus',
      type: 'IRF',
      location: 'Houston, TX',
      tag: 'competitor',
      contactCount: 8,
      lastContact: '2024-01-10',
      qualityScore: 3.8,
      rehospitalizationRate: '15.7%'
    },
    {
      id: 3,
      name: 'Encompass Health Rehabilitation',
      type: 'IRF',
      location: 'Austin, TX',
      tag: 'partner',
      contactCount: 15,
      lastContact: '2024-01-12',
      qualityScore: 4.5,
      rehospitalizationRate: '10.2%'
    },
    {
      id: 4,
      name: 'Genesis Healthcare - South',
      type: 'SNF',
      location: 'San Antonio, TX',
      tag: 'me',
      contactCount: 6,
      lastContact: '2024-01-08',
      qualityScore: 4.0,
      rehospitalizationRate: '13.1%'
    },
    {
      id: 5,
      name: 'Select Medical Corporation',
      type: 'IRF',
      location: 'Fort Worth, TX',
      tag: 'target',
      contactCount: 10,
      lastContact: '2024-01-14',
      qualityScore: 4.3,
      rehospitalizationRate: '11.8%'
    }
  ]

  const getTagColor = (tag) => {
    switch (tag) {
      case 'me': return 'var(--success-color)'
      case 'competitor': return 'var(--danger-color)'
      case 'target': return 'var(--primary-teal)'
      case 'partner': return 'var(--warning-color)'
      default: return 'var(--gray-400)'
    }
  }

  const getTagIcon = (tag) => {
    switch (tag) {
      case 'me': return UserCheck
      case 'competitor': return UserX
      case 'target': return Target
      case 'partner': return Building2
      default: return Tag
    }
  }

  const getTagLabel = (tag) => {
    switch (tag) {
      case 'me': return 'My Organization'
      case 'competitor': return 'Competitor'
      case 'target': return 'Target'
      case 'partner': return 'Partner'
      default: return 'Untagged'
    }
  }

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !selectedFilters.tag || org.tag === selectedFilters.tag
    const matchesType = !selectedFilters.type || org.type === selectedFilters.type
    return matchesSearch && matchesTag && matchesType
  })

  const renderOrganizations = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">Organizations</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
            <Download size={14} />
            Export
          </button>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
            <Upload size={14} />
            Import
          </button>
        </div>
      </div>
      <div className="widget-body">
        {/* Search and Filters */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <select
              value={selectedFilters.tag || ''}
              onChange={(e) => setSelectedFilters({ ...selectedFilters, tag: e.target.value || null })}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--gray-300)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                minWidth: '120px'
              }}
            >
              <option value="">All Tags</option>
              <option value="me">My Organization</option>
              <option value="competitor">Competitor</option>
              <option value="target">Target</option>
              <option value="partner">Partner</option>
            </select>
            <select
              value={selectedFilters.type || ''}
              onChange={(e) => setSelectedFilters({ ...selectedFilters, type: e.target.value || null })}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--gray-300)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                minWidth: '120px'
              }}
            >
              <option value="">All Types</option>
              <option value="SNF">SNF</option>
              <option value="IRF">IRF</option>
              <option value="ALF">ALF</option>
              <option value="Hospital">Hospital</option>
            </select>
          </div>
        </div>

        {/* Organizations Table */}
        <table className="table">
          <thead>
            <tr>
              <th>Organization</th>
              <th>Type</th>
              <th>Location</th>
              <th>Tag</th>
              <th>Contacts</th>
              <th>Quality Score</th>
              <th>Last Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrganizations.map((org) => (
              <tr key={org.id}>
                <td style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                  {org.name}
                </td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {org.type}
                  </span>
                </td>
                <td style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={12} />
                    {org.location}
                  </div>
                </td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: getTagColor(org.tag),
                    color: 'white',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    width: 'fit-content'
                  }}>
                    {React.createElement(getTagIcon(org.tag), { size: 12 })}
                    {getTagLabel(org.tag)}
                  </span>
                </td>
                <td style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  {org.contactCount}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={12} color="var(--warning-color)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                      {org.qualityScore}
                    </span>
                  </div>
                </td>
                <td style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  {org.lastContact}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => {
                        setSelectedOrganization(org)
                        setShowTagOrganization(true)
                      }}
                    >
                      <Tag size={12} />
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      <Edit size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderTaggedOrganizations = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">Tagged Organizations Summary</div>
      </div>
      <div className="widget-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {['me', 'competitor', 'target', 'partner'].map(tag => {
            const count = organizations.filter(org => org.tag === tag).length
            return (
              <div key={tag} style={{
                padding: '1rem',
                border: '1px solid var(--gray-200)',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  {React.createElement(getTagIcon(tag), { size: 24 })}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: getTagColor(tag), marginBottom: '0.25rem' }}>
                  {count}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  {getTagLabel(tag)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'organizations':
        return renderOrganizations()
      case 'summary':
        return renderTaggedOrganizations()
      default:
        return renderOrganizations()
    }
  }

  return (
    <div className="page-container">
      {!hideHeader && (
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              Organization Tagger
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--gray-600)' }}>
              Tag and categorize healthcare organizations for targeted marketing campaigns
            </p>
          </div>
        </div>
      )}

      <div className="nav-tabs">
        <button
          onClick={() => setActiveTab('organizations')}
          className={`nav-tab ${activeTab === 'organizations' ? 'active' : ''}`}
        >
          Organizations
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`nav-tab ${activeTab === 'summary' ? 'active' : ''}`}
        >
          Summary
        </button>
      </div>

      <div className="page-content-area">
        {renderTabContent()}
      </div>

      {/* Tag Organization Modal */}
      {showTagOrganization && selectedOrganization && (
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
            width: '400px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                Tag Organization
              </h3>
              <button
                onClick={() => setShowTagOrganization(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                Tagging: <strong>{selectedOrganization.name}</strong>
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                {selectedOrganization.type} • {selectedOrganization.location}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['me', 'competitor', 'target', 'partner'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    // In a real app, this would update the organization's tag
                    console.log(`Tagging ${selectedOrganization.name} as ${tag}`)
                    setShowTagOrganization(false)
                  }}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.375rem',
                    background: 'transparent',
                    color: 'var(--gray-700)',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {React.createElement(getTagIcon(tag), { size: 16 })}
                  {getTagLabel(tag)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrganizationTagger
