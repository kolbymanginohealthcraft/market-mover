import React, { useState } from 'react'
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Shield, 
  Users, 
  User,
  BarChart3, 
  Zap, 
  Heart, 
  Star,
  ArrowRight,
  CheckCircle,
  Building2,
  Mail,
  MessageSquare,
  Layout,
  Coins,
  Eye,
  Search,
  FileText,
  Tag,
  Bookmark,
  Info,
  Lightbulb,
  Map,
  AlertTriangle,
  Settings,
  ArrowUpRight,
  Globe,
  Clock,
  Target as TargetIcon,
  Database
} from 'lucide-react'
import healthcraftLogo from '../images/HealthcraftCreativeSolutions-White.png'

const AboutPlatform = () => {
  const [activeTab, setActiveTab] = useState('client-sees')

  const tabs = [
    { id: 'client-sees', label: 'What the Client Sees', icon: Eye },
    { id: 'background', label: 'Background', icon: FileText },
    { id: 'vision', label: 'Vision', icon: Lightbulb },
    { id: 'capabilities', label: 'Capabilities', icon: Star },
    { id: 'benefits', label: 'Benefits', icon: Settings },
    { id: 'risks', label: 'Risks', icon: AlertTriangle },
    { id: 'roadmap', label: 'Roadmap', icon: Map }
  ]

  const features = [
    {
      icon: Target,
      title: 'AI-Powered Campaigns',
      description: 'Intelligent content suggestions and audience targeting that adapts to your healthcare audience.',
      benefits: ['Smart content generation', 'Audience optimization', 'Performance prediction']
    },
    {
      icon: Shield,
      title: 'Healthcare Compliance',
      description: 'Built-in compliance features ensuring your marketing meets industry standards and regulatory requirements.',
      benefits: ['HIPAA-aware content', 'Regulatory compliance', 'Audit trails']
    },
    {
      icon: Eye,
      title: 'Market Intelligence',
      description: 'Comprehensive insights into healthcare markets, providers, and industry trends.',
      benefits: ['Provider analytics', 'Market trends', 'Competitive insights']
    },
    {
      icon: BarChart3,
      title: 'Measurable Results',
      description: 'Real-time analytics and ROI tracking to optimize your marketing strategy for maximum impact.',
      benefits: ['Performance tracking', 'ROI measurement', 'A/B testing']
    },
    {
      icon: Users,
      title: 'Targeted Outreach',
      description: 'Precision targeting of healthcare decision-makers with advanced segmentation capabilities.',
      benefits: ['Advanced segmentation', 'Decision-maker targeting', 'Engagement tracking']
    },
    {
      icon: Zap,
      title: 'Automation & Efficiency',
      description: 'Streamlined workflows and automated processes to save time and increase productivity.',
      benefits: ['Workflow automation', 'Time savings', 'Process optimization']
    }
  ]

  const platformModules = [
    {
      icon: Eye,
      title: 'Market Intelligence',
      description: 'Discover and analyze healthcare providers, market trends, and competitive insights.',
      features: ['Provider Search', 'Claims Analysis', 'Quality Metrics', 'Payer Networks', 'Population Data']
    },
    {
      icon: Mail,
      title: 'Campaign Execution',
      description: 'Create, manage, and optimize multi-channel marketing campaigns.',
      features: ['Campaign Builder', 'Email Marketing', 'Social Media', 'Landing Pages', 'Analytics']
    }
  ]

  const useCases = [
    {
      title: 'Post-Acute Care Providers',
      description: 'SNFs, IRFs, ALFs targeting referral sources and patient acquisition.',
      icon: Heart
    },
    {
      title: 'Healthcare Suppliers',
      description: 'Medical device and service companies reaching healthcare decision-makers.',
      icon: Shield
    },
    {
      title: 'Healthcare Associations',
      description: 'Professional organizations and networks building member engagement.',
      icon: Users
    },
    {
      title: 'Healthcare Technology Companies',
      description: 'SaaS and technology solutions providers serving the healthcare industry.',
      icon: Building2
    }
  ]

  const stats = [
    { label: 'Healthcare Organizations Served', value: '200+' },
    { label: 'Campaigns Executed', value: '1,500+' },
    { label: 'Providers Analyzed', value: '2.4M+' },
    { label: 'Average ROI Improvement', value: '45%' }
  ]

  const renderClientSeesContent = () => (
    <div>
      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--primary-teal) 0%, var(--success-green) 100%)',
        color: 'white',
        padding: '3rem 2rem',
        borderRadius: '0.5rem',
        marginBottom: '2rem'
      }}>
        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          {/* Left column - Text content */}
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1.5rem', lineHeight: '1.2' }}>
              Empowering Healthcare Growth Through Intelligent Marketing
            </h1>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.6', marginBottom: '1rem', opacity: '0.9' }}>
              Growth Engine is a unified platform designed to revolutionize healthcare marketing by combining AI-powered insights with comprehensive campaign management.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.6', marginBottom: '2rem', opacity: '0.9' }}>
              We help healthcare organizations connect with their target audiences more effectively, optimize their marketing spend, and drive measurable growth.
            </p>
            
            {/* Feature tags */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <span style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                AI-Powered Campaigns
              </span>
              <span style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Healthcare Compliance
              </span>
              <span style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Market Intelligence
              </span>
            </div>
            
            {/* Quote */}
            <div style={{ 
              fontStyle: 'italic', 
              fontSize: '1.125rem', 
              lineHeight: '1.6', 
              opacity: '0.95',
              borderLeft: '3px solid rgba(255, 255, 255, 0.3)',
              paddingLeft: '1.5rem'
            }}>
              "This integration positions your company as a leader in data-driven healthcare marketing, offering both the tools to execute campaigns and the intelligence to make them highly effective!"
            </div>
          </div>
          
          {/* Right column - Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img 
              src={healthcraftLogo}
              alt="Healthcraft Creative Solutions"
              style={{ 
                width: '100%',
                maxWidth: '400px',
                height: 'auto'
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {stats.map((stat, index) => (
          <div key={index} className="widget" style={{ textAlign: 'center' }}>
            <div className="widget-body">
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Modules */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '2rem', color: 'var(--gray-900)' }}>
          Platform Modules
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {platformModules.map((module, index) => {
            const Icon = module.icon
            return (
              <div key={index} className="widget">
                <div className="widget-header">
                  <div className="widget-title">
                    <Icon size={20} />
                    {module.title}
                  </div>
                </div>
                <div className="widget-body">
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                    {module.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {module.features.map((feature, featureIndex) => (
                      <span key={featureIndex} style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: 'var(--primary-teal-50)',
                        color: 'var(--primary-teal)',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Key Features */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '2rem', color: 'var(--gray-900)' }}>
          Key Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="widget">
                <div className="widget-header">
                  <div className="widget-title">
                    <Icon size={20} />
                    {feature.title}
                  </div>
                </div>
                <div className="widget-body">
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                    {feature.description}
                  </p>
                  <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.875rem', 
                        color: 'var(--gray-700)' 
                      }}>
                        <CheckCircle size={14} color="var(--primary-teal)" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Use Cases */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '2rem', color: 'var(--gray-900)' }}>
          Designed For
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            return (
              <div key={index} className="widget">
                <div className="widget-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: 'var(--primary-teal-50)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-teal)'
                    }}>
                      <Icon size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                      {useCase.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                    {useCase.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mission Statement */}
      <div className="widget" style={{ 
        border: '2px solid var(--primary-teal)', 
        backgroundColor: 'var(--primary-teal-50)',
        marginBottom: '2rem'
      }}>
        <div className="widget-header">
          <div className="widget-title" style={{ color: 'var(--primary-teal)' }}>
            <Target size={20} />
            Our Mission
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-900)' }}>
                Revolutionizing Healthcare Marketing
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                We believe that healthcare organizations deserve marketing tools that understand their unique challenges and regulatory requirements. Growth Engine was built from the ground up to address the specific needs of healthcare marketing, combining cutting-edge AI technology with deep industry expertise.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Our platform empowers healthcare organizations to make data-driven marketing decisions, reach the right audiences at the right time, and achieve measurable growth while maintaining the highest standards of compliance and professionalism.
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '100px',
                height: '100px',
                backgroundColor: 'var(--primary-teal)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.5rem'
              }}>
                <Target size={40} color="white" />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: '500' }}>
                Growth Engine
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div style={{ 
        background: 'var(--gray-50)', 
        padding: '2rem', 
        borderRadius: '0.5rem', 
        textAlign: 'center',
        border: '1px solid var(--gray-200)'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-900)' }}>
          Ready to Transform Your Healthcare Marketing?
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          Start exploring the platform features and see how Growth Engine can help you achieve your marketing goals.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">
            Explore Dashboard
            <ArrowRight size={16} />
          </button>
          <button className="btn btn-secondary">
            View Documentation
            <FileText size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  const renderBackgroundContent = () => (
    <div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '2rem', color: 'var(--gray-900)' }}>
        Background
      </h2>
      
      {/* Origin Story */}
      <div className="widget" style={{ marginBottom: '2rem' }}>
        <div className="widget-header">
          <div className="widget-title">
            <FileText size={20} />
            Our Origin Story
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Growth Engine was born from the recognition that healthcare marketing faces unique challenges that generic marketing platforms cannot adequately address. The healthcare industry operates under strict regulatory requirements, complex stakeholder relationships, and specialized terminology that requires deep understanding.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Our team at Healthcraft Creative Solutions has spent years working with healthcare organizations, understanding their pain points, and developing solutions that truly serve their needs. This platform represents the culmination of that experience, combined with cutting-edge technology to create a comprehensive solution.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                The platform was developed in response to the growing need for healthcare organizations to compete effectively in an increasingly digital marketplace while maintaining compliance and building meaningful relationships with their target audiences.
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                backgroundColor: 'var(--primary-teal-50)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '3px solid var(--primary-teal)'
              }}>
                <FileText size={48} color="var(--primary-teal)" />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: '500' }}>
                Built on Experience
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Challenge Section */}
      <div className="widget" style={{ 
        border: '2px solid var(--warning-orange)', 
        backgroundColor: 'var(--warning-orange-50)',
        marginBottom: '2rem'
      }}>
        <div className="widget-header">
          <div className="widget-title" style={{ color: 'var(--warning-orange)' }}>
            <AlertTriangle size={20} />
            The Challenge We Face
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--gray-900)' }}>
                <TrendingDown size={16} style={{ marginRight: '0.5rem' }} />
                Internal Pressures
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                This has been a difficult sales year, with revenue lagging behind expectations. Two senior leaders recently left, morale within the team has dropped, and a new leader is navigating their first year as head of the department under a great deal of pressure.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                The C-Suite has made it clear: we need to find ways to operate at higher margins, with fewer people, while delivering stronger results.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--gray-900)' }}>
                <Zap size={16} style={{ marginRight: '0.5rem' }} />
                Market Disruption
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                The broader market context compounds this pressure. Across industries — and particularly in healthcare and senior care — budgets for marketing are tight. Buyers are scrutinizing every dollar.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                The explosion of AI tools has created a new challenge: clients increasingly believe they can replace paid marketing services with cheap or even free AI-driven alternatives.
              </p>
            </div>
          </div>
          
          <div style={{ 
            background: 'var(--warning-orange-100)', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            marginTop: '1rem',
            border: '1px solid var(--warning-orange-200)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <MessageSquare size={16} color="var(--warning-orange)" />
              <strong style={{ color: 'var(--warning-orange)', fontSize: '0.875rem' }}>The Question We Face:</strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0', fontStyle: 'italic' }}>
              "Why pay for an agency if ChatGPT can generate content or if no-code AI agents can automate campaigns?"
            </p>
          </div>
          
          <div style={{ 
            background: 'var(--success-green-50)', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            marginTop: '1rem',
            border: '1px solid var(--success-green-200)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Lightbulb size={16} color="var(--success-green)" />
              <strong style={{ color: 'var(--success-green)', fontSize: '0.875rem' }}>The Solution:</strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
              The companies who will thrive are those that integrate AI thoughtfully, differentiate themselves with unique data or insights, and offer clients not just outputs (content, campaigns, reports), but outcomes (qualified leads, new revenue, measurable growth).
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderVisionContent = () => (
    <div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '2rem', color: 'var(--gray-900)' }}>
        Vision
      </h2>
      
      {/* Vision Statement */}
      <div className="widget" style={{ 
        background: 'linear-gradient(135deg, var(--primary-teal-50) 0%, var(--success-green-50) 100%)',
        border: '2px solid var(--primary-teal)',
        marginBottom: '2rem'
      }}>
        <div className="widget-header">
          <div className="widget-title" style={{ color: 'var(--primary-teal)' }}>
            <Lightbulb size={20} />
            Our Vision Statement
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Our vision is to become the premier platform for healthcare marketing, where every healthcare organization can access the tools, insights, and capabilities they need to grow their business effectively.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                We envision a future where healthcare marketing is not just about selling services, but about building communities, educating stakeholders, and driving positive health outcomes. Growth Engine will be at the center of this transformation, providing the technology and insights that make this possible.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Ultimately, we want to democratize access to sophisticated marketing capabilities for healthcare organizations of all sizes, ensuring that quality healthcare marketing is not just the domain of large corporations with massive budgets.
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                backgroundColor: 'var(--primary-teal)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Lightbulb size={48} color="white" />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: '500' }}>
                Future-Focused
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Strategic Response */}
      <div className="widget" style={{ marginBottom: '2rem' }}>
        <div className="widget-header">
          <div className="widget-title">
            <TargetIcon size={20} />
            Our Strategic Response
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Eye size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Market Intelligence (AKA Market Mover)
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Deep insights into healthcare markets, providers, and industry trends that drive strategic decision-making.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Mail size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Marketing Execution
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Comprehensive campaign management and execution tools that deliver measurable outcomes.
              </p>
            </div>
          </div>
          
          <div style={{ 
            background: 'var(--primary-teal-50)', 
            padding: '1.5rem', 
            borderRadius: '0.5rem',
            border: '1px solid var(--primary-teal-200)',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Zap size={16} color="var(--primary-teal)" />
              <strong style={{ color: 'var(--primary-teal)', fontSize: '0.875rem' }}>The Growth Engine Platform:</strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
              It merges two historically separate worlds — market intelligence and marketing execution — into one seamless system. Clients will not just receive outputs (content, campaigns, reports), but outcomes they can measure (qualified leads, growth in referrals, increased census).
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
              By combining these two pillars under one roof, we move beyond being seen as "just another marketing vendor" and establish ourselves as a strategic partner with a proprietary platform that clients cannot easily replicate.
            </p>
          </div>
          
          <div style={{ 
            background: 'var(--success-green-50)', 
            padding: '1.5rem', 
            borderRadius: '0.5rem',
            border: '1px solid var(--success-green-200)',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <ArrowUpRight size={16} color="var(--success-green)" />
              <strong style={{ color: 'var(--success-green)', fontSize: '0.875rem' }}>AI as a Differentiator:</strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
              Rather than fighting AI as a competitor, we turn it into a differentiator: a system where our expertise, data, and strategy elevate AI from a gimmick into a growth engine for our clients. This is how we rebound, reset morale, and reposition ourselves as an indispensable partner in the industry.
            </p>
          </div>
          
          <div style={{ 
            background: 'var(--warning-orange-50)', 
            padding: '1.5rem', 
            borderRadius: '0.5rem',
            border: '1px solid var(--warning-orange-200)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Clock size={16} color="var(--warning-orange)" />
              <strong style={{ color: 'var(--warning-orange)', fontSize: '0.875rem' }}>Why Now:</strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
              It may feel like the wrong time to consider something this ambitious, but the reality is that this is exactly when bold moves matter most. Sales are down, staff are fleeing, and the market is skeptical of traditional agencies. Waiting means falling further behind. Acting now positions us as innovators in our industry, not just survivors.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCapabilitiesContent = () => (
    <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '2rem', color: 'var(--gray-900)' }}>
          Capabilities
        </h2>
      
      {/* Overview */}
      <div className="widget" style={{ marginBottom: '2rem' }}>
        <div className="widget-header">
          <div className="widget-title">
            <Star size={20} />
            Platform Overview
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                What sets Growth Engine apart is our deep specialization in healthcare marketing. Unlike generic marketing platforms, we understand the nuances of healthcare compliance, the complexity of provider networks, and the unique challenges of marketing to healthcare decision-makers.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Our platform combines powerful intelligence capabilities with comprehensive execution tools to deliver a complete healthcare marketing solution. From market intelligence and audience targeting to campaign execution and performance measurement, every capability is designed to drive measurable outcomes for healthcare organizations.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                The platform operates on a unified architecture, ensuring seamless data flow between intelligence and execution modules while maintaining the highest standards of security and compliance.
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, var(--primary-teal) 0%, var(--success-green) 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Star size={48} color="white" />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: '500' }}>
                Healthcare-First
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Why This Is Unique */}
      <div className="widget" style={{ marginBottom: '2rem' }}>
        <div className="widget-header">
          <div className="widget-title">
            <Star size={20} />
            Why This Is Unique
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Healthcare-First Design
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Unlike generic marketing platforms, Growth Engine is purpose-built for healthcare and senior care. Every feature, workflow, and data point is designed with healthcare compliance, terminology, and industry-specific needs in mind.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Intelligence + Execution Unity
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Most platforms offer either market intelligence OR campaign execution. Growth Engine uniquely combines both in a unified architecture, ensuring seamless data flow from insights to action.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Database size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Protected Data Stewardship
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Clients see market scale and reach without direct access to individual contact information. This unique approach protects our data stewardship while enabling confident marketing decisions.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BarChart3 size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Real Healthcare KPIs
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Beyond vanity metrics, we track performance measures that matter to healthcare organizations: referral conversions, campaign response rates, census lift, and share-of-voice benchmarks.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Settings size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  No-Tier Access Model
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Every client receives access to the complete toolkit without feature restrictions or tier limitations. This eliminates the complexity and frustration of tiered pricing models common in other platforms.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Personalized Intelligence
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Each customer can configure branding preferences, value propositions, words to use/avoid, and target audiences. This creates personalized but scalable marketing intelligence that adapts to each organization's unique voice and goals.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Intelligence Section */}
      <div className="widget" style={{ marginBottom: '2rem' }}>
        <div className="widget-header">
          <div className="widget-title" style={{ color: 'var(--primary-teal)' }}>
            <Eye size={20} />
            Intelligence (Insights & Targeting)
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Industry-Specific
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Unlike generic tools, this platform is purpose-built for healthcare and senior care. The intelligence layer (data, workflows, benchmarks) is deeply relevant to how our clients operate.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Master Database
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Clients see the scale and reach of their available markets, but never export individual contact info. This protects our stewardship of the data while allowing confident marketing.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Tag size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Smart Segments
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Pre-built segments can be customized further. We benchmark engagement across our customer base to show best send times, content formats, and conversion rates.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BarChart3 size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Real KPIs
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Beyond vanity metrics, clients gain visibility into performance measures that matter: referral conversions, campaign response rates, census lift, and share-of-voice benchmarks.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Company Personas
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Each customer can configure branding preferences, value propositions, words to use/avoid, and target audiences. This creates personalized but scalable marketing intelligence.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Database size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Master Contact Database
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Comprehensive healthcare contact database with controlled client visibility. Clients see market scale and reach without direct access to individual contact information.
              </p>
              <ul style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0', paddingLeft: '1rem' }}>
                <li>Protected data stewardship</li>
                <li>Market reach visibility</li>
                <li>Compliance-ready access controls</li>
              </ul>
            </div>
            
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TargetIcon size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Industry-Specific Intelligence
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Purpose-built intelligence layer with healthcare-specific data, workflows, and benchmarks that generic tools cannot provide.
              </p>
              <ul style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0', paddingLeft: '1rem' }}>
                <li>Healthcare-specific data sources</li>
                <li>Industry workflow optimization</li>
                <li>Specialized benchmarking</li>
                <li>Regulatory compliance insights</li>
              </ul>
            </div>
            
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Market Trend Analysis
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Advanced market analysis capabilities to identify trends, opportunities, and competitive positioning in healthcare markets.
              </p>
              <ul style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0', paddingLeft: '1rem' }}>
                <li>Market trend identification</li>
                <li>Competitive analysis</li>
                <li>Opportunity mapping</li>
                <li>Predictive market insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Execution Section */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title" style={{ color: 'var(--success-green)' }}>
            <Mail size={20} />
            Execution (Campaigns & Enablement)
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Layout size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  One Platform
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Consolidates what today requires multiple logins and manual cobbling of results. Clients and our team both gain efficiency.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Flexible Usage
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Some clients will confidently self-manage campaigns, while others will rely on us for strategy and execution. The platform is built for both.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Settings size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  All Features
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Every client gets the full toolkit — multi-channel campaigns, SEO and reputation management, landing page creation, analytics, and reporting.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Collaboration
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Clients can log in, see the task pipeline, and approve creative directly in-platform. This cuts down on back-and-forth and improves transparency.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Recurring Revenue
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Shifts us away from project-based work into a subscription model with stable, predictable income.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Globe size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Multi-Channel Execution
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Native support for email, social media, SEO, Google Business updates, reputation management, and landing page creation.
              </p>
              <ul style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0', paddingLeft: '1rem' }}>
                <li>Email campaign management</li>
                <li>Social media automation</li>
                <li>SEO optimization tools</li>
                <li>Google Business integration</li>
                <li>Reputation management</li>
                <li>Landing page builder</li>
              </ul>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BarChart3 size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  KPI Tracking Dashboards
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Comprehensive dashboards that track meaningful outcomes and provide actionable insights for campaign optimization.
              </p>
              <ul style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0', paddingLeft: '1rem' }}>
                <li>Real-time performance tracking</li>
                <li>ROI measurement</li>
                <li>Campaign effectiveness analysis</li>
                <li>Custom reporting capabilities</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderRoadmapContent = () => (
    <div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '2rem', color: 'var(--gray-900)' }}>
        Roadmap
      </h2>
      
      {/* Overview */}
      <div className="widget" style={{ marginBottom: '2rem' }}>
        <div className="widget-header">
          <div className="widget-title">
            <Map size={20} />
            Strategic Development Path
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Our roadmap outlines the strategic development path for Growth Engine, from initial launch to future expansion. This timeline represents our commitment to continuous improvement and innovation in healthcare marketing technology.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Each phase builds upon the previous one, ensuring that we deliver value incrementally while maintaining focus on our core mission. We remain flexible to adapt to market feedback and emerging opportunities.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                The roadmap is designed to balance immediate client needs with long-term strategic goals, ensuring sustainable growth and market leadership in healthcare marketing technology.
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, var(--primary-teal) 0%, var(--success-green) 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Map size={48} color="white" />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: '500' }}>
                Future-Focused
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline Roadmap */}
      <div className="widget" style={{ marginBottom: '2rem' }}>
        <div className="widget-header">
          <div className="widget-title" style={{ color: 'var(--primary-teal)' }}>
            <Clock size={20} />
            Development Timeline
          </div>
        </div>
        <div className="widget-body">
          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            {/* Timeline Line */}
            <div style={{
              position: 'absolute',
              left: '1rem',
              top: '0',
              bottom: '0',
              width: '3px',
              background: 'linear-gradient(to bottom, var(--primary-teal) 0%, var(--success-green) 100%)',
              borderRadius: '2px'
            }} />
            
            {/* Phase 1: Foundation */}
            <div style={{ position: 'relative', marginBottom: '3rem' }}>
              <div style={{
                position: 'absolute',
                left: '-2.5rem',
                top: '0.5rem',
                width: '1rem',
                height: '1rem',
                backgroundColor: 'var(--primary-teal)',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 0 0 3px var(--primary-teal)'
              }} />
              <div style={{
                background: 'var(--primary-teal-50)',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '2px solid var(--primary-teal)',
                marginLeft: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--primary-teal)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Settings size={20} color="white" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                      Phase 1: Foundation
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-teal)', fontWeight: '500', marginTop: '0.25rem' }}>
                      6-8 months
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--primary-teal-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <CheckCircle size={16} color="var(--primary-teal)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>Core Platform</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      Basic intelligence and execution modules
                    </p>
                  </div>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--primary-teal-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <CheckCircle size={16} color="var(--primary-teal)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>Client Onboarding</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      Initial client implementation and training
                    </p>
                  </div>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--primary-teal-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <CheckCircle size={16} color="var(--primary-teal)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>Market Validation</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      Feedback collection and platform refinement
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Phase 2: Growth */}
            <div style={{ position: 'relative', marginBottom: '3rem' }}>
              <div style={{
                position: 'absolute',
                left: '-2.5rem',
                top: '0.5rem',
                width: '1rem',
                height: '1rem',
                backgroundColor: 'var(--success-green)',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 0 0 3px var(--success-green)'
              }} />
              <div style={{
                background: 'var(--success-green-50)',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '2px solid var(--success-green)',
                marginLeft: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--success-green)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingUp size={20} color="white" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                      Phase 2: Growth
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success-green)', fontWeight: '500', marginTop: '0.25rem' }}>
                      6-12 months
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--success-green-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Zap size={16} color="var(--success-green)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>Advanced Features</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      Enhanced analytics and automation capabilities
                    </p>
                  </div>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--success-green-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Users size={16} color="var(--success-green)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>Client Expansion</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      Scaling to additional healthcare organizations
                    </p>
                  </div>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--success-green-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <BarChart3 size={16} color="var(--success-green)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>Performance Optimization</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      Data-driven improvements and optimizations
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Phase 3: Innovation */}
            <div style={{ position: 'relative', marginBottom: '3rem' }}>
              <div style={{
                position: 'absolute',
                left: '-2.5rem',
                top: '0.5rem',
                width: '1rem',
                height: '1rem',
                backgroundColor: 'var(--warning-orange)',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 0 0 3px var(--warning-orange)'
              }} />
              <div style={{
                background: 'var(--warning-orange-50)',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '2px solid var(--warning-orange)',
                marginLeft: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--warning-orange)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Lightbulb size={20} color="white" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                      Phase 3: Innovation
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--warning-orange)', fontWeight: '500', marginTop: '0.25rem' }}>
                      12-18 months
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--warning-orange-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Zap size={16} color="var(--warning-orange)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>AI Integration</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      Advanced AI agents and machine learning
                    </p>
                  </div>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--warning-orange-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Globe size={16} color="var(--warning-orange)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>Market Expansion</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      Broader healthcare market penetration
                    </p>
                  </div>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--warning-orange-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Star size={16} color="var(--warning-orange)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>Industry Leadership</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      Establishing market leadership position
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Phase 4: Future Vision */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '-2.5rem',
                top: '0.5rem',
                width: '1rem',
                height: '1rem',
                background: 'linear-gradient(135deg, var(--primary-teal) 0%, var(--success-green) 100%)',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 0 0 3px var(--primary-teal)'
              }} />
              <div style={{
                background: 'linear-gradient(135deg, var(--primary-teal-50) 0%, var(--success-green-50) 100%)',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '2px solid var(--primary-teal)',
                marginLeft: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, var(--primary-teal) 0%, var(--success-green) 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Eye size={20} color="white" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                      Phase 4: Future Vision
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-teal)', fontWeight: '500', marginTop: '0.25rem' }}>
                      Ongoing
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--primary-teal-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Zap size={16} color="var(--primary-teal)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>AI Ecosystem</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      Comprehensive AI-powered marketing ecosystem
                    </p>
                  </div>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--primary-teal-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <BarChart3 size={16} color="var(--primary-teal)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>Predictive Analytics</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      Advanced predictive and prescriptive analytics
                    </p>
                  </div>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--primary-teal-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Globe size={16} color="var(--primary-teal)" />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>Global Reach</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', margin: '0' }}>
                      International healthcare market expansion
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Future Expansion */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title" style={{ color: 'var(--success-green)' }}>
            <Lightbulb size={20} />
            Future Expansion Vision
          </div>
        </div>
        <div className="widget-body">
          <div style={{ 
            background: 'linear-gradient(135deg, var(--success-green-50) 0%, var(--primary-teal-50) 100%)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '2px solid var(--success-green)',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, var(--success-green) 0%, var(--primary-teal) 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Lightbulb size={24} color="white" />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                AI-Powered Marketing Ecosystem
              </h4>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
              Looking ahead, we envision expanding Growth Engine into a comprehensive AI-powered marketing ecosystem. This could include advanced AI agents that can autonomously manage campaigns, analyze market trends, and optimize performance in real-time.
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
              Future phases may also include predictive analytics, machine learning-powered content generation, and deeper integration with healthcare-specific data sources to provide even more targeted and effective marketing solutions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )


  const renderBenefitsContent = () => (
    <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '2rem', color: 'var(--gray-900)' }}>
          Benefits
        </h2>
      
      {/* Overview */}
      <div className="widget" style={{ marginBottom: '2rem' }}>
        <div className="widget-header">
          <div className="widget-title">
            <Settings size={20} />
            Comprehensive Benefits
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Growth Engine provides comprehensive solutions for the most pressing challenges in healthcare marketing. From identifying target audiences to measuring campaign effectiveness, we offer end-to-end support for healthcare marketing initiatives.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Our solutions address key pain points including compliance management, audience targeting, content creation, performance measurement, and market analysis. Each solution is designed with healthcare-specific requirements in mind.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                We also provide ongoing support and training to ensure that organizations can maximize the value of our platform and achieve their marketing objectives effectively.
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, var(--primary-teal) 0%, var(--success-green) 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Settings size={48} color="white" />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: '500' }}>
                End-to-End Support
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* For Clients */}
      <div className="widget" style={{ marginBottom: '2rem' }}>
        <div className="widget-header">
          <div className="widget-title" style={{ color: 'var(--primary-teal)' }}>
            <Users size={20} />
            For Clients
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Layout size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Unified Platform
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Eliminates the need to utilize multiple tools for social media, email marketing, SEO management, reporting and analytics, and market intelligence.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Flexible Usage
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Provides both self-service capability and professional guidance to meet different client needs.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BarChart3 size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Proven ROI
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Gives visibility into campaign impact, proving ROI in ways free AI tools cannot.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--primary-teal-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--primary-teal-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary-teal)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Compliance Ready
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Offers compliance-ready execution and managed sender reputation for healthcare organizations.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* For Us */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title" style={{ color: 'var(--success-green)' }}>
            <Building2 size={20} />
            For Us
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Star size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Proprietary Product
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Creates a proprietary product that cannot be easily replaced by competitors.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Recurring Revenue
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Shifts revenue from low-margin projects to recurring subscriptions with stable income.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Automation
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Reduces workload for staff by automating repetitive tasks and streamlining workflows.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Heart size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Employee Retention
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Retains employees better by streamlining workflows and reducing burnout.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Collaboration
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Strengthens collaboration by giving clients visibility into tasks and approvals.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--success-green-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--success-green-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--success-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Coins size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Cost Savings
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Saves money by eliminating various platforms and solving operational pain points.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderRisksContent = () => (
    <div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '2rem', color: 'var(--gray-900)' }}>
        Risks
      </h2>
      
      {/* Overview */}
      <div className="widget" style={{ marginBottom: '2rem' }}>
        <div className="widget-header">
          <div className="widget-title">
            <AlertTriangle size={20} />
            Risk Management Approach
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                We acknowledge the potential risks and challenges associated with healthcare marketing technology, including data privacy concerns, regulatory compliance issues, and the need for ongoing adaptation to changing healthcare landscapes.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '1rem' }}>
                To mitigate these risks, we've implemented robust security measures, maintain strict compliance protocols, and continuously monitor regulatory changes to ensure our platform remains compliant and secure.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                We also recognize the importance of user education and provide comprehensive training and support to help organizations use our platform safely and effectively while minimizing potential risks.
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                backgroundColor: 'var(--warning-orange-50)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '3px solid var(--warning-orange)'
              }}>
                <AlertTriangle size={48} color="var(--warning-orange)" />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: '500' }}>
                Proactive Mitigation
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Key Risk Considerations */}
      <div className="widget">
        <div className="widget-header">
          <div className="widget-title" style={{ color: 'var(--warning-orange)' }}>
            <AlertTriangle size={20} />
            Key Risk Considerations
          </div>
        </div>
        <div className="widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Settings size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Execution Risk
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                A platform of this scale requires careful planning and prioritization to ensure successful delivery and implementation.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Mail size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Sender Reputation
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Running large-scale campaigns comes with the risk of damaging email deliverability if not carefully managed.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Support Expectations
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                With a fully bespoke product, we must ensure we have the resources to maintain the platform long-term.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Market Education
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Clients must understand that this is not a CRM, nor a replacement for one — but a growth-focused engine.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Data Boundaries
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Some clients may expect access to raw contact lists, which we cannot provide for compliance, privacy, and data ownership reasons.
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--warning-orange-50)', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-orange-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--warning-orange)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BarChart3 size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0' }}>
                  Platform Perception
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', margin: '0' }}>
                Risk that clients may view this as a substitute for industry data platforms rather than a marketing and growth enablement platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'client-sees':
        return renderClientSeesContent()
      case 'background':
        return renderBackgroundContent()
      case 'vision':
        return renderVisionContent()
      case 'capabilities':
        return renderCapabilitiesContent()
      case 'roadmap':
        return renderRoadmapContent()
      case 'benefits':
        return renderBenefitsContent()
      case 'risks':
        return renderRisksContent()
      default:
        return renderClientSeesContent()
    }
  }

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

      {/* Content */}
      <div style={{ padding: '2rem 2rem' }}>
        {renderTabContent()}
      </div>
    </div>
  )
}

export default AboutPlatform
