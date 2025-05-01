import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Hero.module.css";
import AOS from "aos";
import "aos/dist/aos.css";
import Button from "../../components/Buttons/Button";

export default function Hero() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className={styles.hero} data-aos="fade-up">
      <div className={styles.container}>
        <h1 className={styles.heroTitle}>
          Smarter Decisions, Powered by Data
        </h1>
        <p className={styles.heroSubtitle}>
          Market Mover helps healthcare providers and suppliers uncover new
          opportunities with instant access to clean, actionable insights.
        </p>
        <Link to="/signup">
          <Button variant="gold" size="lg">
            Get Started
          </Button>
        </Link>
      </div>
    </section>
  );
}
