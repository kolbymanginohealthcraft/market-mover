import React, { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Star, 
  Award, 
  Calendar,
  Download,
  Filter,
  Eye,
  PieChart,
  Activity,
  MapPin
} from 'lucide-react'

const QualityMetrics = ({ selectedClient, selectedMarket }) => {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('overview')

  const qualityData = {
    avgQualityScore: selectedMarket ? 4.2 + (Math.random() * 0.6) : 4.2,
    totalProviders: selectedMarket ? selectedMarket.providers : 1250,
    highQualityProviders: selectedMarket ? Math.floor(selectedMarket.providers * 0.65) : 812,
    qualityImprovement: 8.5,
    topMetrics: [
      { metric: 'Patient Satisfaction', score: 4.6, trend: '+12%', providers: 234 },
      { metric: 'Clinical Outcomes', score: 4.3, trend: '+8%', providers: 189 },
      { metric: 'Safety Standards', score: 4.8, trend: '+15%', providers: 156 },
      { metric: 'Care Coordination', score: 4.1, trend: '+6%', providers: 98 }
    ],
    qualityByProviderType: [
      { type: 'Skilled Nursing', score: 4.2, providers: 456, improvement: 12.3 },
      { type: 'Rehabilitation', score: 4.5, providers: 234, improvement: 8.7 },
      { type: 'Home Health', score: 4.1, providers: 189, improvement: 15.2 },
      { type: 'Hospice', score: 4.7, providers: 123, improvement: 6.8 }
    ],
    qualityTrends: [
      { month: 'Jan', avgScore: 4.0, providers: 1200 },
      { month: 'Feb', avgScore: 4.1, providers: 1220 },
      { month: 'Mar', avgScore: 4.2, providers: 1240 },
      { month: 'Apr', avgScore: 4.3, providers: 1260 },
      { month: 'May', avgScore: 4.2, providers: 1280 },
      { month: 'Jun', avgScore: 4.4, providers: 1300 }
    ]
  }

  const renderMetricContent = () => {
    switch (selectedMetric) {
      case 'overview':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            {/* Main Chart Area */}
            <div className="widget">
              <div className="widget-header">
                <div className="widget-title">Quality Score Trends</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="form-select"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                    <Download size={14} />
                  </button>
                </div>
              </div>
              <div className="widget-body">
                <div style={{ 
                  height: '300px', 
                  backgroundColor: 'var(--gray-50)', 
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed var(--gray-300)'
                }}>
                  <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                    <BarChart3 size={48} style={{ marginBottom: '1rem' }} />
                    <div>Quality score trend visualization would appear here</div>
                    <div style={{ fontSize: '0.875rem' }}>Showing quality data over {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="widget">
                <div className="widget-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Avg Quality Score</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <TrendingUp size={14} color="var(--success-green)" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--success-green)', fontWeight: '500' }}>
                        +{qualityData.qualityImprovement}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    {qualityData.avgQualityScore}
                  </div>
                </div>
              </div>

              <div className="widget">
                <div className="widget-body">
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Providers Above 3.0</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success-green)' }}>
                    {qualityData.highQualityProviders.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="widget">
                <div className="widget-body">
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Providers Below 3.0</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--error-red)' }}>
                    {qualityData.totalProviders - qualityData.highQualityProviders}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'providers':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Top Quality Providers</div>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Download size={14} />
                Export
              </button>
            </div>
            <div className="widget-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Quality Score</th>
                    <th>Improvement</th>
                    <th>Claims Volume</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {qualityData.topMetrics.map((provider, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>{provider.metric}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: provider.score >= 4.5 ? 'var(--success-green)' : 'var(--warning-orange)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {provider.score}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: provider.trend.includes('+') ? 'var(--success-green)' : 'var(--error-red)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {provider.trend}
                        </span>
                      </td>
                      <td>{provider.providers.toLocaleString()}</td>
                      <td>
                        <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      
      case 'specialties':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Quality by Provider Type</div>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Download size={14} />
                Export
              </button>
            </div>
            <div className="widget-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Provider Type</th>
                    <th>Avg Quality Score</th>
                    <th>Providers</th>
                    <th>Improvement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {qualityData.qualityByProviderType.map((providerType, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>{providerType.type}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: providerType.score >= 4.0 ? 'var(--success-green)' : 'var(--warning-orange)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {providerType.score}
                        </span>
                      </td>
                      <td>{providerType.providers}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: providerType.improvement > 0 ? 'var(--success-green)' : 'var(--error-red)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {providerType.improvement > 0 ? '+' : ''}{providerType.improvement}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  const metricTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'providers', label: 'Top Providers', icon: Star },
    { id: 'specialties', label: 'By Specialty', icon: Award }
  ]

  return (
    <div className="page-container">
             {/* Market Context Header */}
       {selectedMarket && (
         <div className="market-context-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} />
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                Viewing data for {selectedMarket.name}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                {selectedMarket.location} • {selectedMarket.radius} mile radius • {selectedMarket.providers.toLocaleString()} providers
              </div>
            </div>
          </div>
          <button 
            className="btn btn-secondary"
            style={{ 
              fontSize: '0.75rem', 
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white'
            }}
            onClick={() => {
              // This would clear the selected market and show national data
              if (window.confirm('Switch to national data view?')) {
                // In a real app, this would call setSelectedMarket(null)
                console.log('Switching to national data view')
              }
            }}
          >
            View National Data
          </button>
        </div>
      )}



             {/* Metric Tabs */}
       <div className="nav-tabs">
         <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          {metricTabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedMetric(tab.id)}
                style={{
                  padding: '1rem 1.5rem',
                  border: 'none',
                  background: 'transparent',
                  color: selectedMetric === tab.id ? 'var(--primary-teal)' : 'var(--gray-600)',
                  cursor: 'pointer',
                  fontWeight: selectedMetric === tab.id ? '600' : '400',
                  fontSize: '0.875rem',
                  borderBottom: selectedMetric === tab.id ? '2px solid var(--primary-teal)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

             {/* Content */}
       <div className="page-content-area">
         {renderMetricContent()}
       </div>
    </div>
  )
}

export default QualityMetrics
