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
  try {
    // 1. Get all tract centroids from BigQuery
    const bqQuery = `
      SELECT geo_id, state_fips_code, county_fips_code, tract_ce, internal_point_lat AS lat, internal_point_lon AS lon
      FROM \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\`
    `;
    const [tractRows] = await myBigQuery.query({ query: bqQuery, location: 'US' });
    // 2. Filter tracts by radius
    const center = [parseFloat(lon), parseFloat(lat)];
    const radiusMiles = parseFloat(radius);
    const filteredTracts = tractRows.filter(t => {
      const from = turf.point([parseFloat(t.lon), parseFloat(t.lat)]);
      const to = turf.point(center);
      const dist = turf.distance(from, to, { units: 'miles' });
      return dist <= radiusMiles;
    });
    if (filteredTracts.length === 0) {
      return res.status(200).json({ success: true, data: { market_totals: { total_population: 0, population_65_plus: 0, median_income: 0, total_tracts: 0, acs_year: year }, geographic_units: [] } });
    }
    // 3. Group by state/county
    const tractsByCounty = {};
    for (const t of filteredTracts) {
      const key = `${t.state_fips_code}${t.county_fips_code}`;
      if (!tractsByCounty[key]) tractsByCounty[key] = { state: t.state_fips_code, county: t.county_fips_code, tracts: [] };
      tractsByCounty[key].tracts.push(t.tract_ce);
    }
    // 4. Fetch ACS data for each county
    const ACS_VARS = [
      // Population
      'B01001_001E', // total pop
      // Age
      'B01001_003E','B01001_004E','B01001_005E','B01001_006E', // male under 18
      'B01001_027E','B01001_028E','B01001_029E','B01001_030E', // female under 18
      'B01001_020E','B01001_021E','B01001_022E','B01001_023E','B01001_024E','B01001_025E', // male 65+
      'B01001_044E','B01001_045E','B01001_046E','B01001_047E','B01001_048E','B01001_049E', // female 65+
      // Race/ethnicity
      'B02001_002E', // White alone
      'B02001_003E', // Black alone
      'B02001_005E', // Asian alone
      'B03003_003E', // Hispanic/Latino
      // Economic
      'B19013_001E', // median income
      'B19301_001E', // per capita income
      'B17001_001E', // poverty universe
      'B17001_002E', // below poverty
      // Insurance
      'B27010_001E', // insurance universe
      'B27010_017E', // uninsured
      // Disability
      'B18101_001E', // disability universe
      'B18101_004E', // male with disability
      'B18101_007E', // female with disability
      // Education
      'B15003_001E', // education universe
      'B15003_022E','B15003_023E','B15003_024E','B15003_025E', // bachelor's+
      // Housing/cost of living
      'B25064_001E', // median gross rent
      'B25077_001E'  // median home value
    ].join(',');
    let allTractData = [];
    for (const key of Object.keys(tractsByCounty)) {
      const { state, county, tracts } = tractsByCounty[key];
      const url = `https://api.census.gov/data/${year}/acs/acs5?get=${ACS_VARS}&for=tract:*&in=state:${state}+county:${county}`;
      const resp = await fetch(url);
      const data = await resp.json();
      const header = data[0];
      const rows = data.slice(1);
      for (const row of rows) {
        const obj = {};
        header.forEach((h, i) => { obj[h] = row[i]; });
        if (tracts.includes(obj['tract'])) {
          // Calculate 65+ population
          const m65 = ['B01001_020E','B01001_021E','B01001_022E','B01001_023E','B01001_024E','B01001_025E'].map(k => Number(obj[k]) || 0).reduce((a,b) => a+b,0);
          const f65 = ['B01001_044E','B01001_045E','B01001_046E','B01001_047E','B01001_048E','B01001_049E'].map(k => Number(obj[k]) || 0).reduce((a,b) => a+b,0);
          // Calculate under 18 population
          const mUnder18 = ['B01001_003E','B01001_004E','B01001_005E','B01001_006E'].map(k => Number(obj[k]) || 0).reduce((a,b) => a+b,0);
          const fUnder18 = ['B01001_027E','B01001_028E','B01001_029E','B01001_030E'].map(k => Number(obj[k]) || 0).reduce((a,b) => a+b,0);
          // Bachelor's+
          const bachelors = ['B15003_022E','B15003_023E','B15003_024E','B15003_025E'].map(k => Number(obj[k]) || 0).reduce((a,b) => a+b,0);
          allTractData.push({
            total_pop: Number(obj['B01001_001E']) || 0,
            pop_65_plus: m65 + f65,
            pop_under_18: mUnder18 + fUnder18,
            white: Number(obj['B02001_002E']) || 0,
            black: Number(obj['B02001_003E']) || 0,
            asian: Number(obj['B02001_005E']) || 0,
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
            median_home_value: Number(obj['B25077_001E']) || 0
          });
        }
      }
    }
    // 5. Aggregate
    let total_population = 0, population_65_plus = 0, population_under_18 = 0;
    let white = 0, black = 0, asian = 0, hispanic = 0;
    let median_income_sum = 0, median_income_count = 0;
    let per_capita_income_sum = 0, per_capita_income_count = 0;
    let below_poverty = 0, poverty_universe = 0;
    let uninsured = 0, insurance_universe = 0;
    let disability = 0, disability_universe = 0;
    let bachelors_plus = 0, education_universe = 0;
    let median_rent_sum = 0, median_rent_count = 0;
    let median_home_value_sum = 0, median_home_value_count = 0;
    for (const t of allTractData) {
      total_population += t.total_pop;
      population_65_plus += t.pop_65_plus;
      population_under_18 += t.pop_under_18;
      white += t.white;
      black += t.black;
      asian += t.asian;
      hispanic += t.hispanic;
      if (t.median_income > 0) { median_income_sum += t.median_income; median_income_count++; }
      if (t.per_capita_income > 0) { per_capita_income_sum += t.per_capita_income; per_capita_income_count++; }
      below_poverty += t.below_poverty;
      poverty_universe += t.poverty_universe;
      uninsured += t.uninsured;
      insurance_universe += t.insurance_universe;
      disability += t.male_disability + t.female_disability;
      disability_universe += t.disability_universe;
      bachelors_plus += t.bachelors_plus;
      education_universe += t.education_universe;
      if (t.median_rent > 0) { median_rent_sum += t.median_rent; median_rent_count++; }
      if (t.median_home_value > 0) { median_home_value_sum += t.median_home_value; median_home_value_count++; }
    }
    const result = {
      market_totals: {
        total_population,
        population_65_plus,
        population_under_18,
        white,
        black,
        asian,
        hispanic,
        median_income: median_income_count ? Math.round(median_income_sum / median_income_count) : null,
        per_capita_income: per_capita_income_count ? Math.round(per_capita_income_sum / per_capita_income_count) : null,
        poverty_rate: poverty_universe ? below_poverty / poverty_universe : null,
        uninsured_rate: insurance_universe ? uninsured / insurance_universe : null,
        disability_rate: disability_universe ? disability / disability_universe : null,
        bachelors_plus_rate: education_universe ? bachelors_plus / education_universe : null,
        median_rent: median_rent_count ? Math.round(median_rent_sum / median_rent_count) : null,
        median_home_value: median_home_value_count ? Math.round(median_home_value_sum / median_home_value_count) : null,
        total_tracts: allTractData.length,
        acs_year: year
      },
      geographic_units: []
    };
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('❌ Census ACS API error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router; 