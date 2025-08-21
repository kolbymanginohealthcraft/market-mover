import React, { useState } from 'react'
import { 
  TrendingUp, 
  Users, 
  Mail, 
  Target, 
  BarChart3, 
  Calendar,
  Eye,
  Megaphone,
  Building2,
  MapPin,
  Star,
  ArrowRight,
  DollarSign,
  Heart,
  Shield,
  Network,
  Download,
  Filter,
  Plus,
  Send,
  Bot,
  Edit,
  Trash2,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Settings,
  Play,
  Pause,
  StopCircle,
  Search,
  MessageSquare
} from 'lucide-react'

import CampaignOverview from './CampaignOverview'
import MultiTacticCampaignBuilder from './MultiTacticCampaignBuilder'
import CampaignDetail from './CampaignDetail'

const MarketingHub = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('campaigns')

  const [selectedSegment, setSelectedSegment] = useState(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [viewMode, setViewMode] = useState('overview') // 'overview', 'builder', 'detail'
  const [reportTimeRange, setReportTimeRange] = useState('30d')

  // Campaign data
  const campaigns = [
    {
      id: 1,
      name: 'Welcome Series - New Patients',
      status: 'active',
      type: 'Automated',
      recipients: 2340,
      openRate: 68.5,
      clickRate: 12.3,
      sentDate: '2024-01-15',
      nextSend: '2024-01-22'
    },
    {
      id: 2,
      name: 'Monthly Newsletter',
      status: 'draft',
      type: 'Manual',
      recipients: 0,
      openRate: 0,
      clickRate: 0,
      sentDate: null,
      nextSend: null
    },
    {
      id: 3,
      name: 'Appointment Reminders',
      status: 'active',
      type: 'Automated',
      recipients: 1560,
      openRate: 72.1,
      clickRate: 18.7,
      sentDate: '2024-01-10',
      nextSend: '2024-01-17'
    },
    {
      id: 4,
      name: 'Service Promotion - Wound Care',
      status: 'scheduled',
      type: 'Manual',
      recipients: 890,
      openRate: 0,
      clickRate: 0,
      sentDate: null,
      nextSend: '2024-01-25'
    }
  ]





  const analytics = {
    totalSubscribers: 10240,
    monthlyGrowth: 12.5,
    averageOpenRate: 68.2,
    averageClickRate: 14.7,
    totalCampaigns: 24,
    activeAutomations: 8,
    totalContacts: 45234,
    activeCampaigns: 12,
    conversionRate: 3.2,
    // Social Media Stats
    socialFollowers: 15680,
    socialEngagement: 8.7,
    socialReach: 23400,
    // Google Business Stats
    googleReviews: 4.6,
    totalReviews: 89,
    reviewResponseRate: 94.2,
    // Reputation Stats
    sentimentScore: 87.5,
    brandMentions: 156,
    positiveMentions: 142
  }



  const aiSuggestions = [
    { type: 'Campaign Optimization', title: 'Improve email open rates', description: 'Segment contacts by engagement level for better targeting', priority: 'high' },
    { type: 'Content Suggestion', title: 'Create Medicare Advantage guide', description: 'High interest in MA topics based on recent searches', priority: 'medium' },
    { type: 'Timing Optimization', title: 'Adjust send times', description: 'Emails sent at 2 PM have 15% higher open rates', priority: 'low' }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--success-green)'
      case 'draft': return 'var(--gray-500)'
      case 'scheduled': return 'var(--warning-orange)'
      case 'paused': return 'var(--error-red)'
      default: return 'var(--gray-500)'
    }
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'var(--success-green)',
      scheduled: 'var(--warning-orange)',
      draft: 'var(--gray-500)',
      paused: 'var(--error-red)'
    }
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        backgroundColor: statusColors[status] + '20',
        color: statusColors[status]
      }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'var(--error-red)',
      medium: 'var(--warning-orange)',
      low: 'var(--gray-500)'
    }
    return colors[priority]
  }



  // Content rendering functions
  const renderOverview = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Token Usage Alert */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: 'var(--warning-orange)', 
        color: 'white', 
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <AlertTriangle size={20} />
        <div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Token Usage Alert</div>
          <div style={{ fontSize: '0.875rem' }}>
            You have used 12,500 of 20,000 monthly tokens (62.5%). Consider A/B testing with smaller groups to optimize your campaigns.
          </div>
        </div>
      </div>

      {/* Key Metrics */}
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
              {analytics.totalContacts.toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--success-green)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--success-green)' }}>+23% this month</span>
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Mail size={20} />
              <span>Active Campaigns</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {analytics.activeCampaigns}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              Running campaigns
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Target size={20} />
              <span>Open Rate</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {analytics.averageOpenRate}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              Average open rate
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <BarChart3 size={20} />
              <span>Conversion Rate</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {analytics.conversionRate}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              Average conversion
            </div>
          </div>
        </div>
      </div>

      {/* Additional Marketing Metrics */}
      <div className="dashboard-grid">
        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <MessageSquare size={20} />
              <span>Social Followers</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {analytics.socialFollowers.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              {analytics.socialEngagement}% engagement rate
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Star size={20} />
              <span>Google Rating</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {analytics.googleReviews}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              {analytics.totalReviews} reviews
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Heart size={20} />
              <span>Sentiment Score</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {analytics.sentimentScore}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              {analytics.brandMentions} brand mentions
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <TrendingUp size={20} />
              <span>Social Reach</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {analytics.socialReach.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              Monthly reach
            </div>
          </div>
        </div>
      </div>

      {/* Recent Campaigns and AI Suggestions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>Recent Campaigns</h3>
          </div>
          <div className="card-body">
            {campaigns.slice(0, 3).map((campaign, index) => (
              <div key={campaign.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.75rem 0',
                borderBottom: index < 2 ? '1px solid var(--gray-200)' : 'none'
              }}>
                <div>
                  <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{campaign.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    {campaign.recipients} recipients
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {getStatusBadge(campaign.status)}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                      {campaign.openRate}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Open Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>AI Suggestions</h3>
          </div>
          <div className="card-body">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} style={{ 
                padding: '0.75rem 0',
                borderBottom: index < aiSuggestions.length - 1 ? '1px solid var(--gray-200)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '500', 
                    color: 'var(--gray-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {suggestion.type}
                  </span>
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: getPriorityColor(suggestion.priority) + '20',
                    color: getPriorityColor(suggestion.priority)
                  }}>
                    {suggestion.priority}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-900)', lineHeight: '1.4' }}>
                  {suggestion.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                  {suggestion.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderCampaigns = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Campaign Stats */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <BarChart3 size={20} />
            Campaign Performance
          </div>
          <button className="btn btn-primary" onClick={() => setActiveTab('builder')}>
            <Plus size={16} />
            New Campaign
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.totalSubscribers.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Subscribers</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success-green)', marginTop: '0.25rem' }}>
                +{analytics.monthlyGrowth}% this month
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.averageOpenRate}%
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Avg Open Rate</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.averageClickRate}%
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Avg Click Rate</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.totalCampaigns}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Campaigns</div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Mail size={20} />
            Email Campaigns
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary">
              <Filter size={16} />
              Filter
            </button>
            <button className="btn btn-secondary">
              <Search size={16} />
              Search
            </button>
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {campaigns.map((campaign) => (
              <div key={campaign.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>
                      {campaign.name}
                    </h4>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: getStatusColor(campaign.status), 
                        color: 'white', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {campaign.status}
                      </span>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: 'var(--gray-100)', 
                        color: 'var(--gray-700)', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {campaign.type}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      <Edit size={12} />
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      <Eye size={12} />
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Recipients: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {campaign.recipients.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Open Rate: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {campaign.openRate}%
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Click Rate: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {campaign.clickRate}%
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Next Send: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {campaign.nextSend || 'Not scheduled'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderReports = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Time Range Selector */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <BarChart3 size={20} />
            Campaign Reports & Analytics
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select 
              value={reportTimeRange} 
              onChange={(e) => setReportTimeRange(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid var(--gray-300)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--white)'
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="btn btn-secondary">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="dashboard-grid">
        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <TrendingUp size={20} />
              <span>Total Reach</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {(analytics.totalContacts * 0.85).toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--success-green)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--success-green)' }}>+18% vs last period</span>
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Target size={20} />
              <span>Engagement Rate</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {((analytics.averageOpenRate + analytics.averageClickRate) / 2).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              Combined open & click rate
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <DollarSign size={20} />
              <span>ROI</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {analytics.conversionRate * 12}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              Return on investment
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Users size={20} />
              <span>New Leads</span>
            </div>
          </div>
          <div className="widget-body">
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {Math.round(analytics.totalContacts * 0.08).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
              Generated this period
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Chart */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <BarChart3 size={20} />
            Campaign Performance Over Time
          </div>
        </div>
        <div className="widget-body">
          <div style={{ 
            height: '300px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'var(--gray-50)',
            borderRadius: '0.5rem',
            border: '1px solid var(--gray-200)'
          }}>
            <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
              <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', fontWeight: '500' }}>Performance Chart</div>
              <div style={{ fontSize: '0.875rem' }}>Interactive chart showing campaign metrics over time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Campaigns */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Star size={20} />
            Top Performing Campaigns
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {campaigns.slice(0, 5).map((campaign, index) => (
              <div key={campaign.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '1rem',
                border: '1px solid var(--gray-200)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: index === 0 ? 'var(--warning-orange)' : 
                                   index === 1 ? 'var(--gray-400)' : 
                                   index === 2 ? 'var(--gray-500)' : 'var(--gray-200)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    #{index + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                      {campaign.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      {campaign.recipients.toLocaleString()} recipients
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                      {campaign.openRate}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Open Rate</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                      {campaign.clickRate}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Click Rate</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                      {Math.round(campaign.openRate * campaign.clickRate / 100)}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Conversion</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audience Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Users size={20} />
              Audience Demographics
            </div>
          </div>
          <div className="widget-body">
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Age 25-34</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '8px', 
                    backgroundColor: 'var(--gray-200)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '35%', 
                      height: '100%', 
                      backgroundColor: 'var(--primary-teal)' 
                    }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>35%</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Age 35-44</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '8px', 
                    backgroundColor: 'var(--gray-200)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '28%', 
                      height: '100%', 
                      backgroundColor: 'var(--primary-teal)' 
                    }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>28%</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Age 45-54</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '8px', 
                    backgroundColor: 'var(--gray-200)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '22%', 
                      height: '100%', 
                      backgroundColor: 'var(--primary-teal)' 
                    }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>22%</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Age 55+</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '8px', 
                    backgroundColor: 'var(--gray-200)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '15%', 
                      height: '100%', 
                      backgroundColor: 'var(--primary-teal)' 
                    }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>15%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <MapPin size={20} />
              Geographic Performance
            </div>
          </div>
          <div className="widget-body">
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>California</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '8px', 
                    backgroundColor: 'var(--gray-200)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '42%', 
                      height: '100%', 
                      backgroundColor: 'var(--success-green)' 
                    }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>42%</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Texas</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '8px', 
                    backgroundColor: 'var(--gray-200)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '28%', 
                      height: '100%', 
                      backgroundColor: 'var(--success-green)' 
                    }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>28%</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Florida</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '8px', 
                    backgroundColor: 'var(--gray-200)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '18%', 
                      height: '100%', 
                      backgroundColor: 'var(--success-green)' 
                    }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>18%</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Other States</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '8px', 
                    backgroundColor: 'var(--gray-200)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '12%', 
                      height: '100%', 
                      backgroundColor: 'var(--success-green)' 
                    }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>12%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    // Handle view modes for campaigns
    if (activeTab === 'campaigns') {
      if (viewMode === 'builder') {
        return (
          <MultiTacticCampaignBuilder 
            selectedClient={selectedClient}
            onSave={(campaignData) => {
              console.log('Campaign saved:', campaignData)
              setViewMode('overview')
              setActiveTab('campaigns')
            }}
            onCancel={() => {
              setViewMode('overview')
              setActiveTab('campaigns')
            }}
          />
        )
      }
      
      if (viewMode === 'detail' && selectedCampaign) {
        return (
          <CampaignDetail 
            campaign={selectedCampaign}
            onBack={() => {
              setViewMode('overview')
              setSelectedCampaign(null)
            }}
            onEdit={() => {
              setViewMode('builder')
            }}
          />
        )
      }
      
      return (
        <CampaignOverview 
          selectedClient={selectedClient}
          onCreateCampaign={() => {
            setViewMode('builder')
          }}
          onCampaignSelect={(campaign) => {
            setSelectedCampaign(campaign)
            setViewMode('detail')
          }}
        />
      )
    }

    // Handle other tabs
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'reports':
        return renderReports()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="marketing-hub">
      {/* Main Navigation Tabs */}
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
            <BarChart3 size={16} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'campaigns' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'campaigns' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'campaigns' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Mail size={16} />
            Campaigns
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'reports' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'reports' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'reports' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BarChart3 size={16} />
            Reports & Analytics
          </button>

        </div>
      </div>

      {/* Content Area */}
      <div className="page-content-area">
        {renderContent()}
      </div>


    </div>
  )
}

export default MarketingHub
