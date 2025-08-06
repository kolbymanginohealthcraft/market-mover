import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/Buttons/Spinner';
import Button from '../../components/Buttons/Button';
import styles from './SpinnerDemo.module.css';

export default function SpinnerDemo() {
  const [loadingStates, setLoadingStates] = useState({
    demo1: false,
    demo2: false,
    demo3: false,
    demo4: false
  });

  const [currentDemo, setCurrentDemo] = useState(null);

  const startDemo = (demoKey) => {
    setCurrentDemo(demoKey);
    setLoadingStates(prev => ({ ...prev, [demoKey]: true }));
    
    // Simulate loading for 3 seconds
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [demoKey]: false }));
      setCurrentDemo(null);
    }, 3000);
  };

  const demoMessages = {
    demo1: "Loading your network...",
    demo2: "Loading profile information...",
    demo3: "Loading company profile...",
    demo4: "Loading branding settings..."
  };

  if (currentDemo && loadingStates[currentDemo]) {
    return <Spinner message={demoMessages[currentDemo]} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/app" className={styles.backLink}>← Back to Dashboard</Link>
        <h1 className={styles.title}>Spinner Demo</h1>
        <p className={styles.subtitle}>
          Test the custom spinner component with different loading messages
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.demoSection}>
          <h2>Loading States</h2>
          <p>Click any button below to see the spinner in action:</p>
          
          <div className={styles.demoGrid}>
            <div className={styles.demoCard}>
              <h3>Network Loading</h3>
              <p>Simulates loading the network tab</p>
              <Button 
                variant="blue" 
                onClick={() => startDemo('demo1')}
                disabled={Object.values(loadingStates).some(Boolean)}
              >
                Show Network Spinner
              </Button>
            </div>

            <div className={styles.demoCard}>
              <h3>Profile Loading</h3>
              <p>Simulates loading the profile tab</p>
              <Button 
                variant="green" 
                onClick={() => startDemo('demo2')}
                disabled={Object.values(loadingStates).some(Boolean)}
              >
                Show Profile Spinner
              </Button>
            </div>

            <div className={styles.demoCard}>
              <h3>Company Loading</h3>
              <p>Simulates loading the company tab</p>
              <Button 
                variant="gold" 
                onClick={() => startDemo('demo3')}
                disabled={Object.values(loadingStates).some(Boolean)}
              >
                Show Company Spinner
              </Button>
            </div>

            <div className={styles.demoCard}>
              <h3>Branding Loading</h3>
              <p>Simulates loading the branding tab</p>
              <Button 
                variant="purple" 
                onClick={() => startDemo('demo4')}
                disabled={Object.values(loadingStates).some(Boolean)}
              >
                Show Branding Spinner
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.infoSection}>
          <h2>About the Spinner</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h3>🎨 Design</h3>
              <p>Custom blue spinner with smooth animation</p>
            </div>
            <div className={styles.infoCard}>
              <h3>📍 Position</h3>
              <p>Positioned higher on the page, near page titles</p>
            </div>
            <div className={styles.infoCard}>
              <h3>🔄 Global</h3>
              <p>Used across all settings tabs for consistency</p>
            </div>
            <div className={styles.infoCard}>
              <h3>⚡ Performance</h3>
              <p>Lightweight component with minimal dependencies</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 