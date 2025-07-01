import React, { useEffect } from 'react';
import styles from './HowItWorks.module.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

const steps = [
  {
    icon: '🧠',
    title: 'Find Your Focus',
    description:
      'Start with yourself—or your target. Whether you\'re a provider exploring your footprint or a supplier seeking new prospects, Market Mover helps you zero in quickly.',
  },
  {
    icon: '🧭',
    title: 'Define the Market',
    description:
      'Set your radius and explore nearby providers. Segment results by type, size, or custom tags like "Competitor" or "Ideal Client."',
  },
  {
    icon: '📊',
    title: 'Analyze the Opportunity',
    description:
      'Reveal referral flows and performance metrics. Understand the competitive landscape and turn raw data into marketing insights.',
  },
  {
    icon: '📁',
    title: 'Save & Share Your Strategy',
    description:
      'Save a market, export insights, and align your team around a common plan—whether for outreach, planning, or presentation.',
  },
];

export default function HowItWorks() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    AOS.refresh();
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>How It Works</h2>
        <div className={styles.grid}>
          {steps.map((step, index) => (
            <div className={styles.card} key={index}>
              <div className={styles.icon}>{step.icon}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
