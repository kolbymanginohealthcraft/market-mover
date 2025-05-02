import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Hero.module.css";
import AOS from "aos";
import "aos/dist/aos.css";
import Button from "../../components/Buttons/Button";
import heroImage from "../../assets/hero-illustration.jpg"; // Use your actual image path

export default function Hero() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className={styles.hero} data-aos="fade-up">
      <div className={styles.container}>
        <h1 className={styles.heroTitle}>Smarter Decisions, Powered by Data</h1>

        <div className={styles.heroContent}>
          <div className={styles.heroText}>
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

            <p className={styles.heroCred} data-aos="fade-up" data-aos-delay="200">
              <strong>📈 Know more. Grow more.</strong>
            </p>

            <Link to="/signup">
              <Button variant="gold" size="lg">
                Get Started
              </Button>
            </Link>
          </div>

          <div className={styles.heroImage}>
            <img src={heroImage} alt="Market insights dashboard" />
          </div>
        </div>
      </div>
    </section>
  );
}
