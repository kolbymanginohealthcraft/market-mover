import React, { useState } from 'react'
import { 
  Building2, 
  MapPin, 
  Globe, 
  User, 
  Target, 
  MessageSquare, 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Plus,
  ExternalLink,
  Phone,
  Mail,
  FileText,
  TrendingUp,
  Shield,
  Star,
  Upload,
  Save,
  X,
  Image,
  Palette,
  Zap,
  Type,
  UserPlus,
  Settings,
  Key,
  Trash2
} from 'lucide-react'

const CustomerView = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState('company')
  const [isEditing, setIsEditing] = useState(false)
  const [logoFiles, setLogoFiles] = useState([])
  const [logoPreviews, setLogoPreviews] = useState([])
  const [showAddColleague, setShowAddColleague] = useState(false)
  const [newColleague, setNewColleague] = useState({
    name: '',
    email: '',
    role: '',
    permissions: 'view'
  })

  // Sample company data - in a real app, this would come from props or API
  const getCustomerData = (clientId) => {
    const customers = {
      'healthcraft': {
        id: clientId,
        company: {
          name: 'Healthcraft Creative Solutions',
          address: '1000 Marketing Avenue, Austin, TX 78701',
          url: 'https://healthcraft.com',
          phone: '(512) 555-0000',
          email: 'hello@healthcraft.com',
          industry: 'Marketing & Creative Services',
          founded: '2018'
        },
        description: {
          type: 'Agency',
          vertical: 'Healthcare Marketing & Creative Services',
          about: 'Healthcraft Creative Solutions is a specialized marketing agency focused on helping healthcare organizations grow their patient base and improve their market presence. We combine creative expertise with healthcare industry knowledge to deliver results-driven marketing campaigns.',
          targetClients: 'Healthcare providers, medical practices, healthcare technology companies, medical device manufacturers',
          tone: {
            keywords: ['creative', 'strategic', 'results-driven', 'healthcare-focused', 'innovative', 'trusted'],
            avoid: ['generic', 'one-size-fits-all', 'cheap', 'quick-fix', 'unprofessional']
          }
        },
        valueProposition: {
          primary: 'Healthcare-focused creative marketing that drives patient acquisition and builds trust through strategic, compliant, and results-driven campaigns.',
          benefits: [
            'Specialized healthcare marketing expertise',
            'Compliant and HIPAA-aware creative solutions',
            'Data-driven campaign optimization',
            'Comprehensive brand development',
            'Ongoing support and strategy refinement'
          ],
          differentiators: [
            'Only agency specializing in healthcare creative marketing',
            'Proven track record with 200+ healthcare clients',
            'In-house compliance and legal review team',
            'Advanced analytics and ROI tracking'
          ]
        },
        team: [
          {
            id: 1,
            name: 'Sarah Johnson',
            email: 'sarah@healthcraft.com',
            role: 'Marketing Director',
            permissions: 'admin',
            status: 'active',
            lastActive: '2024-01-15'
          },
          {
            id: 2,
            name: 'Michael Chen',
            email: 'mchen@healthcraft.com',
            role: 'Creative Director',
            permissions: 'edit',
            status: 'active',
            lastActive: '2024-01-14'
          },
          {
            id: 3,
            name: 'Lisa Wilson',
            email: 'lwilson@healthcraft.com',
            role: 'Client Success Manager',
            permissions: 'view',
            status: 'active',
            lastActive: '2024-01-13'
          }
        ],
        services: [
          { name: 'Brand Development', status: 'active', renewal: '2024-06-15' },
          { name: 'Digital Marketing', status: 'active', renewal: '2024-06-15' },
          { name: 'Content Creation', status: 'active', renewal: '2024-06-15' },
          { name: 'Social Media Management', status: 'active', renewal: '2024-07-01' },
          { name: 'SEO Optimization', status: 'active', renewal: '2024-05-01' }
        ],
        subscription: {
          plan: 'Enterprise',
          monthlyRate: '$5,000',
          nextRenewal: '2024-06-15',
          status: 'active'
        },
        recentActivity: [
          {
            type: 'campaign',
            title: 'New Brand Campaign Launched',
            description: 'Launched comprehensive brand refresh for healthcare client',
            date: '2024-01-15',
            status: 'completed'
          },
          {
            type: 'meeting',
            title: 'Q1 Strategy Planning',
            description: 'Strategic planning session for Q1 marketing initiatives',
            date: '2024-01-12',
            status: 'completed'
          },
          {
            type: 'creative',
            title: 'Website Redesign Project',
            description: 'Completed major website redesign for medical practice',
            date: '2024-01-10',
            status: 'active'
          }
        ],
                 tasks: [
           {
             id: 1,
             title: 'Develop Q1 marketing strategy',
             description: 'Create comprehensive marketing plan for healthcare clients',
             assignee: 'Strategy Team',
             dueDate: '2024-01-20',
             priority: 'high',
             progress: 75
           },
           {
             id: 2,
             title: 'Review client performance metrics',
             description: 'Analyze campaign performance across all healthcare clients',
             assignee: 'Analytics Team',
             dueDate: '2024-01-25',
             priority: 'medium',
             progress: 30
           },
           {
             id: 3,
             title: 'Update brand guidelines',
             description: 'Refresh brand guidelines and creative standards',
             assignee: 'Creative Team',
             dueDate: '2024-01-30',
             priority: 'high',
             progress: 45
           }
         ],
         colorPalette: {
           primary: {
             name: 'Healthcare Teal',
             hex: '#0D9488',
             usage: 'Primary brand color, headers, CTAs'
           },
           secondary: {
             name: 'Trust Blue',
             hex: '#2563EB',
             usage: 'Secondary elements, success states'
           },
           accent: {
             name: 'Creative Orange',
             hex: '#EA580C',
             usage: 'Highlights, important information'
           },
           neutral: {
             name: 'Professional Gray',
             hex: '#6B7280',
             usage: 'Text, borders, backgrounds'
           }
         },
         typography: {
           primary: {
             name: 'Inter',
             category: 'Sans-serif',
             usage: 'Body text and general content',
             weight: '400'
           },
           secondary: {
             name: 'Inter',
             category: 'Sans-serif',
             usage: 'Call-to-action buttons and important elements',
             weight: '600'
           },
           display: {
             name: 'Poppins',
             category: 'Sans-serif',
             usage: 'Hero sections and special announcements',
             weight: '700'
           }
         }
      },
      'sunrise-snf': {
        id: clientId,
        company: {
          name: 'Sunrise SNF',
          address: '123 Healthcare Blvd, Austin, TX 78701',
          url: 'https://sunrisesnf.com',
          phone: '(512) 555-0123',
          email: 'info@sunrisesnf.com',
          industry: 'Healthcare - Skilled Nursing Facility',
          founded: '2015'
        },
        description: {
          type: 'Provider',
          vertical: 'Healthcare - Post-Acute Care',
          about: 'Sunrise SNF is a leading skilled nursing facility specializing in post-acute care, rehabilitation services, and long-term care for seniors. We serve patients transitioning from hospitals and those requiring specialized medical care.',
          targetClients: 'Medicare/Medicaid patients, post-surgical patients, seniors requiring long-term care',
          tone: {
            keywords: ['compassionate', 'professional', 'trusted', 'expertise', 'care', 'recovery', 'wellness'],
            avoid: ['cheap', 'discount', 'budget', 'quick fix', 'miracle cure']
          }
        },
        valueProposition: {
          primary: 'Exceptional post-acute care with personalized rehabilitation programs that help patients recover faster and return home sooner.',
          benefits: [
            'Specialized care teams with advanced certifications',
            'State-of-the-art rehabilitation equipment',
            'Individualized treatment plans for optimal recovery',
            'Family-centered approach with regular communication',
            'Proven outcomes with 85% successful discharge rate'
          ],
          differentiators: [
            'Only facility in Austin with 24/7 on-site physician coverage',
            'Specialized wound care program with 95% healing rate',
            'Advanced fall prevention protocols',
            'Comprehensive discharge planning and home transition support'
          ]
        },
        team: [
          {
            id: 1,
            name: 'Dr. Robert Martinez',
            email: 'rmartinez@sunrisesnf.com',
            role: 'Medical Director',
            permissions: 'admin',
            status: 'active',
            lastActive: '2024-01-15'
          },
          {
            id: 2,
            name: 'Jennifer Adams',
            email: 'jadams@sunrisesnf.com',
            role: 'Administrator',
            permissions: 'admin',
            status: 'active',
            lastActive: '2024-01-14'
          },
          {
            id: 3,
            name: 'David Thompson',
            email: 'dthompson@sunrisesnf.com',
            role: 'Marketing Coordinator',
            permissions: 'edit',
            status: 'active',
            lastActive: '2024-01-13'
          }
        ],
        colorPalette: {
          primary: {
            name: 'Healing Blue',
            hex: '#2563EB',
            usage: 'Primary brand color, headers, CTAs'
          },
          secondary: {
            name: 'Compassionate Green',
            hex: '#059669',
            usage: 'Secondary elements, success states'
          },
          accent: {
            name: 'Warm Gold',
            hex: '#D97706',
            usage: 'Highlights, important information'
          },
          neutral: {
            name: 'Trust Gray',
            hex: '#6B7280',
            usage: 'Text, borders, backgrounds'
          }
        },
        typography: {
          primary: {
            name: 'Inter',
            category: 'Sans-serif',
            usage: 'Body text and general content',
            weight: '400'
          },
          secondary: {
            name: 'Inter',
            category: 'Sans-serif',
            usage: 'Call-to-action buttons and important elements',
            weight: '600'
          },
          display: {
            name: 'Space Grotesk',
            category: 'Sans-serif',
            usage: 'Hero sections and special announcements',
            weight: '700'
          }
        }
      }
    }
    // If 'all' is selected, show Healthcraft's data (agency view)
    if (clientId === 'all') {
      return customers['healthcraft']
    }
    return customers[clientId] || customers['healthcraft']
  }

  const customerData = getCustomerData(selectedClient)

  const handleLogoUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
      const newFiles = [...logoFiles, ...files]
      setLogoFiles(newFiles)
      
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setLogoPreviews(prev => [...prev, e.target.result])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleSave = () => {
    // In a real app, this would save to the backend
    setIsEditing(false)
    // Reset logo preview if no new files were selected
    if (logoFiles.length === 0) {
      setLogoPreviews([])
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setLogoFiles([])
    setLogoPreviews([])
  }

  const handleAddColleague = () => {
    if (newColleague.name && newColleague.email && newColleague.role) {
      // In a real app, this would save to the backend
      console.log('Adding colleague:', newColleague)
      setNewColleague({ name: '', email: '', role: '', permissions: 'view' })
      setShowAddColleague(false)
    }
  }

  const handleRemoveColleague = (colleagueId) => {
    // In a real app, this would remove from the backend
    console.log('Removing colleague:', colleagueId)
  }

  const getPermissionLabel = (permission) => {
    switch (permission) {
      case 'admin':
        return 'Administrator'
      case 'edit':
        return 'Editor'
      case 'view':
        return 'Viewer'
      default:
        return permission
    }
  }

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'admin':
        return 'var(--danger-color)'
      case 'edit':
        return 'var(--warning-color)'
      case 'view':
        return 'var(--success-color)'
      default:
        return 'var(--gray-500)'
    }
  }



  const renderCompanyInfo = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">
          <Building2 size={20} />
          Company Information
        </div>
        {!isEditing ? (
          <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
            <Edit size={16} />
            Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} />
              Save
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              <X size={16} />
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className="widget-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Contact Information */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
              Contact Information
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={16} color="var(--gray-500)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                  {customerData.company.address}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Globe size={16} color="var(--gray-500)" />
                <a href={customerData.company.url} target="_blank" rel="noopener noreferrer" 
                   style={{ fontSize: '0.875rem', color: 'var(--primary-teal)', textDecoration: 'none' }}>
                  {customerData.company.url}
                  <ExternalLink size={12} style={{ marginLeft: '0.25rem' }} />
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={16} color="var(--gray-500)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                  {customerData.company.phone}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={16} color="var(--gray-500)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                  {customerData.company.email}
                </span>
              </div>
            </div>
          </div>
          
          {/* Company Details */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
              Company Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)', minWidth: '60px' }}>Industry:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-800)' }}>
                  {customerData.company.industry}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)', minWidth: '60px' }}>Founded:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-800)' }}>
                  {customerData.company.founded}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDesignPreferences = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">
          <Palette size={20} />
          Design Preferences
        </div>
      </div>
      <div className="widget-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Logo Upload Section */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
              Company Logos
            </h4>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem'
            }}>
              {/* Logo Previews */}
              {logoPreviews.length > 0 && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  {logoPreviews.map((preview, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img 
                        src={preview} 
                        alt={`Company Logo ${index + 1}`} 
                        style={{ 
                          width: '100%',
                          maxHeight: '80px', 
                          objectFit: 'contain',
                          border: '1px solid var(--gray-200)',
                          borderRadius: '0.375rem',
                          padding: '0.5rem',
                          backgroundColor: 'white'
                        }} 
                      />
                      {isEditing && (
                        <button 
                          onClick={() => {
                            const newFiles = logoFiles.filter((_, i) => i !== index)
                            const newPreviews = logoPreviews.filter((_, i) => i !== index)
                            setLogoFiles(newFiles)
                            setLogoPreviews(newPreviews)
                          }}
                          style={{
                            position: 'absolute',
                            top: '-0.5rem',
                            right: '-0.5rem',
                            background: 'var(--danger-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Area */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '1rem',
                padding: '2rem',
                border: '2px dashed var(--gray-300)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--gray-50)',
                minHeight: '120px',
                justifyContent: 'center'
              }}>
                {logoPreviews.length === 0 ? (
                  <div style={{ textAlign: 'center' }}>
                    <Image size={48} color="var(--gray-400)" />
                    <p style={{ marginTop: '0.5rem', color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                      No logos uploaded
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <Image size={32} color="var(--gray-400)" />
                    <p style={{ marginTop: '0.5rem', color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                      {logoPreviews.length} logo{logoPreviews.length !== 1 ? 's' : ''} uploaded
                    </p>
                  </div>
                )}
                {isEditing && (
                  <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                    <Upload size={16} />
                    {logoPreviews.length > 0 ? 'Add More Logos' : 'Upload Logos'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Color Palette & Typography */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Color Palette */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
                Color Palette
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '20px', height: '20px', backgroundColor: customerData.colorPalette.primary.hex, borderRadius: '4px' }}></div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)' }}>Primary</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', margin: '0' }}>{customerData.colorPalette.primary.name}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '20px', height: '20px', backgroundColor: customerData.colorPalette.secondary.hex, borderRadius: '4px' }}></div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)' }}>Secondary</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', margin: '0' }}>{customerData.colorPalette.secondary.name}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '20px', height: '20px', backgroundColor: customerData.colorPalette.accent.hex, borderRadius: '4px' }}></div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)' }}>Accent</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', margin: '0' }}>{customerData.colorPalette.accent.name}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '20px', height: '20px', backgroundColor: customerData.colorPalette.neutral.hex, borderRadius: '4px' }}></div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)' }}>Neutral</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', margin: '0' }}>{customerData.colorPalette.neutral.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
                Typography
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Type size={14} color="var(--gray-500)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)' }}>Heading</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', margin: '0' }}>
                    {customerData.typography.primary.name} ({customerData.typography.primary.weight})
                  </p>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Type size={14} color="var(--gray-500)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)' }}>Body</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', margin: '0' }}>
                    {customerData.typography.primary.name} ({customerData.typography.primary.weight})
                  </p>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Type size={14} color="var(--gray-500)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)' }}>Accent</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', margin: '0' }}>
                    {customerData.typography.secondary.name} ({customerData.typography.secondary.weight})
                  </p>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Type size={14} color="var(--gray-500)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-700)' }}>Display</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', margin: '0' }}>
                    {customerData.typography.display.name} ({customerData.typography.display.weight})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDescription = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">
          <FileText size={20} />
          Description & Target Market
        </div>
      </div>
      <div className="widget-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
              About Your Company
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
              {customerData.description.about}
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
              Target Market
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
              {customerData.description.targetClients}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderToneVoice = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">
          <MessageSquare size={20} />
          Tone & Voice Guidelines
        </div>
      </div>
      <div className="widget-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
              Keywords to Use
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {customerData.description.tone.keywords.map((keyword, index) => (
                <span key={index} style={{
                  padding: '0.375rem 0.875rem',
                  backgroundColor: 'var(--primary-teal)',
                  color: 'white',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  display: 'inline-block'
                }}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
              Words to Avoid
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {customerData.description.tone.avoid.map((word, index) => (
                <span key={index} style={{
                  padding: '0.375rem 0.875rem',
                  backgroundColor: 'var(--gray-200)',
                  color: 'var(--gray-700)',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  display: 'inline-block'
                }}>
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderValueProposition = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">
          <Zap size={20} />
          Value Proposition
        </div>
      </div>
      <div className="widget-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Primary Value - Full Width */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
              Primary Value
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
              {customerData.valueProposition.primary}
            </p>
          </div>
          
          {/* Benefits & Differentiators - Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
                Benefits
              </h4>
              <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                {customerData.valueProposition.benefits.map((benefit, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.75rem', 
                    marginBottom: '0.75rem', 
                    fontSize: '0.875rem', 
                    color: 'var(--gray-700)' 
                  }}>
                    <CheckCircle size={16} color="var(--primary-teal)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-800)' }}>
                Differentiators
              </h4>
              <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                {customerData.valueProposition.differentiators.map((differentiator, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.75rem', 
                    marginBottom: '0.75rem', 
                    fontSize: '0.875rem', 
                    color: 'var(--gray-700)' 
                  }}>
                    <Shield size={16} color="var(--primary-teal)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{differentiator}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )



  const renderTeamManagement = () => (
    <div className="widget">
      <div className="widget-header">
        <div className="widget-title">
          <Users size={20} />
          Team Management
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddColleague(true)}>
          <UserPlus size={16} />
          Add Colleague
        </button>
      </div>
      <div className="widget-body">
        <div style={{ display: 'grid', gap: '1rem' }}>
          {customerData.team.map((member) => (
            <div key={member.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              border: '1px solid var(--gray-200)',
              borderRadius: '0.375rem',
              backgroundColor: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    {member.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                    {member.role}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: getPermissionColor(member.permissions) + '20',
                  color: getPermissionColor(member.permissions)
                }}>
                  {getPermissionLabel(member.permissions)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  Last active: {member.lastActive}
                </span>
                <button 
                  onClick={() => handleRemoveColleague(member.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger-color)',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {renderCompanyInfo()}
            {renderDescription()}
            {renderToneVoice()}
          </div>
        )
      case 'value-proposition':
        return (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {renderValueProposition()}
          </div>
        )
      case 'design-preferences':
        return (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {renderDesignPreferences()}
          </div>
        )
      case 'team':
        return (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {renderTeamManagement()}
          </div>
        )
      default:
        return (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {renderCompanyInfo()}
            {renderDescription()}
            {renderToneVoice()}
          </div>
        )
    }
  }

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'value-proposition', label: 'Value Proposition', icon: Target },
    { id: 'design-preferences', label: 'Design Preferences', icon: Palette },
    { id: 'team', label: 'Team Management', icon: Users }
  ]

  return (
    <div>
      {/* Navigation Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          {tabs.map((tab) => {
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
      <div className="page-content-area">
        {renderTabContent()}
      </div>

      {/* Add Colleague Modal */}
      {showAddColleague && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                Add Colleague
              </h3>
              <button 
                onClick={() => setShowAddColleague(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-500)'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={newColleague.name}
                  onChange={(e) => setNewColleague({...newColleague, name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input"
                  value={newColleague.email}
                  onChange={(e) => setNewColleague({...newColleague, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Role</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={newColleague.role}
                  onChange={(e) => setNewColleague({...newColleague, role: e.target.value})}
                  placeholder="Enter job title or role"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Permissions</label>
                <select 
                  className="form-select"
                  value={newColleague.permissions}
                  onChange={(e) => setNewColleague({...newColleague, permissions: e.target.value})}
                >
                  <option value="view">Viewer - Can view company information</option>
                  <option value="edit">Editor - Can edit company information</option>
                  <option value="admin">Administrator - Full access to all features</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAddColleague(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddColleague}
              >
                Add Colleague
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerView
