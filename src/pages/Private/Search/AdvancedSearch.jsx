import { useState } from "react";
import styles from "./AdvancedSearch.module.css";
import PageLayout from "../../../components/Layouts/PageLayout";
import SectionHeader from "../../../components/Layouts/SectionHeader";
import { Search, Filter, MapPin, Building2, Users, Shield, Star } from 'lucide-react';

export default function AdvancedSearch() {
  const [loading, setLoading] = useState(false);

  return (
    <PageLayout>
      <div className={styles.section}>
        <SectionHeader 
          title="Advanced Search Features" 
          icon={Search}
          showActionButton={false}
        />
        <div className={styles.content}>
          <div className={styles.comingSoonPanel}>
            <div className={styles.comingSoonContent}>
              <p>We're working on enhanced search capabilities including:</p>
              <ul>
                <li>Detailed provider filtering by NPI, CCN, and specialty</li>
                <li>Location-based search with distance parameters</li>
                <li>Quality score and certification filters</li>
                <li>Advanced network and program filtering</li>
              </ul>
              <p>Stay tuned for updates!</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
