import React, { useState } from 'react'
import { 
  Search, 
  Tag, 
  Bookmark, 
  MapPin, 
  Building2, 
  Users, 
  TrendingUp,
  BarChart3,
  Filter,
  Plus,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Star,
  Phone,
  Mail,
  Globe,
  Target,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react'
import ProviderSearch from './ProviderSearch'
import OrganizationTagger from './OrganizationTagger'
import SavedMarkets from './SavedMarkets'

const InsightsHub = ({ selectedClient, onMarketSelect, setProviderId, setCurrentView, currentView }) => {
  const [selectedMarket, setSelectedMarket] = useState(null)

  // Map currentView to activeTab
  const getActiveTab = () => {
    switch (currentView) {
      case 'providers':
        return 'providers'
      case 'organization-tagger':
        return 'organizations'
      case 'saved-markets':
        return 'markets'
      default:
        return 'providers'
    }
  }

  const activeTab = getActiveTab()

  const tabs = [
    {
      id: 'providers',
      label: 'Provider Search',
      icon: Search,
      description: 'Search and analyze healthcare providers with market intelligence data'
    },
    {
      id: 'organizations',
      label: 'Organization Tagger',
      icon: Tag,
      description: 'Tag and categorize healthcare organizations for targeted marketing campaigns'
    },
    {
      id: 'markets',
      label: 'Saved Markets',
      icon: Bookmark,
      description: 'Manage your saved market areas and view market intelligence data for each region'
    }
  ]

  const handleMarketSelect = (market) => {
    setSelectedMarket(market)
    if (onMarketSelect) {
      onMarketSelect(market)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'providers':
        return <ProviderSearch selectedClient={selectedClient} hideHeader={true} />
      case 'organizations':
        return <OrganizationTagger selectedClient={selectedClient} hideHeader={true} />
      case 'markets':
        return (
          <SavedMarkets 
            selectedClient={selectedClient} 
            onMarketSelect={handleMarketSelect}
            hideHeader={true}
          />
        )
      default:
        return <ProviderSearch selectedClient={selectedClient} hideHeader={true} />
    }
  }

  const getActiveTabInfo = () => tabs.find(tab => tab.id === activeTab)

  return (
    <div className="page-container">
      {/* Tab Navigation */}
      <div className="nav-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => {
                // Map tab.id back to currentView
                let newView
                switch (tab.id) {
                  case 'providers':
                    newView = 'providers'
                    break
                  case 'organizations':
                    newView = 'organization-tagger'
                    break
                  case 'markets':
                    newView = 'saved-markets'
                    break
                  default:
                    newView = 'providers'
                }
                setCurrentView(newView)
              }}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="page-content-area">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default InsightsHub
