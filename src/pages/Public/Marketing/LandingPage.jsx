import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  MapPin,
  AlertTriangle,
  Settings,
  ArrowUpRight,
  Globe,
  Clock,
  Database,
  Bot,
  Megaphone,
  Calendar,
  DollarSign,
  Network,
  Download,
  Filter,
  Plus,
  Send,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  StopCircle,
  MessageSquare as MessageSquareIcon,
  Phone,
  UserCheck,
  UserX,
  Handshake,
  Compass
} from 'lucide-react';

import styles from './LandingPage.module.css';
import heroImage from '../../../assets/hero-illustration.jpg';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const heroRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          heroRef.current.classList.add(styles.inView);
        }
      },
      { threshold: 0.3 }
    );
    if (heroRef.current) {
      observer.observe(heroRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Database,
      title: 'Claims Intelligence',
      description: 'Analyze comprehensive claims data to understand provider behavior and service utilization.',
      benefits: ['All payers and settings', 'Referral patterns', 'Diagnoses and procedures', 'Volume Trends']
    },
    {
      icon: BarChart3,
      title: 'Quality Performance',
      description: 'Identify opportunities and build a stronger sales and marketing case by comparing provider performance against industry benchmarks.',
      benefits: ['Provider Rankings', 'Quality Comparisons', 'Performance Trends', 'Benchmark Analysis']
    },
    {
      icon: Users,
      title: 'Market Demographics',
      description: 'Understand the people that providers serve to align your strategy with market needs.',
      benefits: ['Population density', 'Economic profile', 'Percent insured', 'National and county benchmarks']
    },
    {
      icon: Shield,
      title: 'Payer Enrollment',
      description: 'Track payer networks, enrollment data, and coverage patterns to understand market access and opportunities.',
      benefits: ['Payer networks', 'Enrollment trends', 'Coverage patterns', 'Network access']
    }
  ];

  const platformModules = [
    {
      icon: Search,
      title: 'Search the Industry',
      description: 'Find healthcare providers with advanced filtering and comprehensive provider profiles.',
      features: ['Advanced Filters', 'Provider Profiles', 'Contact Information', 'Specialty Search', 'Location Search']
    },
    {
      icon: MapPin,
      title: 'Saved Markets',
      description: 'Create and manage custom market areas for targeted analysis and insights.',
      features: ['Market Creation', 'Geographic Analysis', 'Market Comparison', 'Saved Searches', 'Custom Boundaries']
    },
    {
      icon: Network,
      title: 'My Network',
      description: 'Track and analyze your provider partners, competitors and target opportunities.',
      features: ['Network Mapping', 'Relationship Tracking', 'Connection Analysis', 'Referral Patterns', 'Network Insights']
    }
  ];

  const useCases = [
    {
      icon: Building2,
      title: 'Healthcare Administrators',
      description: 'Make strategic decisions with comprehensive market data to optimize operations and identify growth opportunities.'
    },
    {
      icon: Heart,
      title: 'Clinical Program Leaders',
      description: 'Plan strategic care programs by aligning clinical services with the needs and outcomes of local populations.'
    },
    {
      icon: TrendingUp,
      title: 'Referral Coordinators',
      description: 'Visualize referral paths, spot new connection opportunities, and strengthen existing provider relationships.'
    },
    {
      icon: Settings,
      title: 'Operations Directors',
      description: 'Optimize operational efficiency and resource allocation using performance insights and data-driven clarity.'
    },
    {
      icon: Target,
      title: 'Business Development',
      description: 'Identify and pursue new market opportunities with data-driven insights on provider networks and market gaps.'
    },
    {
      icon: Megaphone,
      title: 'Sales and Marketing Teams',
      description: 'Identify high-potential markets and tailor outreach based on geography, service type, and facility profile.'
    }
  ];



  return (
    <div className={styles.landingPage}>
                    {/* Hero Section */}
        <section className={styles.hero} ref={heroRef}>
         <div className={styles.heroGrid}>
           <div className={styles.heroTextCard} data-aos="fade-right" data-aos-delay="200">
                             <h1 className={styles.heroTitle}>Smarter Decisions,<br />Powered by Data</h1>

             <p className={styles.heroSubtitle}>
               <strong>
                 Market Mover<sup>®</sup>
               </strong>{" "}
               is a data-driven strategy platform built by{" "}
               <span className={styles.tooltipWrapper}>
                 <a
                   href="https://www.healthcraftcreative.com/"
                   target="_blank"
                   rel="noopener noreferrer"
                   className={styles.brandLinkInline}
                 >
                   Healthcraft Creative Solutions
                 </a>
                 <span className={`${styles.tooltipContent} ${styles.greenTooltip}`}>
                   Visit our main company site
                 </span>
               </span>
               . We help healthcare{" "}
               <span className={styles.tooltipWrapper}>
                 <span className={styles.roleHighlight}>providers</span>
                 <span className={styles.tooltipContent}>
                   Organizations delivering patient care like SNFs, hospitals, and clinics.
                 </span>
               </span>{" "}
               and{" "}
               <span className={styles.tooltipWrapper}>
                 <span className={styles.roleHighlight}>suppliers</span>
                 <span className={styles.tooltipContent}>
                   Companies offering services or products to healthcare providers such as therapy vendors,
                   software platforms, or diagnostics labs.
                 </span>
               </span>{" "}
               discover the right partners, understand market opportunities, and grow smarter powered by
               real-time insights and market intelligence.
             </p>

                                                       <p className={styles.heroCred}>
                 <TrendingUp size={20} className={styles.credIcon} />
                 Know more. Grow more.
               </p>
               
                                               <div className={styles.heroActions}>
                   <Link to="/signup">
                     <button className={styles.primaryButton}>
                       Start For Free
                     </button>
                   </Link>
                   {/* <Link to="/pricing">
                     <button className={styles.secondaryButton}>
                       View Plans
                     </button>
                   </Link> */}
                 </div>
           </div>

                       <div className={styles.heroImageWrapper} data-aos="fade-left" data-aos-delay="500">
              <img src={heroImage} alt="Market insights dashboard" className={styles.heroImage} />
            </div>
         </div>
               </section>

        {/* Why Market Intelligence & Why Healthcraft Section */}
        <section className={styles.aboutSection}>
          <div className={styles.aboutContainer}>
            <div className={styles.aboutColumn} data-aos="fade-right" data-aos-delay="200">
              <h2>Why Market Intelligence Matters</h2>
              <p>
                In today's competitive healthcare landscape, having a great service isn't enough.
                You need to understand where the opportunities are and how to reach the right partners.
                That's where market analytics come in: they turn blind outreach into focused strategy.
              </p>
            </div>
            <div className={styles.aboutArrow} data-aos="zoom-in" data-aos-delay="300"></div>
            <div className={styles.aboutColumn} data-aos="fade-left" data-aos-delay="400">
              <h2>Why Healthcraft?</h2>
              <p>
                Healthcraft Creative Solutions is a team of analysts, designers, and strategists
                dedicated to transforming how healthcare organizations grow. Our flagship product,
                Market Mover, brings transparency, clarity, and action to your market strategy with
                tools designed to help you move faster and smarter than ever before.
              </p>
            </div>
          </div>
        </section>



                     {/* Platform Modules */}
        <section className={styles.modules}>
          <div className={styles.sectionHeader}>
            <h2>Platform Modules</h2>
            <p>Purpose-built tools that bring clarity and precision to healthcare market dynamics</p>
          </div>
          
          <div className={styles.modulesContainer}>
            {/* Data Preview Section - Left Side */}
            <div className={styles.chartSection}>
              <div className={styles.platformPreview}>
                <div className={styles.previewHeader}>
                  <h3>Real Market Data Insights</h3>
                                     <div className={styles.previewTabs}>
                     <span className={styles.previewTab}>Me</span>
                     <span className={styles.previewTab}>Partners</span>
                     <span className={styles.previewTab}>Competitors</span>
                     <span className={styles.previewTab}>Targets</span>
                   </div>
                </div>
                <div className={styles.previewContent}>
                  <div className={styles.previewChart}>
                    <div className={styles.chartBar} style={{height: '60%'}}></div>
                    <div className={styles.chartBar} style={{height: '80%'}}></div>
                    <div className={styles.chartBar} style={{height: '45%'}}></div>
                    <div className={styles.chartBar} style={{height: '90%'}}></div>
                    <div className={styles.chartBar} style={{height: '70%'}}></div>
                  </div>
                  <div className={styles.previewStats}>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>1.8M+</span>
                      <span className={styles.statLabel}>Organizations</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>5.2M+</span>
                      <span className={styles.statLabel}>Licensed Professionals</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modules List - Right Side */}
            <div className={styles.modulesList}>
              {platformModules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <div key={index} className={styles.moduleItem}>
                    <div className={styles.moduleIcon}>
                      <Icon size={20} />
                    </div>
                    <div className={styles.moduleContent}>
                      <h4>{module.title}</h4>
                      <p>{module.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

             {/* Core Data Intelligence */}
       <section className={styles.features}>
                   <div className={styles.sectionHeader}>
            <h2>Key Components</h2>
            <p>Core areas that form the foundation for smarter strategic decisions.</p>
          </div>
         <div className={styles.featuresGrid}>
           {features.map((feature, index) => {
             const Icon = feature.icon;
             return (
               <div key={index} className={styles.featureCard}>
                 <div className={styles.featureHeader}>
                   <Icon size={24} className={styles.featureIcon} />
                   <h3>{feature.title}</h3>
                 </div>
                 <p className={styles.featureDescription}>{feature.description}</p>
                 <ul className={styles.featureBenefits}>
                   {feature.benefits.map((benefit, benefitIndex) => (
                     <li key={benefitIndex}>
                       <CheckCircle size={16} />
                       {benefit}
                     </li>
                   ))}
                 </ul>
               </div>
             );
           })}
         </div>
         
         
       </section>

             {/* Use Cases */}
       <section className={styles.useCases}>
         <div className={styles.sectionHeader}>
           <h2>A Healthcare Professionals Guide for Strategy and Growth</h2>
           <p>Market Mover was designed as a simple sales and marketing enhancer for healthcare providers and sales professionals.</p>
         </div>
        <div className={styles.useCasesGrid}>
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div key={index} className={styles.useCaseCard}>
                <Icon size={32} className={styles.useCaseIcon} />
                <h3>{useCase.title}</h3>
                <p>{useCase.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2>Ready to supercharge your healthcare strategy?</h2>
          <p>Experience Healthcraft's proven analytics expertise reimagined for the modern healthcare landscape. Be among the first to access our industry-leading vision in an entirely new way.</p>
          <div className={styles.ctaActions}>
            <Link to="/signup">
              <button className={styles.ctaPrimaryButton}>
                Sign Up Now
              </button>
            </Link>
            {/* <Link to="/pricing">
              <button className={styles.ctaSecondaryButton}>
                View Plans
              </button>
            </Link> */}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
