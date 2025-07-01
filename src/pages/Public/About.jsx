import React, { useEffect } from "react";
import styles from "./About.module.css";
import AOS from "aos";
import "aos/dist/aos.css";

export default function About() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className={styles.about} data-aos="fade-up">
      <div className={styles.container}>
        <div className={styles.columnLeft}>
          <h2>Why Market Intelligence Matters</h2>
          <p>
            In today’s competitive healthcare landscape, having a great service isn’t enough—
            you need to understand where the opportunities are and how to reach the right partners.
            That’s where market analytics come in: they turn blind outreach into focused strategy.
          </p>
        </div>
        <div className={styles.columnRight}>
          <h2>Why Healthcraft?</h2>
          <p>
            Healthcraft Creative Solutions is a team of analysts, designers, and strategists
            dedicated to transforming how healthcare organizations grow. Our flagship product,
            Market Mover, brings transparency, clarity, and action to your market strategy—with
            tools designed to help you move faster and smarter than ever before.
          </p>
        </div>
      </div>
    </section>
  );
}
