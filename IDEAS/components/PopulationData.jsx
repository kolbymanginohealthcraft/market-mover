import React, { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Calendar,
  Download,
  Filter,
  Eye,
  PieChart,
  Activity
} from 'lucide-react'

const PopulationData = ({ selectedClient, selectedMarket }) => {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('overview')

  const populationData = {
    totalPopulation: selectedMarket ? selectedMarket.population : 8500000,
    growthRate: 2.3,
    avgAge: 42.5,
    medianIncome: 65000,
    topDemographics: [
      { group: 'Age 65+', population: selectedMarket ? Math.floor(selectedMarket.population * 0.18) : 1530000, share: 18.2, growth: 3.2 },
      { group: 'Age 45-64', population: selectedMarket ? Math.floor(selectedMarket.population * 0.28) : 2380000, share: 28.1, growth: 1.8 },
      { group: 'Age 25-44', population: selectedMarket ? Math.floor(selectedMarket.population * 0.32) : 2720000, share: 32.0, growth: 2.1 },
      { group: 'Age 0-24', population: selectedMarket ? Math.floor(selectedMarket.population * 0.22) : 1870000, share: 21.7, growth: 1.5 }
    ],
    populationByRegion: [
      { region: 'Urban', population: selectedMarket ? Math.floor(selectedMarket.population * 0.65) : 5525000, density: 2500, growth: 2.8 },
      { region: 'Suburban', population: selectedMarket ? Math.floor(selectedMarket.population * 0.25) : 2125000, density: 850, growth: 1.9 },
      { region: 'Rural', population: selectedMarket ? Math.floor(selectedMarket.population * 0.10) : 850000, density: 150, growth: 0.8 }
    ],
    populationTrends: [
      { month: 'Jan', population: 8400000, growth: 1.8 },
      { month: 'Feb', population: 8420000, growth: 2.0 },
      { month: 'Mar', population: 8440000, growth: 2.1 },
      { month: 'Apr', population: 8460000, growth: 2.2 },
      { month: 'May', population: 8480000, growth: 2.3 },
      { month: 'Jun', population: 8500000, growth: 2.3 }
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
                <div className="widget-title">Population Growth Trends</div>
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
                    <div>Population growth visualization would appear here</div>
                    <div style={{ fontSize: '0.875rem' }}>Showing population data over {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="widget">
                <div className="widget-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Population</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <TrendingUp size={14} color="var(--success-green)" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--success-green)', fontWeight: '500' }}>
                        +{populationData.growthRate}%
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    {(populationData.totalPopulation / 1000000).toFixed(1)}M
                  </div>
                </div>
              </div>

              <div className="widget">
                <div className="widget-body">
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Average Age</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    {populationData.avgAge}
                  </div>
                </div>
              </div>

              <div className="widget">
                <div className="widget-body">
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Median Income</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    ${populationData.medianIncome.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'age':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Population by Age Group</div>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Download size={14} />
                Export
              </button>
            </div>
            <div className="widget-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Age Group</th>
                    <th>Population</th>
                    <th>Percentage</th>
                    <th>Growth</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {populationData.topDemographics.map((demographic, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>{demographic.group}</td>
                      <td>{(demographic.population / 1000000).toFixed(1)}M</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: 'var(--primary-teal)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {demographic.share}%
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: demographic.growth > 0 ? 'var(--success-green)' : 'var(--error-red)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {demographic.growth > 0 ? '+' : ''}{demographic.growth}%
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
              <div className="widget-title">Population by Region</div>
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
                    <th>Population</th>
                    <th>Density (per sq mi)</th>
                    <th>Growth</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {populationData.populationByRegion.map((region, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>{region.region}</td>
                      <td>{(region.population / 1000000).toFixed(1)}M</td>
                      <td>{region.density.toLocaleString()}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: region.growth > 0 ? 'var(--success-green)' : 'var(--error-red)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {region.growth > 0 ? '+' : ''}{region.growth}%
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
    { id: 'age', label: 'By Age Group', icon: Users },
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

export default PopulationData
