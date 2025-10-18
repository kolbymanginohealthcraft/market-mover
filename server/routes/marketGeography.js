// server/routes/marketGeography.js
// Geographic and demographic analysis for markets using public census data + vendor HCO data
import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";

const router = express.Router();

/**
 * GET /api/market-geography/profile
 * Get geographic breakdown of HCO data by county, city, ZIP
 * Shows how providers are distributed across different geographic areas
 * 
 * Query params: latitude, longitude, radius (in miles)
 */
router.get("/profile", async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude || !radius) {
      return res.status(400).json({
        error: "Missing required parameters: latitude, longitude, radius",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusMiles = parseFloat(radius);

    console.log(`🗺️ Generating HCO geographic profile for ${lat}, ${lng} (${radiusMiles}mi)`);

    const distanceFormula = `
      ST_DISTANCE(
        ST_GEOGPOINT(${lng}, ${lat}),
        ST_GEOGPOINT(primary_address_long, primary_address_lat)
      ) / 1609.34
    `;

    // Get breakdowns by county, city, ZIP
    const queries = await Promise.all([
      // County breakdown
      vendorBigQuery.query({
        query: `
          WITH nearby_hcos AS (
            SELECT 
              primary_address_county,
              primary_address_state_or_province,
              ${distanceFormula} as distance_miles
            FROM \`aegis_access.hco_flat\`
            WHERE 
              primary_address_lat IS NOT NULL 
              AND primary_address_long IS NOT NULL
              AND npi_deactivation_date IS NULL
              AND ${distanceFormula} <= ${radiusMiles}
          )
          SELECT
            primary_address_county as county,
            primary_address_state_or_province as state,
            COUNT(*) as hco_count,
            ROUND(AVG(distance_miles), 2) as avg_distance,
            ROUND(MIN(distance_miles), 2) as min_distance,
            ROUND(MAX(distance_miles), 2) as max_distance
          FROM nearby_hcos
          WHERE primary_address_county IS NOT NULL
          GROUP BY primary_address_county, primary_address_state_or_province
          ORDER BY hco_count DESC
        `
      }),
      // City breakdown
      vendorBigQuery.query({
        query: `
          WITH nearby_hcos AS (
            SELECT 
              primary_address_city,
              primary_address_state_or_province,
              ${distanceFormula} as distance_miles
            FROM \`aegis_access.hco_flat\`
            WHERE 
              primary_address_lat IS NOT NULL 
              AND primary_address_long IS NOT NULL
              AND npi_deactivation_date IS NULL
              AND ${distanceFormula} <= ${radiusMiles}
          )
          SELECT
            primary_address_city as city,
            primary_address_state_or_province as state,
            COUNT(*) as hco_count,
            ROUND(AVG(distance_miles), 2) as avg_distance
          FROM nearby_hcos
          WHERE primary_address_city IS NOT NULL
          GROUP BY primary_address_city, primary_address_state_or_province
          ORDER BY hco_count DESC
          LIMIT 20
        `
      }),
      // ZIP code breakdown
      vendorBigQuery.query({
        query: `
          WITH nearby_hcos AS (
            SELECT 
              primary_address_zip5,
              ${distanceFormula} as distance_miles
            FROM \`aegis_access.hco_flat\`
            WHERE 
              primary_address_lat IS NOT NULL 
              AND primary_address_long IS NOT NULL
              AND npi_deactivation_date IS NULL
              AND ${distanceFormula} <= ${radiusMiles}
          )
          SELECT
            primary_address_zip5 as zip,
            COUNT(*) as hco_count,
            ROUND(AVG(distance_miles), 2) as avg_distance
          FROM nearby_hcos
          WHERE primary_address_zip5 IS NOT NULL
          GROUP BY primary_address_zip5
          ORDER BY hco_count DESC
          LIMIT 20
        `
      })
    ]);

    const [countyResults, cityResults, zipResults] = queries;
    const counties = countyResults[0];
    const cities = cityResults[0];
    const zips = zipResults[0];

    // Calculate summary
    const totalHCOs = counties.reduce((sum, c) => sum + c.hco_count, 0);
    
    console.log(`✅ Geographic profile: ${totalHCOs} HCOs across ${counties.length} counties`);

    res.json({
      summary: {
        total_hcos: totalHCOs,
        counties_count: counties.length,
        cities_count: cities.length,
        zips_count: zips.length,
      },
      by_county: counties,
      by_city: cities,
      by_zip: zips,
    });

  } catch (error) {
    console.error("Error generating HCO geographic profile:", error);
    res.status(500).json({
      error: "Failed to generate HCO geographic profile",
      details: error.message,
    });
  }
});

/**
 * GET /api/market-geography/boundaries
 * Get GeoJSON boundaries for census tracts, ZIP codes, and counties that intersect with market radius
 * Returns polygon data for visualization on maps
 * 
 * Query params: latitude, longitude, radius (in miles), type (tracts|zips|counties)
 */
router.get("/boundaries", async (req, res) => {
  try {
    const { latitude, longitude, radius, type = 'tracts' } = req.query;

    if (!latitude || !longitude || !radius) {
      return res.status(400).json({
        error: "Missing required parameters: latitude, longitude, radius",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusMiles = parseFloat(radius);
    const radiusMeters = radiusMiles * 1609.34;

    console.log(`🗺️ Fetching ${type} boundaries for ${lat}, ${lng} (${radiusMiles}mi)`);

    let query;
    
    if (type === 'tracts') {
      // Census tracts - use actual polygon boundaries with no limit for complete coverage
      query = `
        SELECT 
          geo_id,
          state_fips_code,
          county_fips_code,
          tract_ce,
          ST_AsGeoJSON(ST_SIMPLIFY(tract_geom, 50)) as geometry
        FROM \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\`
        WHERE ST_INTERSECTS(
          tract_geom,
          ST_BUFFER(ST_GEOGPOINT(${lng}, ${lat}), ${radiusMeters})
        )
      `;
    } else if (type === 'zips') {
      // ZIP codes - use proper spatial intersection with no limit for complete coverage
      query = `
        SELECT 
          zip_code,
          ST_AsGeoJSON(ST_SIMPLIFY(zip_code_geom, 100)) as geometry
        FROM \`bigquery-public-data.geo_us_boundaries.zip_codes\`
        WHERE ST_INTERSECTS(
          zip_code_geom,
          ST_BUFFER(ST_GEOGPOINT(${lng}, ${lat}), ${radiusMeters})
        )
      `;
    } else if (type === 'counties') {
      // Counties - use proper spatial intersection with no limit
      query = `
        SELECT 
          county_fips_code,
          county_name,
          state_fips_code,
          ST_AsGeoJSON(county_geom) as geometry
        FROM \`bigquery-public-data.geo_us_boundaries.counties\`
        WHERE ST_INTERSECTS(
          county_geom,
          ST_BUFFER(ST_GEOGPOINT(${lng}, ${lat}), ${radiusMeters})
        )
      `;
    } else {
      return res.status(400).json({ error: "Invalid type. Must be 'tracts', 'zips', or 'counties'" });
    }

    const [results] = await vendorBigQuery.query({ query });

    // Convert to GeoJSON FeatureCollection
    const features = results.map(row => ({
      type: 'Feature',
      properties: {
        ...row,
        geometry: undefined // Remove geometry from properties
      },
      geometry: JSON.parse(row.geometry)
    }));

    const geojson = {
      type: 'FeatureCollection',
      features
    };

    console.log(`✅ Retrieved ${features.length} ${type} boundaries`);

    res.json(geojson);

  } catch (error) {
    console.error("Error fetching boundaries:", error);
    res.status(500).json({
      error: "Failed to fetch boundary data",
      details: error.message,
    });
  }
});

/**
 * GET /api/market-geography/demographics
 * Get demographic breakdown of market using ACS data
 * NOTE: This requires a second query to the public ACS tables
 * 
 * Query params: latitude, longitude, radius (in miles)
 */
router.get("/demographics", async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude || !radius) {
      return res.status(400).json({
        error: "Missing required parameters: latitude, longitude, radius",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusMiles = parseFloat(radius);
    const radiusMeters = radiusMiles * 1609.34;

    console.log(`📊 Fetching demographics for market at ${lat}, ${lng} (${radiusMiles}mi)`);

    // Query to get census tracts in market
    const tractsQuery = `
      SELECT 
        geo_id,
        state_fips_code,
        county_fips_code,
        internal_point_lat,
        internal_point_lon
      FROM \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\`
      WHERE ST_DISTANCE(
        ST_GEOGPOINT(CAST(internal_point_lon AS FLOAT64), CAST(internal_point_lat AS FLOAT64)),
        ST_GEOGPOINT(${lng}, ${lat})
      ) <= ${radiusMeters}
    `;

    const [tracts] = await vendorBigQuery.query({ query: tractsQuery });
    
    if (tracts.length === 0) {
      return res.json({
        summary: {
          total_population: 0,
          tract_count: 0,
        },
        message: "No census tracts found in this radius"
      });
    }

    // Get unique state-county combinations for ACS API calls
    const counties = [...new Set(tracts.map(t => `${t.state_fips_code}${t.county_fips_code}`))];
    
    console.log(`✅ Found ${tracts.length} tracts across ${counties.length} counties`);

    res.json({
      summary: {
        tract_count: tracts.length,
        county_count: counties.length,
        state_count: new Set(tracts.map(t => t.state_fips_code)).size,
      },
      tracts: tracts.map(t => ({
        geo_id: t.geo_id,
        state_fips: t.state_fips_code,
        county_fips: t.county_fips_code,
        lat: t.internal_point_lat,
        lon: t.internal_point_lon,
      })),
      note: "Use existing /api/census-acs-api endpoint for detailed demographic data",
    });

  } catch (error) {
    console.error("Error fetching market demographics:", error);
    res.status(500).json({
      error: "Failed to fetch market demographics",
      details: error.message,
    });
  }
});

/**
 * GET /api/market-geography/distance-distribution
 * Get HCO distribution by distance from center point
 * Shows how providers cluster or spread across the market
 * 
 * Query params: latitude, longitude, radius (in miles)
 */
router.get("/distance-distribution", async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude || !radius) {
      return res.status(400).json({
        error: "Missing required parameters: latitude, longitude, radius",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusMiles = parseFloat(radius);

    console.log(`📊 Analyzing HCO distance distribution for ${lat}, ${lng} (${radiusMiles}mi)`);

    const distanceFormula = `
      ST_DISTANCE(
        ST_GEOGPOINT(${lng}, ${lat}),
        ST_GEOGPOINT(primary_address_long, primary_address_lat)
      ) / 1609.34
    `;

    // Get distance distribution
    const query = `
      WITH nearby_hcos AS (
        SELECT 
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hco_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}
      ),
      distance_bands AS (
        SELECT
          CASE
            WHEN distance_miles < 5 THEN '0-5 miles'
            WHEN distance_miles < 10 THEN '5-10 miles'
            WHEN distance_miles < 15 THEN '10-15 miles'
            WHEN distance_miles < 20 THEN '15-20 miles'
            ELSE '20+ miles'
          END as distance_band,
          distance_miles
        FROM nearby_hcos
      )
      SELECT
        distance_band,
        COUNT(*) as hco_count,
        ROUND(AVG(distance_miles), 2) as avg_distance,
        ROUND(MIN(distance_miles), 2) as min_distance,
        ROUND(MAX(distance_miles), 2) as max_distance
      FROM distance_bands
      GROUP BY distance_band
      ORDER BY 
        CASE distance_band
          WHEN '0-5 miles' THEN 1
          WHEN '5-10 miles' THEN 2
          WHEN '10-15 miles' THEN 3
          WHEN '15-20 miles' THEN 4
          WHEN '20+ miles' THEN 5
        END
    `;

    const [results] = await vendorBigQuery.query({ query });
    const totalHCOs = results.reduce((sum, r) => sum + r.hco_count, 0);

    console.log(`✅ Distance distribution: ${totalHCOs} HCOs across ${results.length} bands`);

    res.json({
      summary: {
        total_hcos: totalHCOs,
        bands_count: results.length,
      },
      distribution: results.map(r => ({
        ...r,
        percentage: ((r.hco_count / totalHCOs) * 100).toFixed(1)
      })),
    });

  } catch (error) {
    console.error("Error analyzing distance distribution:", error);
    res.status(500).json({
      error: "Failed to analyze distance distribution",
      details: error.message,
    });
  }
});

export default router;
