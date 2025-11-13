import { Link } from 'react-router-dom';
import { MapPin, Code, GitBranch, LayoutTemplate, Globe, Users } from 'lucide-react';
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
      id: 'osm-explorer',
      title: 'OpenStreetMap Explorer',
      description: 'Explore OSM planet feature coverage by market',
      path: '/app/platform/unfinished/osm-explorer',
      icon: Globe
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
    },
    {
      id: 'provider-affiliations',
      title: 'Provider Affiliations',
      description: 'Explore relationships between service locations and performing providers',
      path: '/app/platform/unfinished/provider-affiliations',
      icon: Users
    },
    {
      id: 'mobile-workshop',
      title: 'Mobile Navigation Workshop',
      description: 'Prototype responsive header and sidebar behavior',
      path: '/app/platform/unfinished/mobile-workshop',
      icon: LayoutTemplate
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

