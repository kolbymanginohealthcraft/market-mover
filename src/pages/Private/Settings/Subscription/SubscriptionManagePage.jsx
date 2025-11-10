import styles from './SubscriptionManagePage.module.css';

export default function SubscriptionManagePage() {
  return (
    <section className={styles.notice}>
      <h2 className={styles.heading}>Subscription management is coming soon</h2>
      <p className={styles.description}>
        We&apos;re finalizing the in-app subscription experience. Until then, please reach out to{' '}
        <a className={styles.emailLink} href="mailto:support@healthcraftmarketmover.com">
          support@healthcraftmarketmover.com
        </a>{' '}
        for help managing your plan.
      </p>
    </section>
  );
}
