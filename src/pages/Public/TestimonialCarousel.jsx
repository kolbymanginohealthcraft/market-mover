import React, { useEffect, useRef } from 'react';
import styles from './TestimonialCarousel.module.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

const testimonials = [
  {
    quote: 'Market Mover gives our team clarity on where to focus next. It is essential.',
    name: 'Dr. Alicia Mendes',
    role: 'Network Strategy Lead',
  },
  {
    quote: 'I found three new target markets I had not even considered. Huge time-saver.',
    name: 'Jamie Caldwell',
    role: 'VP of Business Development',
  },
  {
    quote: 'This tool changed how we present to partners. It has become part of our pitch deck.',
    name: 'Tariq Boyd',
    role: 'Growth Strategy Director',
  },
  {
    quote: 'It is like having a market strategist in your pocket.',
    name: 'Lena Zhao',
    role: 'Regional Development Manager',
  },
  {
    quote: 'The storytelling tools help us stand out. Everyone wants the map slides!',
    name: 'Carlos Gutierrez',
    role: 'Chief Marketing Officer',
  },
  {
    quote: 'Our clinical leadership uses it to identify gaps in care delivery. It is more than just a sales tool.',
    name: 'Emily Tran',
    role: 'VP of Clinical Innovation',
  },
  {
    quote: 'The maps and visuals make it easy for non-technical stakeholders to understand our strategy.',
    name: 'Brian Yates',
    role: 'Market Intelligence Analyst',
  },
  {
    quote: 'We launched two new service lines after identifying unmet demand in nearby counties.',
    name: 'Shreya Patel',
    role: 'Director of Strategic Growth',
  },
  {
    quote: 'Our referral network visibility went from fragmented to crystal clear.',
    name: 'Alyssa Romano',
    role: 'Referral Development Coordinator',
  },
  {
    quote: 'Honestly, I do not know how we did territory planning before this.',
    name: 'Marcus DeLeon',
    role: 'Field Strategy Manager',
  },
];

export default function TestimonialCarousel() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const carouselRef = useRef();

  const scroll = (direction) => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollAmount = clientWidth * 0.9;
      carouselRef.current.scrollTo({
        left: direction === 'right' ? scrollLeft + scrollAmount : scrollLeft - scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Testimonials</h2>
        <div className={styles.carouselWrapper}>
          <div className={styles.carousel}>
            {testimonials.map((t, idx) => (
              <div className={styles.card} key={idx}>
                <p className={styles.quote}>{t.quote}</p>
                <div className={styles.author}>{t.name}, {t.role}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.carouselControls}>
          <button className={styles.arrow} onClick={() => scroll('left')}>
            ←
          </button>
          <button className={styles.arrow} onClick={() => scroll('right')}>
            →
          </button>
        </div>
      </div>
    </section>
  );
}
