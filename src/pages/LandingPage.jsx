//LandingPage.jsx
// src/pages/LandingPage.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

const LandingPage = () => {
  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  return (
    <>
      <div className={styles.page}>
        <section className={styles.hero} data-aos="fade-up">
          <h1>Unlock Smarter Healthcare Decisions</h1>
          <p>Healthcraft empowers providers and suppliers with actionable data and insight tools.</p>
          <Link to="/login" className={styles.cta}>Get Started</Link>
        </section>

        <section className={styles.about} data-aos="fade-right">
          <h2>Why Healthcraft?</h2>
          <p>
            We're building tools for healthcare professionals to explore provider networks,
            benchmark performance, and discover opportunities. Whether you're a small clinic or a national supplier, our platform scales to meet your needs.
          </p>
        </section>

        <section className={styles.features} data-aos="fade-up">
          <h2>What You Can Do</h2>
          <div className={styles.featureGrid}>
            <div>
              <h3>🔍 Search Providers</h3>
              <p>Quickly search and filter providers by specialty, location, and metrics.</p>
            </div>
            <div>
              <h3>📍 View Detailed Profiles</h3>
              <p>Access in-depth views for each provider, including maps and performance data.</p>
            </div>
            <div>
              <h3>📁 Save & Share Insights</h3>
              <p>Save searches, export CSVs, and collaborate with your team.</p>
            </div>
          </div>
        </section>

        <section className={styles.testimonial} data-aos="zoom-in">
          <blockquote>
            “Healthcraft has completely transformed how we analyze our provider network.
            It's like having a data team in your pocket.”
          </blockquote>
          <p className={styles.testimonialAuthor}>— Dr. Alicia Mendes, Network Strategy Lead</p>
        </section>

        <section className={styles.ctaSection} data-aos="fade-up">
          <h2>Ready to Explore?</h2>
          <Link to="/login" className={styles.ctaAlt}>Create an Account</Link>
        </section>
      </div>
    </>
  );
};

export default LandingPage;
