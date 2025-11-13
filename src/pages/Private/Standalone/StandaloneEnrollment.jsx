import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { supabase } from '../../../app/supabaseClient';
import useCMSEnrollmentData from '../../../hooks/useCMSEnrollmentData';
import useMAEnrollmentData, { useMAEnrollmentTrendData, useNationwideMAEnrollmentData, useNationwideMAEnrollmentTrendData } from '../../../hooks/useMAEnrollmentData';
import { apiUrl } from '../../../utils/api';
import Spinner from '../../../components/Buttons/Spinner';
import CMSEnrollmentPanel from '../Results/Enrollment/CMSEnrollmentPanel';
import styles from './StandaloneEnrollment.module.css';

const formatNumber = (value) => new Intl.NumberFormat().format(Math.round(value || 0));

export default function StandaloneEnrollment() {
  const [searchParams] = useSearchParams();
  const [savedMarkets, setSavedMarkets] = useState([]);
  const [publishDates, setPublishDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [errorDates, setErrorDates] = useState(null);
  const [selectedParentOrg, setSelectedParentOrg] = useState('');
  const [trendRange, setTrendRange] = useState({ startDate: null, endDate: null });

  const navigate = useNavigate();
  const location = useLocation();

  const planType = 'MA';

  const validViews = useMemo(() => new Set(['overview', 'listing', 'payer']), []);

  const activeView = useMemo(() => {
    const trimmedPath = location.pathname.replace(/\/+/g, '/').replace(/\/$/, '');
    const segments = trimmedPath.split('/');
    const lastSegment = segments[segments.length - 1] || '';
    return validViews.has(lastSegment) ? lastSegment : 'overview';
  }, [location.pathname, validViews]);

  useEffect(() => {
    const normalizedPath = location.pathname.replace(/\/+/g, '/').replace(/\/$/, '');
    if (normalizedPath === '/app/enrollment') {
      navigate('/app/enrollment/overview', { replace: true });
    } else {
      const segments = normalizedPath.split('/');
      const lastSegment = segments[segments.length - 1] || '';
      if (!validViews.has(lastSegment)) {
        navigate('/app/enrollment/overview', { replace: true });
      }
    }
  }, [location.pathname, navigate, validViews]);

  useEffect(() => {
    async function fetchMarkets() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSavedMarkets(data || []);
      } catch (err) {
        console.error('Error fetching markets:', err);
      }
    }

    fetchMarkets();
  }, []);

  useEffect(() => {
    setLoadingDates(true);
    setErrorDates(null);

    async function fetchPublishDates() {
      try {
        const resp = await fetch(apiUrl('/api/ma-enrollment-dates'));
        if (!resp.ok) throw new Error('Failed to fetch publish dates');
        const result = await resp.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch publish dates');

        const dates = (result.data || [])
          .map((d) => {
            if (typeof d === 'string') return d.slice(0, 10);
            if (d?.value) return String(d.value).slice(0, 10);
            return String(d).slice(0, 10);
          })
          .filter(Boolean);

        const sorted = [...new Set(dates)].sort();
        setPublishDates(sorted);
      } catch (err) {
        setErrorDates(err.message);
        setPublishDates([]);
      } finally {
        setLoadingDates(false);
      }
    }

    fetchPublishDates();
  }, []);

  useEffect(() => {
    if (!publishDates.length) return;
    const sorted = [...publishDates].sort();
    const end = sorted[sorted.length - 1];
    const start = sorted[Math.max(0, sorted.length - 12)];
    setTrendRange({ startDate: start, endDate: end });
  }, [publishDates]);

  const publishDate = publishDates[publishDates.length - 1] || null;

  const marketIdParam = searchParams.get('marketId');

  const selectedMarket = useMemo(() => {
    if (!savedMarkets.length) return null;
    if (marketIdParam) {
      return savedMarkets.find((market) => String(market.id) === marketIdParam) || null;
    }
    return null;
  }, [savedMarkets, marketIdParam]);

  const baseProvider = useMemo(() => {
    if (!selectedMarket) return null;
    const lat = Number(selectedMarket.latitude);
    const lon = Number(selectedMarket.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      name: selectedMarket.name || 'Saved Market',
      facility_name: selectedMarket.name,
      latitude: lat,
      longitude: lon,
      city: selectedMarket.city,
      state: selectedMarket.state,
    };
  }, [selectedMarket]);

  const effectiveRadius = useMemo(() => {
    if (!selectedMarket) return null;
    const radius = Number(selectedMarket.radius_miles);
    return Number.isFinite(radius) ? radius : null;
  }, [selectedMarket]);

  const hasCoordinates = Boolean(baseProvider?.latitude && baseProvider?.longitude && effectiveRadius);
  
  // For payer deep dive, always use nationwide data (ignore county filtering)
  const useNationwideForPayer = activeView === 'payer';

  const { data: cmsData, loading: cmsLoading, error: cmsError, latestMonth } = useCMSEnrollmentData(baseProvider, effectiveRadius);
  const { data: maData, loading: maLoading, error: maError } = useMAEnrollmentData(
    useNationwideForPayer ? null : baseProvider, 
    useNationwideForPayer ? null : effectiveRadius, 
    publishDate, 
    planType
  );
  const { data: trendData, loading: trendLoading, error: trendError } = useMAEnrollmentTrendData(
    useNationwideForPayer ? null : baseProvider,
    useNationwideForPayer ? null : effectiveRadius,
    trendRange.startDate,
    trendRange.endDate,
    planType
  );

  const [allOrganizations, setAllOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [errorOrgs, setErrorOrgs] = useState(null);

  // Fetch all organizations nationwide for payer deep dive
  useEffect(() => {
    if (activeView !== 'payer' || !publishDate) {
      setAllOrganizations([]);
      return;
    }

    setLoadingOrgs(true);
    setErrorOrgs(null);

    fetch(apiUrl('/api/ma-enrollment-organizations'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishDate, type: planType })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setAllOrganizations(result.data || []);
        } else {
          throw new Error(result.error || 'Failed to fetch organizations');
        }
      })
      .catch(err => {
        setErrorOrgs(err.message);
        setAllOrganizations([]);
      })
      .finally(() => setLoadingOrgs(false));
  }, [activeView, publishDate, planType]);

  const { data: nationwideMaData, loading: nationwideMaLoading, error: nationwideMaError } = useNationwideMAEnrollmentData(
    selectedParentOrg,
    publishDate,
    planType
  );
  const { data: nationwideTrendData, loading: nationwideTrendLoading, error: nationwideTrendError } = useNationwideMAEnrollmentTrendData(
    selectedParentOrg,
    trendRange.startDate,
    trendRange.endDate,
    planType
  );

  const parentOrgSummary = useMemo(() => {
    // For payer view, use all organizations nationwide; for listing view, use county data if available
    if (useNationwideForPayer) {
      if (!Array.isArray(allOrganizations) || !allOrganizations.length) return [];
      return allOrganizations.map(org => ({
        parentOrg: org.parent_org,
        totalEnrollment: Number(org.total_enrollment) || 0,
        planCount: Number(org.plan_count) || 0,
        counties: new Set(), // Not available from aggregated query
        states: new Set(), // Not available from aggregated query
        plans: [] // Not available from aggregated query
      }));
    }
    
    const dataToUse = hasCoordinates ? maData : nationwideMaData;
    if (!Array.isArray(dataToUse) || !dataToUse.length) return [];
    const summaryMap = new Map();

    dataToUse.forEach((row) => {
      const parentOrg = row.parent_org || 'Other / Unknown';
      if (!summaryMap.has(parentOrg)) {
        summaryMap.set(parentOrg, {
          parentOrg,
          totalEnrollment: 0,
          plans: new Map(),
          counties: new Set(),
          states: new Set(),
        });
      }

      const entry = summaryMap.get(parentOrg);
      entry.totalEnrollment += row.enrollment || 0;
      if (row.fips) {
        entry.counties.add(row.fips);
        entry.states.add(row.fips.slice(0, 2));
      }

      const planKey = row.plan_id || `${row.plan_name || 'Unknown'}-${row.contract_name || ''}`;
      if (!entry.plans.has(planKey)) {
        entry.plans.set(planKey, {
          plan_id: row.plan_id,
          plan_name: row.plan_name || 'Unnamed Plan',
          contract_name: row.contract_name || 'Unspecified Contract',
          snp_type: row.snp_type,
          enrollment: 0,
        });
      }

      const plan = entry.plans.get(planKey);
      plan.enrollment += row.enrollment || 0;
    });

    return Array.from(summaryMap.values())
      .map((entry) => ({
        parentOrg: entry.parentOrg,
        totalEnrollment: entry.totalEnrollment,
        planCount: entry.plans.size,
        counties: entry.counties,
        states: entry.states,
        plans: Array.from(entry.plans.values()).sort((a, b) => b.enrollment - a.enrollment),
      }))
      .sort((a, b) => b.totalEnrollment - a.totalEnrollment);
  }, [maData, nationwideMaData, hasCoordinates, useNationwideForPayer, allOrganizations]);

  useEffect(() => {
    if (!parentOrgSummary.length) {
      setSelectedParentOrg('');
      return;
    }
    if (!selectedParentOrg || !parentOrgSummary.some((item) => item.parentOrg === selectedParentOrg)) {
      setSelectedParentOrg(parentOrgSummary[0].parentOrg);
    }
  }, [parentOrgSummary, selectedParentOrg]);

  const selectedParentEntry = useMemo(() => {
    if (!selectedParentOrg) return null;
    const entry = parentOrgSummary.find((entry) => entry.parentOrg === selectedParentOrg);
    if (!entry) return null;
    
    // For payer view, enrich with detailed data from nationwideMaData
    if (useNationwideForPayer && Array.isArray(nationwideMaData) && nationwideMaData.length > 0) {
      const orgData = allOrganizations.find(org => org.parent_org === selectedParentOrg);
      const plansMap = new Map();
      const countiesSet = new Set();
      const statesSet = new Set();
      
      nationwideMaData.forEach((row) => {
        if (row.fips) {
          countiesSet.add(row.fips);
          statesSet.add(row.fips.slice(0, 2));
        }
        
        const planKey = row.plan_id || `${row.plan_name || 'Unknown'}-${row.contract_name || ''}`;
        if (!plansMap.has(planKey)) {
          plansMap.set(planKey, {
            plan_id: row.plan_id,
            plan_name: row.plan_name || 'Unnamed Plan',
            contract_name: row.contract_name || 'Unspecified Contract',
            snp_type: row.snp_type,
            enrollment: 0,
          });
        }
        plansMap.get(planKey).enrollment += row.enrollment || 0;
      });
      
      return {
        ...entry,
        counties: countiesSet,
        states: statesSet,
        planCount: plansMap.size,
        plans: Array.from(plansMap.values()).sort((a, b) => b.enrollment - a.enrollment)
      };
    }
    
    return entry;
  }, [parentOrgSummary, selectedParentOrg, useNationwideForPayer, allOrganizations, nationwideMaData]);

  const parentOrgTrend = useMemo(() => {
    // For payer view, always use nationwide data; for listing view, use county data if available
    const trendToUse = (useNationwideForPayer || !hasCoordinates) ? nationwideTrendData : trendData;
    if (!Array.isArray(trendToUse) || !selectedParentOrg) return [];
    return trendToUse
      .filter((row) => (row.parent_org || 'Other / Unknown') === selectedParentOrg)
      .map((row) => {
        const publishDateValue = row.publish_date?.value || row.publish_date || row.publishDate || row.date;
        const formattedDate = typeof publishDateValue === 'string'
          ? publishDateValue.slice(0, 10)
          : String(publishDateValue).slice(0, 10);
        return {
          publishDate: formattedDate,
          enrollment: row.org_enrollment || 0,
        };
      })
      .sort((a, b) => (a.publishDate > b.publishDate ? 1 : -1));
  }, [trendData, nationwideTrendData, selectedParentOrg, hasCoordinates, useNationwideForPayer]);

  const growthMetrics = useMemo(() => {
    if (!parentOrgTrend.length) return null;
    const first = parentOrgTrend[0];
    const last = parentOrgTrend[parentOrgTrend.length - 1];
    const absolute = (last.enrollment || 0) - (first.enrollment || 0);
    const percentage = first.enrollment ? (absolute / first.enrollment) * 100 : null;
    return {
      start: first,
      end: last,
      absolute,
      percentage,
    };
  }, [parentOrgTrend]);

  const hasMarkets = savedMarkets.length > 0;
  const canShowPayerView = activeView === 'payer' && selectedParentOrg;

  return (
    <div className={styles.container}>
      <div className={styles.viewContainer}>
        {!hasMarkets && activeView !== 'payer' ? (
          <div className={styles.emptyState}>
            <h2>No saved markets yet</h2>
            <p>Create a market to explore enrollment insights.</p>
          </div>
        ) : !selectedMarket && !canShowPayerView ? (
          <div className={styles.emptyState}>
            <h2>Select a saved market</h2>
            <p>Choose a market from the controls above to load enrollment data.</p>
          </div>
        ) : !hasCoordinates && activeView !== 'payer' ? (
          <div className={styles.emptyState}>
            <h2>Market location unavailable</h2>
            <p>The selected market is missing location details. Update the market to continue.</p>
          </div>
        ) : activeView === 'overview' ? (
          <div className={styles.panelWrapper}>
            {cmsLoading ? (
              <Spinner message="Loading CMS enrollment data..." />
            ) : cmsError ? (
              <div className={styles.errorPanel}>
                <h3>CMS enrollment unavailable</h3>
                <p>{cmsError}</p>
              </div>
            ) : (
              <CMSEnrollmentPanel
                data={cmsData}
                loading={cmsLoading}
                error={cmsError}
                latestMonth={latestMonth}
              />
            )}
          </div>
        ) : activeView === 'listing' ? (
          <div className={styles.panelWrapper}>
            {loadingDates || (hasCoordinates ? maLoading : nationwideMaLoading) ? (
              <Spinner message="Loading payer listing..." />
            ) : errorDates ? (
              <div className={styles.errorPanel}>
                <h3>Publish dates unavailable</h3>
                <p>{errorDates}</p>
              </div>
            ) : (hasCoordinates ? maError : nationwideMaError) ? (
              <div className={styles.errorPanel}>
                <h3>Payer data unavailable</h3>
                <p>{hasCoordinates ? maError : nationwideMaError}</p>
              </div>
            ) : parentOrgSummary.length === 0 ? (
              <div className={styles.emptyState}>
                <h2>No payer data available</h2>
                <p>We could not find enrollment results for this market.</p>
              </div>
            ) : (
              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h3>Payer organizations</h3>
                  <p>Enrollment totals by parent organization within the selected market.</p>
                </div>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Parent organization</th>
                        <th>Enrollment</th>
                        <th>Plans</th>
                        <th>Counties</th>
                        <th>States</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parentOrgSummary.map((entry) => (
                        <tr key={entry.parentOrg}>
                          <td>
                            <button
                              type="button"
                              className={styles.linkButton}
                              onClick={() => {
                                setSelectedParentOrg(entry.parentOrg);
                                navigate('/app/enrollment/payer');
                              }}
                            >
                              {entry.parentOrg}
                            </button>
                          </td>
                          <td>{formatNumber(entry.totalEnrollment)}</td>
                          <td>{entry.planCount}</td>
                          <td>{entry.counties.size}</td>
                          <td>{entry.states.size}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.panelWrapper}>
            {loadingDates || loadingOrgs || nationwideMaLoading || nationwideTrendLoading ? (
              <Spinner message="Loading payer deep dive..." />
            ) : errorOrgs ? (
              <div className={styles.errorPanel}>
                <h3>Organizations unavailable</h3>
                <p>{errorOrgs}</p>
              </div>
            ) : nationwideMaError ? (
              <div className={styles.errorPanel}>
                <h3>Payer data unavailable</h3>
                <p>{nationwideMaError}</p>
              </div>
            ) : nationwideTrendError ? (
              <div className={styles.errorPanel}>
                <h3>Trend data unavailable</h3>
                <p>{nationwideTrendError}</p>
              </div>
            ) : parentOrgSummary.length === 0 ? (
              <div className={styles.emptyState}>
                <h2>No payer data available</h2>
                <p>No data available for this payer.</p>
              </div>
            ) : !selectedParentEntry ? (
              <div className={styles.emptyState}>
                <h2>Select a payer</h2>
                <p>Choose a parent organization from the listing to explore its footprint.</p>
              </div>
            ) : (
              <div className={styles.deepDiveLayout}>
                <div className={styles.deepDiveHeader}>
                  <div>
                    <h3>{selectedParentEntry.parentOrg}</h3>
                    <p>Nationwide enrollment footprint and trend.</p>
                  </div>
                  <div className={styles.deepDiveSelector}>
                    <label htmlFor="parent-org-select">Parent organization</label>
                    <select
                      id="parent-org-select"
                      value={selectedParentOrg}
                      onChange={(e) => setSelectedParentOrg(e.target.value)}
                    >
                      {parentOrgSummary.map((entry) => (
                        <option key={entry.parentOrg} value={entry.parentOrg}>
                          {entry.parentOrg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.deepDiveGrid}>
                  <div className={styles.deepDiveCard}>
                    <div className={styles.cardTitle}>Enrollment summary</div>
                    <div className={styles.summaryGrid}>
                      <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Total enrollment</span>
                        <span className={styles.metricValue}>{formatNumber(selectedParentEntry.totalEnrollment)}</span>
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Plans</span>
                        <span className={styles.metricValue}>{selectedParentEntry.planCount}</span>
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Counties</span>
                        <span className={styles.metricValue}>{selectedParentEntry.counties.size}</span>
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>States</span>
                        <span className={styles.metricValue}>{selectedParentEntry.states.size}</span>
                      </div>
                      {growthMetrics && (
                        <div className={styles.metricCardWide}>
                          <div className={styles.metricRow}>
                            <span className={styles.metricLabel}>Growth</span>
                            <span className={styles.metricValue}>
                              {formatNumber(growthMetrics.absolute)}
                              {typeof growthMetrics.percentage === 'number' && (
                                <span className={styles.metricDelta}>
                                  {growthMetrics.percentage >= 0 ? '+' : ''}{growthMetrics.percentage.toFixed(1)}%
                                </span>
                              )}
                            </span>
                          </div>
                          <div className={styles.metricSubline}>
                            {growthMetrics.start.publishDate} → {growthMetrics.end.publishDate}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.deepDiveCard}>
                    <div className={styles.cardTitle}>Top plans</div>
                    {selectedParentEntry.plans.length === 0 ? (
                      <div className={styles.emptyInline}>No plan detail available.</div>
                    ) : (
                      <div className={styles.planTableWrapper}>
                        <table className={styles.planTable}>
                          <thead>
                            <tr>
                              <th>Plan name</th>
                              <th>Contract</th>
                              <th>Type</th>
                              <th className={styles.enrollmentColumn}>Enrollment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedParentEntry.plans.slice(0, 10).map((plan) => (
                              <tr key={plan.plan_id || plan.plan_name}>
                                <td className={styles.planNameCell}>{plan.plan_name || 'Unnamed Plan'}</td>
                                <td className={styles.planContractCell}>{plan.contract_name || 'Unspecified'}</td>
                                <td className={styles.planTypeCell}>
                                  {plan.snp_type ? (
                                    <span className={styles.planTag}>{plan.snp_type}</span>
                                  ) : (
                                    <span className={styles.planTypeEmpty}>—</span>
                                  )}
                                </td>
                                <td className={styles.planEnrollmentCell}>{formatNumber(plan.enrollment)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className={styles.deepDiveCardFull}>
                    <div className={styles.cardTitle}>Enrollment trend</div>
                    {parentOrgTrend.length === 0 ? (
                      <div className={styles.emptyInline}>No trend data available for this payer and timeframe.</div>
                    ) : (
                      <div className={styles.trendChart}>
                        <ResponsiveContainer width="100%" height={400}>
                          <AreaChart data={parentOrgTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <defs>
                              <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="publishDate" 
                              tickFormatter={(value) => value.slice(0, 7)}
                              tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            <YAxis 
                              tickFormatter={(value) => formatNumber(value)} 
                              width={100}
                              tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            <Tooltip
                              formatter={(value) => formatNumber(value)}
                              labelFormatter={(label) => `Date: ${label}`}
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '12px'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="enrollment" 
                              stroke="#0f766e" 
                              strokeWidth={3}
                              fill="url(#enrollmentGradient)"
                              dot={{ fill: '#0f766e', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

