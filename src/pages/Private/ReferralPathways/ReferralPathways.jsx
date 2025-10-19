import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import styles from './ReferralPathways.module.css';
import Dropdown from '../../../components/Buttons/Dropdown';
import Spinner from '../../../components/Buttons/Spinner';
import { 
  Users, TrendingUp, MapPin, ChevronDown, Calendar,
  Download, Activity, Building2
} from 'lucide-react';

/**
 * REFERRAL PATHWAYS ANALYSIS
 * 
 * Analyze where referrals come from (outbound providers → inbound providers)
 * Executive questions:
 * - Which hospitals send us the most patients?
 * - What's the payor mix by referral source?
 * - How has referral volume changed over time?
 * - What's the average time between discharge and admission?
 */

export default function ReferralPathways() {
  // Provider selection state
  const [savedMarkets, setSavedMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketNPIs, setMarketNPIs] = useState(null);

  // Data state
  const [summaryStats, setSummaryStats] = useState(null);
  const [topReferralSources, setTopReferralSources] = useState(null);
  const [referralTrends, setReferralTrends] = useState(null);
  const [payorMix, setPayorMix] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Query parameters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupBy, setGroupBy] = useState('facility');
  const [limit, setLimit] = useState(50);
  const [maxLeadDays, setMaxLeadDays] = useState(14); // Default to 14 days or less

  // Active view
  const [activeView, setActiveView] = useState('summary'); // summary, sources, trends, payor
  
  // Dropdown states
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [groupByDropdownOpen, setGroupByDropdownOpen] = useState(false);

  // Fetch markets on mount
  useEffect(() => {
    fetchMarkets();
  }, []);

  // Set default date range (last 12 months) on mount
  useEffect(() => {
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(today.getMonth() - 12);
    
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(twelveMonthsAgo.toISOString().split('T')[0]);
  }, []);

  const fetchMarkets = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (marketsError) throw marketsError;
      setSavedMarkets(data || []);
    } catch (err) {
      console.error('Error fetching markets:', err);
    }
  };

  const handleMarketSelect = async (market) => {
    setSelectedMarket(market);
    
    // Fetch NPIs for this market
    try {
      const params = new URLSearchParams({
        latitude: market.latitude,
        longitude: market.longitude,
        radius: market.radius_miles,
        limit: 10000
      });

      const response = await fetch(`/api/hco-data/sample?${params}`);
      const data = await response.json();
      
      const npis = data.organizations
        ?.filter(org => org.npi)
        .map(org => org.npi)
        .filter(Boolean);
      
      setMarketNPIs(npis || []);
      console.log(`Loaded ${npis?.length || 0} NPIs for market: ${market.name}`);
    } catch (err) {
      console.error('Error fetching market NPIs:', err);
      setError('Failed to load market providers');
    }
  };

  const getCurrentNPIs = () => {
    return marketNPIs || [];
  };

  const runAnalysis = async () => {
    const npis = getCurrentNPIs();
    
    if (npis.length === 0) {
      setError('Please select a market or provider tag first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      await Promise.all([
        fetchSummaryStats(npis),
        fetchTopReferralSources(npis),
        fetchReferralTrends(npis),
        fetchPayorMix(npis)
      ]);
    } catch (err) {
      console.error('Error running analysis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryStats = async (npis) => {
    const response = await fetch('/api/referral-pathways/summary-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inboundNPIs: npis,
        dateFrom,
        dateTo,
        maxLeadDays
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch summary stats');
    }

    const result = await response.json();
    setSummaryStats(result.data);
  };

  const fetchTopReferralSources = async (npis) => {
    const response = await fetch('/api/referral-pathways/top-referral-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inboundNPIs: npis,
        groupBy,
        dateFrom,
        dateTo,
        limit,
        maxLeadDays,
        includePayorMix: true,
        includeTiming: true,
        includeGeography: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch referral sources');
    }

    const result = await response.json();
    setTopReferralSources(result);
  };

  const fetchReferralTrends = async (npis) => {
    const response = await fetch('/api/referral-pathways/referral-trends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inboundNPIs: npis,
        limit: 36, // 3 years of monthly data
        maxLeadDays
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch referral trends');
    }

    const result = await response.json();
    setReferralTrends(result.data);
  };

  const fetchPayorMix = async (npis) => {
    const response = await fetch('/api/referral-pathways/payor-mix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inboundNPIs: npis,
        dateFrom,
        dateTo,
        limit: 100,
        maxLeadDays
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch payor mix');
    }

    const result = await response.json();
    setPayorMix(result.data);
  };

  const exportToCSV = () => {
    if (!topReferralSources?.data) return;

    const headers = ['Outbound NPI', 'Name', 'City', 'State', 'Taxonomy', 'Total Pathways', 'Total Charges', 'Avg Lead Days', 'Payor Groups', 'Patient States'];
    const rows = topReferralSources.data.map(row => [
      row.outbound_npi || '',
      row.outbound_name || '',
      row.outbound_city || '',
      row.outbound_state || '',
      row.outbound_taxonomy || '',
      row.total_pathways || 0,
      row.total_charges || 0,
      row.avg_lead_days || 0,
      row.payor_groups || '',
      row.patient_states || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `referral-sources-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num) => {
    if (!num) return '$0';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Referral Pathways Analysis</h1>
        <p className={styles.subtitle}>
          Understand where your referrals come from and optimize your referral network
        </p>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {/* Market Selector */}
        <Dropdown
          trigger={
            <button className={styles.dropdownTrigger}>
              <MapPin size={14} />
              {selectedMarket ? selectedMarket.name : 'Select Market'}
              <ChevronDown size={14} />
            </button>
          }
          isOpen={marketDropdownOpen}
          onToggle={setMarketDropdownOpen}
          className={styles.dropdownMenu}
        >
          {savedMarkets.length === 0 ? (
            <div className={styles.dropdownItem} style={{ color: 'var(--gray-500)' }}>
              No saved markets
            </div>
          ) : (
            savedMarkets.map((market) => (
              <button
                key={market.id}
                className={styles.dropdownItem}
                onClick={() => {
                  handleMarketSelect(market);
                  setMarketDropdownOpen(false);
                }}
              >
                {market.name}
              </button>
            ))
          )}
        </Dropdown>

        {/* Date Range */}
        <div className={styles.dateRange}>
          <Calendar size={14} />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={styles.dateInput}
          />
          <span>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        {/* Group By */}
        <Dropdown
          trigger={
            <button className={styles.dropdownTrigger}>
              <Building2 size={14} />
              {groupBy === 'facility' ? 'Facility' : 
               groupBy === 'billing' ? 'Billing' :
               groupBy === 'service_location' ? 'Service Location' : 'Performing'}
              <ChevronDown size={14} />
            </button>
          }
          isOpen={groupByDropdownOpen}
          onToggle={setGroupByDropdownOpen}
          className={styles.dropdownMenu}
        >
          <button
            className={styles.dropdownItem}
            onClick={() => { setGroupBy('facility'); setGroupByDropdownOpen(false); }}
          >
            Facility Provider
          </button>
          <button
            className={styles.dropdownItem}
            onClick={() => { setGroupBy('billing'); setGroupByDropdownOpen(false); }}
          >
            Billing Provider
          </button>
          <button
            className={styles.dropdownItem}
            onClick={() => { setGroupBy('service_location'); setGroupByDropdownOpen(false); }}
          >
            Service Location Provider
          </button>
          <button
            className={styles.dropdownItem}
            onClick={() => { setGroupBy('performing'); setGroupByDropdownOpen(false); }}
          >
            Performing Provider
          </button>
        </Dropdown>

        {/* Lead Up Period Filter */}
        <div className={styles.filterControl}>
          <label className={styles.filterLabel}>Max Lead Days:</label>
          <input
            type="number"
            value={maxLeadDays}
            onChange={(e) => setMaxLeadDays(parseInt(e.target.value) || 14)}
            className={styles.numberInput}
            min="1"
            max="365"
          />
        </div>

        {/* Run Analysis Button */}
        <button
          className={styles.runButton}
          onClick={runAnalysis}
          disabled={loading || getCurrentNPIs().length === 0}
        >
          <Activity size={14} />
          {loading ? 'Running...' : 'Run Analysis'}
        </button>
      </div>

      {/* Info Bar */}
      {selectedMarket && (
        <div className={styles.infoBar}>
          <span className={styles.infoText}>
            Analyzing {formatNumber(getCurrentNPIs().length)} providers in {selectedMarket.name}
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Tabs */}
      {summaryStats && (
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeView === 'summary' ? styles.tabActive : ''}`}
            onClick={() => setActiveView('summary')}
          >
            <Activity size={14} />
            Summary
          </button>
          <button
            className={`${styles.tab} ${activeView === 'sources' ? styles.tabActive : ''}`}
            onClick={() => setActiveView('sources')}
          >
            <Users size={14} />
            Top Sources
          </button>
          <button
            className={`${styles.tab} ${activeView === 'trends' ? styles.tabActive : ''}`}
            onClick={() => setActiveView('trends')}
          >
            <TrendingUp size={14} />
            Trends
          </button>
          <button
            className={`${styles.tab} ${activeView === 'payor' ? styles.tabActive : ''}`}
            onClick={() => setActiveView('payor')}
          >
            <Building2 size={14} />
            Payor Mix
          </button>
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {loading && (
          <div className={styles.loadingState}>
            <Spinner size={32} />
            <p>Running referral pathway analysis...</p>
          </div>
        )}

        {!loading && summaryStats && (
          <>
            {/* Summary View */}
            {activeView === 'summary' && (
              <div className={styles.summaryGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Referral Sources</div>
                  <div className={styles.statValue}>{formatNumber(summaryStats.total_referral_sources)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Pathways</div>
                  <div className={styles.statValue}>{formatNumber(summaryStats.total_pathways)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Charges</div>
                  <div className={styles.statValue}>{formatCurrency(summaryStats.total_charges)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Avg Lead Time</div>
                  <div className={styles.statValue}>{summaryStats.avg_lead_days} days</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Payor Groups</div>
                  <div className={styles.statValue}>{formatNumber(summaryStats.distinct_payors)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Patient States</div>
                  <div className={styles.statValue}>{formatNumber(summaryStats.patient_states_count)}</div>
                </div>
              </div>
            )}

            {/* Top Sources View */}
            {activeView === 'sources' && topReferralSources && (
              <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                  <h3>Top {limit} Referral Sources</h3>
                  <button className={styles.exportButton} onClick={exportToCSV}>
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Provider Name</th>
                      <th>Location</th>
                      <th>Taxonomy</th>
                      <th>Pathways</th>
                      <th>Charges</th>
                      <th>Avg Lead Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topReferralSources.data.map((row, idx) => (
                      <tr key={row.outbound_npi || idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <div className={styles.providerName}>{row.outbound_name}</div>
                          <div className={styles.providerNpi}>{row.outbound_npi}</div>
                        </td>
                        <td>{row.outbound_city}, {row.outbound_state}</td>
                        <td>{row.outbound_taxonomy}</td>
                        <td>{formatNumber(row.total_pathways)}</td>
                        <td>{formatCurrency(row.total_charges)}</td>
                        <td>{row.avg_lead_days || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Trends View */}
            {activeView === 'trends' && referralTrends && (
              <div className={styles.trendsContainer}>
                <h3>Referral Volume Trends (Last 36 Months)</h3>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Referral Sources</th>
                      <th>Total Pathways</th>
                      <th>Total Charges</th>
                      <th>Avg Lead Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralTrends.map((row, idx) => (
                      <tr key={idx}>
                        <td>{formatDate(row.month?.value)}</td>
                        <td>{formatNumber(row.distinct_referral_sources)}</td>
                        <td>{formatNumber(row.total_pathways)}</td>
                        <td>{formatCurrency(row.total_charges)}</td>
                        <td>{row.avg_lead_days || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Payor Mix View */}
            {activeView === 'payor' && payorMix && (
              <div className={styles.payorContainer}>
                <h3>Payor Mix by Referral Source</h3>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Provider Name</th>
                      <th>Payor Group</th>
                      <th>Pathways</th>
                      <th>Charges</th>
                      <th>Avg Lead Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payorMix.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className={styles.providerName}>{row.outbound_name}</div>
                          <div className={styles.providerNpi}>{row.outbound_npi}</div>
                        </td>
                        <td>{row.payor_group}</td>
                        <td>{formatNumber(row.total_pathways)}</td>
                        <td>{formatCurrency(row.total_charges)}</td>
                        <td>{row.avg_lead_days || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {!loading && !summaryStats && (
          <div className={styles.emptyState}>
            <Activity size={48} />
            <h3>Ready to Analyze Referral Pathways</h3>
            <p>Select a market or provider tag, then click "Run Analysis" to see where your referrals come from.</p>
          </div>
        )}
      </div>
    </div>
  );
}

