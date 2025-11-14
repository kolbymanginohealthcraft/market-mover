import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";
import fetch from 'node-fetch';
import * as turf from '@turf/turf';

const router = express.Router();

// Get API key at runtime (not module load time) to ensure dotenv has loaded
function getCensusApiKey() {
  return process.env.CENSUS_API_KEY || null;
}

// Log API key status when first used
let apiKeyLogged = false;
function logApiKeyStatus() {
  if (!apiKeyLogged) {
    const key = getCensusApiKey();
    if (key) {
      console.log('✅ Census API key configured:', key.substring(0, 10) + '...');
    } else {
      console.warn('⚠️ No Census API key found - requests may be rate limited');
    }
    apiKeyLogged = true;
  }
}

// Convert state abbreviation to FIPS code
const STATE_ABBR_TO_FIPS = {
  'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06', 'CO': '08', 'CT': '09', 'DE': '10', 'DC': '11',
  'FL': '12', 'GA': '13', 'HI': '15', 'ID': '16', 'IL': '17', 'IN': '18', 'IA': '19', 'KS': '20', 'KY': '21',
  'LA': '22', 'ME': '23', 'MD': '24', 'MA': '25', 'MI': '26', 'MN': '27', 'MS': '28', 'MO': '29', 'MT': '30',
  'NE': '31', 'NV': '32', 'NH': '33', 'NJ': '34', 'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39',
  'OK': '40', 'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45', 'SD': '46', 'TN': '47', 'TX': '48', 'UT': '49',
  'VT': '50', 'VA': '51', 'WA': '53', 'WV': '54', 'WI': '55', 'WY': '56'
};

function normalizeStateFips(stateCode) {
  if (!stateCode) return null;
  const stateStr = String(stateCode).trim().toUpperCase();
  // If it's already a 2-digit FIPS code, return it
  if (/^\d{2}$/.test(stateStr)) {
    return stateStr.padStart(2, '0');
  }
  // If it's an abbreviation, convert it
  return STATE_ABBR_TO_FIPS[stateStr] || null;
}

const DEFAULT_AVAILABLE_ACS_YEARS = [
  '2023',
  '2022',
  '2021',
  '2020',
  '2019',
  '2018',
  '2017',
  '2016',
  '2015'
];

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

/**
 * GET /api/census-data/available-years
 *
 * Returns the list of ACS 5-year dataset years supported by the application.
 * If the CENSUS_ACS_YEARS environment variable is provided (comma-separated list),
 * those values take precedence over the defaults.
 */
router.get('/census-data/available-years', (req, res) => {
  try {
    const configuredYears = process.env.CENSUS_ACS_YEARS
      ? process.env.CENSUS_ACS_YEARS.split(',').map(value => value.trim()).filter(Boolean)
      : [];

    const candidates = configuredYears.length > 0 ? configuredYears : DEFAULT_AVAILABLE_ACS_YEARS;

    const years = Array.from(
      new Set(
        candidates.filter(year => /^\d{4}$/.test(year))
      )
    ).sort((a, b) => Number(b) - Number(a));

    res.status(200).json({
      success: true,
      data: years
    });
  } catch (error) {
    console.error('❌ Error determining available ACS years:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to determine available ACS years'
    });
  }
});

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
      // Query for specific counties only - use counties table to get lsad_name
      const countyConditions = countyFipsList.map((_, index) => `county_fips_code = @county${index}`).join(' OR ');
      query = `
        SELECT 
          CONCAT(state_fips_code, county_fips_code) as county_fips_code,
          COALESCE(lsad_name, county_name) as area_name
        FROM \`bigquery-public-data.geo_us_boundaries.counties\`
        WHERE state_fips_code = @stateFips
          AND (${countyConditions})
        ORDER BY area_name
      `;
      
      params = { stateFips };
      countyFipsList.forEach((countyFips, index) => {
        // Use just the 3-digit county FIPS code
        params[`county${index}`] = String(countyFips).padStart(3, '0');
      });
    } else {
      // Query for all counties in the state - use counties table to get lsad_name
      query = `
        SELECT 
          CONCAT(state_fips_code, county_fips_code) as county_fips_code,
          COALESCE(lsad_name, county_name) as area_name
        FROM \`bigquery-public-data.geo_us_boundaries.counties\`
        WHERE state_fips_code = @stateFips
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

    // Structure response as { fullCountyFips: lsad_name } for the requested state
    const countyNames = {};
    rows.forEach(row => {
      const fullCountyFips = row.county_fips_code; // Already CONCAT(state_fips_code, county_fips_code)
      countyNames[fullCountyFips] = row.area_name; // Use lsad_name (or county_name as fallback)
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

    logApiKeyStatus();
    const apiKey = getCensusApiKey();
    const url = `https://api.census.gov/data/${year}/acs/acs5?get=${NATIONAL_VARS}&for=us:*${apiKey ? `&key=${apiKey}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`⚠️ Census API error for national data: ${response.status}`);
      return null;
    }
    
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      console.warn(`⚠️ Census API returned empty response for national data, year ${year}`);
      return null;
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.warn(`⚠️ Census API returned invalid JSON for national data, year ${year}:`, parseError.message);
      return null;
    }
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

    logApiKeyStatus();
    const apiKey = getCensusApiKey();
    const url = `https://api.census.gov/data/${year}/acs/acs5?get=${STATE_VARS}&for=state:${stateFips}${apiKey ? `&key=${apiKey}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`⚠️ Census API error for state data: ${response.status}`);
      return null;
    }
    
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      console.warn(`⚠️ Census API returned empty response for state ${stateFips}, year ${year}`);
      return null;
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.warn(`⚠️ Census API returned invalid JSON for state ${stateFips}, year ${year}:`, parseError.message);
      return null;
    }
    
    if (!Array.isArray(data) || data.length < 2) {
      console.warn(`⚠️ Census API returned unexpected data format for state ${stateFips}, year ${year}`);
      return null;
    }
    
    const header = data[0];
    const row = data[1];
    if (!header || !row) {
      console.warn(`⚠️ Census API returned incomplete data for state ${stateFips}, year ${year}`);
      return null;
    }
    
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

    logApiKeyStatus();
    const apiKey = getCensusApiKey();
    const url = `https://api.census.gov/data/${year}/acs/acs5?get=${COUNTY_VARS}&for=county:${countyFips}&in=state:${stateFips}${apiKey ? `&key=${apiKey}` : ''}`;
    console.log(`🔍 Fetching county averages: ${stateFips}-${countyFips} (${year}) - URL: ${url.substring(0, 100)}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`⚠️ Census API error for county data: ${response.status}`);
      return null;
    }
    
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      console.warn(`⚠️ Census API returned empty response for county ${stateFips}-${countyFips}, year ${year}`);
      return null;
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.warn(`⚠️ Census API returned invalid JSON for county ${stateFips}-${countyFips}, year ${year}:`, parseError.message);
      console.warn(`   Response text: ${text.substring(0, 200)}`);
      return null;
    }
    
    // Check if response is an error object
    if (!Array.isArray(data)) {
      console.warn(`⚠️ Census API returned error for county ${stateFips}-${countyFips}, year ${year}:`, JSON.stringify(data));
      console.warn(`   Response text: ${text.substring(0, 500)}`);
      return null;
    }
    
    if (data.length < 2) {
      console.warn(`⚠️ Census API returned insufficient data for county ${stateFips}-${countyFips}, year ${year}:`, data.length, 'rows');
      return null;
    }
    
    const header = data[0];
    const row = data[1];
    if (!header || !row) {
      console.warn(`⚠️ Census API returned incomplete data for county ${stateFips}-${countyFips}, year ${year}`);
      return null;
    }
    
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

async function getZipCodesWithinRadius(lat, lon, radiusMiles) {
  const cacheParams = { lat, lon, radiusMiles };
  const cached = cache.get('zip_codes_within_radius', cacheParams);
  if (cached) {
    return cached;
  }

  const radiusMeters = parseFloat(radiusMiles) * 1609.34;
  const centerLat = parseFloat(lat);
  const centerLon = parseFloat(lon);

  const zipQuery = `
    SELECT
      z.zip_code,
      z.state_code,
      ST_AREA(z.zip_code_geom) AS area_land_meters,
      ST_Y(ST_CENTROID(z.zip_code_geom)) AS centroid_lat,
      ST_X(ST_CENTROID(z.zip_code_geom)) AS centroid_lon,
      ST_DISTANCE(
        ST_GEOGPOINT(CAST(ST_X(ST_CENTROID(z.zip_code_geom)) AS FLOAT64), CAST(ST_Y(ST_CENTROID(z.zip_code_geom)) AS FLOAT64)),
        ST_GEOGPOINT(@centerLon, @centerLat)
      ) AS distance_to_center_meters
    FROM \`bigquery-public-data.geo_us_boundaries.zip_codes\` z
    WHERE ST_INTERSECTS(
      z.zip_code_geom,
      ST_BUFFER(ST_GEOGPOINT(@centerLon, @centerLat), @radiusMeters)
    )
    ORDER BY distance_to_center_meters ASC
  `;

  const [rows] = await myBigQuery.query({
    query: zipQuery,
    location: 'US',
    params: {
      centerLat: Number(centerLat),
      centerLon: Number(centerLon),
      radiusMeters: Number(radiusMeters)
    }
  });

  cache.set('zip_codes_within_radius', cacheParams, rows);
  return rows;
}

async function fetchZipAcsData(zipRow, year) {
  logApiKeyStatus();
  const apiKey = getCensusApiKey();
  const zip = String(zipRow.zip_code).padStart(5, '0');
  const url = `https://api.census.gov/data/${year}/acs/acs5?get=${ACS_VARS}&for=zip%20code%20tabulation%20area:${zip}${apiKey ? `&key=${apiKey}` : ''}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`⚠️ Census API error for ZIP ${zip}: ${response.status}`);
      return null;
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      console.warn(`⚠️ Census API returned empty response for ZIP ${zip}`);
      return null;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.warn(`⚠️ Census API returned invalid JSON for ZIP ${zip}:`, parseError.message);
      return null;
    }
    if (!Array.isArray(data) || data.length < 2) {
      console.warn(`⚠️ Census API returned no data for ZIP ${zip}`);
      return null;
    }

    const header = data[0];
    const row = data[1];
    const obj = {};
    header.forEach((h, idx) => { obj[h] = row[idx]; });

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

    const population = Number(obj['B01001_001E']) || 0;
    if (population === 0) {
      console.warn(`⚠️ ZIP ${zip} returned population 0 for ${year}`);
    }

    const geoIdRaw = obj['zip code tabulation area'] || zip;

    return {
      total_pop: population,
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
      land_area_meters: Number(zipRow.area_land_meters) || 0,
      latitude: Number(zipRow.centroid_lat) || 0,
      longitude: Number(zipRow.centroid_lon) || 0,
      zip_code: zip,
      state: obj['state'] || zipRow.state_code || null,
      county: obj['county'] || null,
      state_fips: obj['state'] || normalizeStateFips(zipRow.state_code) || null,
      county_fips: obj['county'] || null,
      geo_id: geoIdRaw ? `8600000US${String(geoIdRaw).padStart(5, '0')}` : null,
      distance_to_center_meters: Number(zipRow.distance_to_center_meters) || 0,
      geography_type: 'zip'
    };
  } catch (error) {
    console.error(`❌ Error fetching ACS data for ZIP ${zip}:`, error);
    return null;
  }
}

async function buildZipCensusData({ lat, lon, radiusMiles, year, zipRows: providedZipRows = null }) {
  const zipRows = providedZipRows || await getZipCodesWithinRadius(lat, lon, radiusMiles);
  if (!zipRows || zipRows.length === 0) {
    return {
      geography: 'zip',
      metadata: { zip_codes: [], matched_zips: [], missing_zips: [] },
      market_totals: {
        total_population: 0,
        population_65_plus: 0,
        population_under_18: 0,
        median_income: 0,
        total_tracts: 0,
        total_zip_codes: 0,
        acs_year: year
      },
      national_averages: null,
      state_averages: {},
      county_averages: {},
      geographic_units: []
    };
  }

  // Separate BigQuery queries for counties and states in the radius
  const radiusMeters = parseFloat(radiusMiles) * 1609.34;
  const centerLat = parseFloat(lat);
  const centerLon = parseFloat(lon);

  // Query 1: Get counties within radius
  const countiesSet = new Set();
  const countyNamesMap = {};
  try {
    const countiesQuery = `
      SELECT DISTINCT
        state_fips_code,
        county_fips_code,
        COALESCE(lsad_name, county_name) as county_name
      FROM \`bigquery-public-data.geo_us_boundaries.counties\`
      WHERE ST_INTERSECTS(
        county_geom,
        ST_BUFFER(ST_GEOGPOINT(@centerLon, @centerLat), @radiusMeters)
      )
    `;
    
    const [countyRows] = await myBigQuery.query({
      query: countiesQuery,
      location: 'US',
      params: {
        centerLat: Number(centerLat),
        centerLon: Number(centerLon),
        radiusMeters: Number(radiusMeters)
      }
    });
    
    countyRows.forEach(row => {
      const stateFips = String(row.state_fips_code).padStart(2, '0');
      const countyFips = String(row.county_fips_code).length >= 5 
        ? String(row.county_fips_code).substring(2) 
        : String(row.county_fips_code).padStart(3, '0');
      const countyKey = `${stateFips}-${countyFips}`;
      countiesSet.add(countyKey);
      
      // Store county name for later use
      if (!countyNamesMap[stateFips]) {
        countyNamesMap[stateFips] = {};
      }
      const fullCountyFips = String(row.county_fips_code).length >= 5 
        ? String(row.county_fips_code)
        : `${stateFips}${countyFips.padStart(3, '0')}`;
      countyNamesMap[stateFips][fullCountyFips] = row.county_name; // Uses lsad_name (or county_name as fallback)
    });
    console.log(`✅ Found ${countiesSet.size} counties in radius`);
  } catch (err) {
    console.warn('⚠️ Error fetching counties:', err.message);
  }

  // Query 2: Get states within radius
  const statesSet = new Set();
  try {
    const statesQuery = `
      SELECT DISTINCT
        state_fips_code
      FROM \`bigquery-public-data.geo_us_boundaries.states\`
      WHERE ST_INTERSECTS(
        state_geom,
        ST_BUFFER(ST_GEOGPOINT(@centerLon, @centerLat), @radiusMeters)
      )
    `;
    
    const [stateRows] = await myBigQuery.query({
      query: statesQuery,
      location: 'US',
      params: {
        centerLat: Number(centerLat),
        centerLon: Number(centerLon),
        radiusMeters: Number(radiusMeters)
      }
    });
    
    stateRows.forEach(row => {
      const stateFips = String(row.state_fips_code).padStart(2, '0');
      statesSet.add(stateFips);
    });
    console.log(`✅ Found ${statesSet.size} states in radius`);
  } catch (err) {
    console.warn('⚠️ Error fetching states:', err.message);
  }

  const allZipData = [];
  const missingZips = [];
  const matchedZips = [];
  const chunkSize = 8;

  for (let i = 0; i < zipRows.length; i += chunkSize) {
    const chunk = zipRows.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(row => fetchZipAcsData(row, year)));
    chunkResults.forEach((result, idx) => {
      const zipCode = String(chunk[idx].zip_code).padStart(5, '0');
      if (result) {
        matchedZips.push(zipCode);
        allZipData.push(result);
      } else {
        missingZips.push(zipCode);
      }
    });

    if (i + chunkSize < zipRows.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const totals = allZipData.reduce((acc, z) => {
    acc.total_population += z.total_pop;
    acc.population_65_plus += z.pop_65_plus;
    acc.population_under_18 += z.pop_under_18;
    acc.white += z.white;
    acc.black += z.black;
    acc.native_american += z.native_american;
    acc.asian += z.asian;
    acc.pacific_islander += z.pacific_islander;
    acc.some_other_race += z.some_other_race;
    acc.two_or_more += z.two_or_more;
    acc.hispanic += z.hispanic;
    acc.below_poverty += z.below_poverty;
    acc.poverty_universe += z.poverty_universe;
    acc.uninsured += z.uninsured;
    acc.insurance_universe += z.insurance_universe;
    acc.disability += z.male_disability + z.female_disability;
    acc.disability_universe += z.disability_universe;
    acc.bachelors_plus += z.bachelors_plus;
    acc.education_universe += z.education_universe;
    acc.total_land_area_meters += z.land_area_meters;

    if (z.median_income > 0) { acc.median_income_sum += z.median_income; acc.median_income_count++; }
    if (z.per_capita_income > 0) { acc.per_capita_income_sum += z.per_capita_income; acc.per_capita_income_count++; }
    if (z.median_rent > 0) { acc.median_rent_sum += z.median_rent; acc.median_rent_count++; }
    if (z.median_home_value > 0) { acc.median_home_value_sum += z.median_home_value; acc.median_home_value_count++; }

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

  const nationalAverages = await getNationalAverages(year);

  // Use states from BigQuery query (already fetched above)
  const stateSet = statesSet;
  
  const stateAverages = {};
  const statePromises = Array.from(stateSet).map(async (stateFips) => {
    const average = await getStateAverages(stateFips, year);
    if (average) {
      return {
        stateFips,
        data: {
          median_income: average.median_income,
          per_capita_income: average.per_capita_income,
          poverty_rate: average.poverty_universe ? average.below_poverty / average.poverty_universe : null,
          uninsured_rate: average.insurance_universe ? average.uninsured / average.insurance_universe : null,
          disability_rate: average.disability_universe ? (average.male_disability + average.female_disability) / average.disability_universe : null,
          bachelors_plus_rate: average.education_universe ? average.bachelors_plus / average.education_universe : null,
          median_rent: average.median_rent,
          median_home_value: average.median_home_value
        }
      };
    }
    return null;
  });
  
  const stateResults = await Promise.all(statePromises);
  stateResults.forEach(result => {
    if (result) {
      stateAverages[result.stateFips] = result.data;
    }
  });

  // Use counties from BigQuery query (already fetched above)
  const countySet = countiesSet;
  
  const countyAverages = {};
  const countyPromises = Array.from(countySet).map(async (countyKey) => {
    const [stateFips, countyFips] = countyKey.split('-');
    const average = await getCountyAverages(stateFips, countyFips, year);
    if (average) {
      return {
        countyKey,
        data: {
          median_income: average.median_income,
          per_capita_income: average.per_capita_income,
          poverty_rate: average.poverty_universe ? average.below_poverty / average.poverty_universe : null,
          uninsured_rate: average.insurance_universe ? average.uninsured / average.insurance_universe : null,
          disability_rate: average.disability_universe ? (average.male_disability + average.female_disability) / average.disability_universe : null,
          bachelors_plus_rate: average.education_universe ? average.bachelors_plus / average.education_universe : null,
          median_rent: average.median_rent,
          median_home_value: average.median_home_value
        }
      };
    }
    return null;
  });
  
  const countyResults = await Promise.all(countyPromises);
  countyResults.forEach(result => {
    if (result) {
      countyAverages[result.countyKey] = result.data;
    }
  });

  // County names already fetched in the separate counties query above (countyNamesMap)

  const marketTotals = {
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
    total_tracts: zipRows.length,
    total_zip_codes: zipRows.length,
    matched_zip_codes: matchedZips.length,
    acs_year: year,
    total_land_area_meters: totals.total_land_area_meters
  };

  const result = {
    geography: 'zip',
    market_totals: marketTotals,
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
    county_names: countyNamesMap,
    geographic_units: allZipData,
    metadata: {
      geography: 'zip',
      zip_codes: zipRows.map(row => String(row.zip_code).padStart(5, '0')),
      matched_zips: matchedZips,
      missing_zips: missingZips
    }
  };
  
  console.log('📊 Benchmark data summary:', {
    hasNational: !!result.national_averages,
    stateCount: Object.keys(result.state_averages).length,
    countyCount: Object.keys(result.county_averages).length,
    stateKeys: Object.keys(result.state_averages).slice(0, 3),
    countyKeys: Object.keys(result.county_averages).slice(0, 3),
    sampleCountyData: result.county_averages[Object.keys(result.county_averages)[0]]
  });
  
  return result;
}

router.get('/census-acs-api', async (req, res) => {
  const { lat, lon, radius, year = '2023' } = req.query;
  const geography = (req.query.geography || 'zip').toLowerCase();
  if (!lat || !lon || !radius) {
    return res.status(400).json({ success: false, error: 'lat, lon, and radius are required' });
  }

  console.log(`🌍 Census API request: geography=${geography}, lat=${lat}, lon=${lon}, radius=${radius}, year=${year}`);

  // Check cache first
  const cacheParams = { lat, lon, radius, year, geography };
  const cachedData = cache.get('census_acs', cacheParams);
  if (cachedData) {
    console.log('📦 Serving census ACS data from cache:', {
      geography: cachedData.geography,
      hasNational: !!cachedData.national_averages,
      stateCount: cachedData.state_averages ? Object.keys(cachedData.state_averages).length : 0,
      countyCount: cachedData.county_averages ? Object.keys(cachedData.county_averages).length : 0
    });
    return res.status(200).json({ success: true, data: cachedData });
  }

  try {
    if (geography === 'zip') {
      const result = await buildZipCensusData({
        lat: Number(lat),
        lon: Number(lon),
        radiusMiles: parseFloat(radius),
        year
      });

      console.log('📤 Returning ZIP census data:', {
        hasNational: !!result.national_averages,
        stateCount: result.state_averages ? Object.keys(result.state_averages).length : 0,
        countyCount: result.county_averages ? Object.keys(result.county_averages).length : 0,
        countyKeys: result.county_averages ? Object.keys(result.county_averages).slice(0, 5) : []
      });

      cache.set('census_acs', cacheParams, result, 60 * 60 * 1000);
      return res.status(200).json({ success: true, data: result });
    }

    const radiusMeters = parseFloat(radius) * 1609.34;
    const centerLat = parseFloat(lat);
    const centerLon = parseFloat(lon);

    // 1. Get tracts within radius using BigQuery spatial functions (optimized with ST_INTERSECTS)
    // Also join with counties table to get county names in one query
    const bqQuery = `
      SELECT 
        t.geo_id, 
        t.state_fips_code, 
        t.county_fips_code, 
        t.tract_ce, 
        t.internal_point_lat AS lat, 
        t.internal_point_lon AS lon, 
        t.area_land_meters,
        c.county_name
      FROM \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\` t
      LEFT JOIN \`bigquery-public-data.geo_us_boundaries.counties\` c
        ON t.state_fips_code = c.state_fips_code 
        AND t.county_fips_code = c.county_fips_code
      WHERE ST_INTERSECTS(
        t.tract_geom,
        ST_BUFFER(ST_GEOGPOINT(@centerLon, @centerLat), @radiusMeters)
      )
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
      cache.set('census_acs', cacheParams, emptyResult, 5 * 60 * 1000); // 5 minutes
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
        logApiKeyStatus();
        const apiKey = getCensusApiKey();
        const { state, county, tracts } = tractsByCounty[key];
        const url = `https://api.census.gov/data/${year}/acs/acs5?get=${ACS_VARS}&for=tract:*&in=state:${state}+county:${county}${apiKey ? `&key=${apiKey}` : ''}`;
        
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
    
    // Fetch county names from BigQuery for all counties in the market
    const countyNamesMap = {};
    if (countiesInMarket.length > 0) {
      try {
        const countyConditions = countiesInMarket.map((countyKey, index) => {
          const [stateFips, countyFips] = countyKey.split('-');
          const fullCountyFips = `${stateFips}${countyFips.padStart(3, '0')}`;
          return `county_fips_code = @county${index}`;
        }).join(' OR ');
        
        const countyNamesQuery = `
          SELECT 
            county_fips_code,
            COALESCE(lsad_name, county_name) as county_name
          FROM \`bigquery-public-data.geo_us_boundaries.counties\`
          WHERE (${countyConditions})
        `;
        
        const countyNamesParams = {};
        countiesInMarket.forEach((countyKey, index) => {
          const [stateFips, countyFips] = countyKey.split('-');
          const fullCountyFips = `${stateFips}${countyFips.padStart(3, '0')}`;
          countyNamesParams[`county${index}`] = fullCountyFips;
        });
        
        const [countyNameRows] = await myBigQuery.query({
          query: countyNamesQuery,
          location: 'US',
          params: countyNamesParams
        });
        
        // Group county names by state for easier lookup
        countyNameRows.forEach(row => {
          const fullFips = String(row.county_fips_code);
          const stateFips = fullFips.substring(0, 2);
          if (!countyNamesMap[stateFips]) {
            countyNamesMap[stateFips] = {};
          }
          countyNamesMap[stateFips][fullFips] = row.county_name;
        });
      } catch (err) {
        console.warn('⚠️ Error fetching county names from BigQuery:', err.message);
      }
    }
    
    // Fetch state and county averages in parallel for better performance
    const stateAverages = {};
    const countyAverages = {};
    
    // Fetch state averages for all states in parallel
    const statePromises = statesInMarket.map(async (stateFips) => {
      const stateData = await getStateAverages(stateFips, year);
      if (stateData) {
        return {
          stateFips,
          data: {
            median_income: stateData.median_income,
            per_capita_income: stateData.per_capita_income,
            poverty_rate: stateData.poverty_universe ? stateData.below_poverty / stateData.poverty_universe : null,
            uninsured_rate: stateData.insurance_universe ? stateData.uninsured / stateData.insurance_universe : null,
            disability_rate: stateData.disability_universe ? (stateData.male_disability + stateData.female_disability) / stateData.disability_universe : null,
            bachelors_plus_rate: stateData.education_universe ? stateData.bachelors_plus / stateData.education_universe : null,
            median_rent: stateData.median_rent,
            median_home_value: stateData.median_home_value
          }
        };
      }
      return null;
    });
    
    const stateResults = await Promise.all(statePromises);
    stateResults.forEach(result => {
      if (result) {
        stateAverages[result.stateFips] = result.data;
      }
    });
    
    // Fetch county averages for all counties in parallel
    const countyPromises = countiesInMarket.map(async (countyKey) => {
      const [stateFips, countyFips] = countyKey.split('-');
      const countyData = await getCountyAverages(stateFips, countyFips, year);
      if (countyData) {
        return {
          countyKey,
          data: {
            median_income: countyData.median_income,
            per_capita_income: countyData.per_capita_income,
            poverty_rate: countyData.poverty_universe ? countyData.below_poverty / countyData.poverty_universe : null,
            uninsured_rate: countyData.insurance_universe ? countyData.uninsured / countyData.insurance_universe : null,
            disability_rate: countyData.disability_universe ? (countyData.male_disability + countyData.female_disability) / countyData.disability_universe : null,
            bachelors_plus_rate: countyData.education_universe ? countyData.bachelors_plus / countyData.education_universe : null,
            median_rent: countyData.median_rent,
            median_home_value: countyData.median_home_value
          }
        };
      }
      return null;
    });
    
    const countyResults = await Promise.all(countyPromises);
    countyResults.forEach(result => {
      if (result) {
        countyAverages[result.countyKey] = result.data;
      }
    });
    
    const result = {
      geography: 'tract',
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
      county_names: countyNamesMap,
      geographic_units: allTractData
    };

    // Cache the result for 1 hour (census data doesn't change frequently)
    cache.set('census_acs', cacheParams, result, 60 * 60 * 1000);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('❌ Census ACS API error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/census-acs-zip-summary', async (req, res) => {
  const { lat, lon, radius, years } = req.query;

  if (!lat || !lon || !radius) {
    return res.status(400).json({
      success: false,
      error: 'lat, lon, and radius are required'
    });
  }

  try {
    const requestedYears = years
      ? years.split(',').map(value => value.trim()).filter(Boolean)
      : DEFAULT_AVAILABLE_ACS_YEARS;

    const uniqueYears = Array.from(new Set(
      requestedYears.filter(year => /^\d{4}$/.test(year))
    )).sort((a, b) => Number(b) - Number(a));

    const zipRows = await getZipCodesWithinRadius(lat, lon, radius);
    if (!zipRows || zipRows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          zipCodes: [],
          totalZipCodes: 0,
          summaries: {},
          availableYears: uniqueYears
        }
      });
    }

    const summaries = {};

    for (const year of uniqueYears) {
      const data = await buildZipCensusData({
        lat: Number(lat),
        lon: Number(lon),
        radiusMiles: parseFloat(radius),
        year,
        zipRows
      });

      summaries[year] = {
        totalPopulation: data.market_totals.total_population,
        matchedZipCount: data.market_totals.matched_zip_codes ?? (data.metadata?.matched_zips?.length ?? 0),
        missingZipCount: data.metadata?.missing_zips?.length ?? 0,
        matchedZips: data.metadata?.matched_zips ?? [],
        missingZips: data.metadata?.missing_zips ?? [],
        marketTotals: data.market_totals
      };
    }

    res.status(200).json({
      success: true,
      data: {
        zipCodes: zipRows.map(row => String(row.zip_code).padStart(5, '0')),
        totalZipCodes: zipRows.length,
        summaries,
        availableYears: uniqueYears
      }
    });
  } catch (error) {
    console.error('❌ Error generating ACS ZIP summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

router.get('/census-acs-zip-trend', async (req, res) => {
  const { lat, lon, radius, startYear, endYear } = req.query;

  if (!lat || !lon || !radius) {
    return res.status(400).json({
      success: false,
      error: 'lat, lon, and radius are required'
    });
  }

  try {
    const radiusMiles = parseFloat(radius);
    const cacheKey = {
      lat,
      lon,
      radius: radiusMiles,
      startYear: startYear || null,
      endYear: endYear || null,
      endpoint: 'zip_trend'
    };

    const cached = cache.get('census_acs_zip_trend', cacheKey);
    if (cached) {
      console.log('📦 Serving cached ZIP trend results');
      return res.status(200).json({ success: true, data: cached, cached: true });
    }

    const zipRows = await getZipCodesWithinRadius(lat, lon, radiusMiles);
    if (!zipRows || zipRows.length === 0) {
      const empty = {
        zipCodes: [],
        totalZipCodes: 0,
        trend: [],
        matchedZipCodes: [],
        missingZipCodes: []
      };
      cache.set('census_acs_zip_trend', cacheKey, empty, 30 * 60 * 1000);
      return res.status(200).json({ success: true, data: empty });
    }

    const yearsRange = (() => {
      const start = startYear ? Number(startYear) : Number(DEFAULT_AVAILABLE_ACS_YEARS[DEFAULT_AVAILABLE_ACS_YEARS.length - 1]);
      const end = endYear ? Number(endYear) : Number(DEFAULT_AVAILABLE_ACS_YEARS[0]);
      const yearsList = [];
      for (let y = end; y >= start; y -= 1) {
        yearsList.push(String(y));
      }
      return yearsList.filter(year => /^\d{4}$/.test(year));
    })();

    const trend = [];
    const aggregateMatched = new Set();
    const aggregateMissing = new Set();

    for (const year of yearsRange) {
      const result = await buildZipCensusData({
        lat: Number(lat),
        lon: Number(lon),
        radiusMiles,
        year,
        zipRows
      });

      const matched = result.metadata?.matched_zips ?? [];
      const missing = result.metadata?.missing_zips ?? [];

      matched.forEach(zip => aggregateMatched.add(zip));
      missing.forEach(zip => aggregateMissing.add(zip));

      trend.push({
        year,
        totalPopulation: result.market_totals.total_population,
        population65Plus: result.market_totals.population_65_plus,
        populationUnder18: result.market_totals.population_under_18,
        medianIncome: result.market_totals.median_income,
        perCapitaIncome: result.market_totals.per_capita_income,
        povertyRate: result.market_totals.poverty_rate,
        uninsuredRate: result.market_totals.uninsured_rate,
        disabilityRate: result.market_totals.disability_rate,
        matchedZipCount: result.market_totals.matched_zip_codes ?? matched.length,
        missingZipCount: missing.length,
        matchedZips: matched,
        missingZips: missing
      });
    }

    const payload = {
      geography: 'zip',
      zipCodes: zipRows.map(row => String(row.zip_code).padStart(5, '0')),
      totalZipCodes: zipRows.length,
      trend,
      matchedZipCodes: Array.from(aggregateMatched),
      missingZipCodes: Array.from(aggregateMissing)
    };

    cache.set('census_acs_zip_trend', cacheKey, payload, 60 * 60 * 1000);

    res.status(200).json({
      success: true,
      data: payload,
      cached: false
    });
  } catch (error) {
    console.error('❌ Error generating ACS ZIP trend:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router; 