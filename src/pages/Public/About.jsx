import React, { useEffect, useRef } from "react";
import styles from "./About.module.css";

export default function About() {
  const sectionRef = useRef();
  const leftColumnRef = useRef();
  const rightColumnRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.inView);
          }
        });
      },
      { threshold: 0.3 }
    );

    // Observe the section and columns
    if (sectionRef.current) observer.observe(sectionRef.current);
    if (leftColumnRef.current) observer.observe(leftColumnRef.current);
    if (rightColumnRef.current) observer.observe(rightColumnRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.about} ref={sectionRef}>
      <div className={styles.container}>
        <div className={styles.columnLeft} ref={leftColumnRef}>
          <h2>Why Market Intelligence Matters</h2>
          <p>
            In today's competitive healthcare landscape, having a great service isn't enough—
            you need to understand where the opportunities are and how to reach the right partners.
            That's where market analytics come in: they turn blind outreach into focused strategy.
          </p>
        </div>
        <div className={styles.columnRight} ref={rightColumnRef}>
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
