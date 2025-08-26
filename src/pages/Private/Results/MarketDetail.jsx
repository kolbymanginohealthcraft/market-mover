import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  useParams,
  useNavigate,
  Routes,
  Route,
  Navigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import styles from "./ProviderDetail.module.css";
import { Pencil, Check, X } from "lucide-react";
import { useDebounce } from 'use-debounce';
import { apiUrl } from '../../../utils/api';
import { trackProviderView, trackActivity, ACTIVITY_TYPES } from '../../../utils/activityTracker';
import { supabase } from '../../../app/supabaseClient';

import useMarketAnalysis from "../../../hooks/useMarketAnalysis";
import useQualityMeasures from "../../../hooks/useQualityMeasures";

import MarketOverview from "../Markets/MarketOverview";
import ProviderListingTab from "./Providers/ProviderListingTab";
import ChartsTab from "./Storyteller/ChartDashboard";
import DiagnosesTab from "./Claims/DiagnosesTab";
import ProceduresTab from "./Claims/ProceduresTab";
import ClaimsTab from "./Claims/ClaimsTab";
import PopulationTab from "./Population/PopulationTab";
import ReferralsTab from "./Claims/ReferralsTab";
import CMSEnrollmentTab from "./Enrollment/CMSEnrollmentTab";
import ProviderDensityPage from "./Providers/ProviderDensityPage";

import Spinner from "../../../components/Buttons/Spinner";
import DetailedLoadingSpinner from "../../../components/Buttons/DetailedLoadingSpinner";
import Storyteller from "./Storyteller/Storyteller";
import PageLayout from "../../../components/Layouts/PageLayout";

export default function MarketDetail() {
  const { marketId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  


  // Market data state
  const [market, setMarket] = useState(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState(null);

  const radiusFromUrl = Number(searchParams.get("radius"));
  const [radiusInMiles, setRadiusInMiles] = useState(radiusFromUrl || 10);
  const [debouncedRadius] = useDebounce(radiusInMiles, 500);

  // Debug radius changes
  useEffect(() => {
    console.log('🔄 Radius state changed:', {
      radiusInMiles,
      debouncedRadius,
      radiusFromUrl,
      marketRadius: market?.radius_miles
    });
  }, [radiusInMiles, debouncedRadius, radiusFromUrl, market?.radius_miles]);

  // Update radius when URL parameter changes or when market data loads
  useEffect(() => {
    const newRadius = radiusFromUrl || market?.radius_miles || 10;
    console.log('🔄 MarketDetail radius update:', {
      radiusFromUrl,
      marketRadius: market?.radius_miles,
      currentRadius: radiusInMiles,
      newRadius,
      willUpdate: newRadius !== radiusInMiles
    });
    if (newRadius !== radiusInMiles) {
      setRadiusInMiles(newRadius);
    }
  }, [searchParams, market?.radius_miles]);

  // Fetch market data
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        setMarketLoading(true);
        setMarketError(null);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('User not authenticated');
        }

        const { data: marketData, error: marketError } = await supabase
          .from('markets')
          .select('*')
          .eq('id', marketId)
          .eq('user_id', user.id)
          .single();

        if (marketError) {
          throw new Error('Market not found');
        }

        console.log('📊 Market data loaded:', {
          marketId,
          name: marketData.name,
          savedRadius: marketData.radius_miles,
          latitude: marketData.latitude,
          longitude: marketData.longitude
        });

        setMarket(marketData);
      } catch (err) {
        console.error('Error fetching market data:', err);
        setMarketError(err.message);
      } finally {
        setMarketLoading(false);
      }
    };

    if (marketId) {
      fetchMarket();
    }
  }, [marketId]);

  // Track market view activity (only once per market per session)
  useEffect(() => {
    if (market && !marketLoading) {
      // Don't track if coming from activity panel
      const urlParams = new URLSearchParams(window.location.search);
      const fromActivity = urlParams.get('fromActivity');
      
      if (fromActivity) {
        // Remove the parameter from URL without triggering a page reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        return;
      }
      
      const viewedMarkets = JSON.parse(sessionStorage.getItem('viewedMarkets') || '[]');
      const marketKey = `${market.id}`;
      
      if (!viewedMarkets.includes(marketKey)) {
        trackActivity(ACTIVITY_TYPES.VIEW_MARKET, market.id, market.name, { radius: market.radius_miles });
        viewedMarkets.push(marketKey);
        sessionStorage.setItem('viewedMarkets', JSON.stringify(viewedMarkets));
      }
    }
  }, [market, marketLoading]);



  // Create a mock provider object for the market center point
  const marketProvider = useMemo(() => {
    return market ? {
      dhc: `market-${marketId}`,
      name: market.name,
      latitude: market.latitude,
      longitude: market.longitude,
      city: market.city,
      state: market.state,
      type: 'Market Center',
      network: 'Market Analysis'
    } : null;
  }, [market, marketId]);

  // Market analysis hook - unified data source
  const {
    providers: nearbyProviders,
    ccns: nearbyDhcCcns,
    npis: nearbyNpis,
    censusData,
    counties,
    censusTracts,
    qualityMeasuresDates,
    loading: marketAnalysisLoading,
    providersLoading,
    ccnsLoading,
    npisLoading,
    censusLoading,
    qualityMeasuresDatesLoading,
    error: marketAnalysisError,
    providersError,
    ccnsError,
    npisError,
    censusError,
    qualityMeasuresDatesError,
    getAllNpis,
    getProviderDhcToCcns,
    getProviderDhcToNpis
  } = useMarketAnalysis(
    market ? {
      latitude: market.latitude,
      longitude: market.longitude,
      dhc: `market-${marketId}`
    } : null,
    debouncedRadius,
    'market'
  );

  // Debug: Log route changes (moved after market analysis hook)
  useEffect(() => {
    console.log('🔄 MarketDetail route changed:', {
      pathname: location.pathname,
      marketId,
      market: market?.name,
      shouldFetchQualityMeasures: location.pathname.includes('/storyteller'),
      nearbyProvidersCount: nearbyProviders?.length || 0,
      nearbyDhcCcnsCount: nearbyDhcCcns?.length || 0
    });
  }, [location.pathname, marketId, market?.name, nearbyProviders, nearbyDhcCcns]);

  // Quality measures hook - always fetch when on storyteller route
  const shouldFetchQualityMeasures = location.pathname.includes('/storyteller');
  const { 
    matrixLoading: qualityLoading,
    matrixMeasures: qualityMeasures,
    matrixData: qualityData,
    matrixMarketAverages: qualityMarketAverages,
    matrixNationalAverages: qualityNationalAverages,
    matrixError: qualityError,
    allMatrixProviders: qualityProviders,
    availableProviderTypes: qualityProviderTypes,
    availablePublishDates: qualityPublishDates,
    currentPublishDate: qualityCurrentDate
  } = useQualityMeasures(
    shouldFetchQualityMeasures && marketProvider ? marketProvider : null, 
    shouldFetchQualityMeasures && nearbyProviders ? nearbyProviders : [], 
    shouldFetchQualityMeasures && nearbyDhcCcns ? nearbyDhcCcns : []
  );

  // Loading state
  if (marketLoading || marketAnalysisLoading) {
    const loadingStates = {
      market: marketLoading,
      nearbyProviders: providersLoading,
      ccns: ccnsLoading,
      npis: npisLoading,
      censusData: censusLoading,
      qualityMeasures: qualityLoading
    };
    
    return (
      <PageLayout>
        <div className={styles.loading}>
          <DetailedLoadingSpinner 
            message="Loading market analysis..." 
            loadingStates={loadingStates}
            showProgress={true}
          />
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (marketError || !market) {
    return (
      <PageLayout>
        <div className={styles.error}>
          <h2>Error Loading Market</h2>
          <p>{marketError || 'Market not found'}</p>
          <button onClick={() => navigate('/app/markets')}>
            Back to Markets
          </button>
        </div>
      </PageLayout>
    );
  }



  // For all routes, render normally inside PageLayout
  return (
    <PageLayout>
      <Routes key={location.pathname}>
        <Route path="overview" element={<MarketOverview key={`overview-${marketId}`} market={market} providers={nearbyProviders} />} />
        <Route path="provider-listing" element={<ProviderListingTab provider={marketProvider} radiusInMiles={radiusInMiles} providers={nearbyProviders} />} />
        <Route path="provider-density" element={<ProviderDensityPage key={`provider-density-${marketId}`} radius={radiusInMiles} latitude={market?.latitude} longitude={market?.longitude} provider={marketProvider} />} />
        <Route path="population" element={<PopulationTab key={`population-${marketId}`} provider={marketProvider} radiusInMiles={radiusInMiles} censusData={censusData} counties={counties} censusTracts={censusTracts} />} />
        <Route path="claims" element={<ClaimsTab key={`claims-${marketId}`} provider={marketProvider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />} />
        <Route path="cms-enrollment" element={<CMSEnrollmentTab key={`cms-enrollment-${marketId}`} provider={marketProvider} radiusInMiles={radiusInMiles} />} />
        <Route path="storyteller/*" element={<Storyteller 
          key={`storyteller-${marketId}`}
          provider={marketProvider}
          radiusInMiles={radiusInMiles}
          nearbyProviders={nearbyProviders}
          nearbyDhcCcns={nearbyDhcCcns}
          mainProviderCcns={getProviderDhcToCcns(marketProvider?.dhc) || []}
          prefetchedData={{
            loading: qualityLoading,
            measures: qualityMeasures,
            data: qualityData,
            marketAverages: qualityMarketAverages,
            nationalAverages: qualityNationalAverages,
            error: qualityError,
            allProviders: qualityProviders,
            providerTypes: qualityProviderTypes,
            publishDates: qualityPublishDates,
            currentDate: qualityCurrentDate,
            qualityMeasuresDates
          }}
        />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </PageLayout>
  );
}
