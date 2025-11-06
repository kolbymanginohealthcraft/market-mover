import { Link } from 'react-router-dom';
import { MapPin, Code, GitBranch } from 'lucide-react';
import styles from './UnfinishedItems.module.css';

export default function UnfinishedItems() {
  const unfinishedPages = [
    {
      id: 'geography',
      title: 'Geography Analysis',
      description: 'Geographic analysis and mapping tools',
      path: '/app/platform/unfinished/geography',
      icon: MapPin
    },
    {
      id: 'medicare-pos',
      title: 'Medicare POS',
      description: 'Medicare Provider of Services data exploration',
      path: '/app/platform/unfinished/medicare-pos',
      icon: Code
    },
    {
      id: 'medicare-pos-enriched',
      title: 'Medicare POS Enriched',
      description: 'Enhanced Medicare Provider of Services data',
      path: '/app/platform/unfinished/medicare-pos-enriched',
      icon: Code
    },
    {
      id: 'referral-pathways',
      title: 'Referral Pathways',
      description: 'Referral source and downstream facility analysis',
      path: '/app/platform/unfinished/referral-pathways',
      icon: GitBranch
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Unfinished Items</h1>
        <p>Pages and features that are in development and not yet ready for production.</p>
      </div>
      
      <div className={styles.grid}>
        {unfinishedPages.map((page) => {
          const IconComponent = page.icon;
          return (
            <Link key={page.id} to={page.path} className={styles.card}>
              <div className={styles.icon}>
                <IconComponent size={24} />
              </div>
              <h3>{page.title}</h3>
              <p>{page.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

