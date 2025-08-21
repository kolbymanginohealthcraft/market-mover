import React, { useState } from 'react'
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  TrendingUp, 
  Users, 
  Building2, 
  Calendar,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react'

const ProviderDetails = ({ selectedClient, providerId, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview')

  // Mock provider data - in real implementation this would come from Market Mover API
  const provider = {
    id: providerId || 1,
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
    coordinates: { lat: 25.7617, lng: -80.1918 },
    ownership: 'For-Profit',
    medicareCertified: true,
    medicaidCertified: true,
    yearEstablished: 1998,
    licenseNumber: 'SNF-123456',
    administrator: 'Dr. Sarah Johnson',
    medicalDirector: 'Dr. Michael Chen',
    services: ['Skilled Nursing', 'Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Wound Care'],
    specialties: ['Post-Acute Care', 'Rehabilitation', 'Long-term Care'],
    qualityMetrics: {
      overallRating: 4.2,
      healthInspection: 4.0,
      staffing: 4.5,
      qualityMeasures: 4.1,
      lastInspection: '2024-01-15',
      nextInspection: '2024-07-15'
    },
    financialMetrics: {
      annualRevenue: 8500000,
      profitMargin: 12.5,
      occupancyRate: 94.2,
      averageLengthOfStay: 28.5
    },
    marketData: {
      marketShare: 8.5,
      competitorCount: 12,
      marketGrowth: 3.2,
      referralSources: ['Miami General Hospital', 'Coral Gables Medical Center', 'Home Health Agencies']
    },
    recentActivity: [
      { date: '2024-03-15', type: 'Quality Improvement', description: 'Implemented new fall prevention program' },
      { date: '2024-03-10', type: 'Staffing', description: 'Hired 3 new RNs to improve staffing ratios' },
      { date: '2024-03-05', type: 'Partnership', description: 'Signed agreement with Miami General Hospital' },
      { date: '2024-02-28', type: 'Certification', description: 'Renewed Medicare certification' }
    ]
  }

  const getQualityColor = (score) => {
    if (score >= 4.0) return 'var(--success-green)'
    if (score >= 3.0) return 'var(--warning-orange)'
    return 'var(--error-red)'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'quality', label: 'Quality Metrics', icon: Star },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'market', label: 'Market Data', icon: TrendingUp },
    { id: 'activity', label: 'Recent Activity', icon: Calendar }
  ]

  return (
    <div className="provider-details">
      {/* Header */}
      <div className="details-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Search
        </button>
        <div className="header-content">
          <div>
            <h1>{provider.name}</h1>
            <div className="provider-meta">
              <span className="provider-type">{provider.type}</span>
              <span className="provider-distance">{provider.distance} miles away</span>
              {provider.specialFocus && (
                <span className="special-focus">Special Focus Facility</span>
              )}
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline">Add to Segment</button>
            <button className="btn btn-primary">Contact Provider</button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Star size={20} style={{ color: getQualityColor(provider.qualityScore) }} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: getQualityColor(provider.qualityScore) }}>
              {provider.qualityScore}
            </div>
            <div className="stat-label">Quality Score</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{provider.bedCount}</div>
            <div className="stat-label">Licensed Beds</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{provider.readmissionRate}%</div>
            <div className="stat-label">Readmission Rate</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{provider.financialMetrics.occupancyRate}%</div>
            <div className="stat-label">Occupancy Rate</div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="contact-section">
        <h3>Contact Information</h3>
        <div className="contact-grid">
          <div className="contact-item">
            <MapPin size={16} />
            <span>{provider.address}</span>
          </div>
          <div className="contact-item">
            <Phone size={16} />
            <span>{provider.phone}</span>
          </div>
          <div className="contact-item">
            <Mail size={16} />
            <span>{provider.email}</span>
          </div>
          <div className="contact-item">
            <Globe size={16} />
            <span>{provider.website}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-section">
        <div className="tabs-header">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <div className="overview-grid">
                <div className="overview-card">
                  <h4>Basic Information</h4>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="label">Ownership:</span>
                      <span className="value">{provider.ownership}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Established:</span>
                      <span className="value">{provider.yearEstablished}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">License:</span>
                      <span className="value">{provider.licenseNumber}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Administrator:</span>
                      <span className="value">{provider.administrator}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Medical Director:</span>
                      <span className="value">{provider.medicalDirector}</span>
                    </div>
                  </div>
                </div>

                <div className="overview-card">
                  <h4>Certifications</h4>
                  <div className="certifications">
                    {provider.medicareCertified && (
                      <div className="certification-item">
                        <CheckCircle size={16} style={{ color: 'var(--success-green)' }} />
                        <span>Medicare Certified</span>
                      </div>
                    )}
                    {provider.medicaidCertified && (
                      <div className="certification-item">
                        <CheckCircle size={16} style={{ color: 'var(--success-green)' }} />
                        <span>Medicaid Certified</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overview-card">
                  <h4>Services & Specialties</h4>
                  <div className="services-list">
                    <h5>Services Offered:</h5>
                    <div className="tags">
                      {provider.services.map(service => (
                        <span key={service} className="tag">{service}</span>
                      ))}
                    </div>
                    <h5>Specialties:</h5>
                    <div className="tags">
                      {provider.specialties.map(specialty => (
                        <span key={specialty} className="tag specialty">{specialty}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="quality-content">
              <div className="quality-metrics">
                <div className="metric-card">
                  <h4>Overall Quality Rating</h4>
                  <div className="rating-display">
                    <Star size={32} style={{ color: getQualityColor(provider.qualityMetrics.overallRating) }} />
                    <span className="rating-value" style={{ color: getQualityColor(provider.qualityMetrics.overallRating) }}>
                      {provider.qualityMetrics.overallRating}
                    </span>
                  </div>
                </div>

                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">Health Inspection</span>
                    <span className="metric-value">{provider.qualityMetrics.healthInspection}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Staffing</span>
                    <span className="metric-value">{provider.qualityMetrics.staffing}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Quality Measures</span>
                    <span className="metric-value">{provider.qualityMetrics.qualityMeasures}</span>
                  </div>
                </div>

                <div className="inspection-info">
                  <h4>Inspection Information</h4>
                  <div className="inspection-details">
                    <div className="inspection-item">
                      <span className="label">Last Inspection:</span>
                      <span className="value">{provider.qualityMetrics.lastInspection}</span>
                    </div>
                    <div className="inspection-item">
                      <span className="label">Next Inspection:</span>
                      <span className="value">{provider.qualityMetrics.nextInspection}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="financial-content">
              <div className="financial-metrics">
                <div className="metric-card">
                  <h4>Financial Overview</h4>
                  <div className="financial-grid">
                    <div className="financial-item">
                      <span className="label">Annual Revenue</span>
                      <span className="value">{formatCurrency(provider.financialMetrics.annualRevenue)}</span>
                    </div>
                    <div className="financial-item">
                      <span className="label">Profit Margin</span>
                      <span className="value">{provider.financialMetrics.profitMargin}%</span>
                    </div>
                    <div className="financial-item">
                      <span className="label">Occupancy Rate</span>
                      <span className="value">{provider.financialMetrics.occupancyRate}%</span>
                    </div>
                    <div className="financial-item">
                      <span className="label">Avg Length of Stay</span>
                      <span className="value">{provider.financialMetrics.averageLengthOfStay} days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="market-content">
              <div className="market-metrics">
                <div className="metric-card">
                  <h4>Market Position</h4>
                  <div className="market-grid">
                    <div className="market-item">
                      <span className="label">Market Share</span>
                      <span className="value">{provider.marketData.marketShare}%</span>
                    </div>
                    <div className="market-item">
                      <span className="label">Competitors</span>
                      <span className="value">{provider.marketData.competitorCount}</span>
                    </div>
                    <div className="market-item">
                      <span className="label">Market Growth</span>
                      <span className="value">{provider.marketData.marketGrowth}%</span>
                    </div>
                  </div>
                </div>

                <div className="referral-sources">
                  <h4>Top Referral Sources</h4>
                  <div className="sources-list">
                    {provider.marketData.referralSources.map(source => (
                      <div key={source} className="source-item">
                        <Building2 size={16} />
                        <span>{source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-content">
              <div className="activity-timeline">
                <h4>Recent Activity</h4>
                <div className="timeline">
                  {provider.recentActivity.map((activity, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-marker">
                        <div className="marker-dot"></div>
                      </div>
                      <div className="timeline-content">
                        <div className="activity-header">
                          <span className="activity-type">{activity.type}</span>
                          <span className="activity-date">{activity.date}</span>
                        </div>
                        <p className="activity-description">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .provider-details {
          padding: 2rem;
        }

        .details-header {
          margin-bottom: 2rem;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--gray-600);
          cursor: pointer;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .back-button:hover {
          color: var(--gray-900);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .header-content h1 {
          margin: 0 0 0.5rem 0;
          color: var(--gray-900);
        }

        .provider-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .provider-type {
          background: var(--primary-teal);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .provider-distance {
          color: var(--gray-600);
          font-size: 0.875rem;
        }

        .special-focus {
          background: var(--warning-orange);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 0.5rem;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          background: var(--gray-100);
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-900);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        .contact-section {
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .contact-section h3 {
          margin: 0 0 1rem 0;
          color: var(--gray-900);
        }

        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--gray-700);
        }

        .contact-item svg {
          color: var(--gray-400);
        }

        .tabs-section {
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .tabs-header {
          display: flex;
          border-bottom: 1px solid var(--gray-200);
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          color: var(--gray-600);
          cursor: pointer;
          font-size: 0.875rem;
          border-bottom: 2px solid transparent;
        }

        .tab-button.active {
          color: var(--primary-teal);
          border-bottom-color: var(--primary-teal);
        }

        .tab-content {
          padding: 2rem;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .overview-card {
          border: 1px solid var(--gray-200);
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .overview-card h4 {
          margin: 0 0 1rem 0;
          color: var(--gray-900);
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-item .label {
          font-weight: 500;
          color: var(--gray-700);
        }

        .info-item .value {
          color: var(--gray-900);
        }

        .certifications {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .certification-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--gray-700);
        }

        .services-list h5 {
          margin: 0 0 0.5rem 0;
          color: var(--gray-700);
          font-size: 0.875rem;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .tag {
          background: var(--gray-100);
          color: var(--gray-700);
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
        }

        .tag.specialty {
          background: var(--primary-teal);
          color: white;
        }

        .quality-metrics {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .metric-card {
          border: 1px solid var(--gray-200);
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .metric-card h4 {
          margin: 0 0 1rem 0;
          color: var(--gray-900);
        }

        .rating-display {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .rating-value {
          font-size: 2rem;
          font-weight: 700;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--gray-50);
          border-radius: 0.375rem;
        }

        .metric-label {
          color: var(--gray-600);
          font-size: 0.875rem;
        }

        .metric-value {
          font-weight: 600;
          color: var(--gray-900);
        }

        .inspection-info {
          border: 1px solid var(--gray-200);
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .inspection-info h4 {
          margin: 0 0 1rem 0;
          color: var(--gray-900);
        }

        .inspection-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .inspection-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .financial-metrics {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .financial-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .financial-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--gray-50);
          border-radius: 0.375rem;
        }

        .market-metrics {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .market-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .market-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--gray-50);
          border-radius: 0.375rem;
        }

        .referral-sources {
          border: 1px solid var(--gray-200);
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .referral-sources h4 {
          margin: 0 0 1rem 0;
          color: var(--gray-900);
        }

        .sources-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .source-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--gray-700);
        }

        .activity-timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-timeline h4 {
          margin: 0 0 1rem 0;
          color: var(--gray-900);
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .timeline-item {
          display: flex;
          gap: 1rem;
        }

        .timeline-marker {
          position: relative;
        }

        .marker-dot {
          width: 12px;
          height: 12px;
          background: var(--primary-teal);
          border-radius: 50%;
          margin-top: 0.5rem;
        }

        .timeline-content {
          flex: 1;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .activity-type {
          font-weight: 600;
          color: var(--gray-900);
        }

        .activity-date {
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        .activity-description {
          margin: 0;
          color: var(--gray-700);
          line-height: 1.5;
        }
      `}</style>
    </div>
  )
}

export default ProviderDetails
