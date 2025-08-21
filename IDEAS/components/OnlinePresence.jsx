import React, { useState } from 'react'
import { 
  Globe, 
  Plus, 
  BarChart3, 
  Star,
  MessageSquare,
  MapPin,
  Phone,
  Edit,
  Eye,
  Download,
  Upload,
  Settings,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Camera,
  FileText,
  Share2,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Target,
  TrendingDown,
  Activity,
  Zap,
  Bell,
  Mail,
  Building2,
  Tag,
  Hash,
  ArrowUp,
  ArrowDown,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react'

const OnlinePresence = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedReview, setSelectedReview] = useState(null)

  // Google Business Profile Data
  const googleProfile = {
    name: 'Sunrise SNF',
    address: '123 Healthcare Blvd, Austin, TX 78701',
    phone: '(512) 555-0123',
    website: 'https://sunrisesnf.com',
    category: 'Skilled Nursing Facility',
    hours: {
      monday: '8:00 AM - 6:00 PM',
      tuesday: '8:00 AM - 6:00 PM',
      wednesday: '8:00 AM - 6:00 PM',
      thursday: '8:00 AM - 6:00 PM',
      friday: '8:00 AM - 6:00 PM',
      saturday: '9:00 AM - 4:00 PM',
      sunday: 'Closed'
    },
    status: 'verified',
    lastUpdated: '2024-01-15'
  }

  // Reputation Data
  const reputation = {
    overallScore: 4.6,
    totalReviews: 234,
    monthlyGrowth: 8.5,
    responseRate: 94.2,
    averageResponseTime: '2.3 hours',
    sentiment: {
      positive: 78,
      neutral: 15,
      negative: 7
    }
  }

  // SEO Data
  const seoData = {
    overallScore: 87,
    organicTraffic: 15420,
    organicGrowth: 12.3,
    keywords: 234,
    rankingKeywords: 189,
    averagePosition: 8.2,
    clickThroughRate: 3.4,
    domainAuthority: 45,
    pageSpeed: {
      desktop: 78,
      mobile: 65
    }
  }

  const platforms = [
    {
      name: 'Google',
      icon: 'G',
      score: 4.7,
      reviews: 89,
      status: 'monitored',
      type: 'google'
    },
    {
      name: 'Facebook',
      icon: 'F',
      score: 4.5,
      reviews: 67,
      status: 'monitored',
      type: 'social'
    },
    {
      name: 'Yelp',
      icon: 'Y',
      score: 4.4,
      reviews: 45,
      status: 'monitored',
      type: 'review'
    },
    {
      name: 'Healthgrades',
      icon: 'H',
      score: 4.8,
      reviews: 33,
      status: 'monitored',
      type: 'healthcare'
    }
  ]

  const reviews = [
    {
      id: 1,
      platform: 'Google',
      author: 'Sarah Johnson',
      rating: 5,
      date: '2024-01-15',
      content: 'Excellent care and compassionate staff. My mother received wonderful treatment during her stay. Highly recommend!',
      sentiment: 'positive',
      response: 'Thank you Sarah for your kind words. We\'re so glad your mother had a positive experience with us.',
      status: 'responded',
      priority: 'high'
    },
    {
      id: 2,
      platform: 'Facebook',
      author: 'Michael Chen',
      rating: 4,
      date: '2024-01-14',
      content: 'Good facility with professional staff. Clean environment and good food. Would recommend.',
      sentiment: 'positive',
      response: null,
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 3,
      platform: 'Yelp',
      author: 'Lisa Rodriguez',
      rating: 5,
      date: '2024-01-13',
      content: 'Outstanding rehabilitation services. The therapists are amazing and helped me recover quickly.',
      sentiment: 'positive',
      response: 'Thank you Lisa! We\'re thrilled to hear about your successful recovery.',
      status: 'responded',
      priority: 'high'
    }
  ]

  const seoKeywords = [
    {
      keyword: 'skilled nursing facility austin',
      position: 3,
      searchVolume: 1200,
      difficulty: 45,
      trend: 'up'
    },
    {
      keyword: 'rehabilitation center texas',
      position: 7,
      searchVolume: 890,
      difficulty: 52,
      trend: 'up'
    },
    {
      keyword: 'wound care austin',
      position: 12,
      searchVolume: 650,
      difficulty: 38,
      trend: 'down'
    },
    {
      keyword: 'post acute care',
      position: 5,
      searchVolume: 2100,
      difficulty: 67,
      trend: 'up'
    }
  ]

  const seoIssues = [
    {
      type: 'critical',
      title: 'Slow Page Speed',
      description: 'Homepage loading time is 4.2 seconds, should be under 3 seconds',
      impact: 'high',
      pages: 3
    },
    {
      type: 'warning',
      title: 'Missing Meta Descriptions',
      description: '15 pages are missing meta descriptions',
      impact: 'medium',
      pages: 15
    },
    {
      type: 'info',
      title: 'Broken Internal Links',
      description: '8 internal links are broken',
      impact: 'low',
      pages: 8
    }
  ]

  const alerts = [
    {
      id: 1,
      type: 'negative_review',
      platform: 'Google',
      author: 'Jennifer Davis',
      rating: 2,
      content: 'Disappointed with the wait times...',
      time: '2 hours ago',
      priority: 'high'
    },
    {
      id: 2,
      type: 'seo_drop',
      platform: 'Search Rankings',
      message: 'Keyword "skilled nursing austin" dropped from position 2 to 5',
      time: '1 day ago',
      priority: 'medium'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'var(--success-green)'
      case 'pending': return 'var(--warning-orange)'
      case 'unverified': return 'var(--error-red)'
      case 'published': return 'var(--success-green)'
      case 'scheduled': return 'var(--warning-orange)'
      case 'draft': return 'var(--gray-500)'
      case 'responded': return 'var(--success-green)'
      case 'monitored': return 'var(--success-green)'
      default: return 'var(--gray-500)'
    }
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'var(--success-green)'
      case 'neutral': return 'var(--warning-orange)'
      case 'negative': return 'var(--error-red)'
      default: return 'var(--gray-500)'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--error-red)'
      case 'medium': return 'var(--warning-orange)'
      case 'low': return 'var(--success-green)'
      default: return 'var(--gray-500)'
    }
  }

  const getIssueColor = (type) => {
    switch (type) {
      case 'critical': return 'var(--error-red)'
      case 'warning': return 'var(--warning-orange)'
      case 'info': return 'var(--primary-teal)'
      default: return 'var(--gray-500)'
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        size={16} 
        fill={i < rating ? 'var(--warning-orange)' : 'transparent'}
        color="var(--warning-orange)"
      />
    ))
  }

  const renderOverview = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Overall Performance */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <BarChart3 size={20} />
            Online Presence Overview
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Add Platform
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {reputation.overallScore}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Reputation Score</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.125rem' }}>
                {renderStars(Math.floor(reputation.overallScore))}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {seoData.overallScore}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>SEO Score</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success-green)', marginTop: '0.25rem' }}>
                +{seoData.organicGrowth}% organic growth
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {reputation.totalReviews}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Reviews</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success-green)', marginTop: '0.25rem' }}>
                +{reputation.monthlyGrowth}% this month
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {seoData.organicTraffic.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Organic Traffic</div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Globe size={20} />
            Platform Performance
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {platforms.map((platform) => (
              <div key={platform.name} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      backgroundColor: 'var(--primary-teal)', 
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {platform.icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>
                        {platform.name}
                      </h4>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        backgroundColor: getStatusColor(platform.status), 
                        color: 'white', 
                        borderRadius: '0.25rem', 
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
                      {platform.score}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {platform.reviews} reviews
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.125rem' }}>
                  {renderStars(Math.floor(platform.score))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Google Business Profile */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Building2 size={20} />
            Google Business Profile
          </div>
          <button className="btn btn-primary">
            <Edit size={16} />
            Edit Profile
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-900)' }}>
                {googleProfile.name}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="var(--gray-500)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                    {googleProfile.address}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={16} color="var(--gray-500)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                    {googleProfile.phone}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={16} color="var(--gray-500)" />
                  <a href={googleProfile.website} target="_blank" rel="noopener noreferrer" 
                     style={{ fontSize: '0.875rem', color: 'var(--primary-teal)', textDecoration: 'none' }}>
                    {googleProfile.website}
                    <ExternalLink size={12} style={{ marginLeft: '0.25rem' }} />
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--gray-800)' }}>
                Business Hours
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(googleProfile.hours).map(([day, hours]) => (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)', textTransform: 'capitalize' }}>
                      {day}:
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-800)' }}>
                      {hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReviews = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Star size={20} />
            Review Management
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary">
              <Filter size={16} />
              Filter
            </button>
            <button className="btn btn-secondary">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {reviews.map((review) => (
              <div key={review.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                        {review.author}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.125rem' }}>
                        {renderStars(review.rating)}
                      </div>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        backgroundColor: 'var(--gray-100)', 
                        color: 'var(--gray-700)', 
                        borderRadius: '0.25rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {review.platform}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      {review.content}
                    </p>
                    {review.response && (
                      <div style={{ 
                        padding: '0.75rem', 
                        backgroundColor: 'var(--gray-50)', 
                        borderRadius: '0.375rem',
                        borderLeft: '3px solid var(--primary-teal)'
                      }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', fontStyle: 'italic' }}>
                          <strong>Response:</strong> {review.response}
                        </p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      <MessageSquare size={12} />
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      <Edit size={12} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span>{review.date}</span>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      backgroundColor: getSentimentColor(review.sentiment), 
                      color: 'white', 
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {review.sentiment}
                    </span>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      backgroundColor: getPriorityColor(review.priority), 
                      color: 'white', 
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {review.priority}
                    </span>
                  </div>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    backgroundColor: getStatusColor(review.status), 
                    color: 'white', 
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {review.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderSEO = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* SEO Performance */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Search size={20} />
            SEO Performance
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Run Audit
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {seoData.overallScore}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>SEO Score</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {seoData.rankingKeywords}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Ranking Keywords</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {seoData.averagePosition}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Avg Position</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {seoData.domainAuthority}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Domain Authority</div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Speed */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Activity size={20} />
            Page Speed
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <Monitor size={32} color="var(--primary-teal)" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.25rem' }}>
                {seoData.pageSpeed.desktop}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Desktop</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <Smartphone size={32} color="var(--primary-teal)" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.25rem' }}>
                {seoData.pageSpeed.mobile}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Mobile</div>
            </div>
          </div>
        </div>
      </div>

      {/* Keywords */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Hash size={20} />
            Top Keywords
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {seoKeywords.map((keyword, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0.75rem',
                border: '1px solid var(--gray-200)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                    {keyword.keyword}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                    <span>Volume: {keyword.searchVolume.toLocaleString()}</span>
                    <span>Difficulty: {keyword.difficulty}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
                      {keyword.position}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Position</div>
                  </div>
                  <div style={{ 
                    color: keyword.trend === 'up' ? 'var(--success-green)' : 'var(--error-red)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {keyword.trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEO Issues */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <AlertCircle size={20} />
            SEO Issues
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {seoIssues.map((issue, index) => (
              <div key={index} style={{ 
                padding: '0.75rem',
                border: '1px solid var(--gray-200)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)',
                borderLeft: `4px solid ${getIssueColor(issue.type)}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                    {issue.title}
                  </h4>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    backgroundColor: getIssueColor(issue.type), 
                    color: 'white', 
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {issue.type}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                  {issue.description}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  Affects {issue.pages} page{issue.pages !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderAlerts = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Bell size={20} />
            Online Presence Alerts
          </div>
          <button className="btn btn-primary">
            <Settings size={16} />
            Alert Settings
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {alerts.map((alert) => (
              <div key={alert.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <AlertCircle size={16} color={getPriorityColor(alert.priority)} />
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                        {alert.type === 'negative_review' ? 'Negative Review' : 
                         alert.type === 'seo_drop' ? 'SEO Ranking Drop' : 'New Review'}
                      </h4>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        backgroundColor: 'var(--gray-100)', 
                        color: 'var(--gray-700)', 
                        borderRadius: '0.25rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {alert.platform}
                      </span>
                    </div>
                    {alert.author && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          By {alert.author}
                        </span>
                        {alert.rating && (
                          <div style={{ display: 'flex', gap: '0.125rem' }}>
                            {renderStars(alert.rating)}
                          </div>
                        )}
                      </div>
                    )}
                    {alert.content && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        "{alert.content}..."
                      </p>
                    )}
                    {alert.message && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        {alert.message}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      <Eye size={12} />
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      <MessageSquare size={12} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  <span>{alert.time}</span>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    backgroundColor: getPriorityColor(alert.priority), 
                    color: 'white', 
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {alert.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'reviews':
        return renderReviews()
      case 'seo':
        return renderSEO()
      case 'alerts':
        return renderAlerts()
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
            onClick={() => setActiveTab('reviews')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'reviews' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'reviews' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'reviews' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Star size={16} />
            Reviews
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'seo' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'seo' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'seo' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Search size={16} />
            SEO
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'alerts' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'alerts' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'alerts' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Bell size={16} />
            Alerts
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

export default OnlinePresence
