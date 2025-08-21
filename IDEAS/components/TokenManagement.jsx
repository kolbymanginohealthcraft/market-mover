import React, { useState } from 'react'
import { 
  Coins, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Calendar,
  Users,
  Mail,
  Zap,
  BarChart3,
  Settings,
  Plus,
  Download,
  Eye
} from 'lucide-react'

const TokenManagement = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  // Mock token data - in real implementation, this would come from your backend
  const tokenData = {
    currentBalance: 15000,
    monthlyAllocation: 20000,
    dailyLimit: 1000,
    tokensUsed: {
      today: 450,
      thisWeek: 3200,
      thisMonth: 12500,
      lastMonth: 11800
    },
    usageBreakdown: {
      emailCampaigns: 8500,
      automation: 3200,
      aITools: 800
    },
    recentTransactions: [
      {
        id: 1,
        type: 'email_campaign',
        description: 'Welcome Series - New Patients',
        tokens: 2340,
        date: '2024-01-15',
        status: 'completed'
      },
      {
        id: 2,
        type: 'automation',
        description: 'Appointment Reminders',
        tokens: 1560,
        date: '2024-01-14',
        status: 'completed'
      },
      {
        id: 3,
        type: 'ai_tools',
        description: 'Content Generation',
        tokens: 200,
        date: '2024-01-13',
        status: 'completed'
      },
      {
        id: 4,
        type: 'email_campaign',
        description: 'Service Promotion - Wound Care',
        tokens: 890,
        date: '2024-01-12',
        status: 'scheduled'
      }
    ],
    pricing: {
      emailPerRecipient: 1,
      automationPerTrigger: 2,
      aiPerRequest: 5,
      monthlyBaseFee: 99
    }
  }

  const getUsagePercentage = () => {
    return (tokenData.tokensUsed.thisMonth / tokenData.monthlyAllocation) * 100
  }

  const getRemainingTokens = () => {
    return tokenData.monthlyAllocation - tokenData.tokensUsed.thisMonth
  }

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'var(--danger-color)'
    if (percentage >= 75) return 'var(--warning-color)'
    return 'var(--success-color)'
  }

  const renderOverview = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Token Balance Card */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Coins size={20} />
            Token Balance
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary">
              <RefreshCw size={16} />
              Refresh
            </button>
            <button className="btn btn-primary">
              <Plus size={16} />
              Purchase Tokens
            </button>
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div style={{ 
              padding: '1.5rem', 
              border: '1px solid var(--gray-200)', 
              borderRadius: '0.75rem',
              backgroundColor: 'var(--white)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {tokenData.currentBalance.toLocaleString()}
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>Available Tokens</div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: 'var(--gray-200)', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${getUsagePercentage()}%`, 
                  height: '100%', 
                  backgroundColor: getStatusColor(getUsagePercentage()),
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
                {getUsagePercentage().toFixed(1)}% used this month
              </div>
            </div>

            <div style={{ 
              padding: '1.5rem', 
              border: '1px solid var(--gray-200)', 
              borderRadius: '0.75rem',
              backgroundColor: 'var(--white)'
            }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-900)' }}>
                Usage This Month
              </h4>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Email Campaigns</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-800)' }}>
                    {tokenData.usageBreakdown.emailCampaigns.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Automation</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-800)' }}>
                    {tokenData.usageBreakdown.automation.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>AI Tools</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-800)' }}>
                    {tokenData.usageBreakdown.aITools.toLocaleString()}
                  </span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--gray-200)', margin: '0.5rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-800)' }}>Total Used</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--primary-teal)' }}>
                    {tokenData.tokensUsed.thisMonth.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ 
              padding: '1.5rem', 
              border: '1px solid var(--gray-200)', 
              borderRadius: '0.75rem',
              backgroundColor: 'var(--white)'
            }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-900)' }}>
                Limits & Alerts
              </h4>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Daily Limit</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-800)' }}>
                    {tokenData.dailyLimit.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Used Today</span>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: tokenData.tokensUsed.today > tokenData.dailyLimit * 0.8 ? 'var(--warning-orange)' : 'var(--gray-800)'
                  }}>
                    {tokenData.tokensUsed.today.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Remaining</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-800)' }}>
                    {getRemainingTokens().toLocaleString()}
                  </span>
                </div>
                {getUsagePercentage() > 75 && (
                  <div style={{ 
                    padding: '0.5rem', 
                    backgroundColor: 'var(--warning-orange)', 
                    color: 'white', 
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <AlertTriangle size={12} />
                    Approaching monthly limit
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <BarChart3 size={20} />
            Recent Token Usage
          </div>
          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tokenData.recentTransactions.map((transaction) => (
              <div key={transaction.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    padding: '0.5rem', 
                    backgroundColor: 'var(--gray-100)', 
                    borderRadius: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {transaction.type === 'email_campaign' && <Mail size={16} />}
                    {transaction.type === 'automation' && <Zap size={16} />}
                    {transaction.type === 'ai_tools' && <Settings size={16} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                      {transaction.description}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {transaction.date}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: 'var(--primary-teal)' 
                  }}>
                    -{transaction.tokens.toLocaleString()} tokens
                  </span>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    backgroundColor: transaction.status === 'completed' ? 'var(--success-green)' : 'var(--warning-orange)', 
                    color: 'white', 
                    borderRadius: '1rem', 
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {transaction.status}
                  </span>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                    <Eye size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderPricing = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Coins size={20} />
            Token Pricing
          </div>
          <button className="btn btn-primary">
            <Settings size={16} />
            Configure Pricing
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ 
              padding: '1.5rem', 
              border: '1px solid var(--gray-200)', 
              borderRadius: '0.75rem',
              backgroundColor: 'var(--white)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Mail size={24} color="var(--primary-teal)" />
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Email Campaigns
                </h4>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {tokenData.pricing.emailPerRecipient} token
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                per recipient
              </div>
              <ul style={{ fontSize: '0.875rem', color: 'var(--gray-700)', listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>• One-time sends</li>
                <li style={{ marginBottom: '0.5rem' }}>• A/B testing campaigns</li>
                <li style={{ marginBottom: '0.5rem' }}>• Newsletter broadcasts</li>
              </ul>
            </div>

            <div style={{ 
              padding: '1.5rem', 
              border: '1px solid var(--gray-200)', 
              borderRadius: '0.75rem',
              backgroundColor: 'var(--white)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Zap size={24} color="var(--primary-teal)" />
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Automation
                </h4>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {tokenData.pricing.automationPerTrigger} tokens
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                per trigger
              </div>
              <ul style={{ fontSize: '0.875rem', color: 'var(--gray-700)', listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>• Welcome series</li>
                <li style={{ marginBottom: '0.5rem' }}>• Appointment reminders</li>
                <li style={{ marginBottom: '0.5rem' }}>• Follow-up sequences</li>
              </ul>
            </div>

            <div style={{ 
              padding: '1.5rem', 
              border: '1px solid var(--gray-200)', 
              borderRadius: '0.75rem',
              backgroundColor: 'var(--white)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Settings size={24} color="var(--primary-teal)" />
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  AI Tools
                </h4>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {tokenData.pricing.aiPerRequest} tokens
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                per request
              </div>
              <ul style={{ fontSize: '0.875rem', color: 'var(--gray-700)', listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>• Content generation</li>
                <li style={{ marginBottom: '0.5rem' }}>• Subject line optimization</li>
                <li style={{ marginBottom: '0.5rem' }}>• Campaign suggestions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <TrendingUp size={20} />
            Usage Analytics
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.875rem' }}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
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
              <BarChart3 size={48} style={{ marginBottom: '1rem' }} />
              <div>Usage analytics chart will be displayed here</div>
              <div style={{ fontSize: '0.875rem' }}>Showing data for {selectedPeriod}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'pricing':
        return renderPricing()
      default:
        return renderOverview()
    }
  }

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
            <BarChart3 size={16} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'pricing' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'pricing' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'pricing' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <TrendingUp size={16} />
            Pricing & Analytics
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

export default TokenManagement
