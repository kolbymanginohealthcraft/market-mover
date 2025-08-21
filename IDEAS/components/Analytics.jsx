import React, { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Mail, 
  Target, 
  Calendar,
  Download,
  Filter,
  Eye
} from 'lucide-react'

const Analytics = ({ selectedClient }) => {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('overview')

  const metrics = [
    { title: 'Total Emails Sent', value: '12,450', change: '+15%', trend: 'up' },
    { title: 'Open Rate', value: '24.3%', change: '+2.1%', trend: 'up' },
    { title: 'Click Rate', value: '3.2%', change: '+0.8%', trend: 'up' },
    { title: 'Conversion Rate', value: '1.8%', change: '-0.3%', trend: 'down' }
  ]

  const topCampaigns = [
    { name: 'Fall Wellness Newsletter', sent: '2,340', opens: '567', clicks: '89', rate: '24.2%' },
    { name: 'New Product Launch', sent: '1,890', opens: '423', clicks: '67', rate: '22.4%' },
    { name: 'Referral Partner Update', sent: '3,120', opens: '698', clicks: '112', rate: '22.4%' },
    { name: 'Holiday Greetings', sent: '2,100', opens: '441', clicks: '58', rate: '21.0%' }
  ]

  const segmentPerformance = [
    { segment: 'SNF Administrators', sent: '2,340', opens: '567', clicks: '89', rate: '24.2%' },
    { segment: 'Wound Care Specialists', sent: '1,890', opens: '423', clicks: '67', rate: '22.4%' },
    { segment: 'Discharge Planners', sent: '3,120', opens: '698', clicks: '112', rate: '22.4%' },
    { segment: 'Rehab Directors', sent: '1,450', opens: '312', clicks: '45', rate: '21.5%' }
  ]

  const renderMetricContent = () => {
    switch (selectedMetric) {
      case 'overview':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            {/* Main Chart Area */}
            <div className="widget">
              <div className="widget-header">
                <div className="widget-title">Campaign Performance</div>
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
                    <div>Chart visualization would appear here</div>
                    <div style={{ fontSize: '0.875rem' }}>Showing performance over {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {metrics.map((metric, index) => (
                <div key={index} className="widget">
                  <div className="widget-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{metric.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <TrendingUp size={14} color={metric.trend === 'up' ? 'var(--primary-teal)' : 'var(--red-500)'} />
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: metric.trend === 'up' ? 'var(--primary-teal)' : 'var(--red-500)',
                          fontWeight: '500'
                        }}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                      {metric.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'campaigns':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Top Performing Campaigns</div>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Download size={14} />
                Export
              </button>
            </div>
            <div className="widget-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Sent</th>
                    <th>Opens</th>
                    <th>Clicks</th>
                    <th>Open Rate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((campaign, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>{campaign.name}</td>
                      <td>{campaign.sent}</td>
                      <td>{campaign.opens}</td>
                      <td>{campaign.clicks}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: 'var(--primary-teal)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {campaign.rate}
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
      
      case 'segments':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Segment Performance</div>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Download size={14} />
                Export
              </button>
            </div>
            <div className="widget-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Segment</th>
                    <th>Sent</th>
                    <th>Opens</th>
                    <th>Clicks</th>
                    <th>Open Rate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {segmentPerformance.map((segment, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>{segment.segment}</td>
                      <td>{segment.sent}</td>
                      <td>{segment.opens}</td>
                      <td>{segment.clicks}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: 'var(--primary-teal)', 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {segment.rate}
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
    { id: 'campaigns', label: 'Campaigns', icon: Mail },
    { id: 'segments', label: 'Segments', icon: Target }
  ]

  return (
    <div>
      {/* Navigation Tabs */}
      <div style={{ marginBottom: '2rem' }}>
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

export default Analytics
