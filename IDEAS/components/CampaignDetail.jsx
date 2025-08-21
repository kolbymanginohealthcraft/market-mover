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
  Zap,
  BarChart3,
  TrendingUp,
  DollarSign,
  Users2,
  CalendarDays,
  FileCheck,
  ArrowLeft,
  Save,
  Copy,
  MoreHorizontal,
  Activity,
  PieChart,
  Award,
  TrendingDown
} from 'lucide-react'

const CampaignDetail = ({ campaign, onBack, onEdit }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTactic, setSelectedTactic] = useState(null)

  // Sample campaign data (in real app, this would come from props)
  const campaignData = campaign || {
    id: 1,
    name: 'Fall Wellness Initiative',
    status: 'active',
    objective: 'Increase resident engagement and family awareness',
    startDate: '2024-09-01',
    endDate: '2024-11-30',
    budget: 5000,
    targetAudience: 'SNF Administrators, Discharge Planners',
    timeline: [
      { event: 'Campaign Launch', date: '2025-01-15', type: 'email' },
      { event: 'First Email Sent', date: '2025-01-20', type: 'email' },
      { event: 'Social Media Launch', date: '2025-01-25', type: 'social' },
      { event: 'Landing Page Live', date: '2025-02-01', type: 'landing' },
      { event: 'Mid-Campaign Review', date: '2025-02-15', type: 'analytics' },
      { event: 'Campaign Completion', date: '2025-03-01', type: 'analytics' }
    ],
    tactics: [
      {
        id: 'email-1',
        type: 'email',
        name: 'Welcome Email Series',
        status: 'active',
        progress: 75,
        metrics: { sent: 2340, opens: 68.5, clicks: 12.3, conversions: 156 },
        nextAction: '2024-01-22',
        content: [
          { id: 1, title: 'Welcome Email', status: 'sent', sentDate: '2024-01-15' },
          { id: 2, title: 'Follow-up Email', status: 'scheduled', scheduledDate: '2024-01-22' },
          { id: 3, title: 'Final Email', status: 'draft' }
        ]
      },
      {
        id: 'social-1',
        type: 'social',
        name: 'Wellness Content Series',
        status: 'active',
        progress: 60,
        metrics: { posts: 8, engagement: 15.2, reach: 8900, shares: 234 },
        nextAction: '2024-01-20',
        content: [
          { id: 1, title: 'Fall Prevention Tips', status: 'published', publishedDate: '2024-01-10' },
          { id: 2, title: 'Wellness Activities', status: 'published', publishedDate: '2024-01-12' },
          { id: 3, title: 'Staff Spotlight', status: 'scheduled', scheduledDate: '2024-01-20' },
          { id: 4, title: 'Event Promotion', status: 'draft' }
        ]
      },
      {
        id: 'landing-1',
        type: 'landing',
        name: 'Wellness Fair Registration',
        status: 'draft',
        progress: 0,
        metrics: { visits: 0, conversions: 0 },
        nextAction: '2024-01-25',
        content: [
          { id: 1, title: 'Registration Page', status: 'draft' }
        ]
      },
      {
        id: 'gmb-1',
        type: 'gmb',
        name: 'Google Business Updates',
        status: 'active',
        progress: 40,
        metrics: { updates: 3, views: 1200, clicks: 89 },
        nextAction: '2024-01-18',
        content: [
          { id: 1, title: 'Wellness Fair Post', status: 'published', publishedDate: '2024-01-08' },
          { id: 2, title: 'Service Update', status: 'published', publishedDate: '2024-01-10' },
          { id: 3, title: 'Event Reminder', status: 'scheduled', scheduledDate: '2024-01-18' }
        ]
      }
    ],
         overallMetrics: {
       totalReach: 12440,
       totalEngagement: 2340,
       conversionRate: 8.2,
       roi: 340,
       costPerLead: 12.50,
       totalLeads: 267
     }
  }

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
      case 'completed': return 'var(--success-green)'
      default: return 'var(--gray-400)'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'draft': return Edit
      case 'scheduled': return Clock
      case 'paused': return Pause
      case 'completed': return CheckCircle
      default: return AlertCircle
    }
  }

  const renderOverview = () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Campaign Performance */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">Campaign Performance</div>
          <button className="btn btn-secondary">
            <Download size={16} />
            Export Report
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--primary-teal)', color: 'white', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                {campaignData.overallMetrics.totalReach.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem' }}>Total Reach</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--success-green)', color: 'white', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                {campaignData.overallMetrics.conversionRate}%
              </div>
              <div style={{ fontSize: '0.875rem' }}>Conversion Rate</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--warning-orange)', color: 'white', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                ${campaignData.overallMetrics.costPerLead}
              </div>
              <div style={{ fontSize: '0.875rem' }}>Cost per Lead</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--primary-blue)', color: 'white', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                {campaignData.overallMetrics.totalLeads}
              </div>
              <div style={{ fontSize: '0.875rem' }}>Total Leads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tactics Performance */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">Tactics Performance</div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {campaignData.tactics.map(tactic => {
              const TacticIcon = getTacticIcon(tactic.type)
              const StatusIcon = getStatusIcon(tactic.status)
              
              return (
                <div key={tactic.id} style={{ 
                  border: '1px solid var(--gray-200)', 
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  backgroundColor: 'var(--white)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedTactic(tactic)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <TacticIcon size={20} style={{ color: 'var(--primary-teal)' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        {tactic.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <StatusIcon size={14} style={{ color: getStatusColor(tactic.status) }} />
                        <span style={{ fontSize: '0.75rem', color: getStatusColor(tactic.status) }}>
                          {tactic.status.charAt(0).toUpperCase() + tactic.status.slice(1)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          • {tactic.progress}% complete
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--gray-400)' }} />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                    {Object.entries(tactic.metrics).map(([key, value]) => (
                      <div key={key} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                          {typeof value === 'number' && value > 1000 ? value.toLocaleString() : value}
                          {key === 'opens' || key === 'clicks' || key === 'engagement' ? '%' : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  const renderTimeline = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">Campaign Timeline</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          Track campaign milestones and key events
        </div>
      </div>
             <div className="widget-body">
         {/* Timeline Summary */}
         <div style={{ 
           marginBottom: '2rem', 
           padding: '1rem', 
           backgroundColor: 'var(--gray-50)', 
           borderRadius: '0.5rem',
           border: '1px solid var(--gray-200)'
         }}>
           <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Timeline Summary</h4>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
                 {(campaignData.timeline || []).filter(item => {
                   const eventDate = new Date(item.date)
                   const today = new Date()
                   today.setHours(0, 0, 0, 0) // Reset time to start of day
                   return eventDate <= today
                 }).length}
               </div>
               <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Completed</div>
             </div>
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning-orange)' }}>
                 {(campaignData.timeline || []).filter(item => {
                   const eventDate = new Date(item.date)
                   const today = new Date()
                   today.setHours(0, 0, 0, 0) // Reset time to start of day
                   return eventDate > today
                 }).length}
               </div>
               <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Upcoming</div>
             </div>
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success-green)' }}>
                 {Math.round(((campaignData.timeline || []).filter(item => {
                   const eventDate = new Date(item.date)
                   const today = new Date()
                   today.setHours(0, 0, 0, 0) // Reset time to start of day
                   return eventDate <= today
                 }).length / (campaignData.timeline || []).length) * 100) || 0}%
               </div>
               <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Progress</div>
             </div>
           </div>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           {(campaignData.timeline || []).map((item, index) => {
             const TacticIcon = getTacticIcon(item.type)
             const isCompleted = new Date(item.date) <= new Date()
             const isToday = new Date(item.date).toDateString() === new Date().toDateString()
             
             return (
               <div key={index} style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '1rem',
                 padding: '1rem',
                 border: isToday ? '2px solid var(--primary-teal)' : '1px solid var(--gray-200)',
                 borderRadius: '0.5rem',
                 backgroundColor: isToday ? 'var(--primary-teal)' : 'var(--white)',
                 color: isToday ? 'white' : 'inherit',
                 position: 'relative',
                 transition: 'all 0.2s ease'
               }}>
                                  {/* Timeline connector */}
                  {index < (campaignData.timeline || []).length - 1 && (
                   <div style={{
                     position: 'absolute',
                     left: '20px',
                     top: '60px',
                     width: '2px',
                     height: '1rem',
                     backgroundColor: isToday ? 'white' : 'var(--gray-300)',
                     zIndex: 1
                   }} />
                 )}
                 
                 <div style={{ 
                   width: '40px', 
                   height: '40px', 
                   borderRadius: '50%', 
                   backgroundColor: isToday ? 'white' : 'var(--primary-teal)',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   color: isToday ? 'var(--primary-teal)' : 'white',
                   position: 'relative',
                   zIndex: 2
                 }}>
                   {isCompleted ? (
                     <CheckCircle size={16} />
                   ) : (
                     <TacticIcon size={16} />
                   )}
                 </div>
                 
                 <div style={{ flex: 1 }}>
                   <div style={{ 
                     fontSize: '0.875rem', 
                     fontWeight: '500', 
                     marginBottom: '0.25rem',
                     color: isToday ? 'white' : 'var(--gray-900)'
                   }}>
                     {item.event}
                   </div>
                   <div style={{ 
                     fontSize: '0.75rem', 
                     color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--gray-500)',
                     marginBottom: '0.25rem'
                   }}>
                     {new Date(item.date).toLocaleDateString('en-US', { 
                       weekday: 'long', 
                       year: 'numeric', 
                       month: 'long', 
                       day: 'numeric' 
                     })}
                   </div>
                   <div style={{ 
                     fontSize: '0.75rem', 
                     color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--gray-600)',
                     textTransform: 'capitalize'
                   }}>
                     {item.type} • {isCompleted ? 'Completed' : isToday ? 'Today' : 'Upcoming'}
                   </div>
                 </div>
                 
                 {isToday && (
                   <div style={{
                     padding: '0.25rem 0.5rem',
                     backgroundColor: 'rgba(255,255,255,0.2)',
                     borderRadius: '0.25rem',
                     fontSize: '0.625rem',
                     fontWeight: '500'
                   }}>
                     TODAY
                   </div>
                 )}
               </div>
             )
           })}
         </div>
       </div>
    </div>
  )

  const renderContent = () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {(campaignData.tactics || []).map(tactic => {
        const TacticIcon = getTacticIcon(tactic.type)
        
        return (
          <div key={tactic.id} className="widget">
            <div className="widget-header">
              <div className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TacticIcon size={20} style={{ color: 'var(--primary-teal)' }} />
                {tactic.name}
              </div>
              <button className="btn btn-secondary">
                <Plus size={16} />
                Add Content
              </button>
            </div>
            <div className="widget-body">
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {(tactic.content || []).map(content => (
                  <div key={content.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--white)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                        {content.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: getStatusColor(content.status), 
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.625rem',
                          fontWeight: '500'
                        }}>
                          {content.status}
                        </span>
                        {content.sentDate && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            Sent: {new Date(content.sentDate).toLocaleDateString()}
                          </span>
                        )}
                        {content.scheduledDate && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            Scheduled: {new Date(content.scheduledDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderAnalytics = () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Performance Trends */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">Performance Trends</div>
          <select className="form-select" style={{ width: 'auto' }}>
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        <div className="widget-body">
          <div style={{ 
            height: '300px', 
            backgroundColor: 'var(--gray-50)', 
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gray-500)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <div>Performance charts will be displayed here</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Analysis */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">ROI Analysis</div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div style={{ 
              padding: '1.5rem', 
              backgroundColor: 'var(--success-green)', 
              color: 'white',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                ${campaignData.overallMetrics.roi}
              </div>
              <div style={{ fontSize: '0.875rem' }}>Total Revenue Generated</div>
            </div>
            <div style={{ 
              padding: '1.5rem', 
              backgroundColor: 'var(--primary-teal)', 
              color: 'white',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {((campaignData.overallMetrics.roi / campaignData.budget) * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.875rem' }}>ROI Percentage</div>
            </div>
            <div style={{ 
              padding: '1.5rem', 
              backgroundColor: 'var(--warning-orange)', 
              color: 'white',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                ${campaignData.overallMetrics.costPerLead}
              </div>
              <div style={{ fontSize: '0.875rem' }}>Cost per Lead</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'timeline': return renderTimeline()
      case 'content': return renderContent()
      case 'analytics': return renderAnalytics()
      default: return renderOverview()
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={16} />
            Back to Campaigns
          </button>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              {campaignData.name}
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
              {campaignData.objective}
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
              <span>{campaignData.startDate} - {campaignData.endDate}</span>
              <span>•</span>
              <span>${campaignData.budget.toLocaleString()}</span>
              <span>•</span>
              <span>{campaignData.tactics.length} tactics</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={onEdit}>
              <Edit size={16} />
              Edit Campaign
            </button>
            <button className="btn btn-primary">
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          {tabs.map(tab => {
            const TabIcon = tab.icon
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '1rem 1.5rem',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === tab.id ? 'var(--primary-teal)' : 'var(--gray-600)',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  fontSize: '0.875rem',
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary-teal)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="page-content-area">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default CampaignDetail
