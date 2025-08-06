import styles from "./ReferralsTab.module.css";

export default function ReferralsTab({ provider }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>🔄</div>
        <h2>Referrals</h2>
        <p>Coming Soon</p>
        <p className={styles.description}>
          Referral patterns and network relationships will be available here.
        </p>
      </div>
    </div>
  );
} 