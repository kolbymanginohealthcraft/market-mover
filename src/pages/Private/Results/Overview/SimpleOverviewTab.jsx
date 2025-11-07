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

  useEffect(() => {
    let isSubscribed = true;

    async function fetchProviderIds() {
      if (!provider?.dhc) {
        if (isSubscribed) {
          setNpis([]);
          setCcns([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const payload = JSON.stringify({ dhc_ids: [provider.dhc] });

        const [npisResponse, ccnsResponse] = await Promise.all([
          fetch(apiUrl('/api/related-npis'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          }),
          fetch(apiUrl('/api/related-ccns'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          }),
        ]);

        let npisData = [];
        if (npisResponse.ok) {
          const npisResult = await npisResponse.json();
          if (npisResult.success && Array.isArray(npisResult.data)) {
            const unique = new Map();
            npisResult.data.forEach((item) => {
              if (!item?.npi) return;
              const npi = String(item.npi);
              const existing = unique.get(npi);
              const candidate = {
                npi,
                name: item.name ? String(item.name) : null,
                organizationName: item.organization_name ? String(item.organization_name) : null,
                is_primary: Boolean(item.is_primary),
                city: item.city ? String(item.city) : null,
                state: item.state ? String(item.state) : null,
              };

              if (!existing) {
                unique.set(npi, candidate);
                return;
              }

              if (!existing.is_primary && candidate.is_primary) {
                unique.set(npi, {
                  ...candidate,
                  name: candidate.name || existing.name,
                  organizationName: candidate.organizationName || existing.organizationName,
                });
                return;
              }

              if (!existing.name && candidate.name) {
                unique.set(npi, {
                  ...existing,
                  name: candidate.name,
                  is_primary: existing.is_primary || candidate.is_primary,
                  organizationName: existing.organizationName || candidate.organizationName,
                });
                return;
              }

              if (!existing.organizationName && candidate.organizationName) {
                unique.set(npi, {
                  ...existing,
                  organizationName: candidate.organizationName,
                  is_primary: existing.is_primary || candidate.is_primary,
                });
              }
            });
            npisData = Array.from(unique.values());
          }
        }

        let ccnsData = [];
        if (ccnsResponse.ok) {
          const ccnsResult = await ccnsResponse.json();
          if (ccnsResult.success && Array.isArray(ccnsResult.data)) {
            const map = new Map();
            ccnsResult.data.forEach((item) => {
              if (!item?.ccn) return;
              const ccn = String(item.ccn);
              const entry = map.get(ccn) || {
                dhc: item.dhc ? String(item.dhc) : null,
                ccn,
                npis: [],
                facilityName: null,
              };

              if (item.npi) {
                const npiString = String(item.npi);
                if (!entry.npis.includes(npiString)) {
                  entry.npis.push(npiString);
                }
              }

              map.set(ccn, entry);
            });

            const dedupedCcns = Array.from(map.values());
            const uniqueCcns = dedupedCcns.map((entry) => entry.ccn);

            if (uniqueCcns.length > 0) {
              try {
                const posResponse = await fetch(apiUrl('/api/provider-of-services'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    filters: { PRVDR_NUM: uniqueCcns },
                    limit: uniqueCcns.length,
                  }),
                });

                if (posResponse.ok) {
                  const posResult = await posResponse.json();
                  if (posResult.success && Array.isArray(posResult.data)) {
                    const nameMap = new Map();
                    posResult.data.forEach((record) => {
                      if (!record?.PRVDR_NUM) return;
                      nameMap.set(String(record.PRVDR_NUM), record.FAC_NAME ? String(record.FAC_NAME) : null);
                    });

                    dedupedCcns.forEach((entry) => {
                      if (!entry.facilityName && nameMap.has(entry.ccn)) {
                        entry.facilityName = nameMap.get(entry.ccn);
                      }
                    });
                  }
                }
              } catch (nameError) {
                console.error('Error fetching CCN facility names:', nameError);
              }
            }

            ccnsData = dedupedCcns;
          }
        }

        if (isSubscribed) {
          setNpis(npisData);
          setCcns(ccnsData);
        }
      } catch (err) {
        console.error('Error fetching provider IDs:', err);
        if (isSubscribed) {
          setNpis([]);
          setCcns([]);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    fetchProviderIds();

    return () => {
      isSubscribed = false;
    };
  }, [provider?.dhc]);

  if (!provider) {
    return <p>Loading provider data...</p>;
  }

  const handleSeeMarket = () => {
    navigate(`/app/${provider.dhc}/market/overview`);
  };

  const formatLocation = (city, state) => {
    if (city && state) return `${city}, ${state}`;
    if (state) return state;
    if (city) return city;
    return null;
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

        <div className={styles.identifiersSection}>
          <h3 className={styles.identifiersTitle}>Provider Identifiers</h3>

          <div className={styles.identifierGrid}>
            <div className={styles.identifierCard}>
              <div className={styles.identifierHeader}>
                <Hash size={18} />
                <span>NPIs (National Provider Identifiers)</span>
              </div>
              {loading ? (
                <div className={styles.identifierLoading}>Loading...</div>
              ) : npis.length > 0 ? (
                <div className={styles.identifierList}>
                  {npis.map((item) => {
                    const location = formatLocation(item.city, item.state);
                    const displayName = item.name || item.organizationName || `NPI ${item.npi}`;
                    return (
                      <div key={item.npi} className={styles.identifierItem}>
                        <div className={styles.identifierItemHeader}>
                          <span className={styles.identifierName}>{displayName}</span>
                          {item.is_primary && (
                            <span className={styles.identifierBadge}>Primary</span>
                          )}
                        </div>
                        <div className={styles.identifierCode}>{item.npi}</div>
                        {location && (
                          <div className={styles.identifierMeta}>{location}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.identifierEmpty}>No NPIs found</div>
              )}
            </div>

            <div className={styles.identifierCard}>
              <div className={styles.identifierHeader}>
                <FileText size={18} />
                <span>CCNs (CMS Certification Numbers)</span>
              </div>
              {loading ? (
                <div className={styles.identifierLoading}>Loading...</div>
              ) : ccns.length > 0 ? (
                <div className={styles.identifierList}>
                  {ccns.map((item) => {
                    const linkedNpis = item.npis && item.npis.length > 0
                      ? item.npis.slice(0, 3).join(', ') + (item.npis.length > 3 ? '…' : '')
                      : null;

                    return (
                      <div key={item.ccn} className={styles.identifierItem}>
                        {item.facilityName && (
                          <div className={styles.identifierItemHeader}>
                            <span className={styles.identifierName}>{item.facilityName}</span>
                          </div>
                        )}
                        <div className={styles.identifierCode}>{item.ccn}</div>
                        {linkedNpis && (
                          <div className={styles.identifierMeta}>Linked NPIs: {linkedNpis}</div>
                        )}
                      </div>
                    );
                  })}
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

