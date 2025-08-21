import React, { useState } from 'react'
import { 
  Building2, 
  Plus, 
  BarChart3, 
  Star,
  MessageSquare,
  MapPin,
  Phone,
  Globe,
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
  ThumbsDown
} from 'lucide-react'

const GoogleBusiness = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedReview, setSelectedReview] = useState(null)

  const profile = {
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

  const reviews = [
    {
      id: 1,
      author: 'Sarah Johnson',
      rating: 5,
      date: '2024-01-15',
      content: 'Excellent care and compassionate staff. My mother received wonderful treatment during her stay. Highly recommend!',
      response: 'Thank you Sarah for your kind words. We\'re so glad your mother had a positive experience with us.',
      status: 'responded'
    },
    {
      id: 2,
      author: 'Michael Chen',
      rating: 4,
      date: '2024-01-14',
      content: 'Good facility with professional staff. Clean environment and good food. Would recommend.',
      response: null,
      status: 'pending'
    },
    {
      id: 3,
      author: 'Lisa Rodriguez',
      rating: 5,
      date: '2024-01-13',
      content: 'Outstanding rehabilitation services. The therapists are amazing and helped me recover quickly.',
      response: 'Thank you Lisa! We\'re thrilled to hear about your successful recovery.',
      status: 'responded'
    },
    {
      id: 4,
      author: 'Robert Wilson',
      rating: 3,
      date: '2024-01-12',
      content: 'Decent care but the food could be better. Staff was friendly though.',
      response: 'Thank you for your feedback Robert. We\'re working on improving our meal options.',
      status: 'responded'
    }
  ]

  const insights = {
    totalViews: 12450,
    monthlyGrowth: 15.2,
    averageRating: 4.6,
    totalReviews: 234,
    searchQueries: [
      'skilled nursing facility austin',
      'rehabilitation center texas',
      'wound care austin',
      'post acute care',
      'nursing home near me'
    ],
    topPhotos: [
      { id: 1, views: 1234, title: 'Facility Entrance' },
      { id: 2, views: 890, title: 'Rehabilitation Gym' },
      { id: 3, views: 756, title: 'Patient Room' },
      { id: 4, views: 654, title: 'Dining Area' }
    ]
  }

  const posts = [
    {
      id: 1,
      title: 'Welcome New Patients',
      content: 'We\'re excited to welcome new patients to our healthcare family. Our compassionate team is here to provide the highest quality care.',
      type: 'text',
      status: 'published',
      publishedDate: '2024-01-15',
      views: 234,
      engagement: 45
    },
    {
      id: 2,
      title: 'Wound Care Services',
      content: 'Our specialized wound care team provides expert treatment for all types of wounds. Contact us to learn more.',
      type: 'image',
      status: 'scheduled',
      scheduledDate: '2024-01-20',
      views: 0,
      engagement: 0
    },
    {
      id: 3,
      title: 'Patient Success Story',
      content: 'Meet John, who made an incredible recovery through our rehabilitation program. His journey inspires us every day.',
      type: 'video',
      status: 'draft',
      publishedDate: null,
      views: 0,
      engagement: 0
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'var(--success-color)'
      case 'pending': return 'var(--warning-color)'
      case 'unverified': return 'var(--danger-color)'
      case 'published': return 'var(--success-color)'
      case 'scheduled': return 'var(--warning-color)'
      case 'draft': return 'var(--gray-400)'
      case 'responded': return 'var(--success-color)'
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
      {/* Profile Stats */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <BarChart3 size={20} />
            Profile Performance
          </div>
          <button className="btn btn-primary">
            <Edit size={16} />
            Edit Profile
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {insights.totalViews.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Views</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success-green)', marginTop: '0.25rem' }}>
                +{insights.monthlyGrowth}% this month
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {insights.averageRating}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Average Rating</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.125rem' }}>
                {renderStars(Math.floor(insights.averageRating))}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {insights.totalReviews}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Reviews</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {profile.status === 'verified' ? '✓' : '?'}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Verification</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                {profile.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Building2 size={20} />
            Business Profile
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-900)' }}>
                {profile.name}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="var(--gray-500)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                    {profile.address}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={16} color="var(--gray-500)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                    {profile.phone}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={16} color="var(--gray-500)" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                     style={{ fontSize: '0.875rem', color: 'var(--primary-teal)', textDecoration: 'none' }}>
                    {profile.website}
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
                {Object.entries(profile.hours).map(([day, hours]) => (
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
            Customer Reviews
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
                  <span>{review.date}</span>
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

  const renderPosts = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <MessageSquare size={20} />
            Google Posts
          </div>
          <button className="btn btn-primary">
            <Plus size={16} />
            Create Post
          </button>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {posts.map((post) => (
              <div key={post.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>
                      {post.title}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      {post.content}
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
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {post.type} post
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
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Views: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {post.views}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>Engagement: </span>
                    <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {post.engagement}
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

  const renderInsights = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Search Queries */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Search size={20} />
            Search Queries
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {insights.searchQueries.map((query, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0.75rem',
                border: '1px solid var(--gray-200)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)'
              }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                  "{query}"
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  {Math.floor(Math.random() * 100) + 50} searches
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Photos */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title">
            <Camera size={20} />
            Top Performing Photos
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {insights.topPhotos.map((photo) => (
              <div key={photo.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--white)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  width: '100%', 
                  height: '120px', 
                  backgroundColor: 'var(--gray-100)', 
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <Camera size={32} color="var(--gray-400)" />
                </div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--gray-800)' }}>
                  {photo.title}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                  {photo.views.toLocaleString()} views
                </p>
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
      case 'posts':
        return renderPosts()
      case 'insights':
        return renderInsights()
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
            onClick={() => setActiveTab('posts')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'posts' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'posts' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'posts' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Edit size={16} />
            Posts
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'insights' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'insights' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'insights' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <TrendingUp size={16} />
            Insights
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

export default GoogleBusiness
