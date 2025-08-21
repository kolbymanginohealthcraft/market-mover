import React, { useState } from 'react'
import { 
  LayoutDashboard, 
  Mail, 
  Users, 
  BarChart3, 
  Settings, 
  Building2,
  MessageSquare,
  Calendar,
  Target,
  Zap,
  UserCheck,
  TrendingUp,
  Layout,
  Filter,
  Coins,
  Hash,
  Eye,
  Megaphone,
  DollarSign,
  Heart,
  Shield,
  Network,
  FileText,
  Star,
  MapPin,
  Bookmark,
  User,
  Search,
  Tag,
  Info,
  Globe
} from 'lucide-react'
import favicon from '../images/favicon.png'

const Sidebar = ({ currentModule, setCurrentModule, currentView, setCurrentView, selectedClient, setSelectedClient, setProviderId, selectedMarket, setSelectedMarket }) => {
  // Add state for "View As" functionality
  const [viewAs, setViewAs] = useState('healthcraft') // 'healthcraft' or specific client

  // Market intelligence navigation items (Insights) - organized into sections
  const insightsNavigationItems = [
    { id: 'providers', label: 'Provider Search', icon: Search },
    { id: 'organization-tagger', label: 'Organization Tagger', icon: Tag },
    { id: 'saved-markets', label: 'Saved Markets', icon: Bookmark },
    { id: 'claims', label: 'Claims Analysis', icon: FileText },
    { id: 'quality', label: 'Quality Metrics', icon: Star },
    { id: 'payers', label: 'Payer Networks', icon: Shield },
    { id: 'population', label: 'Population Data', icon: Users },
    { id: 'analytics', label: 'Market Analytics', icon: BarChart3 },
  ]

  // Organized insights sections
  const insightsSections = [
    {
      title: 'Market Intelligence',
      items: [
        { id: 'providers', label: 'Provider Discovery Hub', icon: Search },
      ]
    },
    {
      title: 'Market Data',
      items: [
        { id: 'claims', label: 'Claims Analysis', icon: FileText },
        { id: 'quality', label: 'Quality Metrics', icon: Star },
        { id: 'payers', label: 'Payer Networks', icon: Shield },
        { id: 'population', label: 'Population Data', icon: Users },
      ]
    }
  ]

  // Campaign navigation items
  const campaignsNavigationItems = [
    { id: 'customer', label: 'My Company', icon: UserCheck },
    { id: 'kpi', label: 'KPI Goals', icon: TrendingUp },
    { id: 'campaigns', label: 'Campaigns', icon: Target },
    { id: 'email-marketing', label: 'Email Marketing', icon: Mail },
    { id: 'contact-segments', label: 'Contact Segments', icon: Users },
    { id: 'landing-pages', label: 'Landing Pages', icon: Layout },
    { id: 'trending', label: 'Trending Topics', icon: Hash },
    { id: 'social', label: 'Social Media', icon: MessageSquare },
    { id: 'online-presence', label: 'Online Presence', icon: Globe },
    { id: 'tokens', label: 'Token Management', icon: Coins }
  ]

  // Organized campaign sections
  const campaignSections = [
    {
      title: 'Overview',
      items: [
        { id: 'customer', label: 'My Company', icon: UserCheck },
        { id: 'kpi', label: 'KPI Goals', icon: TrendingUp },
      ]
    },
    {
      title: 'Marketing',
      items: [
        { id: 'campaigns', label: 'Campaigns', icon: Target },
        { id: 'email-marketing', label: 'Email Marketing', icon: Mail },
        { id: 'contact-segments', label: 'Contact Segments', icon: Users },
        { id: 'landing-pages', label: 'Landing Pages', icon: Layout },
        { id: 'trending', label: 'Trending Topics', icon: Hash },
        { id: 'social', label: 'Social Media', icon: MessageSquare },
        { id: 'online-presence', label: 'Online Presence', icon: Globe },
      ]
    },
    {
      title: 'Tools',
      items: [
        { id: 'tokens', label: 'Token Management', icon: Coins },
      ]
    }
  ]

  const clients = [
    { id: 'all', name: 'All Clients' },
    { id: 'healthcraft', name: 'Healthcraft Creative Solutions', type: 'Agency' },
    { id: 'sunrise-snf', name: 'Sunrise SNF', type: 'Provider' },
    { id: 'medsupply-co', name: 'MedSupply Co', type: 'Supplier' },
    { id: 'rehab-partners', name: 'Rehab Partners', type: 'Provider' },
    { id: 'care-tech', name: 'CareTech Solutions', type: 'Supplier' },
  ]

  const getCurrentNavigationItems = () => {
    return currentModule === 'insights' ? insightsNavigationItems : campaignsNavigationItems
  }

  const getModuleStats = () => {
    if (currentModule === 'insights') {
      return {
        title: 'Market Intelligence',
        stats: [
          { label: 'Providers Tracked', value: '2.4K' },
          { label: 'Claims Analyzed', value: '1.2M' },
          { label: 'This Month', value: '+18%' }
        ]
      }
    } else {
      return {
        title: 'Campaign Performance',
        stats: [
          { label: 'Active Campaigns', value: '12' },
          { label: 'Contacts', value: '45.2K' },
          { label: 'This Month', value: '+23%' }
        ]
      }
    }
  }

  const moduleStats = getModuleStats()

  // Handle view as change
  const handleViewAsChange = (newViewAs) => {
    setViewAs(newViewAs)
    if (newViewAs === 'healthcraft') {
      setSelectedClient('all') // Reset to all clients when viewing as Healthcraft
    } else {
      setSelectedClient(newViewAs) // Set to specific client when viewing as them
    }
  }

  return (
    <div className="sidebar">
      {/* Logo */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src={favicon}
            alt="Healthcraft Creative Solutions"
            style={{ 
              width: '32px', 
              height: '32px', 
              objectFit: 'contain'
            }}
          />
          <div>
            <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>Growth Engine</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Healthcraft Creative Solutions</div>
          </div>
        </div>
        
        {/* About Platform Link */}
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={() => {
              setCurrentModule('campaigns')
              setCurrentView('about-platform')
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--gray-200)',
              borderRadius: '0.375rem',
              background: currentView === 'about-platform' ? 'var(--primary-teal)' : 'var(--white)',
              color: currentView === 'about-platform' ? 'white' : 'var(--gray-700)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'about-platform') {
                e.target.style.background = 'var(--gray-50)'
                e.target.style.borderColor = 'var(--gray-300)'
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'about-platform') {
                e.target.style.background = 'var(--white)'
                e.target.style.borderColor = 'var(--gray-200)'
              }
            }}
          >
            <Info size={16} />
            About Platform
          </button>
        </div>
      </div>

      {/* View As Selector (Dev purposes) */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          View As
        </div>
        <select 
          value={viewAs}
          onChange={(e) => handleViewAsChange(e.target.value)}
          className="form-select"
          style={{ fontSize: '0.875rem' }}
        >
                     <option value="healthcraft">Healthcraft (All Clients)</option>
           {clients.filter(client => client.id !== 'all' && client.id !== 'healthcraft').map(client => (
             <option key={client.id} value={client.id}>
               {client.name}
             </option>
           ))}
        </select>
      </div>

      {/* Client Selector (only show when viewing as Healthcraft) */}
      {viewAs === 'healthcraft' && (
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Client
          </div>
          <select 
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.875rem' }}
          >
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Module Selector */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Module
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button
             onClick={() => {
               setCurrentModule('campaigns')
               setCurrentView('campaigns')
             }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              border: 'none',
              borderRadius: '0.375rem',
              background: currentModule === 'campaigns' && currentView !== 'about-platform' ? 'var(--primary-teal)' : 'var(--gray-100)',
              color: currentModule === 'campaigns' && currentView !== 'about-platform' ? 'white' : 'var(--gray-700)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            <Megaphone size={14} />
            Execution
          </button>
          <button
            onClick={() => {
              setCurrentModule('insights')
              setCurrentView('providers')
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              border: 'none',
              borderRadius: '0.375rem',
              background: currentModule === 'insights' && currentView !== 'about-platform' ? 'var(--primary-teal)' : 'var(--gray-100)',
              color: currentModule === 'insights' && currentView !== 'about-platform' ? 'white' : 'var(--gray-700)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            <Eye size={14} />
            Intelligence
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: '1rem 0' }}>
        {currentModule === 'insights' ? (
          <>
            {insightsSections.map((section, sectionIndex) => (
              <div key={section.title}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem', padding: '0 1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {section.title}
                </div>
                {section.items.map(item => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        background: currentView === item.id ? 'var(--primary-teal)' : 'transparent',
                        color: currentView === item.id ? 'white' : 'var(--gray-700)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: currentView === item.id ? '500' : '400',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  )
                })}
                {sectionIndex < insightsSections.length - 1 && (
                  <div style={{ height: '1px', backgroundColor: 'var(--gray-200)', margin: '0.5rem 1.5rem' }} />
                )}
              </div>
            ))}
          </>
        ) : (
          <>
            {campaignSections.map((section, sectionIndex) => (
              <div key={section.title}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem', padding: '0 1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {section.title}
                </div>
                {section.items.map(item => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        background: currentView === item.id ? 'var(--primary-teal)' : 'transparent',
                        color: currentView === item.id ? 'white' : 'var(--gray-700)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: currentView === item.id ? '500' : '400',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  )
                })}
                {sectionIndex < campaignSections.length - 1 && (
                  <div style={{ height: '1px', backgroundColor: 'var(--gray-200)', margin: '0.5rem 1.5rem' }} />
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Quick Stats */}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--gray-200)', marginTop: 'auto' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {moduleStats.title}
        </div>
        {moduleStats.stats.map((stat, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: index < moduleStats.stats.length - 1 ? '0.5rem' : 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>{stat.label}</span>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: '600', 
              color: stat.label === 'This Month' ? 'var(--primary-teal)' : 'var(--gray-900)' 
            }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
