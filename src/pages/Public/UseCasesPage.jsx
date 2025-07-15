import React from 'react';
import { Link } from 'react-router-dom';
import styles from './UseCasesPage.module.css';

export default function UseCasesPage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Ready to Get Started?
          </h1>
          <p className={styles.heroSubtitle}>
            Not sure where to begin? Here are some simple ways to start exploring healthcare markets and finding opportunities.
          </p>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className={styles.gettingStarted}>
        <div className={styles.sectionHeader}>
          <h2>Your First Steps</h2>
          <p>Start with these simple actions to explore Market Mover's capabilities</p>
        </div>

        <div className={styles.stepsGrid}>
          {/* Step 1: Search */}
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h3>🔍 Search for a Provider</h3>
              <p>Start by searching for a healthcare provider you know or are interested in. This will show you how Market Mover analyzes provider data.</p>
              <div className={styles.stepActions}>
                <Link to="/app/search" className={styles.primaryAction}>
                  Start Searching
                </Link>
                <div className={styles.stepTip}>
                  <strong>Tip:</strong> Try searching for "Cardiology" or "Orthopedics" to see providers by specialty
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Explore Markets */}
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h3>📍 Explore a Market</h3>
              <p>Once you find a provider, explore their market area to see nearby providers, demographics, and market opportunities.</p>
              <div className={styles.stepActions}>
                <Link to="/app/markets" className={styles.primaryAction}>
                  View Markets
                </Link>
                <div className={styles.stepTip}>
                  <strong>Tip:</strong> Look at the "Provider Density" tab to understand market saturation
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Save & Compare */}
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h3>💾 Save What You Find</h3>
              <p>Save interesting providers and markets to your dashboard for easy access and comparison later.</p>
              <div className={styles.stepActions}>
                <Link to="/app/profile" className={styles.primaryAction}>
                  Manage Saved Items
                </Link>
                <div className={styles.stepTip}>
                  <strong>Tip:</strong> Saved items appear on your home dashboard for quick access
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Common Scenarios */}
      <section className={styles.scenarios}>
        <div className={styles.sectionHeader}>
          <h2>What Are You Looking For?</h2>
          <p>Choose a scenario that matches your goals</p>
        </div>

        <div className={styles.scenarioGrid}>
          <div className={styles.scenarioCard}>
            <div className={styles.scenarioIcon}>🎯</div>
            <h3>I want to find new referral sources</h3>
            <p>Search for providers by specialty, then explore their referral patterns and network connections.</p>
            <Link to="/app/search" className={styles.scenarioAction}>
              Find Providers →
            </Link>
          </div>

          <div className={styles.scenarioCard}>
            <div className={styles.scenarioIcon}>📊</div>
            <h3>I want to understand a market area</h3>
            <p>Search for a provider in your target area, then analyze the surrounding market and competition.</p>
            <Link to="/app/provider-density" className={styles.scenarioAction}>
              Analyze Markets →
            </Link>
          </div>

          <div className={styles.scenarioCard}>
            <div className={styles.scenarioIcon}>🚀</div>
            <h3>I want to expand to new territories</h3>
            <p>Use provider density analysis to find underserved areas with growth opportunities.</p>
            <Link to="/app/markets" className={styles.scenarioAction}>
              Explore Opportunities →
            </Link>
          </div>

          <div className={styles.scenarioCard}>
            <div className={styles.scenarioIcon}>👥</div>
            <h3>I want to research competitors</h3>
            <p>Search for competing providers and analyze their market presence and performance.</p>
            <Link to="/app/search" className={styles.scenarioAction}>
              Research Competitors →
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className={styles.tips}>
        <div className={styles.sectionHeader}>
          <h2>Quick Tips for New Users</h2>
          <p>Make the most of your Market Mover experience</p>
        </div>

        <div className={styles.tipsGrid}>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>💡</div>
            <h4>Start Simple</h4>
            <p>Begin with a provider you already know. This helps you understand how the data relates to real-world scenarios.</p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>📱</div>
            <h4>Use the Dashboard</h4>
            <p>Your home dashboard shows recent activity and saved items. It's your command center for quick access.</p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>🔍</div>
            <h4>Try Different Searches</h4>
            <p>Search by specialty, location, or provider name. Each approach reveals different insights.</p>
          </div>

          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>💾</div>
            <h4>Save Everything</h4>
            <p>Save interesting providers and markets. You can always remove them later, but it's easier to organize as you go.</p>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className={styles.helpSection}>
        <div className={styles.helpContent}>
          <h2>Need Help Getting Started?</h2>
          <p>We're here to help you succeed with Market Mover</p>
          <div className={styles.helpActions}>
            <Link to="/app/feedback" className={styles.helpButton}>
              Ask a Question
            </Link>
            <Link to="/app/search" className={styles.helpButton}>
              Start Exploring Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
