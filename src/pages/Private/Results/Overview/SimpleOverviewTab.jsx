import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Building2, Network, ArrowRight, Hash, FileText } from 'lucide-react';
import { apiUrl } from '../../../../utils/api';
import styles from './SimpleOverviewTab.module.css';

export default function SimpleOverviewTab({ provider }) {
  const navigate = useNavigate();
  const [npis, setNpis] = useState([]);
  const [ccns, setCcns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch NPIs and CCNs for this provider
  useEffect(() => {
    async function fetchProviderIds() {
      if (!provider?.dhc) return;

      try {
        // Fetch NPIs
        const npisResponse = await fetch(apiUrl('/api/related-npis'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dhc_ids: [provider.dhc] })
        });
        const npisResult = await npisResponse.json();
        if (npisResult.success) {
          setNpis(npisResult.data || []);
        }

        // Fetch CCNs
        const ccnsResponse = await fetch(apiUrl('/api/related-ccns'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dhc_ids: [provider.dhc] })
        });
        const ccnsResult = await ccnsResponse.json();
        if (ccnsResult.success) {
          setCcns(ccnsResult.data || []);
        }
      } catch (err) {
        console.error('Error fetching provider IDs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProviderIds();
  }, [provider?.dhc]);

  if (!provider) {
    return <p>Loading provider data...</p>;
  }

  const handleSeeMarket = () => {
    // Navigate to market analysis view
    navigate(`/app/${provider.dhc}/market/overview`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <h2>{provider.name}</h2>
          <p className={styles.type}>{provider.type}</p>
          {provider.network && <p className={styles.network}>{provider.network}</p>}
        </div>

        <div className={styles.profileDetails}>
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>
              <MapPin size={18} />
            </div>
            <div>
              <label>Address</label>
              <p>
                {provider.street}<br />
                {provider.city}, {provider.state} {provider.zip}
              </p>
            </div>
          </div>

          {provider.phone && (
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <Phone size={18} />
              </div>
              <div>
                <label>Phone</label>
                <p>{provider.phone}</p>
              </div>
            </div>
          )}

          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>
              <Building2 size={18} />
            </div>
            <div>
              <label>Provider Type</label>
              <p>{provider.type}</p>
            </div>
          </div>

          {provider.network && (
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <Network size={18} />
              </div>
              <div>
                <label>Network</label>
                <p>{provider.network}</p>
              </div>
            </div>
          )}

          {provider.dhc && (
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <Building2 size={18} />
              </div>
              <div>
                <label>DHC (Provider ID)</label>
                <p>{provider.dhc}</p>
              </div>
            </div>
          )}
        </div>

        {/* Provider Identifiers Section */}
        <div className={styles.identifiersSection}>
          <h3 className={styles.identifiersTitle}>Provider Identifiers</h3>
          
          <div className={styles.identifierGrid}>
            {/* NPIs */}
            <div className={styles.identifierCard}>
              <div className={styles.identifierHeader}>
                <Hash size={18} />
                <span>NPIs (National Provider Identifiers)</span>
              </div>
              {loading ? (
                <div className={styles.identifierLoading}>Loading...</div>
              ) : npis.length > 0 ? (
                <div className={styles.identifierList}>
                  {npis.map((item, index) => (
                    <div key={index} className={styles.identifierItem}>
                      {item.npi}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.identifierEmpty}>No NPIs found</div>
              )}
            </div>

            {/* CCNs */}
            <div className={styles.identifierCard}>
              <div className={styles.identifierHeader}>
                <FileText size={18} />
                <span>CCNs (CMS Certification Numbers)</span>
              </div>
              {loading ? (
                <div className={styles.identifierLoading}>Loading...</div>
              ) : ccns.length > 0 ? (
                <div className={styles.identifierList}>
                  {ccns.map((item, index) => (
                    <div key={index} className={styles.identifierItem}>
                      {item.ccn}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.identifierEmpty}>No CCNs found</div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.marketCta}>
          <button className={styles.marketButton} onClick={handleSeeMarket}>
            <span>View Market Analysis</span>
            <ArrowRight size={18} />
          </button>
          <p className={styles.marketDescription}>
            See nearby providers, population data, catchment areas, and more
          </p>
        </div>
      </div>
    </div>
  );
}

