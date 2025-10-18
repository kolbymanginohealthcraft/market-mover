// server/routes/hcoData.js
import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";

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
        COUNT(DISTINCT primary_address_state_or_province) as distinct_states,
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
        COUNT(DISTINCT primary_address_state_or_province) as distinct_states,
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

export default router;

