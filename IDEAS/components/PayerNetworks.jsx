import React, { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  Eye,
  PieChart,
  Activity,
  MapPin
} from 'lucide-react'

const PayerNetworks = ({ selectedClient, selectedMarket }) => {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('overview')

  const payerData = {
    totalPayers: selectedMarket ? Math.floor(selectedMarket.providers * 0.3) : 375,
    totalValue: selectedMarket ? Math.floor(8500000000 * (selectedMarket.providers / 1000)) : 8500000000,
    avgNetworkSize: selectedMarket ? Math.floor(selectedMarket.providers * 0.8) : 1000,
    networkGrowth: 15.2,
    topPayers: [
      { payer: 'Medicare', providers: selectedMarket ? Math.floor(selectedMarket.providers * 0.9) : 1125, value: 3600000000, share: 42.3 },
      { payer: 'Blue Cross Blue Shield', providers: selectedMarket ? Math.floor(selectedMarket.providers * 0.7) : 875, value: 1600000000, share: 18.7 },
      { payer: 'Aetna', providers: selectedMarket ? Math.floor(selectedMarket.providers * 0.5) : 625, value: 1050000000, share: 12.1 },
      { payer: 'UnitedHealth', providers: selectedMarket ? Math.floor(selectedMarket.providers * 0.4) : 500, value: 890000000, share: 10.2 }
    ],
    networkByType: [
      { type: 'Commercial', payers: 156, providers: 2340, value: 3200000000 },
      { type: 'Medicare', payers: 89, providers: 1890, value: 2800000000 },
      { type: 'Medicaid', payers: 67, providers: 1450, value: 1800000000 },
      { type: 'Self-Pay', payers: 23, providers: 890, value: 700000000 }
    ],
    networkTrends: [
      { month: 'Jan', payers: 320, providers: 2400, value: 7200000000 },
      { month: 'Feb', payers: 325, providers: 2420, value: 7300000000 },
      { month: 'Mar', payers: 330, providers: 2440, value: 7400000000 },
      { month: 'Apr', payers: 335, providers: 2460, value: 7500000000 },
      { month: 'May', payers: 340, providers: 2480, value: 7600000000 },
      { month: 'Jun', payers: 345, providers: 2500, value: 7700000000 }
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
                <div className="widget-title">Payer Network Growth</div>
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
                    <div>Payer network growth visualization would appear here</div>
                    <div style={{ fontSize: '0.875rem' }}>Showing network data over {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="widget">
                <div className="widget-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Payers</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <TrendingUp size={14} color="var(--success-green)" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--success-green)', fontWeight: '500' }}>
                        +{payerData.networkGrowth}%
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    {payerData.totalPayers}
                  </div>
                </div>
              </div>

              <div className="widget">
                <div className="widget-body">
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Network Value</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    ${(payerData.totalValue / 1000000000).toFixed(1)}B
                  </div>
                </div>
              </div>

              <div className="widget">
                <div className="widget-body">
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Avg Network Size</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    {payerData.avgNetworkSize}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'payers':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Top Payer Networks</div>
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
                    <th>Network Size</th>
                    <th>Market Share</th>
                    <th>Claims Value</th>
                    <th>Growth</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payerData.topPayers.map((payer, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>{payer.payer}</td>
                      <td>{payer.providers.toLocaleString()}</td>
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
                      <td>${(payer.value / 1000000000).toFixed(1)}B</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: payer.growth > 0 ? 'var(--success-green)' : 'var(--error-red)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {payer.growth > 0 ? '+' : ''}{payer.growth}%
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
      
      case 'regions':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Networks by Region</div>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Download size={14} />
                Export
              </button>
            </div>
            <div className="widget-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Payers</th>
                    <th>Providers</th>
                    <th>Avg Network Value</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payerData.networkByType.map((region, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>{region.type}</td>
                      <td>{region.payers}</td>
                      <td>{region.providers.toLocaleString()}</td>
                      <td>${(region.value / 1000000000).toFixed(1)}B</td>
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
    { id: 'payers', label: 'Top Payers', icon: Shield },
    { id: 'regions', label: 'By Region', icon: MapPin }
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

export default PayerNetworks
