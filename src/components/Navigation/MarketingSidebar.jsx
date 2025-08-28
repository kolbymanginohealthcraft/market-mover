// src/components/MarketingSidebar.jsx
import React from 'react';
import styles from './MarketingSidebar.module.css';

function MarketingSidebar() {
  return (
    <aside className={styles.sidebar}>
      {/* Section 1: Campaign Highlight */}
      <section className={styles.section}>
        <h2 className={styles.heading}>📈 Growth Opportunities</h2>
        <ul className={styles.bullets}>
          <li>You’re outperforming 78% of peers in 5 key counties—consider targeted expansion.</li>
          <li>Referral rates are declining in 3 ZIP codes. Launch a reconnect campaign?</li>
        </ul>
      </section>

      {/* Section 2: Build a Campaign */}
      <section className={styles.section}>
        <h2 className={styles.heading}>🎯 Start a Campaign</h2>
        <p><strong>Saved Segment:</strong> Top SNFs in Austin</p>
        <p><strong>Action Template:</strong> New Market Entry</p>
        <p><strong>Assets Needed:</strong> Outreach List, Landing Page</p>
        <button className={styles.button}>Generate Campaign Brief</button>
      </section>

      {/* Section 3: Creative Tips */}
      <section className={styles.section}>
        <h2 className={styles.heading}>🎨 Creative Corner</h2>
        <ul className={styles.bullets}>
          <li>Use local statistics in headlines—trust and relevance drive conversions.</li>
          <li>Email open rates double when you reference a county name in the subject line.</li>
        </ul>
      </section>

      {/* Section 4: Collaborate */}
      <section className={styles.section}>
        <h2 className={styles.heading}>💬 Work with Us</h2>
        <p>Have our creative team turn this insight into a polished campaign.</p>
        <div className={styles.buttons}>
          <button className={styles.secondary}>📞 Schedule a Call</button>
          <button className={styles.secondary}>📤 Send to Strategy Team</button>
        </div>
      </section>
    </aside>
  );
}

export default MarketingSidebar;
