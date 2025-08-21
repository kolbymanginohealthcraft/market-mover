import React, { useState } from 'react'
import { 
  Users, 
  Target, 
  BarChart3, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  MessageSquare,
  FileText,
  Image,
  Video,
  Download,
  Share2,
  Copy,
  MoreHorizontal,
  ArrowLeft,
  Save,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Play,
  Pause,
  StopCircle,
  CalendarDays,
  Clock3,
  CheckCircle2,
  FileEdit,
  SendHorizontal
} from 'lucide-react'

const EmailMarketing = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('campaigns')

  // Sample templates data
  const templates = [
    {
      id: 1,
      name: 'Welcome Email',
      category: 'Onboarding',
      lastUsed: '2024-01-15',
      usage: 45,
      preview: 'Welcome to our healthcare family...'
    },
    {
      id: 2,
      name: 'Appointment Reminder',
      category: 'Automation',
      lastUsed: '2024-01-10',
      usage: 128,
      preview: 'Your appointment is scheduled for...'
    },
    {
      id: 3,
      name: 'Monthly Newsletter',
      category: 'Newsletter',
      lastUsed: '2024-01-01',
      usage: 12,
      preview: 'This month in healthcare...'
    },
    {
      id: 4,
      name: 'Service Promotion',
      category: 'Marketing',
      lastUsed: '2024-01-08',
      usage: 23,
      preview: 'Discover our specialized services...'
    }
  ]

  // Sample marketing emails data
  const marketingEmails = [
    {
      id: 1,
      name: 'Welcome Series - Day 1',
      subject: 'Welcome to Our Healthcare Family',
      status: 'sent',
      sentDate: '2024-01-15',
      recipients: 2340,
      openRate: 28.5,
      clickRate: 4.2,
      template: 'Welcome Email',
      segment: 'New Patients'
    },
    {
      id: 2,
      name: 'Monthly Newsletter - January',
      subject: 'This Month in Healthcare: New Services & Updates',
      status: 'scheduled',
      scheduledDate: '2024-01-25',
      scheduledTime: '10:00 AM',
      recipients: 5670,
      template: 'Monthly Newsletter',
      segment: 'Active Patients'
    },
    {
      id: 3,
      name: 'Appointment Reminder Campaign',
      subject: 'Your Appointment is Tomorrow - Don\'t Forget!',
      status: 'draft',
      lastModified: '2024-01-18',
      recipients: 890,
      template: 'Appointment Reminder',
      segment: 'Wound Care Patients'
    },
    {
      id: 4,
      name: 'Service Promotion - Wound Care',
      subject: 'Specialized Wound Care Services Available',
      status: 'sent',
      sentDate: '2024-01-10',
      recipients: 1230,
      openRate: 32.1,
      clickRate: 6.8,
      template: 'Service Promotion',
      segment: 'Inactive Patients'
    },
    {
      id: 5,
      name: 'Holiday Hours Update',
      subject: 'Updated Hours for Memorial Day Weekend',
      status: 'scheduled',
      scheduledDate: '2024-01-22',
      scheduledTime: '2:00 PM',
      recipients: 3450,
      template: 'Announcement',
      segment: 'All Patients'
    },
    {
      id: 6,
      name: 'Patient Satisfaction Survey',
      subject: 'How Was Your Recent Visit? We\'d Love to Hear!',
      status: 'draft',
      lastModified: '2024-01-19',
      recipients: 2100,
      template: 'Survey Request',
      segment: 'Recent Patients'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'var(--success-green)'
      case 'scheduled': return 'var(--primary-teal)'
      case 'draft': return 'var(--warning-orange)'
      case 'active': return 'var(--success-green)'
      default: return 'var(--gray-400)'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return CheckCircle2
      case 'scheduled': return Clock3
      case 'draft': return FileEdit
      case 'active': return CheckCircle
      default: return AlertCircle
    }
  }



  const renderMarketingEmails = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <SendHorizontal size={20} />
            Marketing Emails
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Create Email
          </button>
        </div>
        <div className="widget-body">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                             <thead>
                 <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                   <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>Recipients</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>Performance</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>Actions</th>
                </tr>
              </thead>
                             <tbody>
                 {marketingEmails.map((email) => {
                   const StatusIcon = getStatusIcon(email.status)
                  
                                     return (
                     <tr key={email.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                       <td style={{ padding: '0.75rem' }}>
                         <div>
                           <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                             {email.name}
                           </div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                             {email.subject}
                           </div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                             Template: {email.template} • Segment: {email.segment}
                           </div>
                         </div>
                       </td>
                       <td style={{ padding: '0.75rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <StatusIcon size={16} style={{ color: getStatusColor(email.status) }} />
                           <span style={{ 
                             fontSize: '0.75rem', 
                             fontWeight: '500', 
                             color: getStatusColor(email.status),
                             textTransform: 'capitalize'
                           }}>
                             {email.status}
                           </span>
                         </div>
                       </td>
                       <td style={{ padding: '0.75rem' }}>
                         <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                           {email.status === 'sent' && email.sentDate}
                           {email.status === 'scheduled' && (
                             <div>
                               <div>{email.scheduledDate}</div>
                               <div>{email.scheduledTime}</div>
                             </div>
                           )}
                           {email.status === 'draft' && email.lastModified}
                         </div>
                       </td>
                       <td style={{ padding: '0.75rem' }}>
                         <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                           {email.recipients.toLocaleString()}
                         </div>
                       </td>
                       <td style={{ padding: '0.75rem' }}>
                         {email.status === 'sent' ? (
                           <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                             <div>Open: {email.openRate}%</div>
                             <div>Click: {email.clickRate}%</div>
                           </div>
                         ) : (
                           <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                             Not sent yet
                           </div>
                         )}
                       </td>
                       <td style={{ padding: '0.75rem' }}>
                         <div style={{ display: 'flex', gap: '0.5rem' }}>
                           <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                             <Eye size={12} />
                           </button>
                           <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                             <Edit size={12} />
                           </button>
                           {email.status === 'draft' && (
                             <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                               <Send size={12} />
                             </button>
                           )}
                         </div>
                       </td>
                     </tr>
                   )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCalendar = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <CalendarDays size={20} />
            Email Calendar
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary">
              <ArrowLeft size={16} />
              Previous
            </button>
            <button className="btn btn-secondary">
              Next
              <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        </div>
        <div className="widget-body">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '1px', 
            backgroundColor: 'var(--gray-200)',
            border: '1px solid var(--gray-200)',
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}>
            {/* Calendar Header */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ 
                padding: '0.75rem', 
                backgroundColor: 'var(--white)', 
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--gray-700)'
              }}>
                {day}
              </div>
            ))}
            
                         {/* Calendar Days */}
             {Array.from({ length: 35 }, (_, i) => {
               const day = i + 1
               const scheduledEmails = marketingEmails.filter(email => 
                 email.status === 'scheduled' && 
                 email.scheduledDate === `2024-01-${day.toString().padStart(2, '0')}`
               )
              
              return (
                <div key={i} style={{ 
                  padding: '0.5rem', 
                  backgroundColor: 'var(--white)', 
                  minHeight: '80px',
                  border: '1px solid var(--gray-100)'
                }}>
                                     <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                     {day <= 31 ? day : ''}
                   </div>
                   {scheduledEmails.map(email => (
                     <div key={email.id} style={{
                       fontSize: '0.625rem',
                       padding: '0.125rem 0.25rem',
                       backgroundColor: 'var(--primary-teal)',
                       color: 'white',
                       borderRadius: '0.25rem',
                       marginBottom: '0.125rem',
                       whiteSpace: 'nowrap',
                       overflow: 'hidden',
                       textOverflow: 'ellipsis'
                     }}>
                       {email.name}
                     </div>
                   ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  const renderTemplates = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <FileText size={20} />
            Email Templates
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Create Template
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {templates.map((template) => (
              <div key={template.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>
                      {template.name}
                    </h4>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      backgroundColor: 'var(--gray-100)', 
                      color: 'var(--gray-700)', 
                      borderRadius: '1rem', 
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {template.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      <Edit size={12} />
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                  "{template.preview}..."
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  <span>Used {template.usage} times</span>
                  <span>Last used: {template.lastUsed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'campaigns', label: 'Marketing Emails', icon: SendHorizontal },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'campaigns': return renderMarketingEmails()
      case 'templates': return renderTemplates()
      case 'calendar': return renderCalendar()
      default: return renderMarketingEmails()
    }
  }

  return (
    <div className="email-marketing">
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

export default EmailMarketing
