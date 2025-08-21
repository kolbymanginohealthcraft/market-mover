import React, { useState } from 'react'
import { 
  Zap, 
  Plus, 
  BarChart3, 
  Settings,
  Play,
  Pause,
  StopCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Eye,
  Trash2,
  Copy,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  Users,
  Mail,
  MessageSquare,
  Bell,
  Target,
  TrendingUp,
  Activity,
  Workflow,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react'

const Automation = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('workflows')
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)

  const workflows = [
    {
      id: 1,
      name: 'New Patient Welcome',
      description: 'Automatically sends welcome emails and onboarding materials to new patients',
      status: 'active',
      triggers: ['new_patient_registration'],
      actions: ['send_welcome_email', 'add_to_segment', 'schedule_follow_up'],
      executions: 234,
      successRate: 98.5,
      lastExecuted: '2024-01-15 10:30',
      nextExecution: '2024-01-16 09:00'
    },
    {
      id: 2,
      name: 'Appointment Reminders',
      description: 'Sends reminder emails and SMS messages 24 hours before appointments',
      status: 'active',
      triggers: ['appointment_scheduled'],
      actions: ['send_reminder_email', 'send_sms_reminder', 'update_calendar'],
      executions: 1560,
      successRate: 99.2,
      lastExecuted: '2024-01-15 14:15',
      nextExecution: '2024-01-16 08:00'
    },
    {
      id: 3,
      name: 'Review Response',
      description: 'Automatically responds to positive reviews and flags negative ones',
      status: 'active',
      triggers: ['new_review'],
      actions: ['analyze_sentiment', 'send_response', 'alert_team'],
      executions: 89,
      successRate: 95.7,
      lastExecuted: '2024-01-15 16:45',
      nextExecution: 'Trigger-based'
    },
    {
      id: 4,
      name: 'Inactive Patient Re-engagement',
      description: 'Reaches out to patients who haven\'t visited in 6 months',
      status: 'paused',
      triggers: ['patient_inactive_6_months'],
      actions: ['send_reengagement_email', 'offer_discount', 'schedule_call'],
      executions: 45,
      successRate: 23.4,
      lastExecuted: '2024-01-10 11:20',
      nextExecution: 'Paused'
    }
  ]

  const triggers = [
    {
      id: 1,
      name: 'New Patient Registration',
      type: 'event',
      description: 'Triggered when a new patient completes registration',
      usage: 234,
      status: 'active'
    },
    {
      id: 2,
      name: 'Appointment Scheduled',
      type: 'event',
      description: 'Triggered when an appointment is scheduled',
      usage: 1560,
      status: 'active'
    },
    {
      id: 3,
      name: 'New Review Posted',
      type: 'event',
      description: 'Triggered when a new review is posted',
      usage: 89,
      status: 'active'
    },
    {
      id: 4,
      name: 'Patient Inactive 6 Months',
      type: 'time',
      description: 'Triggered when a patient hasn\'t visited in 6 months',
      usage: 45,
      status: 'active'
    },
    {
      id: 5,
      name: 'Low Inventory Alert',
      type: 'condition',
      description: 'Triggered when inventory levels are low',
      usage: 12,
      status: 'inactive'
    }
  ]

  const actions = [
    {
      id: 1,
      name: 'Send Email',
      type: 'communication',
      description: 'Send automated email to contacts',
      usage: 1890,
      status: 'active'
    },
    {
      id: 2,
      name: 'Send SMS',
      type: 'communication',
      description: 'Send automated SMS message',
      usage: 1234,
      status: 'active'
    },
    {
      id: 3,
      name: 'Add to Segment',
      type: 'data',
      description: 'Add contact to a specific segment',
      usage: 567,
      status: 'active'
    },
    {
      id: 4,
      name: 'Schedule Follow-up',
      type: 'scheduling',
      description: 'Schedule a follow-up task or appointment',
      usage: 234,
      status: 'active'
    },
    {
      id: 5,
      name: 'Update Contact',
      type: 'data',
      description: 'Update contact information in database',
      usage: 89,
      status: 'active'
    }
  ]

  const analytics = {
    totalWorkflows: 12,
    activeWorkflows: 8,
    totalExecutions: 1928,
    successRate: 97.8,
    averageExecutionTime: '2.3 seconds',
    monthlyGrowth: 15.2
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--success-color)'
      case 'paused': return 'var(--warning-color)'
      case 'inactive': return 'var(--gray-400)'
      case 'error': return 'var(--danger-color)'
      default: return 'var(--gray-400)'
    }
  }

  const renderWorkflows = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Workflow Stats */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <BarChart3 size={20} />
            Workflow Performance
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Create Workflow
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.totalWorkflows}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Workflows</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.totalExecutions.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Executions</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.successRate}%
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Success Rate</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.averageExecutionTime}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Avg Execution Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow List */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Workflow size={20} />
            Automation Workflows
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
            {workflows.map((workflow) => (
              <div key={workflow.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelectedWorkflow(workflow)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>
                      {workflow.name}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      {workflow.description}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: getStatusColor(workflow.status), 
                        color: 'white', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {workflow.status}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {workflow.triggers.length} trigger{workflow.triggers.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
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
                    <span style={{ color: 'var(--gray-600)' }}>Executions: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {workflow.executions.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Success Rate: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {workflow.successRate}%
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Last Executed: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {workflow.lastExecuted}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Next Execution: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {workflow.nextExecution}
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

  const renderTriggers = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Target size={20} />
            Available Triggers
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Create Trigger
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {triggers.map((trigger) => (
              <div key={trigger.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>
                      {trigger.name}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      {trigger.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: 'var(--gray-100)', 
                        color: 'var(--gray-700)', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {trigger.type}
                      </span>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: getStatusColor(trigger.status), 
                        color: 'white', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {trigger.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
                      {trigger.usage}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      uses
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', flex: 1 }}>
                    <Edit size={12} />
                    Edit
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', flex: 1 }}>
                    <Eye size={12} />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderActions = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Zap size={20} />
            Available Actions
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Create Action
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {actions.map((action) => (
              <div key={action.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>
                      {action.name}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      {action.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: 'var(--gray-100)', 
                        color: 'var(--gray-700)', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {action.type}
                      </span>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: getStatusColor(action.status), 
                        color: 'white', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {action.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
                      {action.usage}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      uses
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', flex: 1 }}>
                    <Edit size={12} />
                    Edit
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', flex: 1 }}>
                    <Eye size={12} />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <TrendingUp size={20} />
            Automation Analytics
          </div>
          <button className="btn btn-secondary">
            <Download size={16} />
            Export Report
          </button>
        </div>
        <div className="widget-body">
          <div style={{ 
            padding: '2rem', 
            border: '1px solid var(--gray-200)', 
            borderRadius: '0.5rem',
            backgroundColor: 'var(--gray-50)',
            textAlign: 'center'
          }}>
            <BarChart3 size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-700)' }}>
              Detailed Analytics
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
              Comprehensive analytics dashboard with execution metrics, performance trends, and optimization insights
            </p>
            <button className="btn btn-primary">
              <BarChart3 size={16} />
              View Full Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'workflows':
        return renderWorkflows()
      case 'triggers':
        return renderTriggers()
      case 'actions':
        return renderActions()
      case 'analytics':
        return renderAnalytics()
      default:
        return renderWorkflows()
    }
  }

  return (
    <div>
      {/* Navigation Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          <button
            onClick={() => setActiveTab('workflows')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'workflows' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'workflows' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'workflows' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Zap size={16} />
            Workflows
          </button>
          <button
            onClick={() => setActiveTab('triggers')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'triggers' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'triggers' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'triggers' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Play size={16} />
            Triggers
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'actions' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'actions' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'actions' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Settings size={16} />
            Actions
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'analytics' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'analytics' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'analytics' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BarChart3 size={16} />
            Analytics
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="page-content-area">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default Automation
