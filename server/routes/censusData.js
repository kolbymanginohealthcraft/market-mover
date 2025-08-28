import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";
import fetch from 'node-fetch';
import * as turf from '@turf/turf';

const router = express.Router();

/**
 * GET /api/census-data/county-names
 * 
 * Query params:
 *   - stateFips: State FIPS code (required)
 *   - countyFips: Specific county FIPS codes (optional, multiple allowed)
 * 
 * Returns: County names for the specified state and counties
 */
router.get("/census-data/county-names", async (req, res) => {
  const { stateFips, countyFips } = req.query;

  if (!stateFips) {
    return res.status(400).json({
      success: false,
      error: "stateFips is required"
    });
  }

  try {
    // Handle multiple countyFips parameters
    const countyFipsList = Array.isArray(countyFips) ? countyFips : countyFips ? [countyFips] : null;
    
    // Completely disable cache for testing
    console.log('🔍 Cache completely disabled - forcing fresh query for countyFipsList:', countyFipsList);

    let query, params;
    
    if (countyFipsList && countyFipsList.length > 0) {
      // Query for specific counties only
      const countyConditions = countyFipsList.map((_, index) => `county_fips_code = @county${index}`).join(' OR ');
      query = `
        SELECT 
          county_fips_code,
          area_name
        FROM \`bigquery-public-data.census_utility.fips_codes_all\`
        WHERE state_fips_code = @stateFips
          AND summary_level = '050'
          AND (${countyConditions})
        ORDER BY area_name
      `;
      
      params = { stateFips };
      countyFipsList.forEach((countyFips, index) => {
        // Construct full county FIPS code (state + county)
        params[`county${index}`] = `${stateFips}${countyFips.padStart(3, '0')}`;
      });
    } else {
      // Query for all counties in the state
      query = `
        SELECT 
          county_fips_code,
          area_name
        FROM \`bigquery-public-data.census_utility.fips_codes_all\`
        WHERE state_fips_code = @stateFips
          AND summary_level = '050'
          AND county_fips_code LIKE CONCAT(@stateFips, '%')
        ORDER BY area_name
      `;
      params = { stateFips };
    }

    console.log('🔍 County names query params:', params);
    const [rows] = await myBigQuery.query({
      query,
      location: "US",
      params
    });
    console.log('🔍 County names query results:', rows.length, 'rows');

    const countyNames = {};
    rows.forEach(row => {
      countyNames[row.county_fips_code] = row.area_name;
    });

    // Cache disabled for testing
    console.log('🔍 Skipping cache set - cache disabled for testing');

    res.status(200).json({
      success: true,
      data: countyNames
    });

  } catch (err) {
    console.error("❌ County names query error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/census-acs-api
 * Query params:
 *   - lat: Latitude of market center (required)
 *   - lon: Longitude of market center (required)
 *   - radius: Radius in miles (required)
 *   - year: ACS year (defaults to 2023)
 * Returns: Aggregated ACS data for tracts within the radius
 */
// Helper function to fetch national averages
async function getNationalAverages(year) {
  try {
    const NATIONAL_VARS = [
      'B01001_001E', // total pop
      'B19013_001E', // median income
      'B19301_001E', // per capita income
      'B17001_001E', 'B17001_002E', // poverty
      'B27010_001E', 'B27010_017E', // insurance
      'B18101_001E', 'B18101_004E', 'B18101_007E', // disability
      'B15003_001E', 'B15003_022E','B15003_023E','B15003_024E','B15003_025E', // education
      'B25064_001E', 'B25077_001E' // housing
    ].join(',');

    const url = `https://api.census.gov/data/${year}/acs/acs5?get=${NATIONAL_VARS}&for=us:*`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`⚠️ Census API error for national data: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const header = data[0];
    const row = data[1];
    const obj = {};
    header.forEach((h, idx) => { obj[h] = row[idx]; });
    
    // Calculate derived values
    const bachelors = ['B15003_022E','B15003_023E','B15003_024E','B15003_025E']
      .map(k => Number(obj[k]) || 0).reduce((a,b) => a+b, 0);
    
    return {
      total_population: Number(obj['B01001_001E']) || 0,
      median_income: Number(obj['B19013_001E']) || 0,
      per_capita_income: Number(obj['B19301_001E']) || 0,
      poverty_universe: Number(obj['B17001_001E']) || 0,
      below_poverty: Number(obj['B17001_002E']) || 0,
      insurance_universe: Number(obj['B27010_001E']) || 0,
      uninsured: Number(obj['B27010_017E']) || 0,
      disability_universe: Number(obj['B18101_001E']) || 0,
      male_disability: Number(obj['B18101_004E']) || 0,
      female_disability: Number(obj['B18101_007E']) || 0,
      education_universe: Number(obj['B15003_001E']) || 0,
      bachelors_plus: bachelors,
      median_rent: Number(obj['B25064_001E']) || 0,
      median_home_value: Number(obj['B25077_001E']) || 0
    };
  } catch (error) {
    console.error('❌ Error fetching national averages:', error);
    return null;
  }
}

async function getStateAverages(stateFips, year) {
  try {
    const STATE_VARS = [
      'B01001_001E', // total pop
      'B19013_001E', // median income
      'B19301_001E', // per capita income
      'B17001_001E', 'B17001_002E', // poverty
      'B27010_001E', 'B27010_017E', // insurance
      'B18101_001E', 'B18101_004E', 'B18101_007E', // disability
      'B15003_001E', 'B15003_022E','B15003_023E','B15003_024E','B15003_025E', // education
      'B25064_001E', 'B25077_001E' // housing
    ].join(',');

    const url = `https://api.census.gov/data/${year}/acs/acs5?get=${STATE_VARS}&for=state:${stateFips}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`⚠️ Census API error for state data: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const header = data[0];
    const row = data[1];
    const obj = {};
    header.forEach((h, idx) => { obj[h] = row[idx]; });
    
    // Calculate derived values
    const bachelors = ['B15003_022E','B15003_023E','B15003_024E','B15003_025E']
      .map(k => Number(obj[k]) || 0).reduce((a,b) => a+b, 0);
    
    return {
      total_population: Number(obj['B01001_001E']) || 0,
      median_income: Number(obj['B19013_001E']) || 0,
      per_capita_income: Number(obj['B19301_001E']) || 0,
      poverty_universe: Number(obj['B17001_001E']) || 0,
      below_poverty: Number(obj['B17001_002E']) || 0,
      insurance_universe: Number(obj['B27010_001E']) || 0,
      uninsured: Number(obj['B27010_017E']) || 0,
      disability_universe: Number(obj['B18101_001E']) || 0,
      male_disability: Number(obj['B18101_004E']) || 0,
      female_disability: Number(obj['B18101_007E']) || 0,
      education_universe: Number(obj['B15003_001E']) || 0,
      bachelors_plus: bachelors,
      median_rent: Number(obj['B25064_001E']) || 0,
      median_home_value: Number(obj['B25077_001E']) || 0
    };
  } catch (error) {
    console.error('❌ Error fetching state averages:', error);
    return null;
  }
}

async function getCountyAverages(stateFips, countyFips, year) {
  try {
    const COUNTY_VARS = [
      'B01001_001E', // total pop
      'B19013_001E', // median income
      'B19301_001E', // per capita income
      'B17001_001E', 'B17001_002E', // poverty
      'B27010_001E', 'B27010_017E', // insurance
      'B18101_001E', 'B18101_004E', 'B18101_007E', // disability
      'B15003_001E', 'B15003_022E','B15003_023E','B15003_024E','B15003_025E', // education
      'B25064_001E', 'B25077_001E' // housing
    ].join(',');

    const url = `https://api.census.gov/data/${year}/acs/acs5?get=${COUNTY_VARS}&for=county:${countyFips}&in=state:${stateFips}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`⚠️ Census API error for county data: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const header = data[0];
    const row = data[1];
    const obj = {};
    header.forEach((h, idx) => { obj[h] = row[idx]; });
    
    // Calculate derived values
    const bachelors = ['B15003_022E','B15003_023E','B15003_024E','B15003_025E']
      .map(k => Number(obj[k]) || 0).reduce((a,b) => a+b, 0);
    
    return {
      total_population: Number(obj['B01001_001E']) || 0,
      median_income: Number(obj['B19013_001E']) || 0,
      per_capita_income: Number(obj['B19301_001E']) || 0,
      poverty_universe: Number(obj['B17001_001E']) || 0,
      below_poverty: Number(obj['B17001_002E']) || 0,
      insurance_universe: Number(obj['B27010_001E']) || 0,
      uninsured: Number(obj['B27010_017E']) || 0,
      disability_universe: Number(obj['B18101_001E']) || 0,
      male_disability: Number(obj['B18101_004E']) || 0,
      female_disability: Number(obj['B18101_007E']) || 0,
      education_universe: Number(obj['B15003_001E']) || 0,
      bachelors_plus: bachelors,
      median_rent: Number(obj['B25064_001E']) || 0,
      median_home_value: Number(obj['B25077_001E']) || 0
    };
  } catch (error) {
    console.error('❌ Error fetching county averages:', error);
    return null;
  }
}

router.get('/census-acs-api', async (req, res) => {
  const { lat, lon, radius, year = '2023' } = req.query;
  if (!lat || !lon || !radius) {
    return res.status(400).json({ success: false, error: 'lat, lon, and radius are required' });
  }

  // Check cache first
  const cacheKey = `census_acs_${lat}_${lon}_${radius}_${year}`;
  const cachedData = cache.get('census_acs', { lat, lon, radius, year });
  if (cachedData) {
    console.log('📦 Serving census ACS data from cache');
    return res.status(200).json({ success: true, data: cachedData });
  }

  try {
    const radiusMeters = parseFloat(radius) * 1609.34;
    const centerLat = parseFloat(lat);
    const centerLon = parseFloat(lon);

    // 1. Get tracts within radius using BigQuery spatial functions (much faster)
    const bqQuery = `
      SELECT 
        geo_id, 
        state_fips_code, 
        county_fips_code, 
        tract_ce, 
        internal_point_lat AS lat, 
        internal_point_lon AS lon, 
        area_land_meters
      FROM \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\`
      WHERE ST_DISTANCE(
        ST_GEOGPOINT(CAST(internal_point_lon AS FLOAT64), CAST(internal_point_lat AS FLOAT64)),
        ST_GEOGPOINT(@centerLon, @centerLat)
      ) <= @radiusMeters
    `;
    
    const [tractRows] = await myBigQuery.query({ 
      query: bqQuery, 
      location: 'US',
      params: {
        centerLat: Number(centerLat),
        centerLon: Number(centerLon),
        radiusMeters: Number(radiusMeters)
      }
    });

    if (tractRows.length === 0) {
      const emptyResult = { 
        market_totals: { 
          total_population: 0, 
          population_65_plus: 0, 
          median_income: 0, 
          total_tracts: 0, 
          acs_year: year 
        }, 
        geographic_units: [] 
      };
      
      // Cache empty results for a shorter time
      cache.set('census_acs', { lat, lon, radius, year }, emptyResult, 5 * 60 * 1000); // 5 minutes
      return res.status(200).json({ success: true, data: emptyResult });
    }

    // 2. Group by state/county for batch API calls
    const tractsByCounty = {};
    for (const t of tractRows) {
      const key = `${t.state_fips_code}${t.county_fips_code}`;
      if (!tractsByCounty[key]) {
        tractsByCounty[key] = { 
          state: t.state_fips_code, 
          county: t.county_fips_code, 
          tracts: [] 
        };
      }
      tractsByCounty[key].tracts.push(t.tract_ce);
    }

    // 3. Fetch ACS data for each county (with parallel processing)
    const ACS_VARS = [
      'B01001_001E', // total pop
      'B01001_003E','B01001_004E','B01001_005E','B01001_006E', // male under 18
      'B01001_027E','B01001_028E','B01001_029E','B01001_030E', // female under 18
      'B01001_020E','B01001_021E','B01001_022E','B01001_023E','B01001_024E','B01001_025E', // male 65+
      'B01001_044E','B01001_045E','B01001_046E','B01001_047E','B01001_048E','B01001_049E', // female 65+
      'B02001_002E', 'B02001_003E', 'B02001_004E', 'B02001_005E', 'B02001_006E', 'B02001_007E', 'B02001_008E', // race
      'B03003_003E', // Hispanic/Latino
      'B19013_001E', 'B19301_001E', 'B17001_001E', 'B17001_002E', // economic
      'B27010_001E', 'B27010_017E', // insurance
      'B18101_001E', 'B18101_004E', 'B18101_007E', // disability
      'B15003_001E', 'B15003_022E','B15003_023E','B15003_024E','B15003_025E', // education
      'B25064_001E', 'B25077_001E' // housing
    ].join(',');

    // Process counties in parallel (with rate limiting)
    const batchSize = 3; // Process 3 counties at a time to avoid rate limits
    const countyKeys = Object.keys(tractsByCounty);
    let allTractData = [];

    for (let i = 0; i < countyKeys.length; i += batchSize) {
      const batch = countyKeys.slice(i, i + batchSize);
      const batchPromises = batch.map(async (key) => {
        const { state, county, tracts } = tractsByCounty[key];
        const url = `https://api.census.gov/data/${year}/acs/acs5?get=${ACS_VARS}&for=tract:*&in=state:${state}+county:${county}`;
        
        try {
          const resp = await fetch(url);
          if (!resp.ok) {
            console.warn(`⚠️ Census API error for ${state}-${county}: ${resp.status}`);
            return [];
          }
          
          const data = await resp.json();
          const header = data[0];
          const rows = data.slice(1);
          
          return rows
            .filter(row => {
              const obj = {};
              header.forEach((h, idx) => { obj[h] = row[idx]; });
              return tracts.includes(obj['tract']);
            })
            .map(row => {
              const obj = {};
              header.forEach((h, idx) => { obj[h] = row[idx]; });
              
              // Calculate derived values
              const m65 = ['B01001_020E','B01001_021E','B01001_022E','B01001_023E','B01001_024E','B01001_025E']
                .map(k => Number(obj[k]) || 0).reduce((a,b) => a+b, 0);
              const f65 = ['B01001_044E','B01001_045E','B01001_046E','B01001_047E','B01001_048E','B01001_049E']
                .map(k => Number(obj[k]) || 0).reduce((a,b) => a+b, 0);
              const mUnder18 = ['B01001_003E','B01001_004E','B01001_005E','B01001_006E']
                .map(k => Number(obj[k]) || 0).reduce((a,b) => a+b, 0);
              const fUnder18 = ['B01001_027E','B01001_028E','B01001_029E','B01001_030E']
                .map(k => Number(obj[k]) || 0).reduce((a,b) => a+b, 0);
              const bachelors = ['B15003_022E','B15003_023E','B15003_024E','B15003_025E']
                .map(k => Number(obj[k]) || 0).reduce((a,b) => a+b, 0);
              
              // Find tract info
              const tractInfo = tractRows.find(t => t.tract_ce === obj['tract']);
              
              return {
                total_pop: Number(obj['B01001_001E']) || 0,
                pop_65_plus: m65 + f65,
                pop_under_18: mUnder18 + fUnder18,
                white: Number(obj['B02001_002E']) || 0,
                black: Number(obj['B02001_003E']) || 0,
                native_american: Number(obj['B02001_004E']) || 0,
                asian: Number(obj['B02001_005E']) || 0,
                pacific_islander: Number(obj['B02001_006E']) || 0,
                some_other_race: Number(obj['B02001_007E']) || 0,
                two_or_more: Number(obj['B02001_008E']) || 0,
                hispanic: Number(obj['B03003_003E']) || 0,
                median_income: Number(obj['B19013_001E']) || 0,
                per_capita_income: Number(obj['B19301_001E']) || 0,
                poverty_universe: Number(obj['B17001_001E']) || 0,
                below_poverty: Number(obj['B17001_002E']) || 0,
                insurance_universe: Number(obj['B27010_001E']) || 0,
                uninsured: Number(obj['B27010_017E']) || 0,
                disability_universe: Number(obj['B18101_001E']) || 0,
                male_disability: Number(obj['B18101_004E']) || 0,
                female_disability: Number(obj['B18101_007E']) || 0,
                education_universe: Number(obj['B15003_001E']) || 0,
                bachelors_plus: bachelors,
                median_rent: Number(obj['B25064_001E']) || 0,
                median_home_value: Number(obj['B25077_001E']) || 0,
                land_area_meters: tractInfo ? Number(tractInfo.area_land_meters) || 0 : 0,
                latitude: tractInfo ? parseFloat(tractInfo.lat) : 0,
                longitude: tractInfo ? parseFloat(tractInfo.lon) : 0,
                tract_id: obj['tract'],
                state: obj['state'],
                county: obj['county']
              };
            });
        } catch (error) {
          console.error(`❌ Error fetching data for ${state}-${county}:`, error);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      allTractData.push(...batchResults.flat());
      
      // Small delay between batches to be respectful to Census API
      if (i + batchSize < countyKeys.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 4. Aggregate data efficiently
    const totals = allTractData.reduce((acc, t) => {
      acc.total_population += t.total_pop;
      acc.population_65_plus += t.pop_65_plus;
      acc.population_under_18 += t.pop_under_18;
      acc.white += t.white;
      acc.black += t.black;
      acc.native_american += t.native_american;
      acc.asian += t.asian;
      acc.pacific_islander += t.pacific_islander;
      acc.some_other_race += t.some_other_race;
      acc.two_or_more += t.two_or_more;
      acc.hispanic += t.hispanic;
      acc.below_poverty += t.below_poverty;
      acc.poverty_universe += t.poverty_universe;
      acc.uninsured += t.uninsured;
      acc.insurance_universe += t.insurance_universe;
      acc.disability += t.male_disability + t.female_disability;
      acc.disability_universe += t.disability_universe;
      acc.bachelors_plus += t.bachelors_plus;
      acc.education_universe += t.education_universe;
      acc.total_land_area_meters += t.land_area_meters;
      
      // Track weighted sums for averages
      if (t.median_income > 0) { acc.median_income_sum += t.median_income; acc.median_income_count++; }
      if (t.per_capita_income > 0) { acc.per_capita_income_sum += t.per_capita_income; acc.per_capita_income_count++; }
      if (t.median_rent > 0) { acc.median_rent_sum += t.median_rent; acc.median_rent_count++; }
      if (t.median_home_value > 0) { acc.median_home_value_sum += t.median_home_value; acc.median_home_value_count++; }
      
      return acc;
    }, {
      total_population: 0, population_65_plus: 0, population_under_18: 0,
      white: 0, black: 0, native_american: 0, asian: 0, pacific_islander: 0,
      some_other_race: 0, two_or_more: 0, hispanic: 0,
      below_poverty: 0, poverty_universe: 0,
      uninsured: 0, insurance_universe: 0,
      disability: 0, disability_universe: 0,
      bachelors_plus: 0, education_universe: 0,
      total_land_area_meters: 0,
      median_income_sum: 0, median_income_count: 0,
      per_capita_income_sum: 0, per_capita_income_count: 0,
      median_rent_sum: 0, median_rent_count: 0,
      median_home_value_sum: 0, median_home_value_count: 0
    });

    // Fetch national averages
    const nationalAverages = await getNationalAverages(year);
    
    // Get unique states and counties in the market area
    const statesInMarket = [...new Set(allTractData.map(t => t.state))];
    const countiesInMarket = [...new Set(allTractData.map(t => `${t.state}-${t.county}`))];
    
    // Fetch state and county averages
    const stateAverages = {};
    const countyAverages = {};
    
    // Fetch state averages for all states in the market
    for (const stateFips of statesInMarket) {
      const stateData = await getStateAverages(stateFips, year);
      if (stateData) {
        stateAverages[stateFips] = {
          median_income: stateData.median_income,
          per_capita_income: stateData.per_capita_income,
          poverty_rate: stateData.poverty_universe ? stateData.below_poverty / stateData.poverty_universe : null,
          uninsured_rate: stateData.insurance_universe ? stateData.uninsured / stateData.insurance_universe : null,
          disability_rate: stateData.disability_universe ? (stateData.male_disability + stateData.female_disability) / stateData.disability_universe : null,
          bachelors_plus_rate: stateData.education_universe ? stateData.bachelors_plus / stateData.education_universe : null,
          median_rent: stateData.median_rent,
          median_home_value: stateData.median_home_value
        };
      }
    }
    
    // Fetch county averages for all counties in the market
    for (const countyKey of countiesInMarket) {
      const [stateFips, countyFips] = countyKey.split('-');
      const countyData = await getCountyAverages(stateFips, countyFips, year);
      if (countyData) {
        countyAverages[countyKey] = {
          median_income: countyData.median_income,
          per_capita_income: countyData.per_capita_income,
          poverty_rate: countyData.poverty_universe ? countyData.below_poverty / countyData.poverty_universe : null,
          uninsured_rate: countyData.insurance_universe ? countyData.uninsured / countyData.insurance_universe : null,
          disability_rate: countyData.disability_universe ? (countyData.male_disability + countyData.female_disability) / countyData.disability_universe : null,
          bachelors_plus_rate: countyData.education_universe ? countyData.bachelors_plus / countyData.education_universe : null,
          median_rent: countyData.median_rent,
          median_home_value: countyData.median_home_value
        };
      }
    }
    
    const result = {
      market_totals: {
        total_population: totals.total_population,
        population_65_plus: totals.population_65_plus,
        population_under_18: totals.population_under_18,
        white: totals.white,
        black: totals.black,
        native_american: totals.native_american,
        asian: totals.asian,
        pacific_islander: totals.pacific_islander,
        some_other_race: totals.some_other_race,
        two_or_more: totals.two_or_more,
        hispanic: totals.hispanic,
        median_income: totals.median_income_count ? Math.round(totals.median_income_sum / totals.median_income_count) : null,
        per_capita_income: totals.per_capita_income_count ? Math.round(totals.per_capita_income_sum / totals.per_capita_income_count) : null,
        poverty_rate: totals.poverty_universe ? totals.below_poverty / totals.poverty_universe : null,
        uninsured_rate: totals.insurance_universe ? totals.uninsured / totals.insurance_universe : null,
        disability_rate: totals.disability_universe ? totals.disability / totals.disability_universe : null,
        bachelors_plus_rate: totals.education_universe ? totals.bachelors_plus / totals.education_universe : null,
        median_rent: totals.median_rent_count ? Math.round(totals.median_rent_sum / totals.median_rent_count) : null,
        median_home_value: totals.median_home_value_count ? Math.round(totals.median_home_value_sum / totals.median_home_value_count) : null,
        total_tracts: allTractData.length,
        total_land_area_meters: totals.total_land_area_meters,
        acs_year: year
      },
      national_averages: nationalAverages ? {
        median_income: nationalAverages.median_income,
        per_capita_income: nationalAverages.per_capita_income,
        poverty_rate: nationalAverages.poverty_universe ? nationalAverages.below_poverty / nationalAverages.poverty_universe : null,
        uninsured_rate: nationalAverages.insurance_universe ? nationalAverages.uninsured / nationalAverages.insurance_universe : null,
        disability_rate: nationalAverages.disability_universe ? (nationalAverages.male_disability + nationalAverages.female_disability) / nationalAverages.disability_universe : null,
        bachelors_plus_rate: nationalAverages.education_universe ? nationalAverages.bachelors_plus / nationalAverages.education_universe : null,
        median_rent: nationalAverages.median_rent,
        median_home_value: nationalAverages.median_home_value
      } : null,
      state_averages: stateAverages,
      county_averages: countyAverages,
      geographic_units: allTractData
    };

    // Cache the result for 1 hour (census data doesn't change frequently)
    cache.set('census_acs', { lat, lon, radius, year }, result, 60 * 60 * 1000);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('❌ Census ACS API error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router; 