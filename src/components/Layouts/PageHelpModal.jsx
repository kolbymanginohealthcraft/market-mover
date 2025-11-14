import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Info, X } from 'lucide-react';
import styles from './PageHelpModal.module.css';

const getPageHelp = (pathname) => {
  if (pathname.includes('/search/orgs')) {
    return {
      title: 'Search Organizations',
      description: 'Search and filter healthcare organizations by name, type, location, network, and taxonomy codes. Use filters to narrow results, then view overview statistics or browse the detailed listing. Results can be exported to CSV for further analysis.'
    };
  }
  
  if (pathname.includes('/search/ind')) {
    return {
      title: 'Search Individuals',
      description: 'Search healthcare practitioners by name, specialty, location, gender, and affiliations. Filter by saved markets or taxonomy codes. View overview statistics or browse the detailed practitioner listing. Results reflect all matching records and can be exported to CSV.'
    };
  }
  
  if (pathname.includes('/search/density')) {
    return {
      title: 'Provider Density',
      description: 'Analyze provider density by taxonomy code at a specific location. Enter an address or click on the map to see how many providers of each taxonomy type are within a radius. Results show provider counts and can be filtered by your saved taxonomy tags.'
    };
  }
  
  if (pathname.includes('/markets')) {
    return {
      title: 'Markets',
      description: 'Create and manage geographic markets to analyze provider networks, demographics, and enrollment data within specific areas. Markets define a center point and radius for analysis. Use the list view to manage markets or the map view to visualize all your markets geographically.'
    };
  }
  
  if (pathname.includes('/network')) {
    return {
      title: 'Network',
      description: 'View and manage providers you\'ve tagged as partners, competitors, targets, or your own organization. Use the list view to browse tagged providers or the map view to see their geographic distribution. Tag providers from search results or provider profiles.'
    };
  }
  
  if (pathname.includes('/procedures')) {
    return {
      title: 'Procedures',
      description: 'Tag and track procedure codes relevant to your business. Use My Tags to manage your saved procedures, or Browse All to search the full procedure code database. Tagged procedures can be used to filter searches and analyze claims data.'
    };
  }
  
  if (pathname.includes('/diagnoses')) {
    return {
      title: 'Diagnoses',
      description: 'Tag and track diagnosis codes relevant to your business. Use My Tags to manage your saved diagnoses, or Browse All to search the full diagnosis code database. Tagged diagnoses can be used to filter searches and analyze claims data.'
    };
  }
  
  if (pathname.includes('/metrics')) {
    return {
      title: 'Metrics',
      description: 'Tag and track quality metrics relevant to your business. Use My Tags to manage your saved metrics, or Browse All to search the full metrics database. Tagged metrics can be used to analyze provider performance and quality measures.'
    };
  }
  
  if (pathname.includes('/taxonomies')) {
    return {
      title: 'Taxonomies',
      description: 'Tag and track taxonomy codes relevant to your business. Use My Tags to manage your saved taxonomies organized by type (staff, my setting, upstream, downstream), or Browse All to search the full taxonomy database. Tagged taxonomies can be used to filter provider searches.'
    };
  }
  
  if (pathname.includes('/dashboard')) {
    return {
      title: 'Dashboard',
      description: 'Your central hub for activity tracking, usage statistics, and platform announcements. View your recent searches, provider views, and other activity. Monitor your usage patterns and stay updated with system announcements.'
    };
  }
  
  if (pathname.includes('/enrollment')) {
    return {
      title: 'CMS Enrollment',
      description: 'Medicare Advantage enrollment metrics for your saved markets. View enrollment trends, payer breakdowns, and geographic distribution of enrolled beneficiaries within your defined market areas.'
    };
  }
  
  if (pathname.includes('/population')) {
    return {
      title: 'Population Demographics',
      description: 'Census demographics and population data for your markets. Analyze age distributions, income levels, insurance coverage, and other demographic factors that impact healthcare utilization patterns.'
    };
  }
  
  if (pathname.includes('/catchment')) {
    return {
      title: 'Catchment',
      description: 'Service area analysis examining the relationships between ZIP codes where patients live and where they visit hospitals. Analyze catchment areas by hospital or ZIP code to understand geographic patient patterns.'
    };
  }
  
  if (pathname.includes('/storyteller')) {
    return {
      title: 'Quality Storyteller',
      description: 'Highlight the differentiators that set your organization apart. Compare provider performance against benchmarks, analyze quality metrics, and create compelling narratives using data-driven insights.'
    };
  }
  
  if (pathname.includes('/claims')) {
    return {
      title: 'Claims Data Explorer',
      description: 'Interactive claims analysis with dynamic filtering and aggregation. Explore procedure volumes, diagnosis patterns, referral flows, and utilization trends across providers and geographic areas.'
    };
  }
  
  if (pathname.includes('/market/') && !pathname.includes('/markets')) {
    return {
      title: 'Market Analysis',
      description: 'Comprehensive analysis of a specific geographic market. View provider listings, density maps, population demographics, enrollment data, claims patterns, and catchment analysis for your defined market area.'
    };
  }
  
  if (pathname.match(/^\/app\/\d+/)) {
    return {
      title: 'Provider Profile',
      description: 'Detailed provider information including location, network affiliations, claims data, quality metrics, and market analysis. Use the tabs to explore different aspects of the provider\'s profile and performance.'
    };
  }
  
  if (pathname.includes('/settings')) {
    return {
      title: 'Account Settings',
      description: 'Manage your profile and preferences. Update your personal information, team settings, subscription details, branding, and user access. Configure your account to match your organization\'s needs.'
    };
  }
  
  if (pathname.includes('/feedback')) {
    return {
      title: 'Leave Feedback',
      description: 'Share your thoughts and suggestions with us. Submit feature requests, report issues, or share your experience using Market Mover. Your feedback helps us improve the platform.'
    };
  }
  
  return null;
};

export default function PageHelpModal() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const helpContent = getPageHelp(location.pathname);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!helpContent) return;
    
    const handleHelpShortcut = (event) => {
      if (event.key === '?' && !isOpen) {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleHelpShortcut);
    return () => {
      document.removeEventListener('keydown', handleHelpShortcut);
    };
  }, [isOpen, helpContent]);
  
  if (!helpContent) return null;

  return (
    <>
      <button
        className={styles.helpButton}
        onClick={() => setIsOpen(true)}
        title="Page help (Press ?)"
        aria-label="Show page help"
      >
        <Info size={16} />
      </button>

      {isOpen && createPortal(
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{helpContent.title}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>{helpContent.description}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

