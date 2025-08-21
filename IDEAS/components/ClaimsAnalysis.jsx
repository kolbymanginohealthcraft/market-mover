import React, { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Calendar,
  Download,
  Filter,
  Eye,
  PieChart,
  Activity,
  MapPin
} from 'lucide-react'

const ClaimsAnalysis = ({ selectedClient, selectedMarket }) => {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('overview')

  const claimsData = {
    totalClaims: selectedMarket ? Math.floor(1250000 * (selectedMarket.providers / 1000)) : 1250000,
    totalValue: selectedMarket ? Math.floor(8500000000 * (selectedMarket.providers / 1000)) : 8500000000,
    avgClaimValue: 6800,
    claimsGrowth: 12.3,
    topDiagnoses: [
      { diagnosis: 'Heart Failure', claims: 125000, value: 850000000, growth: 8.5 },
      { diagnosis: 'Pneumonia', claims: 98000, value: 650000000, growth: 15.2 },
      { diagnosis: 'Sepsis', claims: 75000, value: 520000000, growth: 22.1 },
      { diagnosis: 'Stroke', claims: 68000, value: 480000000, growth: 5.8 }
    ],
    claimsByPayer: [
      { payer: 'Medicare', claims: 528000, value: 3600000000, share: 42.3 },
      { payer: 'Blue Cross Blue Shield', claims: 234000, value: 1600000000, share: 18.7 },
      { payer: 'Aetna', claims: 151000, value: 1050000000, share: 12.1 },
      { payer: 'UnitedHealth', claims: 128000, value: 890000000, share: 10.2 }
    ],
    claimsTrends: [
      { month: 'Jan', claims: 98000, value: 680000000 },
      { month: 'Feb', claims: 102000, value: 720000000 },
      { month: 'Mar', claims: 108000, value: 760000000 },
      { month: 'Apr', claims: 112000, value: 800000000 },
      { month: 'May', claims: 118000, value: 840000000 },
      { month: 'Jun', claims: 125000, value: 900000000 }
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
                <div className="widget-title">Claims Volume & Value Trends</div>
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
                    <div>Claims trend visualization would appear here</div>
                    <div style={{ fontSize: '0.875rem' }}>Showing claims data over {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="widget">
                <div className="widget-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Claims</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <TrendingUp size={14} color="var(--success-green)" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--success-green)', fontWeight: '500' }}>
                        +{claimsData.claimsGrowth}%
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    {claimsData.totalClaims.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="widget">
                <div className="widget-body">
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Total Value</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    ${(claimsData.totalValue / 1000000000).toFixed(1)}B
                  </div>
                </div>
              </div>

              <div className="widget">
                <div className="widget-body">
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Avg Claim Value</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    ${claimsData.avgClaimValue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'diagnoses':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Top Diagnoses by Claims Volume</div>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Download size={14} />
                Export
              </button>
            </div>
            <div className="widget-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Diagnosis</th>
                    <th>Claims Count</th>
                    <th>Total Value</th>
                    <th>Growth</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claimsData.topDiagnoses.map((diagnosis, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>{diagnosis.diagnosis}</td>
                      <td>{diagnosis.claims.toLocaleString()}</td>
                      <td>${(diagnosis.value / 1000000).toFixed(0)}M</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: diagnosis.growth > 0 ? 'var(--success-green)' : 'var(--error-red)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {diagnosis.growth > 0 ? '+' : ''}{diagnosis.growth}%
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
      
      case 'payers':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Claims by Payer</div>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Download size={14} />
                Export
              </button>
            </div>
            <div className="widget-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Payer</th>
                    <th>Claims Count</th>
                    <th>Total Value</th>
                    <th>Market Share</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claimsData.claimsByPayer.map((payer, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>{payer.payer}</td>
                      <td>{payer.claims.toLocaleString()}</td>
                      <td>${(payer.value / 1000000000).toFixed(1)}B</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: 'var(--primary-teal)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {payer.share}%
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
    { id: 'diagnoses', label: 'Diagnoses', icon: FileText },
    { id: 'payers', label: 'Payers', icon: DollarSign }
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

export default ClaimsAnalysis
