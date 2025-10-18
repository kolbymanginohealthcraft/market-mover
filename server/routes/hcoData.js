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
      SELECT 
        npi,
        name,
        healthcare_organization_name,
        definitive_firm_type,
        definitive_firm_type_full,
        primary_address_line_1,
        primary_address_city,
        primary_address_state_or_province,
        primary_address_zip5,
        primary_address_lat,
        primary_address_long,
        primary_address_county,
        definitive_id,
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
      organizations: results.map((row) => ({
        npi: row.npi,
        name: row.name,
        healthcare_organization_name: row.healthcare_organization_name,
        firm_type: row.definitive_firm_type,
        firm_type_full: row.definitive_firm_type_full,
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
          hospital_parent_id: row.hospital_parent_id,
          hospital_parent_name: row.hospital_parent_name,
          physician_group_parent_id: row.physician_group_parent_id,
          physician_group_parent_name: row.physician_group_parent_name,
          network_id: row.network_id,
          network_name: row.network_name,
        },
        distance_miles: parseFloat(row.distance_miles),
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

export default router;

