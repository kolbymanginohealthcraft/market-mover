import React, { useEffect, useRef } from 'react';
import styles from './WhosItFor.module.css';

const personas = [
  {
    icon: '📣',
    title: 'Healthcare Marketers',
    description: 'Identify high-potential markets and tailor outreach based on geography, service type, and facility profile.',
  },
  {
    icon: '📈',
    title: 'Referral Coordinators',
    description: 'Visualize referral paths, spot new connection opportunities, and strengthen existing provider relationships.',
  },
  {
    icon: '🏥',
    title: 'Clinical Program Leaders',
    description: 'Plan strategic care programs by aligning clinical services with the needs and outcomes of local populations.',
  },
  {
    icon: '🤝',
    title: 'Partnership & Network Teams',
    description: 'Find ideal partners based on capacity, quality metrics, and alignment with your organization\'s priorities.',
  },
  {
    icon: '📊',
    title: 'Data & Ops Analysts',
    description: 'Turn market insights into compelling visuals and reports that drive executive decisions and team actions.',
  },
  {
    icon: '🧭',
    title: 'Strategic Planners',
    description: 'Explore emerging markets, monitor competitors, and support growth initiatives with data-driven clarity.',
  },
];

export default function WhosItFor() {
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
        <h2 className={styles.title} ref={titleRef}>Who's It For?</h2>
        <div className={styles.grid}>
          {personas.map((p, idx) => (
            <div 
              className={styles.card} 
              key={idx}
              ref={el => cardRefs.current[idx] = el}
            >
              <div className={styles.icon}>{p.icon}</div>
              <h3 className={styles.cardTitle}>{p.title}</h3>
              <p className={styles.cardDescription}>{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
