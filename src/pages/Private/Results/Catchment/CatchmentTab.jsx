import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Target, MapPin, Users, TrendingUp, Calendar, Filter, Building2, Navigation } from 'lucide-react';
import { apiUrl } from '../../../../utils/api';
import Spinner from '../../../../components/Buttons/Spinner';
import Banner from '../../../../components/Buttons/Banner';
import { useProviderAnalysis } from '../../../../components/Context/ProviderAnalysisContext';
import styles from './CatchmentTab.module.css';

export default function CatchmentTab({ providerInfo, marketInfo }) {
  const { dhc, marketId } = useParams();
  const [catchmentData, setCatchmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [analysisType, setAnalysisType] = useState('hospitals_to_zip'); // 'hospitals_to_zip', 'zip_to_hospitals', or 'hospitals_grouped'

  const isProviderMode = !!dhc;
  const isMarketMode = !!marketId;
  const contextInfo = isProviderMode ? providerInfo : marketInfo;
  
  // Get all CCNs, zip codes, and provider data from the provider analysis context
  const { getAllCcns, zipCodes, providers, ccns } = useProviderAnalysis();

  useEffect(() => {
    if (!contextInfo) return;

    console.log('🔍 ContextInfo:', contextInfo);
    console.log('🔍 Provider mode:', isProviderMode);
    console.log('🔍 Market mode:', isMarketMode);
    console.log('🔍 Analysis type:', analysisType);

    async function fetchCatchmentData() {
      setLoading(true);
      setError(null);

      try {
        if (analysisType === 'hospitals_to_zip') {
          // Way 1: Look at hospitals inside predefined market and see which zip codes appear
          const allCcns = getAllCcns();
          console.log('🔍 Using all CCNs from context:', allCcns);
          console.log('🔍 Total CCNs available:', allCcns.length);

          const response = await fetch(apiUrl("/api/catchment-data"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ccn: allCcns,
              marketId: isMarketMode ? marketId : null,
              filters
            })
          });

          const result = await response.json();
          
          if (result.success) {
            setCatchmentData(result.data);
          } else {
            setError(result.message || 'Failed to fetch catchment data');
          }
        } else if (analysisType === 'zip_to_hospitals') {
          // Way 2: Look at zip codes within geography and find hospitals they visit
          if (!zipCodes || zipCodes.length === 0) {
            setError('ZIP codes are not available. Please ensure the analysis has completed loading.');
            return;
          }

          console.log('🔍 Using prefetched ZIP codes:', {
            zipCodesCount: zipCodes.length,
            zipCodesSample: zipCodes.slice(0, 3)
          });

          // Extract zip codes for Hospital Service Area analysis
          const zipCodeStrings = zipCodes.map(row => row.zip_code);
          console.log(`🔍 Extracted ${zipCodeStrings.length} ZIP codes for Hospital Service Area analysis`);

          // Query the Hospital Service Area dataset for these zip codes
          const datasetId = "8708ca8b-8636-44ed-8303-724cbfaf78ad"; // Use the same dataset ID
          let hospitalData = [];

          if (zipCodeStrings.length > 0) {
            // Process zip codes in batches for the CMS API
            const batchSize = 25;
            let allHospitalData = [];
            
            for (let i = 0; i < zipCodeStrings.length; i += batchSize) {
              const batch = zipCodeStrings.slice(i, i + batchSize);
              console.log(`🔍 Processing ZIP code batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(zipCodeStrings.length/batchSize)} with ${batch.length} ZIP codes`);
              
              // Use CMS API filter for zip codes
              const zipFilters = batch.map(zip => `filter[condition][value][]=${zip}`).join('&');
              const apiUrl = `https://data.cms.gov/data-api/v1/dataset/${datasetId}/data?filter[condition][path]=ZIP_CD_OF_RESIDENCE&filter[condition][operator]=IN&${zipFilters}&limit=0`;
              
              console.log(`🔍 Fetching hospital data for ZIP codes: ${apiUrl.substring(0, 100)}...`);
              
              const response = await fetch(apiUrl);
              if (!response.ok) {
                console.warn(`⚠️ Failed to fetch data for batch ${Math.floor(i/batchSize) + 1}: ${response.status}`);
                continue;
              }
              
              const batchData = await response.json();
              console.log(`📊 Received ${batchData.length} hospital records from batch ${Math.floor(i/batchSize) + 1}`);
              
              allHospitalData = allHospitalData.concat(batchData);
            }
            
            hospitalData = allHospitalData;
            console.log(`📊 Total hospital records received: ${hospitalData.length}`);
          }

          // Filter out suppressed data
          const filteredHospitalData = hospitalData.filter(row => 
            row.TOTAL_CASES !== "*" && 
            row.TOTAL_DAYS_OF_CARE !== "*" && 
            row.TOTAL_CHARGES !== "*"
          );

          console.log(`✅ Returning ${filteredHospitalData.length} filtered hospital records for ${zipCodeStrings.length} ZIP codes`);

          // Create the data structure expected by the UI
          const result = {
            success: true,
            data: {
              zipCodes: zipCodes,
              hospitalData: filteredHospitalData,
              summary: {
                totalZipCodes: zipCodeStrings.length,
                totalHospitalRecords: filteredHospitalData.length,
                totalCases: filteredHospitalData.reduce((sum, row) => sum + (parseInt(row.TOTAL_CASES) || 0), 0),
                totalDays: filteredHospitalData.reduce((sum, row) => sum + (parseInt(row.TOTAL_DAYS_OF_CARE) || 0), 0),
                totalCharges: filteredHospitalData.reduce((sum, row) => sum + (parseInt(row.TOTAL_CHARGES) || 0), 0)
              }
            }
          };
          
          setCatchmentData(result.data);
        } else if (analysisType === 'hospitals_grouped') {
          // Way 3: Group hospitals and aggregate their data (uses same data as zip_to_hospitals)
          if (!zipCodes || zipCodes.length === 0) {
            setError('ZIP codes are not available. Please ensure the analysis has completed loading.');
            return;
          }

          console.log('🔍 Using prefetched ZIP codes for grouped analysis:', {
            zipCodesCount: zipCodes.length,
            zipCodesSample: zipCodes.slice(0, 3)
          });

          // Extract zip codes for Hospital Service Area analysis
          const zipCodeStrings = zipCodes.map(row => row.zip_code);
          console.log(`🔍 Extracted ${zipCodeStrings.length} ZIP codes for grouped hospital analysis`);

          // Query the Hospital Service Area dataset for these zip codes
          const datasetId = "8708ca8b-8636-44ed-8303-724cbfaf78ad";
          let hospitalData = [];

          if (zipCodeStrings.length > 0) {
            // Process zip codes in batches for the CMS API
            const batchSize = 25;
            let allHospitalData = [];
            
            for (let i = 0; i < zipCodeStrings.length; i += batchSize) {
              const batch = zipCodeStrings.slice(i, i + batchSize);
              console.log(`🔍 Processing ZIP code batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(zipCodeStrings.length/batchSize)} with ${batch.length} ZIP codes`);
              
              // Use CMS API filter for zip codes
              const zipFilters = batch.map(zip => `filter[condition][value][]=${zip}`).join('&');
              const apiUrl = `https://data.cms.gov/data-api/v1/dataset/${datasetId}/data?filter[condition][path]=ZIP_CD_OF_RESIDENCE&filter[condition][operator]=IN&${zipFilters}&limit=0`;
              
              const response = await fetch(apiUrl);
              if (!response.ok) {
                console.warn(`⚠️ Failed to fetch data for batch ${Math.floor(i/batchSize) + 1}: ${response.status}`);
                continue;
              }
              
              const batchData = await response.json();
              allHospitalData = allHospitalData.concat(batchData);
            }
            
            hospitalData = allHospitalData;
            console.log(`📊 Total hospital records received for grouping: ${hospitalData.length}`);
          }

          // Filter out suppressed data
          const filteredHospitalData = hospitalData.filter(row => 
            row.TOTAL_CASES !== "*" && 
            row.TOTAL_DAYS_OF_CARE !== "*" && 
            row.TOTAL_CHARGES !== "*"
          );

          // Group by hospital (CCN) and aggregate data
          const groupedData = {};
          filteredHospitalData.forEach(row => {
            const ccn = row.MEDICARE_PROV_NUM;
            if (!groupedData[ccn]) {
              groupedData[ccn] = {
                MEDICARE_PROV_NUM: ccn,
                TOTAL_CASES: 0,
                TOTAL_DAYS_OF_CARE: 0,
                TOTAL_CHARGES: 0
              };
            }
            groupedData[ccn].TOTAL_CASES += parseInt(row.TOTAL_CASES) || 0;
            groupedData[ccn].TOTAL_DAYS_OF_CARE += parseInt(row.TOTAL_DAYS_OF_CARE) || 0;
            groupedData[ccn].TOTAL_CHARGES += parseInt(row.TOTAL_CHARGES) || 0;
          });

          const groupedHospitalData = Object.values(groupedData);
          console.log(`✅ Grouped into ${groupedHospitalData.length} hospitals`);

          // Create the data structure expected by the UI
          const result = {
            success: true,
            data: {
              zipCodes: zipCodes,
              hospitalData: groupedHospitalData,
              summary: {
                totalZipCodes: zipCodeStrings.length,
                totalHospitalRecords: groupedHospitalData.length,
                totalCases: groupedHospitalData.reduce((sum, row) => sum + (parseInt(row.TOTAL_CASES) || 0), 0),
                totalDays: groupedHospitalData.reduce((sum, row) => sum + (parseInt(row.TOTAL_DAYS_OF_CARE) || 0), 0),
                totalCharges: groupedHospitalData.reduce((sum, row) => sum + (parseInt(row.TOTAL_CHARGES) || 0), 0)
              }
            }
          };
          
          setCatchmentData(result.data);
        }
      } catch (err) {
        console.error('Error fetching catchment data:', err);
        setError('Failed to fetch catchment data');
      } finally {
        setLoading(false);
      }
    }

    fetchCatchmentData();
  }, [contextInfo, filters, isProviderMode, isMarketMode, marketId, getAllCcns, analysisType, zipCodes, ccns, providers]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Helper function to get provider name from CCN
  const getProviderNameFromCcn = (ccn) => {
    if (!ccns || !providers) return ccn;
    
    // Find the DHC that corresponds to this CCN
    const ccnRow = ccns.find(row => row.ccn === ccn);
    if (!ccnRow) return ccn;
    
    // Find the provider that corresponds to this DHC
    const provider = providers.find(p => p.dhc === ccnRow.dhc);
    if (!provider) return ccn;
    
    return provider.name || ccn;
  };

  if (loading) {
    return (
      <>
        <Banner 
          title="Hospital Service Area Analysis"
          description="Geographic distribution of patient discharges, days of care, and charges"
          icon={Target}
        />
        <div className={styles.loadingContainer}>
          <Spinner />
          <p>Loading catchment data...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Banner 
          title="Hospital Service Area Analysis"
          description="Geographic distribution of patient discharges, days of care, and charges"
          icon={Target}
        />
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Banner 
        title="Hospital Service Area Analysis"
        description="Geographic distribution of patient discharges, days of care, and charges"
        icon={Target}
      />

      <div className={styles.analysisToggle}>
            <div className={styles.toggleContainer}>
              <button
                className={`${styles.toggleButton} ${analysisType === 'hospitals_to_zip' ? styles.active : ''}`}
                onClick={() => setAnalysisType('hospitals_to_zip')}
              >
                <Building2 size={16} />
                Hospitals → ZIP Codes
              </button>
              <button
                className={`${styles.toggleButton} ${analysisType === 'zip_to_hospitals' ? styles.active : ''}`}
                onClick={() => setAnalysisType('zip_to_hospitals')}
              >
                <Navigation size={16} />
                ZIP Codes → Hospitals
              </button>
              <button
                className={`${styles.toggleButton} ${analysisType === 'hospitals_grouped' ? styles.active : ''}`}
                onClick={() => setAnalysisType('hospitals_grouped')}
              >
                <Users size={16} />
                Hospitals Grouped
              </button>
            </div>
        <p className={styles.toggleDescription}>
          {analysisType === 'hospitals_to_zip' 
            ? 'Analyze which ZIP codes patients come from for hospitals in your market'
            : analysisType === 'zip_to_hospitals'
            ? 'Analyze which hospitals patients visit from ZIP codes in your geographic area'
            : 'Group hospitals and aggregate their total patient volume and charges'
          }
        </p>
      </div>

      {catchmentData && (
        <div className={styles.content}>
          <div className={styles.summary}>
            {analysisType === 'hospitals_to_zip' ? (
              <>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <MapPin size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Service Areas</h3>
                    <p>{Array.isArray(catchmentData) ? catchmentData.length : 0} ZIP codes</p>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <Users size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Total Cases</h3>
                    <p>{Array.isArray(catchmentData) ? catchmentData.reduce((sum, row) => sum + (parseInt(row.TOTAL_CASES) || 0), 0).toLocaleString() : 0}</p>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <Calendar size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Total Days</h3>
                    <p>{Array.isArray(catchmentData) ? catchmentData.reduce((sum, row) => sum + (parseInt(row.TOTAL_DAYS_OF_CARE) || 0), 0).toLocaleString() : 0}</p>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <TrendingUp size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Total Charges</h3>
                    <p>${Array.isArray(catchmentData) ? catchmentData.reduce((sum, row) => sum + (parseInt(row.TOTAL_CHARGES) || 0), 0).toLocaleString() : 0}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <MapPin size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>ZIP Codes</h3>
                    <p>{catchmentData.summary?.totalZipCodes || 0} in area</p>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <Building2 size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Hospital Records</h3>
                    <p>{catchmentData.summary?.totalHospitalRecords || 0} records</p>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <Users size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Total Cases</h3>
                    <p>{catchmentData.summary?.totalCases?.toLocaleString() || 0}</p>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <TrendingUp size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Total Charges</h3>
                    <p>${catchmentData.summary?.totalCharges?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={styles.tableContainer}>
            {analysisType === 'hospitals_to_zip' ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ZIP Code</th>
                    <th>Hospital</th>
                    <th>Total Cases</th>
                    <th>Total Charges</th>
                    <th>Avg Days per Case</th>
                    <th>Avg Charge per Case</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(catchmentData) && catchmentData
                    .sort((a, b) => {
                      const casesA = parseInt(a.TOTAL_CASES) || 0;
                      const casesB = parseInt(b.TOTAL_CASES) || 0;
                      return casesB - casesA; // Descending order
                    })
                    .map((row, index) => {
                    const cases = parseInt(row.TOTAL_CASES) || 0;
                    const days = parseInt(row.TOTAL_DAYS_OF_CARE) || 0;
                    const charges = parseInt(row.TOTAL_CHARGES) || 0;
                    const avgDays = cases > 0 ? (days / cases).toFixed(1) : '0';
                    const avgCharges = cases > 0 ? (charges / cases).toFixed(0) : '0';
                    const providerName = getProviderNameFromCcn(row.MEDICARE_PROV_NUM);

                    return (
                      <tr key={index}>
                        <td>{row.ZIP_CD_OF_RESIDENCE}</td>
                        <td className={styles.hospitalInfo}>
                          <div className={styles.hospitalName}>{providerName}</div>
                          <div className={styles.hospitalDetails}>
                            {(() => {
                              const provider = providers.find(p => ccns.find(c => c.ccn === row.MEDICARE_PROV_NUM && c.dhc === p.dhc));
                              return provider ? (
                                <div className={styles.location}>
                                  {provider.city}, {provider.state} ({row.MEDICARE_PROV_NUM})
                                </div>
                              ) : (
                                <div className={styles.location}>
                                  CCN: {row.MEDICARE_PROV_NUM}
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                        <td>{cases.toLocaleString()}</td>
                        <td>${charges.toLocaleString()}</td>
                        <td>{avgDays}</td>
                        <td>${parseInt(avgCharges).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : analysisType === 'zip_to_hospitals' ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ZIP Code</th>
                    <th>Hospital</th>
                    <th>Total Cases</th>
                    <th>Total Charges</th>
                    <th>Avg Days per Case</th>
                    <th>Avg Charge per Case</th>
                  </tr>
                </thead>
                <tbody>
                  {catchmentData.hospitalData
                    ?.sort((a, b) => {
                      const casesA = parseInt(a.TOTAL_CASES) || 0;
                      const casesB = parseInt(b.TOTAL_CASES) || 0;
                      return casesB - casesA; // Descending order
                    })
                    ?.map((row, index) => {
                    const cases = parseInt(row.TOTAL_CASES) || 0;
                    const days = parseInt(row.TOTAL_DAYS_OF_CARE) || 0;
                    const charges = parseInt(row.TOTAL_CHARGES) || 0;
                    const avgDays = cases > 0 ? (days / cases).toFixed(1) : '0';
                    const avgCharges = cases > 0 ? (charges / cases).toFixed(0) : '0';
                    const providerName = getProviderNameFromCcn(row.MEDICARE_PROV_NUM);

                    return (
                      <tr key={index}>
                        <td>{row.ZIP_CD_OF_RESIDENCE}</td>
                        <td className={styles.hospitalInfo}>
                          <div className={styles.hospitalName}>{providerName}</div>
                          <div className={styles.hospitalDetails}>
                            {(() => {
                              const provider = providers.find(p => ccns.find(c => c.ccn === row.MEDICARE_PROV_NUM && c.dhc === p.dhc));
                              return provider ? (
                                <div className={styles.location}>
                                  {provider.city}, {provider.state} ({row.MEDICARE_PROV_NUM})
                                </div>
                              ) : (
                                <div className={styles.location}>
                                  CCN: {row.MEDICARE_PROV_NUM}
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                        <td>{cases.toLocaleString()}</td>
                        <td>${charges.toLocaleString()}</td>
                        <td>{avgDays}</td>
                        <td>${parseInt(avgCharges).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Hospital</th>
                    <th>Total Cases</th>
                    <th>Total Charges</th>
                    <th>Avg Days per Case</th>
                    <th>Avg Charge per Case</th>
                  </tr>
                </thead>
                <tbody>
                  {catchmentData.hospitalData
                    ?.sort((a, b) => {
                      const casesA = parseInt(a.TOTAL_CASES) || 0;
                      const casesB = parseInt(b.TOTAL_CASES) || 0;
                      return casesB - casesA; // Descending order
                    })
                    ?.map((row, index) => {
                    const cases = parseInt(row.TOTAL_CASES) || 0;
                    const days = parseInt(row.TOTAL_DAYS_OF_CARE) || 0;
                    const charges = parseInt(row.TOTAL_CHARGES) || 0;
                    const avgDays = cases > 0 ? (days / cases).toFixed(1) : '0';
                    const avgCharges = cases > 0 ? (charges / cases).toFixed(0) : '0';
                    const providerName = getProviderNameFromCcn(row.MEDICARE_PROV_NUM);

                    return (
                      <tr key={index}>
                        <td className={styles.hospitalInfo}>
                          <div className={styles.hospitalName}>{providerName}</div>
                          <div className={styles.hospitalDetails}>
                            {(() => {
                              const provider = providers.find(p => ccns.find(c => c.ccn === row.MEDICARE_PROV_NUM && c.dhc === p.dhc));
                              return provider ? (
                                <div className={styles.location}>
                                  {provider.city}, {provider.state} ({row.MEDICARE_PROV_NUM})
                                </div>
                              ) : (
                                <div className={styles.location}>
                                  CCN: {row.MEDICARE_PROV_NUM}
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                        <td>{cases.toLocaleString()}</td>
                        <td>${charges.toLocaleString()}</td>
                        <td>{avgDays}</td>
                        <td>${parseInt(avgCharges).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  );
}
