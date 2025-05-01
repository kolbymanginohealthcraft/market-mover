import React, { useEffect } from 'react';
import styles from './WhosItFor.module.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

const personas = [
  {
    icon: '🏥',
    title: 'SNF Marketers',
    description: 'Quickly identify facilities that fit your ideal customer profile—by size, quality, or geography.',
  },
  {
    icon: '📈',
    title: 'Referral Coordinators',
    description: 'Understand your current reach and discover new nearby partners to boost referral volume.',
  },
  {
    icon: '🧠',
    title: 'Healthcare Strategists',
    description: 'Explore competitive landscapes and identify whitespace for growth or partnership.',
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
