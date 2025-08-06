import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ServiceLineSearch.module.css';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import { apiUrl } from '../../../utils/api';

export default function ServiceLineSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceLine, setSelectedServiceLine] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedProviderType, setSelectedProviderType] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Mock service lines - in real implementation, fetch from API
  const serviceLines = [
    'Cardiology',
    'Orthopedics',
    'Oncology',
    'Neurology',
    'Gastroenterology',
    'Dermatology',
    'Urology',
    'Ophthalmology',
    'ENT',
    'General Surgery',
    'Internal Medicine',
    'Family Medicine',
    'Pediatrics',
    'Obstetrics & Gynecology',
    'Psychiatry',
    'Physical Therapy',
    'Occupational Therapy',
    'Speech Therapy',
    'Laboratory Services',
    'Radiology'
  ];

  const providerTypes = [
    'Hospital',
    'Physician Practice',
    'Ambulatory Surgery Center',
    'Diagnostic Laboratory',
    'Imaging Center',
    'Rehabilitation Center',
    'Urgent Care',
    'Specialty Clinic'
  ];

  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ];

  const handleSearch = async () => {
    if (!selectedServiceLine) {
      setError('Please select a service line');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/supplier/search-providers'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceLine: selectedServiceLine,
          state: selectedState,
          providerType: selectedProviderType,
          searchQuery: searchQuery.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResults(result.data);
      } else {
        setError(result.error || 'Failed to search providers');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search providers');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderClick = (provider) => {
    navigate(`/app/provider/${provider.dhc}/overview`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Find Providers by Service Line</h1>
        <p>Discover healthcare providers who deliver specific services across markets</p>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Service Line *</label>
              <select
                value={selectedServiceLine}
                onChange={(e) => setSelectedServiceLine(e.target.value)}
                className={styles.select}
              >
                <option value="">Select a service line</option>
                {serviceLines.map(line => (
                  <option key={line} value={line}>{line}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className={styles.select}
              >
                <option value="">All States</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Provider Type</label>
              <select
                value={selectedProviderType}
                onChange={(e) => setSelectedProviderType(e.target.value)}
                className={styles.select}
              >
                <option value="">All Types</option>
                {providerTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Search Terms</label>
              <input
                type="text"
                placeholder="Provider name, network, city, etc."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.searchButton}>
              <Button
                onClick={handleSearch}
                disabled={loading || !selectedServiceLine}
                variant="green"
              >
                {loading ? 'Searching...' : 'Search Providers'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <Spinner message="Searching for providers..." />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <h2>Found {results.length} providers</h2>
            <p>Showing providers who deliver {selectedServiceLine}</p>
          </div>

          <div className={styles.resultsGrid}>
            {results.map((provider) => (
              <div
                key={provider.dhc}
                className={styles.providerCard}
                onClick={() => handleProviderClick(provider)}
              >
                <div className={styles.providerHeader}>
                  <h3>{provider.name}</h3>
                  <span className={styles.providerType}>{provider.type}</span>
                </div>
                
                <div className={styles.providerDetails}>
                  <p>{provider.street}, {provider.city}, {provider.state} {provider.zip}</p>
                  {provider.phone && <p>📞 {provider.phone}</p>}
                  {provider.network && <p>🏥 {provider.network}</p>}
                </div>

                <div className={styles.providerMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Volume</span>
                    <span className={styles.metricValue}>{provider.volume?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Market Share</span>
                    <span className={styles.metricValue}>{provider.marketShare || 'N/A'}</span>
                  </div>
                </div>

                <div className={styles.cardAction}>
                  <span>View Details →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className={styles.emptyState}>
          <h3>No providers found</h3>
          <p>Try adjusting your search criteria or selecting a different service line.</p>
        </div>
      )}
    </div>
  );
} 