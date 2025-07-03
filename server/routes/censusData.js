import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";

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

export default router; 