import React, { useEffect } from 'react';
import styles from './TestimonialCarousel.module.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

const testimonials = [
  {
    quote: 'Market Mover gives our team clarity on where to focus next. It’s essential.',
    name: 'Dr. Alicia Mendes',
    role: 'Network Strategy Lead',
  },
  {
    quote: 'I found three new target markets I hadn’t even considered. Huge time-saver.',
    name: 'Jamie Caldwell',
    role: 'VP of Business Development',
  },
  {
    quote: 'This tool changed how we present to partners. It’s become part of our pitch deck.',
    name: 'Tariq Boyd',
    role: 'Growth Strategy Director',
  },
];

export default function TestimonialCarousel() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className={styles.section} data-aos="fade-up">
      <div className={styles.container}>
        <h2 className={styles.title}>What People Are Saying</h2>
      </div>
      <div className={styles.carouselWrapper}>
        <div className={styles.carousel}>
          {testimonials.map((t, i) => (
            <div className={styles.card} key={i}>
              <p className={styles.quote}>“{t.quote}”</p>
              <p className={styles.author}>— {t.name}, {t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
