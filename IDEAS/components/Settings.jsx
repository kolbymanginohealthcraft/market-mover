import React, { useState } from 'react'
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Database,
  Bot,
  Zap,
  Mail,
  Coins
} from 'lucide-react'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">General Settings</div>
            </div>
            <div className="widget-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Platform Information</h4>
                  <div className="form-group">
                    <label className="form-label">Platform Name</label>
                    <input type="text" className="form-input" defaultValue="Growth Engine" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input type="text" className="form-input" defaultValue="Healthcraft Creative Solutions" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Timezone</label>
                    <select className="form-select">
                      <option>Central Time (CT)</option>
                      <option>Eastern Time (ET)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Pacific Time (PT)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Email Settings</h4>
                  <div className="form-group">
                    <label className="form-label">From Email Address</label>
                    <input type="email" className="form-input" defaultValue="noreply@healthcraft.ai" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reply-To Address</label>
                    <input type="email" className="form-input" defaultValue="support@healthcraft.ai" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Daily Send Limit</label>
                    <input type="number" className="form-input" defaultValue="10000" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'ai':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">AI Agent Configuration</div>
            </div>
            <div className="widget-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Agent Settings</h4>
                  <div className="form-group">
                    <label className="form-label">AI Model</label>
                    <select className="form-select">
                      <option>GPT-4 Turbo</option>
                      <option>Claude 3 Haiku</option>
                      <option>GPT-3.5 Turbo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Tokens per Request</label>
                    <input type="number" className="form-input" defaultValue="4000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Temperature</label>
                    <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="form-input" />
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                      Lower = more focused, Higher = more creative
                    </div>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Memory Settings</h4>
                  <div className="form-group">
                    <label className="form-label">Client Memory Retention</label>
                    <select className="form-select">
                      <option>30 days</option>
                      <option>60 days</option>
                      <option>90 days</option>
                      <option>Indefinite</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Memory per Client</label>
                    <input type="number" className="form-input" defaultValue="10000" />
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                      Characters stored per client
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Enable AI suggestions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'security':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Security & Privacy</div>
            </div>
            <div className="widget-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Access Control</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Require two-factor authentication</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Session timeout after 8 hours</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" />
                    <span style={{ fontSize: '0.875rem' }}>IP address restrictions</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password Policy</label>
                    <select className="form-select">
                      <option>Strong (8+ chars, mixed case, numbers)</option>
                      <option>Very Strong (12+ chars, special chars)</option>
                      <option>Custom Policy</option>
                    </select>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Data Protection</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Encrypt data at rest</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Encrypt data in transit</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Regular security audits</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data Retention Policy</label>
                    <select className="form-select">
                      <option>7 years (HIPAA compliant)</option>
                      <option>5 years</option>
                      <option>3 years</option>
                      <option>Custom</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'notifications':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Notification Preferences</div>
            </div>
            <div className="widget-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Email Notifications</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Campaign completion</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>High bounce rates</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" />
                    <span style={{ fontSize: '0.875rem' }}>Daily performance summary</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>System alerts</span>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>In-App Notifications</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>AI suggestions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Campaign approvals needed</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Performance alerts</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" />
                    <span style={{ fontSize: '0.875rem' }}>Weekly insights</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'tokens':
        return (
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Token System Configuration</div>
            </div>
            <div className="widget-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Token Pricing</h4>
                  <div className="form-group">
                    <label className="form-label">Email Campaign (per recipient)</label>
                    <input type="number" className="form-input" defaultValue="1" min="0" step="0.1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Automation (per trigger)</label>
                    <input type="number" className="form-input" defaultValue="2" min="0" step="0.1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">AI Tools (per request)</label>
                    <input type="number" className="form-input" defaultValue="5" min="0" step="0.1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Base Fee ($)</label>
                    <input type="number" className="form-input" defaultValue="99" min="0" step="1" />
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Usage Limits</h4>
                  <div className="form-group">
                    <label className="form-label">Default Monthly Token Allocation</label>
                    <input type="number" className="form-input" defaultValue="20000" min="0" step="100" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Daily Send Limit</label>
                    <input type="number" className="form-input" defaultValue="1000" min="0" step="10" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">A/B Test Group Size Limit</label>
                    <input type="number" className="form-input" defaultValue="500" min="0" step="10" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Recipients per Campaign</label>
                    <input type="number" className="form-input" defaultValue="5000" min="0" step="100" />
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Token System Features</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Enable token-based billing</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Daily usage limits</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>A/B testing restrictions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Usage alerts and notifications</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '0.875rem' }}>Automatic token purchase</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" />
                    <span style={{ fontSize: '0.875rem' }}>Token rollover to next month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'ai', label: 'AI Agents', icon: Bot },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'tokens', label: 'Token System', icon: Coins }
  ]

  return (
          <div className="page-content-area">
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
          Platform Settings
        </h2>
        <p style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
          Configure your Growth Engine platform settings and preferences.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          {tabs.map(tab => {
            const Icon = tab.icon
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
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button className="btn btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  )
}

export default Settings
