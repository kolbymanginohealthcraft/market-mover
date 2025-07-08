import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";
import fetch from 'node-fetch';
import * as turf from '@turf/turf';

const router = express.Router();

// Helper to get the latest available ACS year
async function getLatestAcsYear() {
  const query = `
    SELECT 
      REGEXP_EXTRACT(table_id, r'county_(\\d{4})_5yr') as year
    FROM \`bigquery-public-data.census_bureau_acs.__TABLES__\`
    WHERE table_id LIKE 'county_%_5yr'
    ORDER BY year DESC
    LIMIT 1
  `;
  const [rows] = await myBigQuery.query({ query, location: "US" });
  return rows[0]?.year || '2018';
}

/**
 * GET /api/census-data
 * 
 * Query params:
 *   - lat: Latitude of market center (required)
 *   - lon: Longitude of market center (required) 
 *   - radius: Radius in miles (required)
 *   - level: Geographic level ('county', 'tract', 'blockgroup') - defaults to 'county'
 *   - year: ACS year (optional, defaults to latest available)
 * 
 * Returns: Census demographics for the specified market area
 */
router.get("/census-data", async (req, res) => {
  const { lat, lon, radius, level = 'county' } = req.query;
  let { year } = req.query;

  if (!lat || !lon || !radius) {
    return res.status(400).json({
      success: false,
      error: "lat, lon, and radius are required"
    });
  }

  // Always use the latest available year if not specified or not found
  let acsYear = year;
  if (!acsYear) {
    acsYear = await getLatestAcsYear();
  } else {
    // Validate year exists
    const query = `
      SELECT 1 FROM \`bigquery-public-data.census_bureau_acs.__TABLES__\`
      WHERE table_id = 'county_${acsYear}_5yr'
      LIMIT 1
    `;
    const [rows] = await myBigQuery.query({ query, location: "US" });
    if (!rows.length) {
      acsYear = await getLatestAcsYear();
    }
  }

  const radiusMeters = Number(radius) * 1609.34;
  const cacheKey = `census_${level}_${lat}_${lon}_${radius}_${acsYear}`;

  try {
    // Check cache first
    const cachedData = cache.get('census_data', { level, lat, lon, radius, year: acsYear });
    if (cachedData) {
      console.log('📦 Serving census data from cache');
      return res.status(200).json({ success: true, data: cachedData });
    }

    let query, params;

    if (level === 'tract') {
      // Tract-level query using ACS data joined with TIGER/Line geometry
      // Only return aggregated totals, not individual tract details
      query = `
        WITH tract_data AS (
          SELECT 
            acs.total_pop,
            -- Calculate 65+ population from available age columns (handle NULL values)
            (COALESCE(acs.female_65_to_66, 0) + COALESCE(acs.female_67_to_69, 0) + COALESCE(acs.female_70_to_74, 0) + COALESCE(acs.female_75_to_79, 0) + COALESCE(acs.female_80_to_84, 0) + COALESCE(acs.female_85_and_over, 0) +
             COALESCE(acs.male_65_to_66, 0) + COALESCE(acs.male_67_to_69, 0) + COALESCE(acs.male_70_to_74, 0) + COALESCE(acs.male_75_to_79, 0) + COALESCE(acs.male_80_to_84, 0) + COALESCE(acs.male_85_and_over, 0)) as pop_65_plus,
            acs.median_income,
            acs.income_per_capita,
            acs.poverty,
            acs.housing_units,
            acs.owner_occupied_housing_units,
            acs.housing_units_renter_occupied as renter_occupied_housing_units,
            -- Additional demographic data
            acs.white_pop,
            acs.black_pop,
            acs.hispanic_pop,
            acs.asian_pop,
            acs.median_age,
            CAST(geo.internal_point_lat AS FLOAT64) as centroid_lat,
            CAST(geo.internal_point_lon AS FLOAT64) as centroid_lon
          FROM \`bigquery-public-data.census_bureau_acs.censustract_${acsYear}_5yr\` acs
          INNER JOIN \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\` geo
            ON acs.geo_id = geo.geo_id
          WHERE acs.total_pop > 0
        )
        SELECT 
          SUM(total_pop) as total_pop,
          SUM(pop_65_plus) as pop_65_plus,
          -- Weighted average for median income (handle NULL values)
          SUM(COALESCE(median_income, 0) * total_pop) / SUM(total_pop) as median_income,
          SUM(income_per_capita * total_pop) / SUM(total_pop) as income_per_capita,
          SUM(poverty) as poverty,
          SUM(housing_units) as housing_units,
          SUM(owner_occupied_housing_units) as owner_occupied_housing_units,
          SUM(renter_occupied_housing_units) as renter_occupied_housing_units,
          SUM(white_pop) as white_pop,
          SUM(black_pop) as black_pop,
          SUM(hispanic_pop) as hispanic_pop,
          SUM(asian_pop) as asian_pop,
          SUM(median_age * total_pop) / SUM(total_pop) as median_age,
          COUNT(*) as total_tracts
        FROM tract_data
        WHERE ST_DISTANCE(
          ST_GEOGPOINT(centroid_lon, centroid_lat),
          ST_GEOGPOINT(@lon, @lat)
        ) <= @radiusMeters
      `;
    } else {
      return res.status(400).json({
        success: false,
        error: "level must be 'tract'"
      });
    }

    params = {
      lat: Number(lat),
      lon: Number(lon),
      radiusMeters
    };

    const [rows] = await myBigQuery.query({
      query,
      location: "US",
      params
    });

    // Debug logging
    console.log(`🔍 Census query results for ${level} level, year ${acsYear}:`);
    console.log(`  - Query params: lat=${lat}, lon=${lon}, radius=${radius} miles`);
    console.log(`  - Number of rows returned: ${rows.length}`);
    if (rows.length > 0) {
      console.log(`  - First row:`, JSON.stringify(rows[0], null, 2));
    }

    // Calculate market totals for tract-level aggregated data
    const row = rows[0] || {};
    const marketTotals = {
      total_population: row.total_pop || 0,
      population_65_plus: row.pop_65_plus || 0,
      median_income: row.median_income || 0,
      total_tracts: row.total_tracts || 0,
      geographic_level: level,
      acs_year: acsYear
    };
    
    // For tract level, no individual geographic units to show
    const geographicUnits = [];

    const result = {
      market_totals: marketTotals,
      geographic_units: geographicUnits,
      query_params: { lat, lon, radius, level, year: acsYear }
    };

    // Cache the result for 1 hour (census data doesn't change frequently)
    cache.set('census_data', { level, lat, lon, radius, year: acsYear }, result, 60 * 60 * 1000);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (err) {
    console.error("❌ Census data query error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/census-data/available-years
 * 
 * Returns: Available ACS years in the public dataset
 */
router.get("/census-data/available-years", async (req, res) => {
  try {
    const query = `
      SELECT 
        REGEXP_EXTRACT(table_id, r'county_(\\d{4})_5yr') as year
      FROM \`bigquery-public-data.census_bureau_acs.__TABLES__\`
      WHERE table_id LIKE 'county_%_5yr'
      ORDER BY year DESC
    `;

    const [rows] = await myBigQuery.query({
      query,
      location: "US"
    });

    const years = rows.map(row => row.year).filter(Boolean);

    res.status(200).json({
      success: true,
      data: years
    });

  } catch (err) {
    console.error("❌ Available years query error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/census-data/schema/:year
 * 
 * Returns: Schema information for a specific ACS year
 */
router.get("/census-data/schema/:year", async (req, res) => {
  const { year } = req.params;
  const { level = 'county' } = req.query;

  try {
    const query = `
      SELECT 
        column_name,
        data_type,
        description
      FROM \`bigquery-public-data.census_bureau_acs.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = '${level}_${year}_5yr'
      ORDER BY ordinal_position
    `;

    const [rows] = await myBigQuery.query({
      query,
      location: "US"
    });

    res.status(200).json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error("❌ Schema query error:", err);
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
 *   - year: ACS year (defaults to 2022)
 * Returns: Aggregated ACS data for tracts within the radius
 */
router.get('/census-acs-api', async (req, res) => {
  const { lat, lon, radius, year = '2022' } = req.query;
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