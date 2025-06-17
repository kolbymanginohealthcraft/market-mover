import React, { useEffect } from 'react';
import styles from './WhosItFor.module.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

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
    description: 'Find ideal partners based on capacity, quality metrics, and alignment with your organization’s priorities.',
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
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className={styles.section} data-aos="fade-up">
      <div className={styles.container}>
        <h2 className={styles.title}>Who’s It For?</h2>
        <div className={styles.grid}>
          {personas.map((p, idx) => (
            <div className={styles.card} key={idx} data-aos="fade-up" data-aos-delay={idx * 100}>
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
