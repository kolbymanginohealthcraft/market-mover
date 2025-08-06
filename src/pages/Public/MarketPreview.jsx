import React, { useEffect, useRef } from 'react';
import styles from './MarketPreview.module.css';
import exampleImg from '../../assets/exampleRedacted.png'; // ✅ Adjusted import path

export default function MarketPreview() {
  const sectionRef = useRef();
  const titleRef = useRef();
  const previewBoxRef = useRef();
  const captionRef = useRef();

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

    // Observe the section, title, preview box, and caption
    if (sectionRef.current) observer.observe(sectionRef.current);
    if (titleRef.current) observer.observe(titleRef.current);
    if (previewBoxRef.current) observer.observe(previewBoxRef.current);
    if (captionRef.current) observer.observe(captionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.container}>
        <h2 className={styles.title} ref={titleRef}>Market Preview</h2>
        <div className={styles.previewBox} ref={previewBoxRef}>
          <img src={exampleImg} alt="Market Preview" className={styles.previewImage} />
        </div>
        <div className={styles.caption} ref={captionRef}>A sneak peek at your market opportunity.</div>
      </div>
    </section>
  );
}
