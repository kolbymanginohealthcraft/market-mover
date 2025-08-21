import React, { useState } from 'react'
import { 
  MessageSquare, 
  Plus, 
  BarChart3, 
  Calendar,
  Image,
  Video,
  Link,
  Edit,
  Trash2,
  Copy,
  Eye,
  Share,
  Heart,
  MessageCircle,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Download,
  Upload,
  Settings,
  Play,
  Pause,
  StopCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Globe
} from 'lucide-react'

const SocialMedia = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('content')
  const [selectedPost, setSelectedPost] = useState(null)

  const posts = [
    {
      id: 1,
      title: 'Welcome to Our Healthcare Family',
      content: 'We\'re excited to welcome new patients to our healthcare family. Our compassionate team is here to provide the highest quality care...',
      type: 'text',
      platforms: ['facebook', 'instagram'],
      status: 'published',
      scheduledDate: '2024-01-15 10:00',
      publishedDate: '2024-01-15 10:00',
      engagement: {
        likes: 45,
        comments: 12,
        shares: 8,
        reach: 1234
      }
    },
    {
      id: 2,
      title: 'Wound Care Tips',
      content: 'Proper wound care is essential for healing. Here are some expert tips from our wound care specialists...',
      type: 'image',
      platforms: ['facebook', 'instagram', 'twitter'],
      status: 'scheduled',
      scheduledDate: '2024-01-20 14:30',
      publishedDate: null,
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0
      }
    },
    {
      id: 3,
      title: 'Patient Success Story',
      content: 'Meet Sarah, who made an incredible recovery through our rehabilitation program. Her journey inspires us every day...',
      type: 'video',
      platforms: ['facebook', 'youtube'],
      status: 'draft',
      scheduledDate: null,
      publishedDate: null,
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0
      }
    },
    {
      id: 4,
      title: 'Healthcare Tips Tuesday',
      content: 'This week\'s tip: Stay hydrated! Proper hydration is crucial for overall health and healing...',
      type: 'text',
      platforms: ['twitter', 'linkedin'],
      status: 'published',
      scheduledDate: '2024-01-16 09:00',
      publishedDate: '2024-01-16 09:00',
      engagement: {
        likes: 23,
        comments: 5,
        shares: 3,
        reach: 567
      }
    }
  ]

  const platforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      followers: 2340,
      engagement: 4.2,
      postsThisMonth: 12,
      status: 'connected'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      followers: 1890,
      engagement: 6.8,
      postsThisMonth: 15,
      status: 'connected'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      followers: 890,
      engagement: 2.1,
      postsThisMonth: 8,
      status: 'connected'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      followers: 456,
      engagement: 3.5,
      postsThisMonth: 6,
      status: 'connected'
    },
    {
      name: 'YouTube',
      icon: Youtube,
      followers: 234,
      engagement: 8.9,
      postsThisMonth: 3,
      status: 'disconnected'
    }
  ]

  const analytics = {
    totalFollowers: 5910,
    monthlyGrowth: 8.5,
    averageEngagement: 5.1,
    totalPosts: 44,
    totalReach: 15600,
    topPerformingPost: 'Welcome to Our Healthcare Family'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'var(--success-color)'
      case 'scheduled': return 'var(--warning-color)'
      case 'draft': return 'var(--gray-400)'
      case 'failed': return 'var(--danger-color)'
      default: return 'var(--gray-400)'
    }
  }

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'facebook': return <Facebook size={16} />
      case 'instagram': return <Instagram size={16} />
      case 'twitter': return <Twitter size={16} />
      case 'linkedin': return <Linkedin size={16} />
      case 'youtube': return <Youtube size={16} />
      default: return <MessageSquare size={16} />
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image': return <Image size={16} />
      case 'video': return <Video size={16} />
      case 'link': return <Link size={16} />
      default: return <MessageSquare size={16} />
    }
  }

  const renderContent = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Content Stats */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <BarChart3 size={20} />
            Content Performance
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Create Post
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.totalFollowers.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Followers</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success-green)', marginTop: '0.25rem' }}>
                +{analytics.monthlyGrowth}% this month
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.averageEngagement}%
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Avg Engagement</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.totalPosts}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Posts</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {analytics.totalReach.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Reach</div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <MessageSquare size={20} />
            Social Media Posts
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
            {posts.map((post) => (
              <div key={post.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelectedPost(post)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {getTypeIcon(post.type)}
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                        {post.title}
                      </h4>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      {post.content.substring(0, 100)}...
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: getStatusColor(post.status), 
                        color: 'white', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {post.status}
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {post.platforms.map((platform, index) => (
                          <span key={index} style={{ color: 'var(--gray-500)' }}>
                            {getPlatformIcon(platform)}
                          </span>
                        ))}
                      </div>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Likes: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {post.engagement.likes}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Comments: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {post.engagement.comments}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Shares: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {post.engagement.shares}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Reach: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {post.engagement.reach.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Date: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {post.publishedDate || post.scheduledDate || 'Not scheduled'}
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

  const renderPlatforms = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Share size={20} />
            Connected Platforms
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Connect Platform
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {platforms.map((platform) => {
              const Icon = platform.icon
              return (
                <div key={platform.name} style={{ 
                  padding: '1rem', 
                  border: '1px solid var(--gray-200)', 
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--white)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Icon size={24} color="var(--primary-teal)" />
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>
                          {platform.name}
                        </h4>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          backgroundColor: platform.status === 'connected' ? 'var(--success-green)' : 'var(--gray-400)', 
                          color: 'white', 
                          borderRadius: '1rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {platform.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
                        {platform.followers.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        followers
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: 'var(--gray-600)' }}>Engagement: </span>
                      <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                        {platform.engagement}%
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray-600)' }}>Posts: </span>
                      <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                        {platform.postsThisMonth} this month
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', flex: 1 }}>
                      <Settings size={12} />
                      Settings
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', flex: 1 }}>
                      <BarChart3 size={12} />
                      Analytics
                    </button>
                  </div>
                </div>
              )
            })}
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
            <Calendar size={20} />
            Content Calendar
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Schedule Post
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
            <Calendar size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-700)' }}>
              Content Calendar
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
              Visual calendar view for scheduling and managing social media content
            </p>
            <button className="btn btn-primary">
              <Plus size={16} />
              Schedule New Post
            </button>
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
            Social Media Analytics
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
              Comprehensive analytics dashboard with charts, trends, and performance metrics
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
      case 'content':
        return renderContent()
      case 'platforms':
        return renderPlatforms()
      case 'calendar':
        return renderCalendar()
      case 'analytics':
        return renderAnalytics()
      default:
        return renderContent()
    }
  }

  return (
    <div>
      {/* Navigation Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          <button
            onClick={() => setActiveTab('content')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'content' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'content' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'content' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Edit size={16} />
            Content
          </button>
          <button
            onClick={() => setActiveTab('platforms')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'platforms' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'platforms' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'platforms' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Globe size={16} />
            Platforms
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'calendar' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'calendar' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'calendar' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Calendar size={16} />
            Calendar
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

export default SocialMedia
