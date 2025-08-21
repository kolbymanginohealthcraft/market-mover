import React, { useState } from 'react'
import { 
  Target, 
  Plus, 
  BarChart3, 
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Download,
  Upload,
  Settings,
  Search,
  Filter,
  Calendar,
  Users,
  Heart,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Shield,
  Activity,
  Zap,
  Bell,
  Mail
} from 'lucide-react'

const Reputation = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedReview, setSelectedReview] = useState(null)

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

  const platforms = [
    {
      name: 'Google',
      icon: 'G',
      score: 4.7,
      reviews: 89,
      status: 'monitored'
    },
    {
      name: 'Facebook',
      icon: 'F',
      score: 4.5,
      reviews: 67,
      status: 'monitored'
    },
    {
      name: 'Yelp',
      icon: 'Y',
      score: 4.4,
      reviews: 45,
      status: 'monitored'
    },
    {
      name: 'Healthgrades',
      icon: 'H',
      score: 4.8,
      reviews: 33,
      status: 'monitored'
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
    },
    {
      id: 4,
      platform: 'Google',
      author: 'Robert Wilson',
      rating: 3,
      date: '2024-01-12',
      content: 'Decent care but the food could be better. Staff was friendly though.',
      sentiment: 'neutral',
      response: 'Thank you for your feedback Robert. We\'re working on improving our meal options.',
      status: 'responded',
      priority: 'medium'
    },
    {
      id: 5,
      platform: 'Healthgrades',
      author: 'Jennifer Davis',
      rating: 2,
      date: '2024-01-11',
      content: 'Disappointed with the wait times. Staff seemed overwhelmed and communication was poor.',
      sentiment: 'negative',
      response: 'We sincerely apologize for your experience. Please contact us directly so we can address your concerns.',
      status: 'responded',
      priority: 'high'
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
      type: 'new_review',
      platform: 'Facebook',
      author: 'Michael Chen',
      rating: 4,
      content: 'Good facility with professional staff...',
      time: '4 hours ago',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'sentiment_change',
      platform: 'Yelp',
      message: 'Average rating dropped from 4.5 to 4.4',
      time: '1 day ago',
      priority: 'medium'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'responded': return 'var(--success-color)'
      case 'pending': return 'var(--warning-color)'
      case 'flagged': return 'var(--danger-color)'
      case 'monitored': return 'var(--success-color)'
      default: return 'var(--gray-400)'
    }
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'var(--success-color)'
      case 'neutral': return 'var(--warning-color)'
      case 'negative': return 'var(--danger-color)'
      default: return 'var(--gray-400)'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--danger-color)'
      case 'medium': return 'var(--warning-color)'
      case 'low': return 'var(--success-color)'
      default: return 'var(--gray-400)'
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
      {/* Reputation Stats */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <BarChart3 size={20} />
            Reputation Overview
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
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Overall Score</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.125rem' }}>
                {renderStars(Math.floor(reputation.overallScore))}
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
                {reputation.responseRate}%
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Response Rate</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {reputation.averageResponseTime}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Avg Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Activity size={20} />
            Sentiment Analysis
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div style={{ 
              padding: '1rem', 
              border: '1px solid var(--success-green)', 
              borderRadius: '0.5rem',
              backgroundColor: 'var(--success-green)',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {reputation.sentiment.positive}%
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Positive</div>
              <TrendingUp size={20} />
            </div>
            <div style={{ 
              padding: '1rem', 
              border: '1px solid var(--warning-orange)', 
              borderRadius: '0.5rem',
              backgroundColor: 'var(--warning-orange)',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {reputation.sentiment.neutral}%
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Neutral</div>
              <Activity size={20} />
            </div>
            <div style={{ 
              padding: '1rem', 
              border: '1px solid var(--error-red)', 
              borderRadius: '0.5rem',
              backgroundColor: 'var(--error-red)',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {reputation.sentiment.negative}%
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Negative</div>
              <TrendingDown size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Target size={20} />
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

  const renderAlerts = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Bell size={20} />
            Reputation Alerts
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
                         alert.type === 'new_review' ? 'New Review' : 'Sentiment Change'}
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

  const renderAutomation = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Zap size={20} />
            Response Automation
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Create Rule
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
            <Zap size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-700)' }}>
              Response Automation
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
              Set up automated responses and alerts for different types of reviews and sentiment levels
            </p>
            <button className="btn btn-primary">
              <Plus size={16} />
              Create Automation Rule
            </button>
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
      case 'alerts':
        return renderAlerts()
      case 'automation':
        return renderAutomation()
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
          <button
            onClick={() => setActiveTab('automation')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'automation' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'automation' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'automation' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Settings size={16} />
            Automation
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

export default Reputation
