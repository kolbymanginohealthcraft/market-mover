import React, { useState } from 'react';
import Banner from '../../components/Banner';
import Button from '../../components/Buttons/Button';
import styles from './BannerTest.module.css';

export default function BannerTest() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  const sampleData = {
    title: "Sample Market",
    subtitle: "Dallas, TX • 25 mile radius",
    stats: {
      all: 156,
      untagged: 89,
      me: 12,
      partner: 23,
      competitor: 18,
      target: 14
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Banner Layout Test Page</h1>
        <p>Testing different banner configurations with various button and card combinations</p>
      </div>

      {/* Test 1: Full Banner with Cards and Buttons */}
      <div className={styles.testSection}>
        <h2>Test 1: Full Banner (Cards + Buttons)</h2>
        <p>This is the current MarketOverview layout</p>
        <Banner
          title={sampleData.title}
          subtitle={sampleData.subtitle}
          gradient="blue"
          cards={[
            {
              value: sampleData.stats.all,
              label: 'All Providers',
              onClick: () => setActiveFilter('all')
            },
            {
              value: sampleData.stats.untagged,
              label: 'Untagged',
              onClick: () => setActiveFilter('untagged')
            },
            {
              value: sampleData.stats.me,
              label: 'My Locations',
              onClick: () => setActiveFilter('me')
            },
            {
              value: sampleData.stats.partner,
              label: 'Partners',
              onClick: () => setActiveFilter('partner')
            },
            {
              value: sampleData.stats.competitor,
              label: 'Competitors',
              onClick: () => setActiveFilter('competitor')
            },
            {
              value: sampleData.stats.target,
              label: 'Targets',
              onClick: () => setActiveFilter('target')
            }
          ]}
          activeCard={activeFilter === 'all' ? 'All Providers' : 
                     activeFilter === 'untagged' ? 'Untagged' :
                     activeFilter === 'me' ? 'My Locations' :
                     activeFilter === 'partner' ? 'Partners' :
                     activeFilter === 'competitor' ? 'Competitors' :
                     activeFilter === 'target' ? 'Targets' : null}
          buttons={[
            {
              text: 'Settings',
              onClick: () => setShowSettings(!showSettings),
              variant: 'default'
            },
            {
              text: 'Back to Markets',
              onClick: () => console.log('Back clicked'),
              variant: 'default'
            }
          ]}
        />
      </div>

      {/* Test 2: Banner with Only Cards */}
      <div className={styles.testSection}>
        <h2>Test 2: Cards Only</h2>
        <p>Banner with cards but no action buttons</p>
        <Banner
          title="Analytics Dashboard"
          subtitle="Monthly performance overview"
          gradient="green"
          cards={[
            {
              value: "2,847",
              label: 'Total Users',
              onClick: () => console.log('Users clicked')
            },
            {
              value: "156",
              label: 'Active Sessions',
              onClick: () => console.log('Sessions clicked')
            },
            {
              value: "89%",
              label: 'Uptime',
              onClick: () => console.log('Uptime clicked')
            },
            {
              value: "$12.4K",
              label: 'Revenue',
              onClick: () => console.log('Revenue clicked')
            }
          ]}
        />
      </div>

      {/* Test 3: Banner with Only Buttons */}
      <div className={styles.testSection}>
        <h2>Test 3: Buttons Only</h2>
        <p>Banner with action buttons but no cards</p>
        <Banner
          title="Project Settings"
          subtitle="Configure your project preferences and team access"
          gradient="blue"
          buttons={[
            {
              text: 'Edit Project',
              onClick: () => console.log('Edit clicked'),
              variant: 'primary'
            },
            {
              text: 'Invite Team',
              onClick: () => console.log('Invite clicked'),
              variant: 'default'
            },
            {
              text: 'Export Data',
              onClick: () => console.log('Export clicked'),
              variant: 'default'
            },
            {
              text: 'Delete Project',
              onClick: () => console.log('Delete clicked'),
              variant: 'default'
            }
          ]}
        />
      </div>



      {/* Test 4: Mixed Content */}
      <div className={styles.testSection}>
        <h2>Test 4: Mixed Content</h2>
        <p>Banner with some cards and some buttons</p>
        <Banner
          title="Team Overview"
          subtitle="Current team performance and actions"
          gradient="green"
          cards={[
            { value: "12", label: 'Team Members', onClick: () => {} },
            { value: "8", label: 'Active Projects', onClick: () => {} },
            { value: "95%", label: 'Completion Rate', onClick: () => {} }
          ]}
          buttons={[
            { text: 'Add Member', onClick: () => {}, variant: 'primary' },
            { text: 'View Reports', onClick: () => {}, variant: 'default' }
          ]}
        />
      </div>

      {/* Test 5: Buttons Under Text */}
      <div className={styles.testSection}>
        <h2>Test 5: Buttons Under Text</h2>
        <p>Banner with small buttons positioned underneath the text area</p>
        <Banner
          title="Market Analysis"
          subtitle="Comprehensive provider data and market insights"
          gradient="blue"
          buttonsUnderText={true}
          cards={[
            { value: "156", label: 'All Providers', onClick: () => {} },
            { value: "89", label: 'Untagged', onClick: () => {} },
            { value: "12", label: 'My Locations', onClick: () => {} },
            { value: "23", label: 'Partners', onClick: () => {} },
            { value: "18", label: 'Competitors', onClick: () => {} },
            { value: "14", label: 'Targets', onClick: () => {} }
          ]}
          buttons={[
            { text: 'Settings', onClick: () => console.log('Settings clicked'), variant: 'default' },
            { text: 'Export Data', onClick: () => console.log('Export clicked'), variant: 'default' },
            { text: 'Share Report', onClick: () => console.log('Share clicked'), variant: 'primary' }
          ]}
        />
      </div>

      {/* Test 6: Buttons Under Text (No Cards) */}
      <div className={styles.testSection}>
        <h2>Test 6: Buttons Under Text (No Cards)</h2>
        <p>Banner with buttons positioned underneath the text area, no cards</p>
        <Banner
          title="Project Settings"
          subtitle="Configure your project preferences and team access"
          gradient="blue"
          buttonsUnderText={true}
          buttons={[
            { text: 'Edit Project', onClick: () => console.log('Edit clicked'), variant: 'primary' },
            { text: 'Invite Team', onClick: () => console.log('Invite clicked'), variant: 'default' },
            { text: 'Export Data', onClick: () => console.log('Export clicked'), variant: 'default' },
            { text: 'Delete Project', onClick: () => console.log('Delete clicked'), variant: 'default' }
          ]}
        />
      </div>

      {/* Test 7: Status Indicators */}
      <div className={styles.testSection}>
        <h2>Test 7: Status Indicators</h2>
        <p>Banner with status badges and progress indicators</p>
        <Banner
          title="Data Processing"
          subtitle="Market analysis in progress - 3 of 5 steps completed"
          gradient="green"
          buttonsUnderText={true}
          statusIndicators={[
            { text: "Processing", color: "#28a745" },
            { text: "Validating", color: "#ffc107" },
            { text: "Connected", color: "#17a2b8" }
          ]}
          buttons={[
            { text: 'Pause', onClick: () => console.log('Pause clicked'), variant: 'default' },
            { text: 'View Logs', onClick: () => console.log('Logs clicked'), variant: 'default' },
            { text: 'Cancel', onClick: () => console.log('Cancel clicked'), variant: 'default' }
          ]}
        />
      </div>

      {/* Test 8: Quick Stats */}
      <div className={styles.testSection}>
        <h2>Test 8: Quick Stats</h2>
        <p>Banner with inline statistics and metrics</p>
        <Banner
          title="Analytics Overview"
          subtitle="Last 30 days performance summary"
          gradient="blue"
          buttonsUnderText={true}
          quickStats={[
            { value: "2,847", label: "Users" },
            { value: "156", label: "Sessions" },
            { value: "89%", label: "Uptime" }
          ]}
          buttons={[
            { text: 'Download Report', onClick: () => console.log('Download clicked'), variant: 'primary' },
            { text: 'Share', onClick: () => console.log('Share clicked'), variant: 'default' },
            { text: 'Schedule', onClick: () => console.log('Schedule clicked'), variant: 'default' }
          ]}
        />
      </div>

      {/* Test 9: Search/Filter Bar */}
      <div className={styles.testSection}>
        <h2>Test 9: Search/Filter Bar</h2>
        <p>Banner with search input and filter controls</p>
        <Banner
          title="Provider Search"
          subtitle="Find and filter healthcare providers in your area"
          gradient="blue"
          buttonsUnderText={true}
          searchBar={{
            placeholder: "Search providers...",
            value: "",
            onChange: (e) => console.log('Search:', e.target.value),
            filters: ["Hospitals", "Clinics", "Specialists"]
          }}
          buttons={[
            { text: 'Advanced Search', onClick: () => console.log('Advanced clicked'), variant: 'primary' },
            { text: 'Save Search', onClick: () => console.log('Save clicked'), variant: 'default' },
            { text: 'Clear Filters', onClick: () => console.log('Clear clicked'), variant: 'default' }
          ]}
        />
      </div>

      {/* Test 10: Progress Bar */}
      <div className={styles.testSection}>
        <h2>Test 10: Progress Bar</h2>
        <p>Banner with progress indicator and completion status</p>
        <Banner
          title="Market Creation"
          subtitle="Setting up your new market - 75% complete"
          gradient="green"
          buttonsUnderText={true}
          progressBar={{
            percentage: 75,
            text: "3 of 4 steps completed"
          }}
          buttons={[
            { text: 'Continue Setup', onClick: () => console.log('Continue clicked'), variant: 'primary' },
            { text: 'Save Draft', onClick: () => console.log('Save clicked'), variant: 'default' },
            { text: 'Start Over', onClick: () => console.log('Restart clicked'), variant: 'default' }
          ]}
        />
      </div>

      {/* Test 11: Market Create Style */}
      <div className={styles.testSection}>
        <h2>Test 11: Market Create Style</h2>
        <p>This replicates the banner style used in the market creation section</p>
        <Banner
          title="Create Market"
          subtitle="Define your market area by searching for a location and adjusting the radius."
          gradient="blue"
          buttonsUnderText={true}
          searchBar={{
            placeholder: "Search location...",
            value: "",
            onChange: () => console.log('Search input changed')
          }}
          buttons={[
            { text: 'Save Market', onClick: () => console.log('Save clicked'), variant: 'primary' }
          ]}
        />
      </div>

      {/* Settings Panel (for testing) */}
      {showSettings && (
        <div className={styles.settingsOverlay}>
          <div className={styles.settingsPanel}>
            <div className={styles.settingsHeader}>
              <h3>Test Settings</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowSettings(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.settingsContent}>
              <p>This is a test settings panel to verify button functionality.</p>
              <p>Current active filter: <strong>{activeFilter}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 