import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export default function Home() {
  const userRole = 'analyst';
  const [greeting, setGreeting] = useState('');
  const [progress, setProgress] = useState({ profile: 0, toolsUsed: 0, streak: 0 });
  const [testimonial, setTestimonial] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quote, setQuote] = useState('');

  const motivationalQuotes = [
    "Every great decision starts with great data.",
    "Turn insight into action — every day.",
    "Grow smart. Win big.",
    "Use the data. Own the market.",
  ];

  const whatsNew = [
    { title: '🎉 New Scorecard Tool', description: 'Compare across 40+ metrics.', date: 'May 1' },
    { title: '📍 Market Data Updated', description: 'April 2025 CMS data now live.', date: 'Apr 29' },
    { title: '🧠 Smarter Suggestions', description: 'New guidance added to "Help Me Decide".', date: 'Apr 25' },
  ];

  const helpContent = {
    admin: [
      { label: 'Manage team access', to: '/app/profile' },
      { label: 'Set market permissions', to: '/app/markets' },
      { label: 'Review usage reports', to: '/app/charts' },
    ],
    analyst: [
      { label: 'Explore a market', to: '/app/markets' },
      { label: 'Understand performance trends', to: '/app/charts' },
      { label: 'Use scorecards to compare facilities', to: '/app/scorecard' },
    ],
    marketer: [
      { label: 'View referral opportunities', to: '/app/markets' },
      { label: 'Track provider growth', to: '/app/charts' },
      { label: 'Build a target list', to: '/app/search' },
    ],
  };

  const helpLinks = helpContent[userRole] || [];

  useEffect(() => {
    window.scrollTo(0, 0);
    setProgress({
      profile: Math.floor(Math.random() * 30 + 60),
      toolsUsed: Math.floor(Math.random() * 40 + 30),
      streak: Math.floor(Math.random() * 5 + 1),
    });

    const hour = new Date().getHours();
    const greetingTime =
      hour < 12 ? 'Good morning' :
      hour < 18 ? 'Good afternoon' :
      'Good evening';
    setGreeting(`${greetingTime}, welcome to Market Mover 👋`);

    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  const handleSubmitTestimonial = () => {
    if (testimonial.trim()) setSubmitted(true);
  };

  return (
    <div className={styles.page}>
      {/* Temporary Banner - Dashboard Development */}
      <div className={styles.comingSoonBanner}>
        <div className={styles.bannerIcon}>🏠</div>
        <div className={styles.bannerContent}>
          <h3>Dashboard Development in Progress</h3>
          <p>
            Welcome to your Market Mover dashboard! This is currently a placeholder interface that will soon become your personalized command center. In the future, you'll see real activity tracking, progress metrics, personalized recommendations, and insights tailored to your market analysis needs. We're building a comprehensive dashboard that will help you track your usage, monitor market changes, and get actionable insights to drive your strategic decisions.
          </p>
        </div>
      </div>

      <header className={styles.heroBox}>
        <h1 className={styles.hero}>{greeting}</h1>
        <p className={styles.subtext}>{quote}</p>
      </header>

      <div className={styles.wrapper}>
        <aside className={styles.sidebar}>
          <h2 className={styles.columnTitle}>🛠️ Getting Started</h2>

          <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>🪰 Recommended Tools</h3>
            <div className={styles.toolGrid}>
              <Link to="/app/markets" className={styles.toolCard}>📍 Saved Markets</Link>
              <Link to="/app/charts" className={styles.toolCard}>📈 Performance Trends</Link>
              <Link to="/app/profile" className={styles.toolCard}>👤 Manage My Account</Link>
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>🧠 Smart Help</h3>
            <ul className={styles.helpList}>
              {helpLinks.map((link, i) => (
                <li key={i}><Link to={link.to}>👉 {link.label}</Link></li>
              ))}
            </ul>
          </div>
        </aside>

        <main className={styles.main}>
          <h2 className={styles.columnTitle}>📊 Your Activity</h2>

          <div className={styles.panel}>
            <h3 className={styles.sectionTitle}>🕒 Recent Activity</h3>
            <ul className={styles.activityList}>
              <li>Viewed provider: <strong>Sunrise Rehab Center</strong></li>
              <li>Explored market: <strong>Chicago Metro</strong></li>
              <li>Compared scorecards in <strong>Dallas-Fort Worth</strong></li>
            </ul>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.sectionSubtitle}>🔥 Your Streak</h3>
            <div className={styles.innerBlock}>{progress.streak}-Day Streak! Keep it going.</div>

            <h3 className={styles.sectionSubtitle}>📈 Progress</h3>
            <div className={styles.innerBlock}>
              <div className={styles.progressItem}>
                <label>Profile Completion</label>
                <div className={styles.progressBar}>
                  <div style={{ width: `${progress.profile}%` }} className={styles.fill}></div>
                </div>
                <span>{progress.profile}%</span>
              </div>
              <div className={styles.progressItem}>
                <label>Tools Explored</label>
                <div className={styles.progressBar}>
                  <div style={{ width: `${progress.toolsUsed}%` }} className={styles.fillAlt}></div>
                </div>
                <span>{progress.toolsUsed}%</span>
              </div>
            </div>

            <h3 className={styles.sectionSubtitle}>💰 ROI This Month</h3>
            <div className={`${styles.innerBlock} ${styles.roiCard}`}>
              12 hours saved and $50k in growth unlocked.
            </div>

            <h3 className={styles.sectionSubtitle}>🎯 Milestones</h3>
            <div className={`${styles.innerBlock} ${styles.statsRow}`}>
              <div className={styles.statBox}>⏱️ 12h Saved</div>
              <div className={styles.statBox}>📍 8 Markets</div>
              <div className={styles.statBox}>📈 15 Reports</div>
            </div>
          </div>
        </main>

        <section className={styles.rightColumn}>
          <h2 className={styles.columnTitle}>📣 From Healthcraft</h2>

          <div className={styles.panel}>
            <h3 className={styles.sectionTitle}>📢 What's New</h3>
            <ul className={styles.updateList}>
              {whatsNew.map((item, i) => (
                <li key={i} className={styles.updateItem}>
                  <div className={styles.updateTitle}>{item.title}</div>
                  <div className={styles.updateDescription}>{item.description}</div>
                  <div className={styles.updateDate}>{item.date}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.sectionTitle}>💬 Leave a Comment</h3>
            {submitted ? (
              <p className={styles.thankYou}>Thanks for your feedback!</p>
            ) : (
              <>
                <textarea
                  className={styles.textarea}
                  placeholder="Share how Market Mover has helped you..."
                  value={testimonial}
                  onChange={(e) => setTestimonial(e.target.value)}
                />
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  You have my consent to feature this on your website.
                </label>
                <button className={styles.submitButton} onClick={handleSubmitTestimonial}>
                  Submit
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
