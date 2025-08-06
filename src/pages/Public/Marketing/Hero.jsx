import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./Hero.module.css";
import Button from "../../../components/Buttons/Button";
import heroImage from "../../../assets/hero-illustration.jpg";

export default function Hero() {
  const heroRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          heroRef.current.classList.add(styles.inView);
        }
      },
      { threshold: 0.3 }
    );
    if (heroRef.current) {
      observer.observe(heroRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.hero} ref={heroRef}>
      <div className={styles.heroGrid}>
        <div className={styles.heroTextCard} data-aos="fade-right" data-aos-delay="200">
          <h1 className={styles.heroTitle}>Smarter Decisions, Powered by Data</h1>

          <p className={styles.heroSubtitle}>
            <strong>
              Market Mover<sup>®</sup>
            </strong>{" "}
            is a data-driven strategy platform built by{" "}
            <span className={styles.tooltipWrapper}>
              <a
                href="https://www.healthcraftcreative.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.brandLinkInline}
              >
                Healthcraft Creative Solutions
              </a>
              <span className={`${styles.tooltipContent} ${styles.greenTooltip}`}>
                Visit our main company site
              </span>
            </span>
            . We help healthcare{" "}
            <span className={styles.tooltipWrapper}>
              <span className={styles.roleHighlight}>providers</span>
              <span className={styles.tooltipContent}>
                Organizations delivering patient care—like SNFs, hospitals, and clinics.
              </span>
            </span>{" "}
            and{" "}
            <span className={styles.tooltipWrapper}>
              <span className={styles.roleHighlight}>suppliers</span>
              <span className={styles.tooltipContent}>
                Companies offering services or products to healthcare providers—such as therapy vendors,
                software platforms, or diagnostics labs.
              </span>
            </span>{" "}
            uncover new opportunities, optimize referrals, and grow smarter—powered by
            real-time insights and market clarity.
          </p>

          <p className={styles.heroCred}>
            <strong>📈 Know more. Grow more.</strong>
          </p>

          <Link to="/signup">
            <Button variant="gold" size="lg">
              Get Started
            </Button>
          </Link>
        </div>

        <div className={styles.heroImageWrapper} data-aos="fade-left" data-aos-delay="500">
          <img src={heroImage} alt="Market insights dashboard" className={styles.heroImage} />
        </div>
      </div>
    </section>
  );
}
