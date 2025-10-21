// server/routes/hcoData.js
import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

/**
 * Calculate distance using BigQuery's ST_DISTANCE function
 * Returns distance in miles
 */
function getDistanceFormula(centerLat, centerLng) {
  return `
    ST_DISTANCE(
      ST_GEOGPOINT(${centerLng}, ${centerLat}),
      ST_GEOGPOINT(primary_address_long, primary_address_lat)
    ) / 1609.34
  `;
}

/**
 * GET /api/hco-data/national-overview
 * Get national-level statistics for HCOs (fast, cached)
 * No query params needed - returns pre-aggregated national data
 */
router.get("/national-overview", async (req, res) => {
  try {
    const cacheKey = 'hco-national-overview-v2';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('✅ Returning cached national HCO overview');
      return res.json({
        success: true,
        ...cached,
        cached: true
      });
    }

    console.log('📊 Fetching national HCO overview (will be cached)...');

    // Query for national statistics - aggregated, not individual rows
    const statsQuery = `
      SELECT
        COUNT(*) as total_organizations,
        COUNT(DISTINCT definitive_firm_type) as distinct_firm_types,
        COUNT(DISTINCT CASE 
          WHEN LENGTH(primary_address_state_or_province) = 2 
            AND primary_address_state_or_province IN (
              'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
              'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
              'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
              'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
              'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
              'DC'
            )
          THEN primary_address_state_or_province 
        END) as distinct_states,
        COUNTIF(hospital_parent_id IS NOT NULL) as with_hospital_parent,
        COUNTIF(physician_group_parent_id IS NOT NULL) as with_physician_group_parent,
        COUNTIF(network_id IS NOT NULL) as with_network_affiliation,
        COUNTIF(definitive_id IS NOT NULL) as with_definitive_id
      FROM \`aegis_access.hco_flat\`
      WHERE npi_deactivation_date IS NULL
    `;

    // Top firm types
    const firmTypesQuery = `
      SELECT
        definitive_firm_type,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE npi_deactivation_date IS NULL
        AND definitive_firm_type IS NOT NULL
      GROUP BY definitive_firm_type
      ORDER BY count DESC
      LIMIT 15
    `;

    // State distribution - filter to valid US states only (2-letter codes)
    const statesQuery = `
      SELECT
        primary_address_state_or_province as state,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE npi_deactivation_date IS NULL
        AND primary_address_state_or_province IS NOT NULL
        AND LENGTH(primary_address_state_or_province) = 2
        AND primary_address_state_or_province IN (
          'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
          'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
          'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
          'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
          'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
          'DC'
        )
      GROUP BY primary_address_state_or_province
      ORDER BY count DESC
    `;

    // Taxonomy breakdown
    const taxonomyQuery = `
      SELECT
        primary_taxonomy_classification as classification,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE npi_deactivation_date IS NULL
        AND primary_taxonomy_classification IS NOT NULL
      GROUP BY primary_taxonomy_classification
      ORDER BY count DESC
      LIMIT 20
    `;

    // Execute all queries in parallel
    const [
      [overallStats],
      [firmTypes],
      [states],
      [taxonomy]
    ] = await Promise.all([
      vendorBigQuery.query({ query: statsQuery }),
      vendorBigQuery.query({ query: firmTypesQuery }),
      vendorBigQuery.query({ query: statesQuery }),
      vendorBigQuery.query({ query: taxonomyQuery })
    ]);

    const result = {
      success: true,
      data: {
        overall: overallStats[0],
        firmTypes: firmTypes,
        states: states,
        taxonomy: taxonomy
      },
      timestamp: new Date().toISOString()
    };

    // Cache for 1 hour (national stats don't change often)
    cache.set(cacheKey, result, 3600);
    
    console.log(`✅ National HCO overview complete: ${overallStats[0].total_organizations?.toLocaleString()} organizations`);

    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching national HCO overview:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/hco-data/stats
 * Get HCO statistics for a geographic area
 * Query params: latitude, longitude, radius (in miles)
 */
router.get("/stats", async (req, res) => {
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

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusMiles)) {
      return res.status(400).json({
        error: "Invalid parameters: latitude, longitude, and radius must be numbers",
      });
    }

    const distanceFormula = getDistanceFormula(lat, lng);

    // Query for overall statistics
    const statsQuery = `
      WITH nearby_hcos AS (
        SELECT 
          *,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hco_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}
      )
      SELECT
        COUNT(*) as total_organizations,
        COUNT(DISTINCT definitive_firm_type) as distinct_firm_types,
        COUNT(DISTINCT CASE 
          WHEN LENGTH(primary_address_state_or_province) = 2 
            AND primary_address_state_or_province IN (
              'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
              'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
              'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
              'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
              'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
              'DC'
            )
          THEN primary_address_state_or_province 
        END) as distinct_states,
        COUNT(DISTINCT primary_address_city) as distinct_cities,
        COUNT(DISTINCT primary_address_zip5) as distinct_zip_codes,
        COUNTIF(definitive_id IS NOT NULL) as with_definitive_id,
        COUNTIF(hospital_parent_id IS NOT NULL) as with_hospital_parent,
        COUNTIF(physician_group_parent_id IS NOT NULL) as with_physician_group_parent,
        COUNTIF(network_id IS NOT NULL) as with_network_affiliation,
        ROUND(AVG(distance_miles), 2) as avg_distance_miles,
        ROUND(MIN(distance_miles), 2) as min_distance_miles,
        ROUND(MAX(distance_miles), 2) as max_distance_miles
      FROM nearby_hcos
    `;

    const [statsResults] = await vendorBigQuery.query({ query: statsQuery });
    const stats = statsResults[0];

    // Query for breakdown by firm type
    const firmTypeQuery = `
      WITH nearby_hcos AS (
        SELECT 
          *,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hco_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}
      )
      SELECT
        definitive_firm_type,
        definitive_firm_type_full,
        COUNT(*) as count,
        ROUND(AVG(distance_miles), 2) as avg_distance
      FROM nearby_hcos
      WHERE definitive_firm_type IS NOT NULL
      GROUP BY definitive_firm_type, definitive_firm_type_full
      ORDER BY count DESC
      LIMIT 20
    `;

    const [firmTypeResults] = await vendorBigQuery.query({ query: firmTypeQuery });

    // Query for breakdown by taxonomy classification with procedure volume
    const taxonomyClassificationQuery = `
      WITH nearby_hcos AS (
        SELECT 
          npi,
          primary_taxonomy_classification,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hco_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}
      ),
      procedure_volumes AS (
        SELECT 
          billing_provider_npi,
          SUM(count) as total_procedures
        FROM \`aegis_access.volume_procedure\`
        WHERE 
          date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
          AND billing_provider_npi IN (SELECT npi FROM nearby_hcos)
        GROUP BY billing_provider_npi
      )
      SELECT
        h.primary_taxonomy_classification,
        COUNT(DISTINCT h.npi) as count,
        COUNTIF(v.total_procedures IS NOT NULL) as orgs_with_procedures,
        SUM(IFNULL(v.total_procedures, 0)) as total_procedures,
        ROUND(AVG(h.distance_miles), 2) as avg_distance
      FROM nearby_hcos h
      LEFT JOIN procedure_volumes v ON h.npi = v.billing_provider_npi
      WHERE h.primary_taxonomy_classification IS NOT NULL
      GROUP BY h.primary_taxonomy_classification
      ORDER BY count DESC
      LIMIT 30
    `;

    const [taxonomyClassificationResults] = await vendorBigQuery.query({ query: taxonomyClassificationQuery });

    // Query for breakdown by consolidated specialty with procedure volume
    const consolidatedSpecialtyQuery = `
      WITH nearby_hcos AS (
        SELECT 
          npi,
          primary_taxonomy_consolidated_specialty,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hco_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}
      ),
      procedure_volumes AS (
        SELECT 
          billing_provider_npi,
          SUM(count) as total_procedures
        FROM \`aegis_access.volume_procedure\`
        WHERE 
          date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
          AND billing_provider_npi IN (SELECT npi FROM nearby_hcos)
        GROUP BY billing_provider_npi
      )
      SELECT
        h.primary_taxonomy_consolidated_specialty,
        COUNT(DISTINCT h.npi) as count,
        COUNTIF(v.total_procedures IS NOT NULL) as orgs_with_procedures,
        SUM(IFNULL(v.total_procedures, 0)) as total_procedures,
        ROUND(AVG(h.distance_miles), 2) as avg_distance
      FROM nearby_hcos h
      LEFT JOIN procedure_volumes v ON h.npi = v.billing_provider_npi
      WHERE h.primary_taxonomy_consolidated_specialty IS NOT NULL
      GROUP BY h.primary_taxonomy_consolidated_specialty
      ORDER BY count DESC
      LIMIT 30
    `;

    const [consolidatedSpecialtyResults] = await vendorBigQuery.query({ query: consolidatedSpecialtyQuery });

    // Query for breakdown by taxonomy grouping
    const taxonomyGroupingQuery = `
      WITH nearby_hcos AS (
        SELECT 
          *,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hco_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}
      )
      SELECT
        primary_taxonomy_grouping,
        COUNT(*) as count,
        ROUND(AVG(distance_miles), 2) as avg_distance
      FROM nearby_hcos
      WHERE primary_taxonomy_grouping IS NOT NULL
      GROUP BY primary_taxonomy_grouping
      ORDER BY count DESC
      LIMIT 20
    `;

    const [taxonomyGroupingResults] = await vendorBigQuery.query({ query: taxonomyGroupingQuery });

    // Query for breakdown by state
    const stateQuery = `
      WITH nearby_hcos AS (
        SELECT 
          *,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hco_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}
      )
      SELECT
        primary_address_state_or_province as state,
        COUNT(*) as count,
        ROUND(AVG(distance_miles), 2) as avg_distance
      FROM nearby_hcos
      WHERE primary_address_state_or_province IS NOT NULL
      GROUP BY primary_address_state_or_province
      ORDER BY count DESC
      LIMIT 10
    `;

    const [stateResults] = await vendorBigQuery.query({ query: stateQuery });

    // Query for top cities
    const cityQuery = `
      WITH nearby_hcos AS (
        SELECT 
          *,
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
        COUNT(*) as count,
        ROUND(AVG(distance_miles), 2) as avg_distance
      FROM nearby_hcos
      WHERE primary_address_city IS NOT NULL
      GROUP BY primary_address_city, primary_address_state_or_province
      ORDER BY count DESC
      LIMIT 15
    `;

    const [cityResults] = await vendorBigQuery.query({ query: cityQuery });

    // Query for top hospital parents with procedure volume
    const hospitalParentQuery = `
      WITH nearby_hcos AS (
        SELECT 
          npi,
          hospital_parent_name,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hco_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}
      ),
      procedure_volumes AS (
        SELECT 
          billing_provider_npi,
          SUM(count) as total_procedures
        FROM \`aegis_access.volume_procedure\`
        WHERE 
          date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
          AND billing_provider_npi IN (SELECT npi FROM nearby_hcos)
        GROUP BY billing_provider_npi
      )
      SELECT
        h.hospital_parent_name,
        COUNT(DISTINCT h.npi) as count,
        COUNTIF(v.total_procedures IS NOT NULL) as orgs_with_procedures,
        SUM(IFNULL(v.total_procedures, 0)) as total_procedures,
        ROUND(AVG(h.distance_miles), 2) as avg_distance
      FROM nearby_hcos h
      LEFT JOIN procedure_volumes v ON h.npi = v.billing_provider_npi
      WHERE h.hospital_parent_name IS NOT NULL
      GROUP BY h.hospital_parent_name
      ORDER BY count DESC
      LIMIT 20
    `;

    const [hospitalParentResults] = await vendorBigQuery.query({ query: hospitalParentQuery });

    // Query for top networks with procedure volume
    const networkQuery = `
      WITH nearby_hcos AS (
        SELECT 
          npi,
          network_name,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hco_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}
      ),
      procedure_volumes AS (
        SELECT 
          billing_provider_npi,
          SUM(count) as total_procedures
        FROM \`aegis_access.volume_procedure\`
        WHERE 
          date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
          AND billing_provider_npi IN (SELECT npi FROM nearby_hcos)
        GROUP BY billing_provider_npi
      )
      SELECT
        h.network_name,
        COUNT(DISTINCT h.npi) as count,
        COUNTIF(v.total_procedures IS NOT NULL) as orgs_with_procedures,
        SUM(IFNULL(v.total_procedures, 0)) as total_procedures,
        ROUND(AVG(h.distance_miles), 2) as avg_distance
      FROM nearby_hcos h
      LEFT JOIN procedure_volumes v ON h.npi = v.billing_provider_npi
      WHERE h.network_name IS NOT NULL
      GROUP BY h.network_name
      ORDER BY count DESC
      LIMIT 20
    `;

    const [networkResults] = await vendorBigQuery.query({ query: networkQuery });

    res.json({
      parameters: {
        latitude: lat,
        longitude: lng,
        radius_miles: radiusMiles,
      },
      stats: {
        total_organizations: parseInt(stats.total_organizations),
        distinct_firm_types: parseInt(stats.distinct_firm_types),
        distinct_states: parseInt(stats.distinct_states),
        distinct_cities: parseInt(stats.distinct_cities),
        distinct_zip_codes: parseInt(stats.distinct_zip_codes),
        with_definitive_id: parseInt(stats.with_definitive_id),
        with_hospital_parent: parseInt(stats.with_hospital_parent),
        with_physician_group_parent: parseInt(stats.with_physician_group_parent),
        with_network_affiliation: parseInt(stats.with_network_affiliation),
        avg_distance_miles: parseFloat(stats.avg_distance_miles),
        min_distance_miles: parseFloat(stats.min_distance_miles),
        max_distance_miles: parseFloat(stats.max_distance_miles),
      },
      breakdown_by_firm_type: firmTypeResults.map((row) => ({
        firm_type: row.definitive_firm_type,
        firm_type_full: row.definitive_firm_type_full,
        count: parseInt(row.count),
        avg_distance: parseFloat(row.avg_distance),
      })),
      breakdown_by_state: stateResults.map((row) => ({
        state: row.state,
        count: parseInt(row.count),
        avg_distance: parseFloat(row.avg_distance),
      })),
      breakdown_by_city: cityResults.map((row) => ({
        city: row.city,
        state: row.state,
        count: parseInt(row.count),
        avg_distance: parseFloat(row.avg_distance),
      })),
      breakdown_by_taxonomy_classification: taxonomyClassificationResults.map((row) => ({
        classification: row.primary_taxonomy_classification,
        count: parseInt(row.count),
        orgs_with_procedures: parseInt(row.orgs_with_procedures || 0),
        total_procedures: parseInt(row.total_procedures || 0),
        avg_distance: parseFloat(row.avg_distance),
      })),
      breakdown_by_consolidated_specialty: consolidatedSpecialtyResults.map((row) => ({
        specialty: row.primary_taxonomy_consolidated_specialty,
        count: parseInt(row.count),
        orgs_with_procedures: parseInt(row.orgs_with_procedures || 0),
        total_procedures: parseInt(row.total_procedures || 0),
        avg_distance: parseFloat(row.avg_distance),
      })),
      breakdown_by_taxonomy_grouping: taxonomyGroupingResults.map((row) => ({
        grouping: row.primary_taxonomy_grouping,
        count: parseInt(row.count),
        avg_distance: parseFloat(row.avg_distance),
      })),
      breakdown_by_hospital_parent: hospitalParentResults.map((row) => ({
        hospital_parent_name: row.hospital_parent_name,
        count: parseInt(row.count),
        orgs_with_procedures: parseInt(row.orgs_with_procedures || 0),
        total_procedures: parseInt(row.total_procedures || 0),
        avg_distance: parseFloat(row.avg_distance),
      })),
      breakdown_by_network: networkResults.map((row) => ({
        network_name: row.network_name,
        count: parseInt(row.count),
        orgs_with_procedures: parseInt(row.orgs_with_procedures || 0),
        total_procedures: parseInt(row.total_procedures || 0),
        avg_distance: parseFloat(row.avg_distance),
      })),
    });
  } catch (error) {
    console.error("Error fetching HCO data:", error);
    res.status(500).json({
      error: "Failed to fetch HCO data",
      details: error.message,
    });
  }
});

/**
 * GET /api/hco-data/sample
 * Get sample HCO records for a geographic area
 * Query params: latitude, longitude, radius (in miles), limit (optional)
 */
router.get("/sample", async (req, res) => {
  try {
    const { latitude, longitude, radius, limit = 100 } = req.query;

    if (!latitude || !longitude || !radius) {
      return res.status(400).json({
        error: "Missing required parameters: latitude, longitude, radius",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusMiles = parseFloat(radius);
    const limitNum = parseInt(limit);

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusMiles)) {
      return res.status(400).json({
        error: "Invalid parameters: latitude, longitude, and radius must be numbers",
      });
    }

    const distanceFormula = getDistanceFormula(lat, lng);

    const sampleQuery = `
      WITH nearby_hcos AS (
        SELECT 
          npi,
          name,
          healthcare_organization_name,
          definitive_id,
          definitive_name,
          definitive_firm_type,
          definitive_firm_type_full,
          primary_taxonomy_classification,
          primary_taxonomy_consolidated_specialty,
          primary_taxonomy_grouping,
          primary_address_line_1,
          primary_address_city,
          primary_address_state_or_province,
          primary_address_zip5,
          primary_address_lat,
          primary_address_long,
          primary_address_county,
          hospital_parent_id,
          hospital_parent_name,
          physician_group_parent_id,
          physician_group_parent_name,
          network_id,
          network_name,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hco_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}
      ),
      procedure_volumes AS (
        SELECT 
          billing_provider_npi,
          SUM(count) as total_procedures
        FROM \`aegis_access.volume_procedure\`
        WHERE 
          date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
          AND billing_provider_npi IN (SELECT npi FROM nearby_hcos)
        GROUP BY billing_provider_npi
      )
      SELECT 
        h.*,
        IFNULL(v.total_procedures, 0) as procedure_volume_12mo
      FROM nearby_hcos h
      LEFT JOIN procedure_volumes v ON h.npi = v.billing_provider_npi
      ORDER BY h.distance_miles ASC
      LIMIT ${limitNum}
    `;

    const [results] = await vendorBigQuery.query({ query: sampleQuery });

    res.json({
      parameters: {
        latitude: lat,
        longitude: lng,
        radius_miles: radiusMiles,
      },
      count: results.length,
      organizations: results.map((row) => ({
        npi: row.npi,
        name: row.name,
        healthcare_organization_name: row.healthcare_organization_name,
        firm_type: row.definitive_firm_type,
        firm_type_full: row.definitive_firm_type_full,
        taxonomy: {
          grouping: row.primary_taxonomy_grouping,
          classification: row.primary_taxonomy_classification,
          consolidated_specialty: row.primary_taxonomy_consolidated_specialty,
        },
        address: {
          line_1: row.primary_address_line_1,
          city: row.primary_address_city,
          state: row.primary_address_state_or_province,
          zip: row.primary_address_zip5,
          county: row.primary_address_county,
          latitude: parseFloat(row.primary_address_lat),
          longitude: parseFloat(row.primary_address_long),
        },
        relationships: {
          definitive_id: row.definitive_id,
          definitive_name: row.definitive_name,
          hospital_parent_id: row.hospital_parent_id,
          hospital_parent_name: row.hospital_parent_name,
          physician_group_parent_id: row.physician_group_parent_id,
          physician_group_parent_name: row.physician_group_parent_name,
          network_id: row.network_id,
          network_name: row.network_name,
        },
        distance_miles: parseFloat(row.distance_miles),
        procedure_volume_12mo: parseInt(row.procedure_volume_12mo || 0),
      })),
    });
  } catch (error) {
    console.error("Error fetching HCO sample data:", error);
    res.status(500).json({
      error: "Failed to fetch HCO sample data",
      details: error.message,
    });
  }
});

/**
 * GET /api/hco-data/stats-by-tract
 * ENHANCED APPROACH: Uses public census tract data for more accurate geographic filtering
 * Instead of simple radius, this:
 * 1. Finds census tracts within radius
 * 2. Matches HCOs to their census tract (using ST_CONTAINS for exact geographic membership)
 * 3. Returns only HCOs that are actually in those tracts
 * 
 * Advantages over simple radius:
 * - More accurate (respects real geographic boundaries)
 * - Enables demographic filtering (can filter tracts by income, age, etc.)
 * - Faster (single BigQuery query vs two-step process)
 * - No data transfer between BigQuery instances
 * 
 * Query params: latitude, longitude, radius (in miles)
 */
router.get("/stats-by-tract", async (req, res) => {
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

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusMiles)) {
      return res.status(400).json({
        error: "Invalid parameters: latitude, longitude, and radius must be numbers",
      });
    }

    console.log(`🗺️ Fetching HCO stats using census tract approach for ${lat}, ${lng} with ${radiusMiles}mi radius`);

    const distanceFormula = getDistanceFormula(lat, lng);

    // UNIFIED QUERY: Get census tracts in radius AND match HCOs to those tracts
    const unifiedQuery = `
      WITH market_tracts AS (
        -- Step 1: Find census tracts within the specified radius
        SELECT 
          geo_id,
          state_fips_code,
          county_fips_code,
          tract_ce,
          tract_geom,
          internal_point_lat,
          internal_point_lon
        FROM \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\`
        WHERE ST_DISTANCE(
          ST_GEOGPOINT(CAST(internal_point_lon AS FLOAT64), CAST(internal_point_lat AS FLOAT64)),
          ST_GEOGPOINT(${lng}, ${lat})
        ) <= ${radiusMeters}
      ),
      hcos_in_market AS (
        -- Step 2: Match HCOs to census tracts
        SELECT 
          h.*,
          ${distanceFormula} as distance_miles,
          (
            SELECT t.geo_id
            FROM market_tracts t
            WHERE ST_CONTAINS(
              ST_GEOGFROMTEXT(t.tract_geom),
              ST_GEOGPOINT(h.primary_address_long, h.primary_address_lat)
            )
            LIMIT 1
          ) as census_tract_id
        FROM \`aegis_access.hco_flat\` h
        WHERE 
          h.primary_address_lat IS NOT NULL 
          AND h.primary_address_long IS NOT NULL
          AND h.npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}  -- Pre-filter by radius for performance
      )
      SELECT
        COUNT(*) as total_organizations,
        COUNT(DISTINCT definitive_firm_type) as distinct_firm_types,
        COUNT(DISTINCT CASE 
          WHEN LENGTH(primary_address_state_or_province) = 2 
            AND primary_address_state_or_province IN (
              'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
              'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
              'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
              'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
              'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
              'DC'
            )
          THEN primary_address_state_or_province 
        END) as distinct_states,
        COUNT(DISTINCT primary_address_city) as distinct_cities,
        COUNT(DISTINCT primary_address_zip5) as distinct_zip_codes,
        COUNT(DISTINCT census_tract_id) as distinct_census_tracts,
        COUNTIF(definitive_id IS NOT NULL) as with_definitive_id,
        COUNTIF(hospital_parent_id IS NOT NULL) as with_hospital_parent,
        COUNTIF(physician_group_parent_id IS NOT NULL) as with_physician_group_parent,
        COUNTIF(network_id IS NOT NULL) as with_network_affiliation,
        COUNTIF(census_tract_id IS NOT NULL) as matched_to_tract,
        COUNTIF(census_tract_id IS NULL) as unmatched_to_tract,
        ROUND(AVG(distance_miles), 2) as avg_distance_miles,
        ROUND(MIN(distance_miles), 2) as min_distance_miles,
        ROUND(MAX(distance_miles), 2) as max_distance_miles
      FROM hcos_in_market
      WHERE census_tract_id IS NOT NULL  -- Only HCOs that matched to a tract
    `;

    const [statsResults] = await vendorBigQuery.query({ query: unifiedQuery });
    const stats = statsResults[0];

    console.log(`✅ Found ${stats.total_organizations} HCOs in ${stats.distinct_census_tracts} census tracts`);

    res.json({
      stats,
      method: 'census_tract_based',
      query_info: {
        center: { lat, lng },
        radius_miles: radiusMiles,
        tracts_used: stats.distinct_census_tracts || 0,
        match_rate: stats.total_organizations > 0 
          ? `${Math.round((stats.matched_to_tract / stats.total_organizations) * 100)}%` 
          : 'N/A'
      }
    });

  } catch (error) {
    console.error("Error fetching HCO stats (census tract method):", error);
    res.status(500).json({
      error: "Failed to fetch HCO stats using census tract method",
      details: error.message,
    });
  }
});

/**
 * GET /api/hco-data/sample-by-tract
 * Get sample HCO data using census tract filtering
 * Similar to /sample but uses the enhanced census tract approach
 * Query params: latitude, longitude, radius, limit (optional, default 100)
 */
router.get("/sample-by-tract", async (req, res) => {
  try {
    const { latitude, longitude, radius, limit = 100 } = req.query;

    if (!latitude || !longitude || !radius) {
      return res.status(400).json({
        error: "Missing required parameters: latitude, longitude, radius",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusMiles = parseFloat(radius);
    const radiusMeters = radiusMiles * 1609.34;
    const limitNum = parseInt(limit);

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusMiles)) {
      return res.status(400).json({
        error: "Invalid parameters: latitude, longitude, and radius must be numbers",
      });
    }

    console.log(`🗺️ Fetching HCO sample data using census tract approach (limit: ${limitNum})`);

    const distanceFormula = getDistanceFormula(lat, lng);

    // Query with census tract matching AND procedure volume
    const sampleQuery = `
      WITH market_tracts AS (
        SELECT 
          geo_id,
          tract_geom
        FROM \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\`
        WHERE ST_DISTANCE(
          ST_GEOGPOINT(CAST(internal_point_lon AS FLOAT64), CAST(internal_point_lat AS FLOAT64)),
          ST_GEOGPOINT(${lng}, ${lat})
        ) <= ${radiusMeters}
      ),
      nearby_hcos AS (
        SELECT 
          h.*,
          ${distanceFormula} as distance_miles,
          (
            SELECT t.geo_id
            FROM market_tracts t
            WHERE ST_CONTAINS(
              ST_GEOGFROMTEXT(t.tract_geom),
              ST_GEOGPOINT(h.primary_address_long, h.primary_address_lat)
            )
            LIMIT 1
          ) as census_tract_id
        FROM \`aegis_access.hco_flat\` h
        WHERE 
          h.primary_address_lat IS NOT NULL 
          AND h.primary_address_long IS NOT NULL
          AND h.npi_deactivation_date IS NULL
          AND ${distanceFormula} <= ${radiusMiles}
      ),
      procedure_volumes AS (
        SELECT 
          billing_provider_npi,
          SUM(count) as total_procedures
        FROM \`aegis_access.volume_procedure\`
        WHERE 
          date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
          AND billing_provider_npi IN (SELECT npi FROM nearby_hcos WHERE census_tract_id IS NOT NULL)
        GROUP BY billing_provider_npi
      )
      SELECT 
        h.*,
        IFNULL(v.total_procedures, 0) as procedure_volume_12mo
      FROM nearby_hcos h
      LEFT JOIN procedure_volumes v ON h.npi = v.billing_provider_npi
      WHERE h.census_tract_id IS NOT NULL  -- Only HCOs matched to tracts
      ORDER BY h.distance_miles ASC
      LIMIT ${limitNum}
    `;

    const [results] = await vendorBigQuery.query({ query: sampleQuery });

    console.log(`✅ Retrieved ${results.length} HCOs using census tract method`);

    res.json({
      data: results,
      count: results.length,
      method: 'census_tract_based'
    });

  } catch (error) {
    console.error("Error fetching HCO sample data (census tract method):", error);
    res.status(500).json({
      error: "Failed to fetch HCO sample data using census tract method",
      details: error.message,
    });
  }
});

/**
 * POST /api/hco-data/search
 * Search and filter HCOs nationally or within a market
 * Returns BOTH count (unlimited) and results (limited)
 * Request body: { search, states, firmTypes, hasHospitalParent, hasNetwork, latitude, longitude, radius, limit }
 */
router.post("/search", async (req, res) => {
  try {
    const {
      search = '',
      states = [],
      firmTypes = [],
      taxonomyClassifications = [],
      hasHospitalParent = null,
      hasNetwork = null,
      latitude = null,
      longitude = null,
      radius = null,
      limit = 500
    } = req.body;

    console.log('🔍 HCO Search:', {
      search: search ? `"${search}"` : 'none',
      states: states.length,
      firmTypes: firmTypes.length,
      taxonomyClassifications: taxonomyClassifications.length,
      hasHospitalParent,
      hasNetwork,
      hasLocation: !!(latitude && longitude && radius),
      limit
    });

    // Build WHERE clauses
    const whereClauses = ['npi_deactivation_date IS NULL'];
    const params = { limit: parseInt(limit) };

    // Search by name or NPI
    if (search && search.trim()) {
      whereClauses.push('(LOWER(healthcare_organization_name) LIKE @searchTerm OR CAST(npi AS STRING) LIKE @searchTerm)');
      params.searchTerm = `%${search.trim().toLowerCase()}%`;
    }

    // State filter
    if (states && Array.isArray(states) && states.length > 0) {
      whereClauses.push('primary_address_state_or_province IN UNNEST(@states)');
      params.states = states;
    }

    // Firm type filter
    if (firmTypes && Array.isArray(firmTypes) && firmTypes.length > 0) {
      whereClauses.push('definitive_firm_type IN UNNEST(@firmTypes)');
      params.firmTypes = firmTypes;
    }

    // Taxonomy classification filter
    if (taxonomyClassifications && Array.isArray(taxonomyClassifications) && taxonomyClassifications.length > 0) {
      whereClauses.push('primary_taxonomy_classification IN UNNEST(@taxonomyClassifications)');
      params.taxonomyClassifications = taxonomyClassifications;
    }

    // Hospital parent filter
    if (hasHospitalParent === true) {
      whereClauses.push('hospital_parent_id IS NOT NULL');
    } else if (hasHospitalParent === false) {
      whereClauses.push('hospital_parent_id IS NULL');
    }

    // Network filter
    if (hasNetwork === true) {
      whereClauses.push('network_id IS NOT NULL');
    } else if (hasNetwork === false) {
      whereClauses.push('network_id IS NULL');
    }

    // Geographic filter (if provided)
    let selectClause = `
      npi,
      COALESCE(healthcare_organization_name, name) as name,
      definitive_firm_type as firm_type,
      primary_address_city as city,
      primary_address_state_or_province as state,
      primary_address_zip5 as zip,
      primary_taxonomy_classification as taxonomy_classification,
      hospital_parent_id,
      physician_group_parent_id,
      network_id,
      definitive_id
    `;

    if (latitude && longitude && radius) {
      const distanceFormula = getDistanceFormula(parseFloat(latitude), parseFloat(longitude));
      whereClauses.push(`${distanceFormula} <= ${parseFloat(radius)}`);
      selectClause += `, ${distanceFormula} as distance_miles`;
    }

    const whereClause = whereClauses.join(' AND ');
    
    // Query 1: Get total count (no limit)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
    `;
    
    // Query 2: Get actual results (with limit)
    const resultsQuery = `
      SELECT ${selectClause}
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
      ORDER BY ${latitude && longitude && radius ? 'distance_miles ASC' : 'healthcare_organization_name ASC'}
      LIMIT @limit
    `;
    
    // Query 3: Get aggregated stats
    const statsQuery = `
      SELECT
        COUNT(DISTINCT definitive_firm_type) as distinct_firm_types,
        COUNT(DISTINCT CASE 
          WHEN LENGTH(primary_address_state_or_province) = 2 
            AND primary_address_state_or_province IN (
              'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
              'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
              'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
              'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
              'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
              'DC'
            )
          THEN primary_address_state_or_province 
        END) as distinct_states,
        COUNT(DISTINCT primary_address_city) as distinct_cities,
        COUNTIF(hospital_parent_id IS NOT NULL) as with_hospital_parent,
        COUNTIF(network_id IS NOT NULL) as with_network
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
    `;

    console.log('📊 Executing search queries (count + results + stats + breakdowns)...');
    
    // Create params without limit for count/stats queries
    const countParams = { ...params };
    delete countParams.limit;
    
    // Breakdown queries - analyze ALL matching records
    const firmTypesBreakdownQuery = `
      SELECT
        definitive_firm_type as firm_type,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
        AND definitive_firm_type IS NOT NULL
      GROUP BY definitive_firm_type
      ORDER BY count DESC
    `;
    
    const statesBreakdownQuery = `
      SELECT
        primary_address_state_or_province as state,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
        AND primary_address_state_or_province IS NOT NULL
      GROUP BY primary_address_state_or_province
      ORDER BY count DESC
    `;
    
    const citiesBreakdownQuery = `
      SELECT
        CONCAT(primary_address_city, ', ', primary_address_state_or_province) as city,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
        AND primary_address_city IS NOT NULL
        AND primary_address_state_or_province IS NOT NULL
      GROUP BY primary_address_city, primary_address_state_or_province
      ORDER BY count DESC
    `;
    
    const taxonomiesBreakdownQuery = `
      SELECT
        primary_taxonomy_classification as taxonomy,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
        AND primary_taxonomy_classification IS NOT NULL
      GROUP BY primary_taxonomy_classification
      ORDER BY count DESC
    `;
    
    const affiliationsBreakdownQuery = `
      SELECT
        COUNTIF(hospital_parent_id IS NOT NULL) as hospital_parent,
        COUNTIF(network_id IS NOT NULL) as network,
        COUNTIF(hospital_parent_id IS NULL AND network_id IS NULL) as independent
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
    `;
    
    // Execute queries in parallel (including breakdown queries)
    const [
      [countResult],
      [rows],
      [statsResult],
      [firmTypesBreakdown],
      [statesBreakdown],
      [citiesBreakdown],
      [taxonomiesBreakdown],
      [affiliationsBreakdown]
    ] = await Promise.all([
      vendorBigQuery.query({ query: countQuery, params: countParams }),
      vendorBigQuery.query({ query: resultsQuery, params }),
      vendorBigQuery.query({ query: statsQuery, params: countParams }),
      vendorBigQuery.query({ query: firmTypesBreakdownQuery, params: countParams }),
      vendorBigQuery.query({ query: statesBreakdownQuery, params: countParams }),
      vendorBigQuery.query({ query: citiesBreakdownQuery, params: countParams }),
      vendorBigQuery.query({ query: taxonomiesBreakdownQuery, params: countParams }),
      vendorBigQuery.query({ query: affiliationsBreakdownQuery, params: countParams })
    ]);

    const totalCount = parseInt(countResult[0].total);
    console.log(`✅ Found ${totalCount} total organizations (showing ${rows.length})`);

    res.json({
      success: true,
      data: {
        organizations: rows,
        count: rows.length,
        totalCount: totalCount,
        stats: statsResult[0],
        limited: totalCount > limit,
        breakdowns: {
          firmTypes: firmTypesBreakdown,
          states: statesBreakdown,
          cities: citiesBreakdown.map(c => ({ name: c.city, count: parseInt(c.count) })),
          taxonomies: taxonomiesBreakdown,
          affiliations: affiliationsBreakdown[0]
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Error searching HCOs:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/hco-data/service-summary
 * Get service/procedure summary for a set of HCO NPIs
 * Request body: { npis, npiField, limit }
 */
router.post("/service-summary", async (req, res) => {
  try {
    const {
      npis = [],
      npiField = 'billing_provider_npi', // or facility_provider_npi
      limit = 50
    } = req.body;

    if (!Array.isArray(npis) || npis.length === 0) {
      return res.status(400).json({
        success: false,
        error: "NPIs array is required and must not be empty"
      });
    }

    console.log('💼 HCO Service Summary:', {
      npis: npis.length,
      npiField,
      limit
    });

    // Top procedures by volume
    const topProceduresQuery = `
      SELECT
        code,
        code_description,
        service_line_description,
        SUM(count) as total_count,
        SUM(charge_total) as total_charges,
        COUNT(DISTINCT ${npiField}) as unique_providers
      FROM \`aegis_access.volume_procedure\`
      WHERE ${npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        AND code IS NOT NULL
      GROUP BY code, code_description, service_line_description
      ORDER BY total_count DESC
      LIMIT @limit
    `;

    // Service line summary
    const serviceLineQuery = `
      SELECT
        service_line_description,
        service_category_description,
        SUM(count) as total_count,
        SUM(charge_total) as total_charges,
        COUNT(DISTINCT ${npiField}) as unique_providers,
        COUNT(DISTINCT code) as unique_codes
      FROM \`aegis_access.volume_procedure\`
      WHERE ${npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        AND service_line_description IS NOT NULL
      GROUP BY service_line_description, service_category_description
      ORDER BY total_count DESC
      LIMIT 20
    `;

    // Overall summary
    const summaryQuery = `
      SELECT
        SUM(count) as total_procedures,
        SUM(charge_total) as total_charges,
        COUNT(DISTINCT ${npiField}) as providers_with_claims,
        COUNT(DISTINCT code) as unique_codes,
        COUNT(DISTINCT service_line_description) as unique_service_lines
      FROM \`aegis_access.volume_procedure\`
      WHERE ${npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
    `;

    const params = { 
      npis, 
      limit: parseInt(limit)
    };

    console.log('📊 Executing service summary queries...');
    
    // Execute all queries in parallel
    const [
      [topProcedures],
      [serviceLines],
      [summary]
    ] = await Promise.all([
      vendorBigQuery.query({ query: topProceduresQuery, params }),
      vendorBigQuery.query({ query: serviceLineQuery, params }),
      vendorBigQuery.query({ query: summaryQuery, params })
    ]);

    console.log(`✅ Service summary complete: ${summary[0].total_procedures?.toLocaleString()} procedures`);

    res.json({
      success: true,
      data: {
        summary: summary[0],
        topProcedures: topProcedures,
        serviceLines: serviceLines
      },
      metadata: {
        npis: npis.length,
        npiField,
        timeframe: 'Last 12 months'
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Error fetching service summary:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;

