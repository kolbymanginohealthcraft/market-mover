import React, { useState } from 'react'
import { 
  Mail, 
  Users, 
  Target, 
  Bot, 
  Send, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Globe,
  FileText,
  Video,
  MapPin,
  Star,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  Settings,
  Download,
  Share2,
  Zap
} from 'lucide-react'

const CampaignOverview = ({ selectedClient, onCreateCampaign, onCampaignSelect }) => {
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState('all')

  // Comprehensive campaigns with multiple tactics
  const campaigns = [
    {
      id: 1,
      name: 'Fall Wellness Initiative',
      status: 'active',
      objective: 'Increase resident engagement and family awareness',
      startDate: '2024-09-01',
      endDate: '2024-11-30',
      budget: 5000,
      targetAudience: 'SNF Administrators, Discharge Planners',
      tactics: [
        {
          id: 'email-1',
          type: 'email',
          name: 'Welcome Email Series',
          status: 'active',
          progress: 75,
          metrics: { sent: 2340, opens: 68.5, clicks: 12.3 },
          nextAction: '2024-01-22'
        },
        {
          id: 'social-1',
          type: 'social',
          name: 'Wellness Content Series',
          status: 'active',
          progress: 60,
          metrics: { posts: 8, engagement: 15.2, reach: 8900 },
          nextAction: '2024-01-20'
        },
        {
          id: 'landing-1',
          type: 'landing',
          name: 'Wellness Fair Registration',
          status: 'draft',
          progress: 0,
          metrics: { visits: 0, conversions: 0 },
          nextAction: '2024-01-25'
        },
        {
          id: 'gmb-1',
          type: 'gmb',
          name: 'Google Business Updates',
          status: 'active',
          progress: 40,
          metrics: { updates: 3, views: 1200 },
          nextAction: '2024-01-18'
        }
      ],
      overallMetrics: {
        totalReach: 12440,
        totalEngagement: 2340,
        conversionRate: 8.2,
        roi: 340
      },
      timeline: [
        { event: 'Campaign Launch', date: '2025-01-15', type: 'email' },
        { event: 'First Email Sent', date: '2025-01-20', type: 'email' },
        { event: 'Social Media Launch', date: '2025-01-25', type: 'social' },
        { event: 'Landing Page Live', date: '2025-02-01', type: 'landing' },
        { event: 'Mid-Campaign Review', date: '2025-02-15', type: 'analytics' },
        { event: 'Campaign Completion', date: '2025-03-01', type: 'analytics' }
      ]
    },
    {
      id: 2,
      name: 'New Wound Care Service Launch',
      status: 'scheduled',
      objective: 'Introduce new wound care services to healthcare providers',
      startDate: '2024-02-01',
      endDate: '2024-03-31',
      budget: 8000,
      targetAudience: 'Wound Care Specialists, Hospital Case Managers',
      tactics: [
        {
          id: 'email-2',
          type: 'email',
          name: 'Service Announcement',
          status: 'draft',
          progress: 0,
          metrics: { sent: 0, opens: 0, clicks: 0 },
          nextAction: '2024-02-01'
        },
        {
          id: 'social-2',
          type: 'social',
          name: 'Educational Content',
          status: 'draft',
          progress: 0,
          metrics: { posts: 0, engagement: 0, reach: 0 },
          nextAction: '2024-02-01'
        },
        {
          id: 'webinar-2',
          type: 'webinar',
          name: 'Wound Care Webinar',
          status: 'draft',
          progress: 0,
          metrics: { registrations: 0, attendees: 0 },
          nextAction: '2024-02-15'
        }
      ],
      overallMetrics: {
        totalReach: 0,
        totalEngagement: 0,
        conversionRate: 0,
        roi: 0
      }
    },
    {
      id: 3,
      name: 'Patient Retention Program',
      status: 'active',
      objective: 'Improve patient satisfaction and reduce readmissions',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      budget: 12000,
      targetAudience: 'Current Patients, Families',
      tactics: [
        {
          id: 'email-3',
          type: 'email',
          name: 'Patient Newsletter',
          status: 'active',
          progress: 90,
          metrics: { sent: 1560, opens: 72.1, clicks: 18.7 },
          nextAction: '2024-01-17'
        },
        {
          id: 'social-3',
          type: 'social',
          name: 'Community Engagement',
          status: 'active',
          progress: 80,
          metrics: { posts: 12, engagement: 22.5, reach: 15600 },
          nextAction: '2024-01-19'
        },
        {
          id: 'direct-3',
          type: 'direct',
          name: 'Direct Mail Program',
          status: 'active',
          progress: 65,
          metrics: { sent: 890, responses: 45 },
          nextAction: '2024-01-28'
        }
      ],
      overallMetrics: {
        totalReach: 22050,
        totalEngagement: 2495,
        conversionRate: 12.8,
        roi: 420
      }
    }
  ]

  const getTacticIcon = (type) => {
    switch (type) {
      case 'email': return Mail
      case 'social': return MessageSquare
      case 'landing': return Globe
      case 'gmb': return MapPin
      case 'webinar': return Video
      case 'direct': return FileText
      default: return Target
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--success-green)'
      case 'draft': return 'var(--warning-orange)'
      case 'scheduled': return 'var(--primary-teal)'
      case 'paused': return 'var(--gray-500)'
      default: return 'var(--gray-400)'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'draft': return Edit
      case 'scheduled': return Clock
      case 'paused': return Pause
      default: return AlertCircle
    }
  }

  const renderCampaignCard = (campaign) => {
    const StatusIcon = getStatusIcon(campaign.status)
    
    return (
      <div 
        key={campaign.id}
        style={{
          border: '1px solid var(--gray-200)',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--white)',
          padding: '1.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
        onClick={() => onCampaignSelect ? onCampaignSelect(campaign) : setSelectedCampaign(campaign)}
      >
        {/* Campaign Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
              {campaign.name}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
              {campaign.objective}
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              <span>{campaign.startDate} - {campaign.endDate}</span>
              <span>•</span>
              <span>${campaign.budget.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusIcon size={16} style={{ color: getStatusColor(campaign.status) }} />
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: getStatusColor(campaign.status) }}>
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Tactics Overview */}
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--gray-700)' }}>
            Tactics ({campaign.tactics.length})
          </h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {campaign.tactics.slice(0, 3).map(tactic => {
              const TacticIcon = getTacticIcon(tactic.type)
              const TacticStatusIcon = getStatusIcon(tactic.status)
              
              return (
                <div key={tactic.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  padding: '0.5rem',
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: '0.375rem'
                }}>
                  <TacticIcon size={14} style={{ color: 'var(--gray-600)' }} />
                  <div style={{ flex: 1, fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: '500', color: 'var(--gray-700)' }}>{tactic.name}</div>
                    <div style={{ color: 'var(--gray-500)' }}>{tactic.progress}% complete</div>
                  </div>
                  <TacticStatusIcon size={12} style={{ color: getStatusColor(tactic.status) }} />
                </div>
              )
            })}
            {campaign.tactics.length > 3 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textAlign: 'center', padding: '0.25rem' }}>
                +{campaign.tactics.length - 3} more tactics
              </div>
            )}
          </div>
        </div>

        {/* Overall Performance */}
        <div style={{ 
          padding: '1rem', 
          backgroundColor: 'var(--primary-teal)', 
          color: 'white', 
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {campaign.overallMetrics.totalReach.toLocaleString()}
              </div>
              <div>Total Reach</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {campaign.overallMetrics.conversionRate}%
              </div>
              <div>Conversion Rate</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCampaignList = (campaign) => {
    const StatusIcon = getStatusIcon(campaign.status)
    
    return (
      <div 
        key={campaign.id}
        style={{
          border: '1px solid var(--gray-200)',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--white)',
          padding: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => onCampaignSelect ? onCampaignSelect(campaign) : setSelectedCampaign(campaign)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                {campaign.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <StatusIcon size={14} style={{ color: getStatusColor(campaign.status) }} />
                <span style={{ fontSize: '0.75rem', color: getStatusColor(campaign.status) }}>
                  {campaign.status}
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
              {campaign.objective}
            </p>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              <span>{campaign.tactics.length} tactics</span>
              <span>•</span>
              <span>{campaign.startDate} - {campaign.endDate}</span>
              <span>•</span>
              <span>${campaign.budget.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
              {campaign.overallMetrics.totalReach.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Total Reach</div>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--gray-400)' }} />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              Campaign Overview
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--gray-600)' }}>
              Manage comprehensive marketing initiatives across multiple channels
            </p>
          </div>
          <button className="btn btn-primary" onClick={onCreateCampaign}>
            <Plus size={16} />
            Create Campaign
          </button>
        </div>

        {/* Filters and Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select 
              className="form-select" 
              style={{ width: 'auto' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="paused">Paused</option>
            </select>
            <button className="btn btn-secondary">
              <Filter size={16} />
              Filter
            </button>
            <button className="btn btn-secondary">
              <Search size={16} />
              Search
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Grid/List */}
      <div style={{ 
        display: viewMode === 'grid' ? 'grid' : 'flex',
        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(400px, 1fr))' : 'none',
        flexDirection: viewMode === 'list' ? 'column' : 'row',
        gap: '1.5rem'
      }}>
        {campaigns
          .filter(campaign => filterStatus === 'all' || campaign.status === filterStatus)
          .map(campaign => viewMode === 'grid' ? renderCampaignCard(campaign) : renderCampaignList(campaign))
        }
      </div>

      {/* Empty State */}
      {campaigns.filter(campaign => filterStatus === 'all' || campaign.status === filterStatus).length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem',
          color: 'var(--gray-500)'
        }}>
          <Target size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            No campaigns found
          </h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Create your first comprehensive marketing campaign to get started.
          </p>
          <button className="btn btn-primary" onClick={onCreateCampaign}>
            <Plus size={16} />
            Create Campaign
          </button>
        </div>
      )}
    </div>
  )
}

export default CampaignOverview
