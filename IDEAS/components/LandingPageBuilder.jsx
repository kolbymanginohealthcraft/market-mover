import React, { useState } from 'react'
import { 
  Layout, 
  Type, 
  Image, 
  Target, 
  Mail, 
  Phone, 
  MapPin,
  Plus,
  Save,
  Eye,
  Copy,
  Trash2,
  Move,
  Settings,
  Palette,
  Download,
  Share2,
  BarChart3,
  Clock,
  TrendingUp
} from 'lucide-react'

const LandingPageBuilder = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('builder')
  const [selectedTemplate, setSelectedTemplate] = useState('healthcare')
  const [pageData, setPageData] = useState({
    title: 'Sunrise SNF - Open House Event',
    subtitle: 'Join us for our annual open house and meet our exceptional care team',
    heroImage: '/api/placeholder/800/400',
    ctaText: 'Register Now',
    ctaLink: '#register',
    sections: [
      {
        id: 1,
        type: 'hero',
        content: {
          title: 'Sunrise SNF - Open House Event',
          subtitle: 'Join us for our annual open house and meet our exceptional care team',
          ctaText: 'Register Now',
          ctaLink: '#register'
        }
      },
      {
        id: 2,
        type: 'features',
        content: {
          title: 'What to Expect',
          features: [
            {
              icon: '🏥',
              title: 'Facility Tour',
              description: 'Explore our state-of-the-art facilities and comfortable living spaces'
            },
            {
              icon: '👥',
              title: 'Meet the Team',
              description: 'Connect with our experienced healthcare professionals and staff'
            },
            {
              icon: '🍽️',
              title: 'Refreshments',
              description: 'Enjoy light refreshments while learning about our services'
            }
          ]
        }
      },
      {
        id: 3,
        type: 'contact',
        content: {
          title: 'Get in Touch',
          address: '123 Healthcare Blvd, Medical City, MC 12345',
          phone: '(555) 123-4567',
          email: 'info@sunrisesnf.com'
        }
      }
    ]
  })

  const templates = [
    {
      id: 'healthcare',
      name: 'Healthcare Event',
      preview: '/api/placeholder/300/200',
      category: 'events'
    },
    {
      id: 'service',
      name: 'Service Promotion',
      preview: '/api/placeholder/300/200',
      category: 'promotions'
    },
    {
      id: 'contact',
      name: 'Contact Form',
      preview: '/api/placeholder/300/200',
      category: 'forms'
    }
  ]

  const components = [
    { type: 'hero', name: 'Hero Section', icon: Layout },
    { type: 'features', name: 'Features Grid', icon: Type },
    { type: 'testimonials', name: 'Testimonials', icon: Mail },
    { type: 'contact', name: 'Contact Form', icon: Phone },
    { type: 'gallery', name: 'Image Gallery', icon: Image },
    { type: 'cta', name: 'Call to Action', icon: Target }
  ]

  const addSection = (type) => {
    const newSection = {
      id: Date.now(),
      type,
      content: getDefaultContent(type)
    }
    setPageData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }))
  }

  const getDefaultContent = (type) => {
    switch (type) {
      case 'hero':
        return {
          title: 'New Hero Section',
          subtitle: 'Add your compelling subtitle here',
          ctaText: 'Learn More',
          ctaLink: '#'
        }
      case 'features':
        return {
          title: 'Features Section',
          features: [
            { icon: '✨', title: 'Feature 1', description: 'Description here' },
            { icon: '🚀', title: 'Feature 2', description: 'Description here' },
            { icon: '💡', title: 'Feature 3', description: 'Description here' }
          ]
        }
      case 'contact':
        return {
          title: 'Contact Us',
          address: 'Your address here',
          phone: '(555) 123-4567',
          email: 'contact@example.com'
        }
      default:
        return {}
    }
  }

  const updateSection = (sectionId, content) => {
    setPageData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, content } : section
      )
    }))
  }

  const removeSection = (sectionId) => {
    setPageData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }))
  }

  const moveSection = (sectionId, direction) => {
    setPageData(prev => {
      const sections = [...prev.sections]
      const index = sections.findIndex(s => s.id === sectionId)
      if (direction === 'up' && index > 0) {
        [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]]
      } else if (direction === 'down' && index < sections.length - 1) {
        [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]]
      }
      return { ...prev, sections }
    })
  }

  return (
    <div>
      {/* Navigation Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          <button
            onClick={() => setActiveTab('builder')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'builder' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'builder' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'builder' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Layout size={16} />
            Builder
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'templates' ? 'var(--primary-teal)' : 'var(--gray-600)',
              cursor: 'pointer',
              fontWeight: activeTab === 'templates' ? '600' : '400',
              fontSize: '0.875rem',
              borderBottom: activeTab === 'templates' ? '2px solid var(--primary-teal)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Image size={16} />
            Templates
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
        {activeTab === 'builder' && (
        <div className="builder-container">
          <div className="builder-sidebar">
            <div className="sidebar-section">
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: 'var(--gray-900)', 
                marginBottom: '1rem',
                borderBottom: '1px solid var(--gray-200)',
                paddingBottom: '0.5rem'
              }}>
                Page Settings
              </h3>
              <div className="form-group">
                <label>Page Title</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={pageData.title}
                  onChange={(e) => setPageData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Subtitle</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={pageData.subtitle}
                  onChange={(e) => setPageData(prev => ({ ...prev, subtitle: e.target.value }))}
                />
              </div>
            </div>

            <div className="sidebar-section" style={{ marginTop: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: 'var(--gray-900)', 
                marginBottom: '1rem',
                borderBottom: '1px solid var(--gray-200)',
                paddingBottom: '0.5rem'
              }}>
                Add Sections
              </h3>
              <div className="components-list">
                {components.map(component => {
                  const Icon = component.icon
                  return (
                    <button
                      key={component.type}
                      className="component-item"
                      onClick={() => addSection(component.type)}
                    >
                      <Icon size={16} />
                      <span>{component.name}</span>
                      <Plus size={14} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="sidebar-section" style={{ marginTop: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: 'var(--gray-900)', 
                marginBottom: '1rem',
                borderBottom: '1px solid var(--gray-200)',
                paddingBottom: '0.5rem'
              }}>
                Page Actions
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }}>
                  <Download size={16} />
                  Export
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>
          </div>

          <div className="builder-main">
            <div className="page-preview">
              <div className="preview-header">
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: 'var(--gray-900)', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--gray-200)',
                  paddingBottom: '0.5rem'
                }}>
                  Page Preview
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary">
                    <Eye size={16} />
                    Preview
                  </button>
                  <button className="btn btn-secondary">
                    <Settings size={16} />
                    Settings
                  </button>
                </div>
              </div>

              <div className="page-content">
                {pageData.sections.map((section, index) => (
                  <div key={section.id} className="page-section">
                    <div className="section-controls">
                      <div className="section-info">
                        <span className="section-type">{section.type}</span>
                        <span className="section-number">#{index + 1}</span>
                      </div>
                      <div className="section-actions">
                        <button 
                          className="control-btn"
                          onClick={() => moveSection(section.id, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button 
                          className="control-btn"
                          onClick={() => moveSection(section.id, 'down')}
                          disabled={index === pageData.sections.length - 1}
                        >
                          ↓
                        </button>
                        <button 
                          className="control-btn"
                          onClick={() => removeSection(section.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="section-content">
                      {section.type === 'hero' && (
                        <div className="hero-section">
                          <h1>{section.content.title}</h1>
                          <p>{section.content.subtitle}</p>
                          <button className="btn-primary">
                            {section.content.ctaText}
                          </button>
                        </div>
                      )}

                      {section.type === 'features' && (
                        <div className="features-section">
                          <h2>{section.content.title}</h2>
                          <div className="features-grid">
                            {section.content.features.map((feature, idx) => (
                              <div key={idx} className="feature-item">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.type === 'contact' && (
                        <div className="contact-section">
                          <h2>{section.content.title}</h2>
                          <div className="contact-info">
                            <div className="contact-item">
                              <MapPin size={16} />
                              <span>{section.content.address}</span>
                            </div>
                            <div className="contact-item">
                              <Phone size={16} />
                              <span>{section.content.phone}</span>
                            </div>
                            <div className="contact-item">
                              <Mail size={16} />
                              <span>{section.content.email}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="templates-container">
          <div className="templates-header">
            <h2>Choose a Template</h2>
            <p>Start with a pre-designed template or create from scratch</p>
          </div>

          <div className="templates-grid">
            {templates.map(template => (
              <div 
                key={template.id} 
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="template-preview">
                  <img src={template.preview} alt={template.name} />
                  <div className="template-overlay">
                    <button className="btn-primary">Use Template</button>
                  </div>
                </div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <span className="template-category">{template.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

             {activeTab === 'analytics' && (
         <div>
           {/* Quick Stats */}
           <div className="dashboard-grid">
             <div className="widget">
               <div className="widget-header">
                 <div className="widget-title">
                   <BarChart3 size={20} />
                   <span>Page Views</span>
                 </div>
               </div>
               <div className="widget-body">
                 <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                   1,247
                 </div>
                 <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                   <span style={{ color: 'var(--primary-teal)' }}>+23.5%</span> vs last week
                 </div>
               </div>
             </div>

             <div className="widget">
               <div className="widget-header">
                 <div className="widget-title">
                   <Target size={20} />
                   <span>Conversions</span>
                 </div>
               </div>
               <div className="widget-body">
                 <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                   89
                 </div>
                 <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                   <span style={{ color: 'var(--primary-teal)' }}>+15.2%</span> vs last week
                 </div>
               </div>
             </div>

             <div className="widget">
               <div className="widget-header">
                 <div className="widget-title">
                   <TrendingUp size={20} />
                   <span>Conversion Rate</span>
                 </div>
               </div>
               <div className="widget-body">
                 <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                   7.1%
                 </div>
                 <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                   <span style={{ color: 'var(--error-red)' }}>-2.1%</span> vs last week
                 </div>
               </div>
             </div>

             <div className="widget">
               <div className="widget-header">
                 <div className="widget-title">
                   <Clock size={20} />
                   <span>Avg. Time on Page</span>
                 </div>
               </div>
               <div className="widget-body">
                 <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                   2:34
                 </div>
                 <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                   <span style={{ color: 'var(--primary-teal)' }}>+18.7%</span> vs last week
                 </div>
               </div>
             </div>
           </div>

           {/* Traffic Chart */}
           <div style={{ marginTop: '2rem' }}>
             <div className="widget">
               <div className="widget-header">
                 <div className="widget-title">
                   <BarChart3 size={20} />
                   <span>Traffic Over Time</span>
                 </div>
               </div>
               <div className="widget-body">
                                                     <div style={{ 
                    display: 'flex', 
                    alignItems: 'end', 
                    gap: '1rem', 
                    height: '200px', 
                    padding: '1rem 0',
                    borderBottom: '1px solid var(--gray-200)'
                  }}>
                    {[80, 120, 60, 160, 100, 140, 90].map((height, index) => (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div 
                          style={{ 
                            width: '100%',
                            height: `${height}px`,
                            backgroundColor: 'var(--primary-teal)',
                            borderRadius: '4px 4px 0 0',
                            minHeight: '20px'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '1rem',
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)'
                  }}>
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                  </div>
               </div>
             </div>
           </div>

           {/* Performance Breakdown */}
           <div style={{ marginTop: '2rem' }}>
             <div className="widget">
               <div className="widget-header">
                 <div className="widget-title">
                   <Target size={20} />
                   <span>Performance Breakdown</span>
                 </div>
               </div>
               <div className="widget-body">
                 <div style={{ display: 'grid', gap: '1rem' }}>
                   <div style={{ 
                     display: 'flex', 
                     justifyContent: 'space-between', 
                     alignItems: 'center',
                     padding: '0.75rem',
                     backgroundColor: 'var(--gray-50)',
                     borderRadius: '0.375rem'
                   }}>
                     <div>
                       <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>Mobile Traffic</div>
                       <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>45.2% of total visits</div>
                     </div>
                     <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
                       45.2%
                     </div>
                   </div>
                   
                   <div style={{ 
                     display: 'flex', 
                     justifyContent: 'space-between', 
                     alignItems: 'center',
                     padding: '0.75rem',
                     backgroundColor: 'var(--gray-50)',
                     borderRadius: '0.375rem'
                   }}>
                     <div>
                       <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>Desktop Traffic</div>
                       <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>54.8% of total visits</div>
                     </div>
                     <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
                       54.8%
                     </div>
                   </div>
                   
                   <div style={{ 
                     display: 'flex', 
                     justifyContent: 'space-between', 
                     alignItems: 'center',
                     padding: '0.75rem',
                     backgroundColor: 'var(--gray-50)',
                     borderRadius: '0.375rem'
                   }}>
                     <div>
                       <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>Bounce Rate</div>
                       <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Visitors who left immediately</div>
                     </div>
                     <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--error-red)' }}>
                       32.1%
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
      </div>
    </div>
  )
}

export default LandingPageBuilder
