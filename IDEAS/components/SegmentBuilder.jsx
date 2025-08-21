import React, { useState } from 'react'
import { 
  Filter, 
  Plus, 
  X, 
  Search, 
  MapPin, 
  Building2, 
  Users, 
  Target, 
  Star, 
  Shield,
  FileText,
  TrendingUp,
  DollarSign,
  Heart,
  Network,
  Bookmark,
  Eye,
  Save,
  Trash2
} from 'lucide-react'

const SegmentBuilder = ({ onSave, onCancel, initialSegment = null }) => {
  const [segmentName, setSegmentName] = useState(initialSegment?.name || '')
  const [segmentDescription, setSegmentDescription] = useState(initialSegment?.description || '')
  const [criteria, setCriteria] = useState(initialSegment?.criteria || [])
  const [activeTab, setActiveTab] = useState('global')
  const [searchTerm, setSearchTerm] = useState('')

  // Global criteria (always available)
  const globalCriteria = [
    {
      id: 'tagged-providers',
      name: 'Tagged Providers',
      description: 'Filter by provider tags (me, competitor, target, partner)',
      icon: Target,
      options: [
        { value: 'me', label: 'Our Organization' },
        { value: 'competitor', label: 'Competitors' },
        { value: 'target', label: 'Targets' },
        { value: 'partner', label: 'Partners' }
      ]
    },
    {
      id: 'suppressed-domains',
      name: 'Suppressed Domains',
      description: 'Exclude contacts from specific email domains',
      icon: Shield,
      options: [
        { value: 'custom', label: 'Custom Domain List' },
        { value: 'competitor-domains', label: 'Competitor Domains' }
      ]
    },
    {
      id: 'contact-status',
      name: 'Contact Status',
      description: 'Filter by contact engagement status',
      icon: Users,
      options: [
        { value: 'active', label: 'Active Contacts' },
        { value: 'inactive', label: 'Inactive Contacts' },
        { value: 'unsubscribed', label: 'Unsubscribed' }
      ]
    }
  ]

  // Market-specific criteria (from saved markets)
  const marketCriteria = [
    {
      id: 'geographic-radius',
      name: 'Geographic Radius',
      description: 'Filter by distance from saved market centers',
      icon: MapPin,
      options: [
        { value: '5-mile', label: 'Within 5 miles' },
        { value: '10-mile', label: 'Within 10 miles' },
        { value: '25-mile', label: 'Within 25 miles' },
        { value: '50-mile', label: 'Within 50 miles' }
      ]
    },
    {
      id: 'market-type',
      name: 'Market Type',
      description: 'Filter by market characteristics',
      icon: Building2,
      options: [
        { value: 'urban', label: 'Urban Markets' },
        { value: 'suburban', label: 'Suburban Markets' },
        { value: 'rural', label: 'Rural Markets' }
      ]
    }
  ]

  // Market Mover data criteria (from insights)
  const marketMoverCriteria = [
    {
      id: 'cpt-procedures',
      name: 'CPT Procedure Codes',
      description: 'Filter by providers using specific procedure codes',
      icon: FileText,
      options: [
        { value: 'high-usage', label: 'High Usage Providers' },
        { value: 'low-usage', label: 'Low Usage Providers' },
        { value: 'specific-codes', label: 'Specific CPT Codes' }
      ]
    },
    {
      id: 'quality-metrics',
      name: 'Quality Metrics',
      description: 'Filter by provider quality scores',
      icon: Star,
      options: [
        { value: 'high-quality', label: 'High Quality (4.0+)' },
        { value: 'medium-quality', label: 'Medium Quality (3.0-4.0)' },
        { value: 'low-quality', label: 'Low Quality (<3.0)' }
      ]
    },
    {
      id: 'readmission-rates',
      name: 'Readmission Rates',
      description: 'Filter by hospital readmission performance',
      icon: TrendingUp,
      options: [
        { value: 'low-readmission', label: 'Low Readmission Rate' },
        { value: 'high-readmission', label: 'High Readmission Rate' }
      ]
    },
    {
      id: 'payer-networks',
      name: 'Payer Networks',
      description: 'Filter by insurance network participation',
      icon: Network,
      options: [
        { value: 'medicare', label: 'Medicare Participating' },
        { value: 'medicaid', label: 'Medicaid Participating' },
        { value: 'commercial', label: 'Commercial Insurance' }
      ]
    },
    {
      id: 'special-focus',
      name: 'Special Focus Designations',
      description: 'Filter by special focus facility status',
      icon: Eye,
      options: [
        { value: 'special-focus', label: 'Special Focus Facilities' },
        { value: 'non-special-focus', label: 'Non-Special Focus' }
      ]
    },
    {
      id: 'financial-metrics',
      name: 'Financial Metrics',
      description: 'Filter by financial performance indicators',
      icon: DollarSign,
      options: [
        { value: 'high-revenue', label: 'High Revenue Providers' },
        { value: 'low-revenue', label: 'Low Revenue Providers' },
        { value: 'profitable', label: 'Profitable Providers' }
      ]
    }
  ]

  const getCriteriaByTab = () => {
    switch (activeTab) {
      case 'global':
        return globalCriteria
      case 'market':
        return marketCriteria
      case 'market-mover':
        return marketMoverCriteria
      default:
        return globalCriteria
    }
  }

  const addCriterion = (criterion) => {
    const newCriterion = {
      id: `${criterion.id}-${Date.now()}`,
      type: criterion.id,
      name: criterion.name,
      value: '',
      operator: 'equals',
      options: criterion.options
    }
    setCriteria([...criteria, newCriterion])
  }

  const removeCriterion = (criterionId) => {
    setCriteria(criteria.filter(c => c.id !== criterionId))
  }

  const updateCriterion = (criterionId, field, value) => {
    setCriteria(criteria.map(c => 
      c.id === criterionId ? { ...c, [field]: value } : c
    ))
  }

  const handleSave = () => {
    if (!segmentName.trim()) {
      alert('Please enter a segment name')
      return
    }
    
    const segment = {
      id: initialSegment?.id || Date.now(),
      name: segmentName,
      description: segmentDescription,
      criteria: criteria,
      category: 'custom',
      contactCount: 0, // Will be calculated
      performance: 0,
      lastUsed: new Date().toISOString().split('T')[0]
    }
    
    onSave(segment)
  }

  const filteredCriteria = getCriteriaByTab().filter(criterion =>
    criterion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    criterion.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
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
        width: '90vw',
        maxWidth: '1200px',
        height: '90vh',
        maxHeight: '800px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
              {initialSegment ? 'Edit Segment' : 'Create New Segment'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Build a segment using criteria from multiple sources
            </p>
          </div>
          <button 
            onClick={onCancel}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '1.5rem',
              color: 'var(--gray-500)'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel - Criteria Selection */}
          <div style={{ 
            width: '400px', 
            borderRight: '1px solid var(--gray-200)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Segment Info */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem', display: 'block' }}>
                  Segment Name
                </label>
                <input
                  type="text"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="Enter segment name..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem', display: 'block' }}>
                  Description
                </label>
                <textarea
                  value={segmentDescription}
                  onChange={(e) => setSegmentDescription(e.target.value)}
                  placeholder="Describe this segment..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Criteria Tabs */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => setActiveTab('global')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    background: activeTab === 'global' ? 'var(--primary-teal)' : 'var(--gray-100)',
                    color: activeTab === 'global' ? 'white' : 'var(--gray-700)',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Global
                </button>
                <button
                  onClick={() => setActiveTab('market')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    background: activeTab === 'market' ? 'var(--primary-teal)' : 'var(--gray-100)',
                    color: activeTab === 'market' ? 'white' : 'var(--gray-700)',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Market
                </button>
                <button
                  onClick={() => setActiveTab('market-mover')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    background: activeTab === 'market-mover' ? 'var(--primary-teal)' : 'var(--gray-100)',
                    color: activeTab === 'market-mover' ? 'white' : 'var(--gray-700)',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Market Mover
                </button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={16} style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--gray-400)' 
                }} />
                <input
                  type="text"
                  placeholder="Search criteria..."
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
            </div>

            {/* Criteria List */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredCriteria.map((criterion) => {
                  const Icon = criterion.icon
                  return (
                    <div
                      key={criterion.id}
                      onClick={() => addCriterion(criterion)}
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--gray-200)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: 'var(--white)'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-50)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--white)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Icon size={20} color="var(--primary-teal)" />
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                          {criterion.name}
                        </h4>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                        {criterion.description}
                      </p>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {criterion.options.slice(0, 3).map((option, index) => (
                          <span key={index} style={{
                            padding: '0.125rem 0.5rem',
                            backgroundColor: 'var(--gray-100)',
                            color: 'var(--gray-700)',
                            borderRadius: '0.25rem',
                            fontSize: '0.625rem',
                            fontWeight: '500'
                          }}>
                            {option.label}
                          </span>
                        ))}
                        {criterion.options.length > 3 && (
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            backgroundColor: 'var(--gray-100)',
                            color: 'var(--gray-700)',
                            borderRadius: '0.25rem',
                            fontSize: '0.625rem',
                            fontWeight: '500'
                          }}>
                            +{criterion.options.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Panel - Selected Criteria */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                Segment Criteria ({criteria.length})
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                Configure the criteria for your segment
              </p>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
              {criteria.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem', 
                  color: 'var(--gray-500)' 
                }}>
                  <Filter size={48} style={{ marginBottom: '1rem' }} />
                  <h3>No criteria selected</h3>
                  <p>Click on criteria from the left panel to build your segment</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {criteria.map((criterion, index) => (
                    <div key={criterion.id} style={{
                      padding: '1rem',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                            {criterion.name}
                          </h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                            Criterion {index + 1}
                          </p>
                        </div>
                        <button
                          onClick={() => removeCriterion(criterion.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--gray-400)',
                            padding: '0.25rem'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem', display: 'block' }}>
                            Operator
                          </label>
                          <select
                            value={criterion.operator}
                            onChange={(e) => updateCriterion(criterion.id, 'operator', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid var(--gray-300)',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem'
                            }}
                          >
                            <option value="equals">Equals</option>
                            <option value="not-equals">Not Equals</option>
                            <option value="contains">Contains</option>
                            <option value="greater-than">Greater Than</option>
                            <option value="less-than">Less Than</option>
                            <option value="in">In</option>
                            <option value="not-in">Not In</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem', display: 'block' }}>
                            Value
                          </label>
                          <select
                            value={criterion.value}
                            onChange={(e) => updateCriterion(criterion.id, 'value', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid var(--gray-300)',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem'
                            }}
                          >
                            <option value="">Select value...</option>
                            {criterion.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem', display: 'block' }}>
                            Logic
                          </label>
                          <select
                            defaultValue="and"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid var(--gray-300)',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem'
                            }}
                          >
                            <option value="and">AND</option>
                            <option value="or">OR</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--gray-200)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={!segmentName.trim()}
          >
            <Save size={16} />
            {initialSegment ? 'Update Segment' : 'Create Segment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SegmentBuilder
