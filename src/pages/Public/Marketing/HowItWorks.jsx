import React, { useEffect, useRef } from 'react';
import { Brain, Compass, BarChart3, FolderOpen } from 'lucide-react';
import styles from './HowItWorks.module.css';

const steps = [
  {
    icon: Brain,
    title: 'Find Your Focus',
    description:
      'Start with yourself—or your target. Whether you\'re a provider exploring your footprint or a supplier seeking new prospects, Market Mover helps you zero in quickly.',
  },
  {
    icon: Compass,
    title: 'Define the Market',
    description:
      'Set your radius and explore nearby providers. Segment results by type, size, or custom tags like "Competitor" or "Ideal Client."',
  },
  {
    icon: BarChart3,
    title: 'Analyze the Opportunity',
    description:
      'Reveal referral flows and performance metrics. Understand the competitive landscape and turn raw data into marketing insights.',
  },
  {
    icon: FolderOpen,
    title: 'Save & Share Your Strategy',
    description:
      'Save a market, export insights, and align your team around a common plan—whether for outreach, planning, or presentation.',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef();
  const titleRef = useRef();
  const cardRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.inView);
          }
        });
      },
      { threshold: 0.3 }
    );

    // Observe the section, title, and cards
    if (sectionRef.current) observer.observe(sectionRef.current);
    if (titleRef.current) observer.observe(titleRef.current);
    cardRefs.current.forEach(card => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.container}>
        <h2 className={styles.title} ref={titleRef}>How It Works</h2>
        <div className={styles.grid}>
          {steps.map((step, index) => (
            <div 
              className={styles.card} 
              key={index}
              ref={el => cardRefs.current[index] = el}
            >
              <div className={styles.icon}>
                <step.icon size={24} />
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
