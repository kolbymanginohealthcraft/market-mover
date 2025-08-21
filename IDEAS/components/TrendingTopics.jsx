import React, { useState, useEffect } from 'react'
import { TrendingUp, Hash, Users, Building2, Globe, Clock, ArrowUpRight, Filter } from 'lucide-react'

const TrendingTopics = ({ selectedClient }) => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [timeRange, setTimeRange] = useState('24h')

  // Mock data for trending topics
  const trendingData = {
    industry: [
      { 
        topic: 'Telehealth Integration', 
        mentions: 15420, 
        growth: '+45%', 
        sentiment: 'positive',
        description: 'Healthcare providers rapidly adopting telehealth solutions',
        tags: ['healthcare', 'technology', 'remote-care']
      },
      { 
        topic: 'Value-Based Care', 
        mentions: 12850, 
        growth: '+32%', 
        sentiment: 'positive',
        description: 'Shift towards outcome-based healthcare models',
        tags: ['healthcare', 'policy', 'reform']
      },
      { 
        topic: 'AI in Diagnostics', 
        mentions: 9870, 
        growth: '+67%', 
        sentiment: 'positive',
        description: 'Artificial intelligence revolutionizing medical diagnostics',
        tags: ['AI', 'diagnostics', 'innovation']
      },
      { 
        topic: 'Mental Health Awareness', 
        mentions: 23450, 
        growth: '+28%', 
        sentiment: 'positive',
        description: 'Growing focus on mental health in healthcare settings',
        tags: ['mental-health', 'wellness', 'awareness']
      }
    ],
    vertical: {
      'sunrise-snf': [
        { 
          topic: 'SNF Quality Measures', 
          mentions: 5430, 
          growth: '+38%', 
          sentiment: 'positive',
          description: 'Skilled nursing facilities focusing on quality metrics',
          tags: ['SNF', 'quality', 'metrics']
        },
        { 
          topic: 'Rehabilitation Technology', 
          mentions: 3210, 
          growth: '+52%', 
          sentiment: 'positive',
          description: 'Advanced rehab equipment and techniques',
          tags: ['rehab', 'technology', 'equipment']
        }
      ],
      'medsupply-co': [
        { 
          topic: 'Supply Chain Optimization', 
          mentions: 8760, 
          growth: '+41%', 
          sentiment: 'positive',
          description: 'Healthcare supply chain improvements',
          tags: ['supply-chain', 'logistics', 'efficiency']
        },
        { 
          topic: 'Medical Device Innovation', 
          mentions: 6540, 
          growth: '+29%', 
          sentiment: 'positive',
          description: 'New medical device technologies',
          tags: ['devices', 'innovation', 'technology']
        }
      ],
      'rehab-partners': [
        { 
          topic: 'Physical Therapy Trends', 
          mentions: 4320, 
          growth: '+35%', 
          sentiment: 'positive',
          description: 'Emerging physical therapy methodologies',
          tags: ['PT', 'therapy', 'rehabilitation']
        },
        { 
          topic: 'Sports Medicine', 
          mentions: 2980, 
          growth: '+48%', 
          sentiment: 'positive',
          description: 'Advances in sports medicine and recovery',
          tags: ['sports', 'medicine', 'recovery']
        }
      ],
      'care-tech': [
        { 
          topic: 'Healthcare Software', 
          mentions: 7650, 
          growth: '+56%', 
          sentiment: 'positive',
          description: 'Software solutions for healthcare management',
          tags: ['software', 'healthcare', 'management']
        },
        { 
          topic: 'Patient Engagement', 
          mentions: 5430, 
          growth: '+33%', 
          sentiment: 'positive',
          description: 'Digital tools for patient engagement',
          tags: ['engagement', 'digital', 'patients']
        }
      ]
    },
    general: [
      { 
        topic: 'Sustainability in Healthcare', 
        mentions: 18750, 
        growth: '+42%', 
        sentiment: 'positive',
        description: 'Green initiatives in healthcare facilities',
        tags: ['sustainability', 'green', 'healthcare']
      },
      { 
        topic: 'Workplace Wellness', 
        mentions: 22340, 
        growth: '+31%', 
        sentiment: 'positive',
        description: 'Employee wellness programs gaining traction',
        tags: ['wellness', 'workplace', 'employees']
      },
      { 
        topic: 'Digital Health Platforms', 
        mentions: 15670, 
        growth: '+58%', 
        sentiment: 'positive',
        description: 'Platform-based healthcare solutions',
        tags: ['digital', 'platforms', 'healthcare']
      }
    ]
  }

  const getTopicsForCategory = () => {
    if (selectedCategory === 'industry') return trendingData.industry
    if (selectedCategory === 'vertical') {
      return selectedClient === 'all' 
        ? Object.values(trendingData.vertical).flat()
        : trendingData.vertical[selectedClient] || []
    }
    if (selectedCategory === 'general') return trendingData.general
    return [
      ...trendingData.industry,
      ...(selectedClient === 'all' 
        ? Object.values(trendingData.vertical).flat()
        : trendingData.vertical[selectedClient] || []),
      ...trendingData.general
    ]
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '#10b981'
      case 'negative': return '#ef4444'
      case 'neutral': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '📈'
      case 'negative': return '📉'
      case 'neutral': return '➡️'
      default: return '➡️'
    }
  }

  return (
    <div>
      {/* Navigation Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: selectedCategory === 'all' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: selectedCategory === 'all' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: selectedCategory === 'all' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Globe size={16} />
            All Topics
          </button>
          <button
            onClick={() => setSelectedCategory('industry')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: selectedCategory === 'industry' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: selectedCategory === 'industry' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: selectedCategory === 'industry' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Building2 size={16} />
            Industry Trends
          </button>
          <button
            onClick={() => setSelectedCategory('vertical')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: selectedCategory === 'vertical' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: selectedCategory === 'vertical' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: selectedCategory === 'vertical' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Users size={16} />
            Vertical Specific
          </button>
          <button
            onClick={() => setSelectedCategory('general')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: selectedCategory === 'general' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: selectedCategory === 'general' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: selectedCategory === 'general' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <TrendingUp size={16} />
            General Trends
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="page-content-area">
        {/* Time Range Filter */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginBottom: '2rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--gray-100)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--gray-700)'
          }}>
            <Clock size={16} />
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{ 
                border: 'none', 
                background: 'transparent',
                fontSize: '0.875rem',
                color: 'var(--gray-700)',
                cursor: 'pointer'
              }}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

      {/* Topics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
        gap: '1.5rem'
      }}>
        {getTopicsForCategory().map((topic, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              border: '1px solid var(--gray-200)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            {/* Topic Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: 'var(--gray-900)',
                  marginBottom: '0.5rem'
                }}>
                  {topic.topic}
                </h3>
                <p style={{ 
                  color: 'var(--gray-600)', 
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {topic.description}
                </p>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: 'var(--gray-100)',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--gray-600)'
              }}>
                {getSentimentIcon(topic.sentiment)}
                <span style={{ textTransform: 'capitalize' }}>{topic.sentiment}</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                <Hash size={14} color="var(--gray-500)" />
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--gray-700)',
                  fontWeight: '500'
                }}>
                  {topic.mentions.toLocaleString()} mentions
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                color: getSentimentColor(topic.sentiment),
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                <ArrowUpRight size={14} />
                {topic.growth}
              </div>
            </div>

            {/* Tags */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.5rem' 
            }}>
              {topic.tags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'var(--primary-teal)',
                    color: 'white',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Action Button */}
            <button
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.75rem',
                border: '1px solid var(--primary-teal)',
                borderRadius: '0.5rem',
                background: 'transparent',
                color: 'var(--primary-teal)',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--primary-teal)'
                e.target.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.color = 'var(--primary-teal)'
              }}
            >
              Create Campaign from Trend
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {getTopicsForCategory().length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 1rem',
          color: 'var(--gray-500)'
        }}>
          <TrendingUp size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No trending topics found</h3>
          <p>Try adjusting your filters or check back later for new trends.</p>
        </div>
      )}
      </div>
    </div>
  )
}

export default TrendingTopics
