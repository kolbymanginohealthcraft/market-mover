import React, { useEffect } from "react";
import styles from "./About.module.css";
import AOS from "aos";
import "aos/dist/aos.css";

export default function About() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className={styles.about} data-aos="fade-left">
      <div className={styles.container}>
        <h2>Why Healthcraft?</h2>
        <p>
          Whether you're optimizing referrals, evaluating competition, or
          expanding reach, Market Mover helps you navigate with clarity.
        </p>
      </div>
    </section>
  );
}
