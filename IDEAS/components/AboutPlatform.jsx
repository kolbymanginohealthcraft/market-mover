import React from 'react'
import { 
  Target, 
  TrendingUp, 
  Shield, 
  Users, 
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
  Bookmark
} from 'lucide-react'
import healthcraftLogo from '../images/HealthcraftCreativeSolutions-White.png'

const AboutPlatform = () => {
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

  return (
    <div>
      {/* Content */}
      <div style={{ padding: '2rem 2rem' }}>
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
    </div>
  )
}

export default AboutPlatform
