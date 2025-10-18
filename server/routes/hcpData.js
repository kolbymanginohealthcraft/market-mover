// server/routes/hcpData.js
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
 * GET /api/hcp-data/stats
 * Get HCP statistics for a geographic area
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
      WITH nearby_hcps AS (
        SELECT 
          *,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hcp_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND ${distanceFormula} <= ${radiusMiles}
      )
      SELECT
        COUNT(*) as total_providers,
        COUNT(DISTINCT primary_taxonomy_consolidated_specialty) as distinct_specialties,
        COUNT(DISTINCT primary_address_state_or_province) as distinct_states,
        COUNT(DISTINCT primary_address_city) as distinct_cities,
        COUNT(DISTINCT primary_address_zip5) as distinct_zip_codes,
        COUNTIF(atlas_affiliation_primary_definitive_id IS NOT NULL) as with_atlas_affiliation,
        COUNTIF(atlas_affiliation_primary_hospital_parent_id IS NOT NULL) as with_hospital_affiliation,
        COUNTIF(atlas_affiliation_primary_physician_group_parent_id IS NOT NULL) as with_physician_group_affiliation,
        COUNTIF(atlas_affiliation_primary_network_id IS NOT NULL) as with_network_affiliation,
        COUNTIF(gender IS NOT NULL) as with_gender,
        COUNTIF(birth_year IS NOT NULL) as with_birth_year,
        ROUND(AVG(distance_miles), 2) as avg_distance_miles,
        ROUND(MIN(distance_miles), 2) as min_distance_miles,
        ROUND(MAX(distance_miles), 2) as max_distance_miles
      FROM nearby_hcps
    `;

    const [statsResults] = await vendorBigQuery.query({ query: statsQuery });
    const stats = statsResults[0];

    // Query for breakdown by specialty
    const specialtyQuery = `
      WITH nearby_hcps AS (
        SELECT 
          *,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hcp_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND ${distanceFormula} <= ${radiusMiles}
      )
      SELECT
        primary_taxonomy_consolidated_specialty as specialty,
        COUNT(*) as count,
        ROUND(AVG(distance_miles), 2) as avg_distance
      FROM nearby_hcps
      WHERE primary_taxonomy_consolidated_specialty IS NOT NULL
      GROUP BY primary_taxonomy_consolidated_specialty
      ORDER BY count DESC
      LIMIT 20
    `;

    const [specialtyResults] = await vendorBigQuery.query({ query: specialtyQuery });

    // Query for breakdown by state
    const stateQuery = `
      WITH nearby_hcps AS (
        SELECT 
          *,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hcp_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND ${distanceFormula} <= ${radiusMiles}
      )
      SELECT
        primary_address_state_or_province as state,
        COUNT(*) as count,
        ROUND(AVG(distance_miles), 2) as avg_distance
      FROM nearby_hcps
      WHERE primary_address_state_or_province IS NOT NULL
      GROUP BY primary_address_state_or_province
      ORDER BY count DESC
      LIMIT 10
    `;

    const [stateResults] = await vendorBigQuery.query({ query: stateQuery });

    // Query for top cities
    const cityQuery = `
      WITH nearby_hcps AS (
        SELECT 
          *,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hcp_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND ${distanceFormula} <= ${radiusMiles}
      )
      SELECT
        primary_address_city as city,
        primary_address_state_or_province as state,
        COUNT(*) as count,
        ROUND(AVG(distance_miles), 2) as avg_distance
      FROM nearby_hcps
      WHERE primary_address_city IS NOT NULL
      GROUP BY primary_address_city, primary_address_state_or_province
      ORDER BY count DESC
      LIMIT 15
    `;

    const [cityResults] = await vendorBigQuery.query({ query: cityQuery });

    // Query for gender breakdown
    const genderQuery = `
      WITH nearby_hcps AS (
        SELECT 
          *,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hcp_flat\`
        WHERE 
          primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND ${distanceFormula} <= ${radiusMiles}
      )
      SELECT
        gender,
        COUNT(*) as count
      FROM nearby_hcps
      WHERE gender IS NOT NULL
      GROUP BY gender
      ORDER BY count DESC
    `;

    const [genderResults] = await vendorBigQuery.query({ query: genderQuery });

    res.json({
      parameters: {
        latitude: lat,
        longitude: lng,
        radius_miles: radiusMiles,
      },
      stats: {
        total_providers: parseInt(stats.total_providers),
        distinct_specialties: parseInt(stats.distinct_specialties),
        distinct_states: parseInt(stats.distinct_states),
        distinct_cities: parseInt(stats.distinct_cities),
        distinct_zip_codes: parseInt(stats.distinct_zip_codes),
        with_atlas_affiliation: parseInt(stats.with_atlas_affiliation),
        with_hospital_affiliation: parseInt(stats.with_hospital_affiliation),
        with_physician_group_affiliation: parseInt(stats.with_physician_group_affiliation),
        with_network_affiliation: parseInt(stats.with_network_affiliation),
        with_gender: parseInt(stats.with_gender),
        with_birth_year: parseInt(stats.with_birth_year),
        avg_distance_miles: parseFloat(stats.avg_distance_miles),
        min_distance_miles: parseFloat(stats.min_distance_miles),
        max_distance_miles: parseFloat(stats.max_distance_miles),
      },
      breakdown_by_specialty: specialtyResults.map((row) => ({
        specialty: row.specialty,
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
      breakdown_by_gender: genderResults.map((row) => ({
        gender: row.gender,
        count: parseInt(row.count),
      })),
    });
  } catch (error) {
    console.error("Error fetching HCP data:", error);
    res.status(500).json({
      error: "Failed to fetch HCP data",
      details: error.message,
    });
  }
});

/**
 * GET /api/hcp-data/sample
 * Get sample HCP records for a geographic area
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
      SELECT 
        npi,
        name_first,
        name_last,
        name_full_formatted,
        title,
        gender,
        birth_year,
        primary_taxonomy_consolidated_specialty,
        primary_taxonomy_classification,
        primary_taxonomy_specialization,
        primary_address_line_1,
        primary_address_city,
        primary_address_state_or_province,
        primary_address_zip5,
        primary_address_lat,
        primary_address_long,
        primary_address_county,
        atlas_affiliation_primary_definitive_id,
        atlas_affiliation_primary_definitive_name,
        atlas_affiliation_primary_hospital_parent_id,
        atlas_affiliation_primary_hospital_parent_name,
        atlas_affiliation_primary_physician_group_parent_id,
        atlas_affiliation_primary_physician_group_parent_name,
        atlas_affiliation_primary_network_id,
        atlas_affiliation_primary_network_name,
        ${distanceFormula} as distance_miles
      FROM \`aegis_access.hcp_flat\`
      WHERE 
        primary_address_lat IS NOT NULL 
        AND primary_address_long IS NOT NULL
        AND ${distanceFormula} <= ${radiusMiles}
      ORDER BY distance_miles ASC
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
      providers: results.map((row) => ({
        npi: row.npi,
        name: {
          first: row.name_first,
          last: row.name_last,
          full: row.name_full_formatted,
          title: row.title,
        },
        gender: row.gender,
        birth_year: row.birth_year,
        specialty: {
          consolidated: row.primary_taxonomy_consolidated_specialty,
          classification: row.primary_taxonomy_classification,
          specialization: row.primary_taxonomy_specialization,
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
        affiliations: {
          definitive_id: row.atlas_affiliation_primary_definitive_id,
          definitive_name: row.atlas_affiliation_primary_definitive_name,
          hospital_parent_id: row.atlas_affiliation_primary_hospital_parent_id,
          hospital_parent_name: row.atlas_affiliation_primary_hospital_parent_name,
          physician_group_parent_id: row.atlas_affiliation_primary_physician_group_parent_id,
          physician_group_parent_name: row.atlas_affiliation_primary_physician_group_parent_name,
          network_id: row.atlas_affiliation_primary_network_id,
          network_name: row.atlas_affiliation_primary_network_name,
        },
        distance_miles: parseFloat(row.distance_miles),
      })),
    });
  } catch (error) {
    console.error("Error fetching HCP sample data:", error);
    res.status(500).json({
      error: "Failed to fetch HCP sample data",
      details: error.message,
    });
  }
});

export default router;

