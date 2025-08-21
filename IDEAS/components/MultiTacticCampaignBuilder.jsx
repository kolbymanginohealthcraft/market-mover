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
  MoreHorizontal
} from 'lucide-react'
import SegmentBuilder from './SegmentBuilder'

const MultiTacticCampaignBuilder = ({ selectedClient, onSave, onCancel }) => {
  const [activeStep, setActiveStep] = useState('strategy')
  const [showSegmentBuilder, setShowSegmentBuilder] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState(null)

  // Campaign data
  const [campaignData, setCampaignData] = useState({
    name: '',
    objective: '',
    targetAudience: '',
    startDate: '',
    endDate: '',
    budget: '',
    successMetrics: '',
    selectedTactics: [],
    contentPlan: {},
    timeline: []
  })

  const [contentData, setContentData] = useState({
    theme: '',
    keyMessages: '',
    callToAction: ''
  })

  // Available tactics
  const availableTactics = [
    {
      id: 'email',
      name: 'Email Marketing',
      icon: Mail,
      description: 'Email campaigns, newsletters, and automated sequences',
      categories: ['Email Series', 'Single Email', 'Automated Workflow', 'Newsletter'],
      estimatedCost: 500,
      timeToImplement: '1-2 days'
    },
    {
      id: 'social',
      name: 'Social Media',
      icon: MessageSquare,
      description: 'Social media posts, stories, and paid advertising',
      categories: ['Organic Posts', 'Paid Ads', 'Stories', 'Live Events'],
      estimatedCost: 800,
      timeToImplement: '2-3 days'
    },
    {
      id: 'landing',
      name: 'Landing Pages',
      icon: Globe,
      description: 'Custom landing pages for campaigns and events',
      categories: ['Event Registration', 'Lead Capture', 'Service Promotion', 'Information'],
      estimatedCost: 1200,
      timeToImplement: '3-5 days'
    },
    {
      id: 'gmb',
      name: 'Google Business',
      icon: MapPin,
      description: 'Google My Business updates and local SEO',
      categories: ['Posts', 'Updates', 'Reviews', 'Local SEO'],
      estimatedCost: 300,
      timeToImplement: '1 day'
    },
    {
      id: 'webinar',
      name: 'Webinars & Events',
      icon: Video,
      description: 'Virtual events, webinars, and educational content',
      categories: ['Webinar', 'Virtual Event', 'Training Session', 'Q&A Session'],
      estimatedCost: 1500,
      timeToImplement: '5-7 days'
    },
    {
      id: 'direct',
      name: 'Direct Mail',
      icon: FileText,
      description: 'Direct mail campaigns and printed materials',
      categories: ['Postcards', 'Letters', 'Brochures', 'Newsletters'],
      estimatedCost: 2000,
      timeToImplement: '7-10 days'
    }
  ]

  const segments = [
    { id: 1, name: 'SNF Administrators', count: '2,340', description: 'Skilled nursing facility administrators in Texas' },
    { id: 2, name: 'Wound Care Specialists', count: '1,890', description: 'Wound care specialists and nurses' },
    { id: 3, name: 'Discharge Planners', count: '3,120', description: 'Hospital discharge planners and case managers' },
    { id: 4, name: 'Rehab Directors', count: '1,450', description: 'Rehabilitation facility directors' }
  ]

  const handleTacticToggle = (tacticId) => {
    setCampaignData(prev => ({
      ...prev,
      selectedTactics: prev.selectedTactics.includes(tacticId)
        ? prev.selectedTactics.filter(id => id !== tacticId)
        : [...prev.selectedTactics, tacticId]
    }))
  }

  const getTacticIcon = (type) => {
    const tactic = availableTactics.find(t => t.id === type)
    return tactic ? tactic.icon : Target
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

  const renderStrategyStep = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">Campaign Strategy</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          Define your campaign objectives and target audience
        </div>
      </div>
      <div className="widget-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <div className="form-group">
              <label className="form-label">Campaign Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., Fall Wellness Initiative"
                value={campaignData.name}
                onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Campaign Objective *</label>
              <textarea 
                className="form-input" 
                rows="3"
                placeholder="What do you want to achieve with this campaign?"
                value={campaignData.objective}
                onChange={(e) => setCampaignData(prev => ({ ...prev, objective: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select 
                className="form-select"
                value={campaignData.targetAudience}
                onChange={(e) => setCampaignData(prev => ({ ...prev, targetAudience: e.target.value }))}
              >
                <option value="">Select target audience</option>
                <option value="SNF Administrators">SNF Administrators</option>
                <option value="Wound Care Specialists">Wound Care Specialists</option>
                <option value="Discharge Planners">Discharge Planners</option>
                <option value="Rehab Directors">Rehab Directors</option>
                <option value="Current Patients">Current Patients</option>
                <option value="Families">Families</option>
              </select>
            </div>
          </div>
          <div>
            <div className="form-group">
              <label className="form-label">Campaign Timeline</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Start Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={campaignData.startDate}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>End Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={campaignData.endDate}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Budget</label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--gray-500)'
                }}>
                  $
                </span>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="5000"
                  style={{ paddingLeft: '1.5rem' }}
                  value={campaignData.budget}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, budget: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Success Metrics</label>
              <textarea 
                className="form-input" 
                rows="3"
                placeholder="How will you measure success? (e.g., 500 new leads, 10% conversion rate)"
                value={campaignData.successMetrics}
                onChange={(e) => setCampaignData(prev => ({ ...prev, successMetrics: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTacticsStep = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">Select Tactics</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          Choose which marketing channels to include in your campaign
        </div>
      </div>
      <div className="widget-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {availableTactics.map(tactic => {
            const TacticIcon = tactic.icon
            const isSelected = campaignData.selectedTactics.includes(tactic.id)
            
            return (
              <div
                key={tactic.id}
                style={{
                  border: isSelected ? '2px solid var(--primary-teal)' : '1px solid var(--gray-200)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--primary-teal)' : 'var(--white)',
                  color: isSelected ? 'white' : 'var(--gray-700)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleTacticToggle(tactic.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <TacticIcon size={20} />
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {tactic.name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      {tactic.description}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Est. Cost</div>
                    <div>${tactic.estimatedCost}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Timeline</div>
                    <div>{tactic.timeToImplement}</div>
                  </div>
                </div>

                {isSelected && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>Categories:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {tactic.categories.map(category => (
                        <span key={category} style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: 'rgba(255,255,255,0.2)', 
                          borderRadius: '0.25rem',
                          fontSize: '0.625rem'
                        }}>
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {campaignData.selectedTactics.length > 0 && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            backgroundColor: 'var(--gray-50)', 
            borderRadius: '0.5rem',
            border: '1px solid var(--gray-200)'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Selected Tactics Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {campaignData.selectedTactics.map(tacticId => {
                const tactic = availableTactics.find(t => t.id === tacticId)
                const TacticIcon = tactic.icon
                
                return (
                  <div key={tacticId} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: 'var(--white)',
                    borderRadius: '0.25rem'
                  }}>
                    <TacticIcon size={16} style={{ color: 'var(--primary-teal)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{tactic.name}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: 'var(--primary-teal)', 
              color: 'white',
              borderRadius: '0.25rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                Total Estimated Cost: ${campaignData.selectedTactics.reduce((total, tacticId) => {
                  const tactic = availableTactics.find(t => t.id === tacticId)
                  return total + (tactic ? tactic.estimatedCost : 0)
                }, 0).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderContentStep = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">Content Planning</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          Plan your messaging and content across all selected tactics
        </div>
      </div>
      <div className="widget-body">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            <div className="form-group">
              <label className="form-label">Campaign Theme</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., Fall Wellness & Prevention"
                value={contentData.theme}
                onChange={(e) => setContentData(prev => ({ ...prev, theme: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Key Messages</label>
              <textarea 
                className="form-input" 
                rows="4"
                placeholder="List the main messages you want to communicate across all channels..."
                value={contentData.keyMessages}
                onChange={(e) => setContentData(prev => ({ ...prev, keyMessages: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Call-to-Action</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., Register Now, Learn More, Contact Us"
                value={contentData.callToAction}
                onChange={(e) => setContentData(prev => ({ ...prev, callToAction: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Content Calendar</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {campaignData.selectedTactics.map(tacticId => {
                const tactic = availableTactics.find(t => t.id === tacticId)
                const TacticIcon = tactic.icon
                
                return (
                  <div key={tacticId} style={{ 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-200)', 
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--white)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <TacticIcon size={16} style={{ color: 'var(--primary-teal)' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{tactic.name}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                      Content needed: {tactic.categories.length} items
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReviewStep = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">Review & Launch</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          Review your campaign details before launching
        </div>
      </div>
      <div className="widget-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Campaign Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Campaign Name:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{campaignData.name || 'Not set'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Objective:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{campaignData.objective || 'Not set'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Timeline:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  {campaignData.startDate && campaignData.endDate 
                    ? `${campaignData.startDate} - ${campaignData.endDate}` 
                    : 'Not set'
                  }
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Budget:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  {campaignData.budget ? `$${campaignData.budget}` : 'Not set'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Tactics:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  {campaignData.selectedTactics.length} selected
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Selected Tactics</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {campaignData.selectedTactics.map(tacticId => {
                const tactic = availableTactics.find(t => t.id === tacticId)
                const TacticIcon = tactic.icon
                
                return (
                  <div key={tacticId} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: 'var(--gray-50)',
                    borderRadius: '0.25rem'
                  }}>
                    <TacticIcon size={16} style={{ color: 'var(--primary-teal)' }} />
                    <span style={{ fontSize: '0.875rem' }}>{tactic.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const steps = [
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'tactics', label: 'Tactics', icon: Zap },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'review', label: 'Review', icon: Eye }
  ]

  const renderStepContent = () => {
    switch (activeStep) {
      case 'strategy': return renderStrategyStep()
      case 'tactics': return renderTacticsStep()
      case 'content': return renderContentStep()
      case 'review': return renderReviewStep()
      default: return null
    }
  }

  return (
    <div>
      {/* Step Navigation */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isActive = activeStep === step.id
            const isCompleted = steps.findIndex(s => s.id === activeStep) > index
            
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                style={{
                  padding: '1rem 1.5rem',
                  border: 'none',
                  background: 'transparent',
                  color: isActive || isCompleted ? 'var(--primary-teal)' : 'var(--gray-600)',
                  cursor: 'pointer',
                  fontWeight: isActive ? '600' : '400',
                  fontSize: '0.875rem',
                  borderBottom: isActive ? '2px solid var(--primary-teal)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <StepIcon size={16} />
                {step.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="page-content-area">
        {renderStepContent()}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              const currentIndex = steps.findIndex(s => s.id === activeStep)
              if (currentIndex > 0) {
                setActiveStep(steps[currentIndex - 1].id)
              }
            }}
            disabled={activeStep === 'strategy'}
          >
            <ArrowLeft size={16} />
            Previous
          </button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary">
              <Save size={16} />
              Save Draft
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                const currentIndex = steps.findIndex(s => s.id === activeStep)
                if (currentIndex < steps.length - 1) {
                  setActiveStep(steps[currentIndex + 1].id)
                } else {
                  // Launch campaign
                  onSave && onSave(campaignData)
                }
              }}
            >
              {activeStep === 'review' ? 'Launch Campaign' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Segment Builder Modal */}
      {showSegmentBuilder && (
        <SegmentBuilder
          onSave={(segment) => {
            setSelectedSegment(segment)
            setShowSegmentBuilder(false)
          }}
          onCancel={() => setShowSegmentBuilder(false)}
        />
      )}
    </div>
  )
}

export default MultiTacticCampaignBuilder
