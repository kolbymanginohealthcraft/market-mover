import React from 'react'
import { 
  Bell, 
  Search, 
  Plus, 
  User,
  Settings,
  HelpCircle,
  Eye,
  Megaphone,
  TrendingUp,
  Building2,
  FileText,
  Star,
  Shield,
  Network,
  Users,
  Bookmark
} from 'lucide-react'

const Header = ({ currentModule, currentView, selectedClient, selectedMarket }) => {
  const getViewTitle = () => {
    if (currentModule === 'insights') {
      switch (currentView) {
        case 'dashboard':
          return 'Market Intelligence Dashboard'
        case 'providers':
          return 'Provider Search'
        case 'organization-tagger':
          return 'Organization Tagger'
        case 'provider-details':
          return 'Provider Details'
        case 'claims':
          return selectedMarket ? `Claims Analysis - ${selectedMarket.name}` : 'Claims Analysis'
        case 'quality':
          return selectedMarket ? `Quality Metrics - ${selectedMarket.name}` : 'Quality Metrics'
        case 'payers':
          return selectedMarket ? `Payer Networks - ${selectedMarket.name}` : 'Payer Networks'
        case 'population':
          return selectedMarket ? `Population Data - ${selectedMarket.name}` : 'Population Data'
        case 'saved-markets':
          return 'Saved Markets'
        default:
          return 'Market Intelligence'
      }
    } else {
      switch (currentView) {
        case 'dashboard':
          return 'Campaign Dashboard'
        case 'campaigns':
          return 'Campaign Builder'
        case 'segments':
          return 'Segments'
        case 'about-platform':
          return 'About this Platform'
        case 'customer':
          return 'My Company'
        case 'kpi':
          return 'KPI Goals'
        case 'email':
          return 'Email Marketing'
        case 'social':
          return 'Social Media'
        case 'google':
          return 'Google Business'
        case 'reputation':
          return 'Reputation Management'
        case 'automation':
          return 'Automation'
        case 'tokens':
          return 'Token Management'
        case 'landing-pages':
          return 'Landing Page Builder'
        case 'trending':
          return 'Trending Topics'
        case 'analytics':
          return 'Analytics'
        default:
          return 'Campaigns'
      }
    }
  }

  const getModuleIcon = () => {
    return currentModule === 'insights' ? <Eye size={20} /> : <Megaphone size={20} />
  }

  const getQuickAction = () => {
    if (currentModule === 'insights') {
      return {
        label: 'Export Data',
        icon: <FileText size={16} />
      }
    } else {
      return {
        label: 'New Campaign',
        icon: <Plus size={16} />
      }
    }
  }

  const getSearchPlaceholder = () => {
    if (currentModule === 'insights') {
      return 'Search providers, claims data, quality metrics...'
    } else {
      return 'Search campaigns, contacts, segments...'
    }
  }

  const getClientName = () => {
    const clients = {
      'all': 'All Clients',
      'healthcraft': 'Healthcraft Creative Solutions',
      'sunrise-snf': 'Sunrise SNF',
      'medsupply-co': 'MedSupply Co',
      'rehab-partners': 'Rehab Partners',
      'care-tech': 'CareTech Solutions'
    }
    return clients[selectedClient] || 'All Clients'
  }

  const quickAction = getQuickAction()

  return (
    <div className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: currentModule === 'insights' ? 'var(--success-green)' : 'var(--primary-teal)',
            borderRadius: '0.5rem',
            color: 'white'
          }}>
            {getModuleIcon()}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--gray-900)', margin: 0 }}>
              {getViewTitle()}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '500', 
                color: currentModule === 'insights' ? 'var(--success-green)' : 'var(--primary-teal)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {currentModule === 'insights' ? 'Market Intelligence' : 'Execution'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>
                Empowering Healthcare Growth
              </span>
              {selectedClient !== 'all' && (
                <>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>•</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    {getClientName()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            type="text"
            placeholder={getSearchPlaceholder()}
            style={{
              padding: '0.5rem 0.75rem 0.5rem 2.5rem',
              border: '1px solid var(--gray-300)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              width: '300px',
              backgroundColor: 'var(--white)'
            }}
          />
        </div>

        {/* Quick Actions */}
        <button className="btn btn-primary">
          {quickAction.icon}
          {quickAction.label}
        </button>

        {/* Module Switch Hint */}
        {currentModule === 'insights' && (
          <button 
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
            title="Switch to Execution to activate campaigns based on market insights"
          >
            <Megaphone size={14} />
            Activate Campaign
          </button>
        )}

        {/* Notifications */}
        <button style={{
          background: 'none',
          border: 'none',
          padding: '0.5rem',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          position: 'relative'
        }}>
          <Bell size={20} color="var(--gray-600)" />
          <div style={{
            position: 'absolute',
            top: '0.25rem',
            right: '0.25rem',
            width: '8px',
            height: '8px',
            backgroundColor: 'var(--red-500)',
            borderRadius: '50%'
          }} />
        </button>

        {/* Help */}
        <button style={{
          background: 'none',
          border: 'none',
          padding: '0.5rem',
          borderRadius: '0.375rem',
          cursor: 'pointer'
        }}>
          <HelpCircle size={20} color="var(--gray-600)" />
        </button>

        {/* User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '0.375rem', cursor: 'pointer', border: '1px solid var(--gray-200)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--primary-teal)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            JD
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
            John Doe
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
