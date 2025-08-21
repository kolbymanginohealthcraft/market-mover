import React, { useState } from 'react'
import { 
  Users, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy,
  BarChart3,
  Mail,
  Target,
  TrendingUp,
  Eye,
  Settings,
  Search,
  Tag,
  UserCheck,
  Building2,
  GraduationCap,
  Stethoscope,
  Briefcase,
  MapPin,
  Calendar,
  PieChart,
  Activity
} from 'lucide-react'

const ContactSegments = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSegment, setSelectedSegment] = useState(null)
  const [showCreateSegment, setShowCreateSegment] = useState(false)

  // Sample segments data
  const segments = [
    {
      id: 1,
      name: 'SNF Administrators',
      description: 'Skilled Nursing Facility administrators and decision makers',
      category: 'healthcare',
      criteria: [
        { field: 'job_title', operator: 'contains', value: 'administrator' },
        { field: 'industry', operator: 'equals', value: 'healthcare' },
        { field: 'facility_type', operator: 'equals', value: 'SNF' }
      ],
      contactCount: 1247,
      emailOpenRate: 28.5,
      clickRate: 4.2,
      conversionRate: 2.1,
      lastUsed: '2024-01-15',
      createdBy: 'Sarah Johnson',
      tags: ['healthcare', 'decision-makers', 'high-value']
    },
    {
      id: 2,
      name: 'Rehab Directors',
      description: 'Rehabilitation department directors and managers',
      category: 'healthcare',
      criteria: [
        { field: 'job_title', operator: 'contains', value: 'rehab' },
        { field: 'job_title', operator: 'contains', value: 'director' },
        { field: 'industry', operator: 'equals', value: 'healthcare' }
      ],
      contactCount: 892,
      emailOpenRate: 32.1,
      clickRate: 5.8,
      conversionRate: 3.4,
      lastUsed: '2024-01-12',
      createdBy: 'Mike Rodriguez',
      tags: ['healthcare', 'rehabilitation', 'management']
    },
    {
      id: 3,
      name: 'Medical Supply Purchasers',
      description: 'Healthcare professionals responsible for medical supply procurement',
      category: 'suppliers',
      criteria: [
        { field: 'job_title', operator: 'contains', value: 'purchasing' },
        { field: 'job_title', operator: 'contains', value: 'procurement' },
        { field: 'industry', operator: 'equals', value: 'healthcare' }
      ],
      contactCount: 1563,
      emailOpenRate: 25.7,
      clickRate: 3.9,
      conversionRate: 1.8,
      lastUsed: '2024-01-10',
      createdBy: 'Alex Kim',
      tags: ['suppliers', 'purchasing', 'procurement']
    },
    {
      id: 4,
      name: 'Physician Practice Managers',
      description: 'Practice managers and administrators in physician offices',
      category: 'healthcare',
      criteria: [
        { field: 'job_title', operator: 'contains', value: 'practice manager' },
        { field: 'facility_type', operator: 'equals', value: 'physician_office' }
      ],
      contactCount: 2341,
      emailOpenRate: 26.3,
      clickRate: 4.7,
      conversionRate: 2.3,
      lastUsed: '2024-01-08',
      createdBy: 'Sarah Johnson',
      tags: ['healthcare', 'physicians', 'management']
    },
    {
      id: 5,
      name: 'Home Health Agencies',
      description: 'Home health agency owners and administrators',
      category: 'healthcare',
      criteria: [
        { field: 'facility_type', operator: 'equals', value: 'home_health' },
        { field: 'job_title', operator: 'contains', value: 'owner' }
      ],
      contactCount: 567,
      emailOpenRate: 35.2,
      clickRate: 6.1,
      conversionRate: 4.2,
      lastUsed: '2024-01-05',
      createdBy: 'Mike Rodriguez',
      tags: ['healthcare', 'home-health', 'owners']
    }
  ]

  // Aggregate contact data by various categories
  const contactBreakdown = {
    byFirmType: [
      { type: 'Skilled Nursing Facility', count: 2847, openRate: 29.2, clickRate: 4.8, addedThisMonth: 156 },
      { type: 'Physician Practice', count: 2341, openRate: 26.3, clickRate: 4.7, addedThisMonth: 89 },
      { type: 'Home Health Agency', count: 1567, openRate: 35.2, clickRate: 6.1, addedThisMonth: 234 },
      { type: 'Hospital', count: 1892, openRate: 31.8, clickRate: 5.2, addedThisMonth: 67 },
      { type: 'Medical Supply Company', count: 1245, openRate: 24.1, clickRate: 3.9, addedThisMonth: 45 },
      { type: 'Rehabilitation Center', count: 892, openRate: 32.1, clickRate: 5.8, addedThisMonth: 123 }
    ],
    byJobTitle: [
      { title: 'Administrator', count: 1247, openRate: 28.5, clickRate: 4.2, addedThisMonth: 78 },
      { title: 'Director', count: 892, openRate: 32.1, clickRate: 5.8, addedThisMonth: 45 },
      { title: 'Manager', count: 2341, openRate: 26.3, clickRate: 4.7, addedThisMonth: 156 },
      { title: 'Owner', count: 567, openRate: 35.2, clickRate: 6.1, addedThisMonth: 34 },
      { title: 'Purchasing Agent', count: 1563, openRate: 25.7, clickRate: 3.9, addedThisMonth: 89 },
      { title: 'Medical Director', count: 445, openRate: 38.9, clickRate: 7.2, addedThisMonth: 23 }
    ],
    byState: [
      { state: 'Texas', count: 2847, openRate: 29.2, clickRate: 4.8, addedThisMonth: 234 },
      { state: 'Florida', count: 2341, openRate: 26.3, clickRate: 4.7, addedThisMonth: 189 },
      { state: 'California', count: 1892, openRate: 31.8, clickRate: 5.2, addedThisMonth: 156 },
      { state: 'New York', count: 1567, openRate: 35.2, clickRate: 6.1, addedThisMonth: 123 },
      { state: 'Illinois', count: 1245, openRate: 24.1, clickRate: 3.9, addedThisMonth: 89 },
      { state: 'Pennsylvania', count: 892, openRate: 32.1, clickRate: 5.8, addedThisMonth: 67 }
    ],
    byIndustry: [
      { industry: 'Healthcare', count: 7847, openRate: 29.8, clickRate: 5.1, addedThisMonth: 456 },
      { industry: 'Medical Supplies', count: 1245, openRate: 24.1, clickRate: 3.9, addedThisMonth: 89 },
      { industry: 'Rehabilitation', count: 892, openRate: 32.1, clickRate: 5.8, addedThisMonth: 123 },
      { industry: 'Home Health', count: 567, openRate: 35.2, clickRate: 6.1, addedThisMonth: 78 }
    ]
  }

  const categories = [
    { id: 'healthcare', name: 'Healthcare', icon: Stethoscope, color: 'var(--primary-teal)' },
    { id: 'suppliers', name: 'Suppliers', icon: Building2, color: 'var(--primary-teal-dark)' },
    { id: 'education', name: 'Education', icon: GraduationCap, color: 'var(--accent-yellow)' },
    { id: 'business', name: 'Business', icon: Briefcase, color: 'var(--secondary-blue)' }
  ]

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.icon : Users
  }

  const getCategoryColor = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.color || 'var(--gray-500)'
  }

  const getPerformanceColor = (rate) => {
    if (rate >= 30) return 'var(--primary-teal)'
    if (rate >= 20) return 'var(--accent-yellow)'
    return 'var(--error-red)'
  }

  const formatNumber = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const renderOverviewTab = () => (
    <div className="overview-container">
      {/* Quick Stats */}
      <div className="dashboard-grid">
        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Users size={20} />
              <span>Total Contacts</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              10.7K
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              Active contacts in database
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Calendar size={20} />
              <span>Added This Month</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              +746
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              New contacts added
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Mail size={20} />
              <span>Avg. Open Rate</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              29.8%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              Across all segments
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <TrendingUp size={20} />
              <span>Avg. Click Rate</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              5.1%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              Across all segments
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Sections */}
      <div style={{ marginTop: '2rem' }}>
        <div className="breakdown-section">
          <h3>By Firm Type</h3>
          <div className="breakdown-grid">
            {contactBreakdown.byFirmType.map((item, index) => (
              <div key={index} className="breakdown-card">
                <div className="breakdown-header">
                  <h4>{item.type}</h4>
                  <span className="count">{formatNumber(item.count)}</span>
                </div>
                <div className="breakdown-metrics">
                  <div className="metric">
                    <span className="label">Open Rate</span>
                    <span className="value" style={{ color: getPerformanceColor(item.openRate) }}>
                      {item.openRate}%
                    </span>
                  </div>
                  <div className="metric">
                    <span className="label">Click Rate</span>
                    <span className="value" style={{ color: getPerformanceColor(item.clickRate * 5) }}>
                      {item.clickRate}%
                    </span>
                  </div>
                  <div className="metric">
                    <span className="label">Added This Month</span>
                    <span className="value positive">+{item.addedThisMonth}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="breakdown-section" style={{ marginTop: '2rem' }}>
          <h3>By Job Title</h3>
          <div className="breakdown-grid">
            {contactBreakdown.byJobTitle.map((item, index) => (
              <div key={index} className="breakdown-card">
                <div className="breakdown-header">
                  <h4>{item.title}</h4>
                  <span className="count">{formatNumber(item.count)}</span>
                </div>
                <div className="breakdown-metrics">
                  <div className="metric">
                    <span className="label">Open Rate</span>
                    <span className="value" style={{ color: getPerformanceColor(item.openRate) }}>
                      {item.openRate}%
                    </span>
                  </div>
                  <div className="metric">
                    <span className="label">Click Rate</span>
                    <span className="value" style={{ color: getPerformanceColor(item.clickRate * 5) }}>
                      {item.clickRate}%
                    </span>
                  </div>
                  <div className="metric">
                    <span className="label">Added This Month</span>
                    <span className="value positive">+{item.addedThisMonth}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="breakdown-section" style={{ marginTop: '2rem' }}>
          <h3>By State</h3>
          <div className="breakdown-grid">
            {contactBreakdown.byState.map((item, index) => (
              <div key={index} className="breakdown-card">
                <div className="breakdown-header">
                  <h4>{item.state}</h4>
                  <span className="count">{formatNumber(item.count)}</span>
                </div>
                <div className="breakdown-metrics">
                  <div className="metric">
                    <span className="label">Open Rate</span>
                    <span className="value" style={{ color: getPerformanceColor(item.openRate) }}>
                      {item.openRate}%
                    </span>
                  </div>
                  <div className="metric">
                    <span className="label">Click Rate</span>
                    <span className="value" style={{ color: getPerformanceColor(item.clickRate * 5) }}>
                      {item.clickRate}%
                    </span>
                  </div>
                  <div className="metric">
                    <span className="label">Added This Month</span>
                    <span className="value positive">+{item.addedThisMonth}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderSegmentsTab = () => (
    <div className="segments-content">
      <div className="segments-filters">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search segments..." />
        </div>
        <div className="filter-controls">
          <select className="form-select">
            <option>All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select className="form-select">
            <option>All Performance</option>
            <option>High Performing</option>
            <option>Medium Performing</option>
            <option>Low Performing</option>
          </select>
        </div>
      </div>

      <div className="segments-grid">
        {segments.map(segment => (
          <div key={segment.id} className="segment-card">
            <div className="segment-header">
              <div className="segment-info">
                <div className="segment-icon" style={{ backgroundColor: getCategoryColor(segment.category) }}>
                  {React.createElement(getCategoryIcon(segment.category), { size: 16 })}
                </div>
                <div>
                  <h3>{segment.name}</h3>
                  <p>{segment.description}</p>
                </div>
              </div>
              <div className="segment-actions">
                <button className="action-btn">
                  <Copy size={14} />
                </button>
                <button className="action-btn">
                  <Edit3 size={14} />
                </button>
                <button className="action-btn">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="segment-stats">
              <div className="stat-item">
                <span className="stat-label">Contacts</span>
                <span className="stat-value">{formatNumber(segment.contactCount)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Open Rate</span>
                <span 
                  className="stat-value"
                  style={{ color: getPerformanceColor(segment.emailOpenRate) }}
                >
                  {segment.emailOpenRate}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Click Rate</span>
                <span 
                  className="stat-value"
                  style={{ color: getPerformanceColor(segment.clickRate * 5) }}
                >
                  {segment.clickRate}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Conversion</span>
                <span 
                  className="stat-value"
                  style={{ color: getPerformanceColor(segment.conversionRate * 10) }}
                >
                  {segment.conversionRate}%
                </span>
              </div>
            </div>

            <div className="segment-criteria">
              <h4>Criteria</h4>
              <div className="criteria-list">
                {segment.criteria.map((criterion, index) => (
                  <div key={index} className="criterion-item">
                    <span className="criterion-field">{criterion.field}</span>
                    <span className="criterion-operator">{criterion.operator}</span>
                    <span className="criterion-value">{criterion.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="segment-footer">
              <div className="segment-tags">
                {segment.tags.map(tag => (
                  <span key={tag} className="tag">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
              <div className="segment-meta">
                <span>Created by {segment.createdBy}</span>
                <span>•</span>
                <span>Last used {new Date(segment.lastUsed).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPerformanceTab = () => (
    <div className="performance-container">
      <div className="performance-header">
        <h2>Segment Performance Analysis</h2>
        <p>Compare performance metrics across all segments</p>
      </div>

      <div className="performance-grid">
        <div className="performance-chart">
          <h3>Email Performance by Segment</h3>
          <div className="chart-container">
            <div className="chart-bars">
              {segments.map(segment => (
                <div key={segment.id} className="chart-bar-group">
                  <div className="chart-bar-label">{segment.name}</div>
                  <div className="chart-bars-stack">
                    <div 
                      className="chart-bar open-rate"
                      style={{ 
                        height: `${segment.emailOpenRate}%`,
                        backgroundColor: getCategoryColor(segment.category)
                      }}
                      title={`Open Rate: ${segment.emailOpenRate}%`}
                    />
                    <div 
                      className="chart-bar click-rate"
                      style={{ 
                        height: `${segment.clickRate * 2}%`,
                        backgroundColor: getCategoryColor(segment.category)
                      }}
                      title={`Click Rate: ${segment.clickRate}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="performance-metrics">
          <div className="metric-card">
            <h4>Top Performing Segments</h4>
            <div className="top-segments">
              {segments
                .sort((a, b) => b.emailOpenRate - a.emailOpenRate)
                .slice(0, 3)
                .map((segment, index) => (
                  <div key={segment.id} className="top-segment">
                    <div className="rank">#{index + 1}</div>
                    <div className="segment-info">
                      <div className="segment-name">{segment.name}</div>
                      <div className="segment-stats">
                        <span>{segment.emailOpenRate}% open rate</span>
                        <span>•</span>
                        <span>{formatNumber(segment.contactCount)} contacts</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="metric-card">
            <h4>Conversion Leaders</h4>
            <div className="conversion-leaders">
              {segments
                .sort((a, b) => b.conversionRate - a.conversionRate)
                .slice(0, 3)
                .map((segment, index) => (
                  <div key={segment.id} className="conversion-leader">
                    <div className="rank">#{index + 1}</div>
                    <div className="segment-info">
                      <div className="segment-name">{segment.name}</div>
                      <div className="conversion-rate">
                        {segment.conversionRate}% conversion rate
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderInsightsTab = () => (
    <div className="insights-container">
      <div className="insights-header">
        <h2>Segment Insights</h2>
        <p>Discover patterns and opportunities in your audience segments</p>
      </div>

      <div className="insights-grid">
        <div className="insight-card">
          <h3>Best Content Topics</h3>
          <div className="content-topics">
            <div className="topic-item">
              <span className="topic-name">Healthcare Technology</span>
              <div className="topic-performance">
                <div className="topic-bar">
                  <div className="topic-fill" style={{ width: '85%' }} />
                </div>
                <span className="topic-rate">85% engagement</span>
              </div>
            </div>
            <div className="topic-item">
              <span className="topic-name">Regulatory Updates</span>
              <div className="topic-performance">
                <div className="topic-bar">
                  <div className="topic-fill" style={{ width: '72%' }} />
                </div>
                <span className="topic-rate">72% engagement</span>
              </div>
            </div>
            <div className="topic-item">
              <span className="topic-name">Staff Training</span>
              <div className="topic-performance">
                <div className="topic-bar">
                  <div className="topic-fill" style={{ width: '68%' }} />
                </div>
                <span className="topic-rate">68% engagement</span>
              </div>
            </div>
          </div>
        </div>

        <div className="insight-card">
          <h3>Optimal Send Times</h3>
          <div className="send-times">
            <div className="time-slot">
              <span className="time">Tuesday 10 AM</span>
              <span className="performance">Best open rate</span>
            </div>
            <div className="time-slot">
              <span className="time">Thursday 2 PM</span>
              <span className="performance">Best click rate</span>
            </div>
            <div className="time-slot">
              <span className="time">Monday 9 AM</span>
              <span className="performance">Best conversion</span>
            </div>
          </div>
        </div>

        <div className="insight-card">
          <h3>Segment Growth</h3>
          <div className="growth-metrics">
            <div className="growth-item">
              <span className="growth-label">SNF Administrators</span>
              <span className="growth-value positive">+15.2%</span>
            </div>
            <div className="growth-item">
              <span className="growth-label">Rehab Directors</span>
              <span className="growth-value positive">+8.7%</span>
            </div>
            <div className="growth-item">
              <span className="growth-label">Medical Supply Purchasers</span>
              <span className="growth-value negative">-2.1%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {/* Navigation Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'overview' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'overview' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'overview' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <PieChart size={16} />
            Database Overview
          </button>
          <button
            onClick={() => setActiveTab('segments')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'segments' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'segments' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'segments' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Users size={16} />
            Segments
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'performance' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'performance' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'performance' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BarChart3 size={16} />
            Performance
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'insights' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'insights' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'insights' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Eye size={16} />
            Insights
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="page-content-area">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'segments' && renderSegmentsTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'insights' && renderInsightsTab()}
      </div>

      {/* Create Segment Modal */}
      {showCreateSegment && (
        <div className="modal-overlay" onClick={() => setShowCreateSegment(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Segment</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateSegment(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Segment Name</label>
                <input type="text" className="form-input" placeholder="e.g., SNF Administrators" />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" rows="3" placeholder="Describe this segment..."></textarea>
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select className="form-select">
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Criteria</label>
                <div className="criteria-builder">
                  <div className="criteria-row">
                    <select className="form-select">
                      <option>Job Title</option>
                      <option>Industry</option>
                      <option>Company Size</option>
                      <option>Location</option>
                    </select>
                    <select className="form-select">
                      <option>contains</option>
                      <option>equals</option>
                      <option>starts with</option>
                      <option>ends with</option>
                    </select>
                    <input type="text" className="form-input" placeholder="Value" />
                    <button className="btn-secondary">Add</button>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label>Tags</label>
                <input type="text" className="form-input" placeholder="Enter tags separated by commas" />
              </div>
              
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowCreateSegment(false)}>
                  Cancel
                </button>
                <button className="btn-primary">
                  Create Segment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactSegments
