// server/routes/hcpData.js
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
 * GET /api/hcp-data/national-overview
 * Get national-level statistics for HCPs (fast, cached)
 * No query params needed - returns pre-aggregated national data
 */
router.get("/national-overview", async (req, res) => {
  try {
    const cacheKey = 'hcp-national-overview-v3'; // v3: fixed gender values
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('✅ Returning cached national HCP overview');
      return res.json({
        success: true,
        ...cached,
        cached: true
      });
    }

    console.log('📊 Fetching national HCP overview (will be cached)...');

    // Query for national statistics - aggregated, not individual rows
    const statsQuery = `
      SELECT
        COUNT(*) as total_providers,
        COUNT(DISTINCT primary_taxonomy_consolidated_specialty) as distinct_specialties,
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
        COUNTIF(atlas_affiliation_primary_hospital_parent_id IS NOT NULL) as with_hospital_affiliation,
        COUNTIF(atlas_affiliation_primary_physician_group_parent_id IS NOT NULL) as with_physician_group_affiliation,
        COUNTIF(atlas_affiliation_primary_network_id IS NOT NULL) as with_network_affiliation,
        COUNTIF(atlas_affiliation_primary_definitive_id IS NOT NULL) as with_atlas_affiliation,
        COUNTIF(LOWER(gender) = 'male') as male_providers,
        COUNTIF(LOWER(gender) = 'female') as female_providers
      FROM \`aegis_access.hcp_flat\`
      WHERE npi_deactivation_date IS NULL
    `;

    // Top specialties
    const specialtiesQuery = `
      SELECT
        primary_taxonomy_consolidated_specialty as specialty,
        COUNT(*) as count
      FROM \`aegis_access.hcp_flat\`
      WHERE npi_deactivation_date IS NULL
        AND primary_taxonomy_consolidated_specialty IS NOT NULL
      GROUP BY primary_taxonomy_consolidated_specialty
      ORDER BY count DESC
      LIMIT 20
    `;

    // State distribution - filter to valid US states only (2-letter codes)
    const statesQuery = `
      SELECT
        primary_address_state_or_province as state,
        COUNT(*) as count
      FROM \`aegis_access.hcp_flat\`
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

    // Execute all queries in parallel
    const [
      [overallStats],
      [specialties],
      [states]
    ] = await Promise.all([
      vendorBigQuery.query({ query: statsQuery }),
      vendorBigQuery.query({ query: specialtiesQuery }),
      vendorBigQuery.query({ query: statesQuery })
    ]);

    const result = {
      success: true,
      data: {
        overall: overallStats[0],
        specialties: specialties,
        states: states
      },
      timestamp: new Date().toISOString()
    };

    // Cache for 1 hour (national stats don't change often)
    cache.set(cacheKey, result, 3600);
    
    console.log(`✅ National HCP overview complete: ${overallStats[0].total_providers?.toLocaleString()} providers`);

    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching national HCP overview:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

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
          AND npi_deactivation_date IS NULL
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
          AND npi_deactivation_date IS NULL
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
          AND npi_deactivation_date IS NULL
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
          AND npi_deactivation_date IS NULL
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
          AND npi_deactivation_date IS NULL
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
        AND npi_deactivation_date IS NULL
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

/**
 * POST /api/hcp-data/search
 * Search and filter HCPs nationally or within a market
 * Request body: { search, states, consolidatedSpecialty, gender, hasHospitalAffiliation, hasNetworkAffiliation, taxonomyCodes, latitude, longitude, radius, limit }
 * Caches national (no filter) results for performance
 */
router.post("/search", async (req, res) => {
  try {
    const {
      search = '',
      states = [],
      consolidatedSpecialty = [],
      gender = [],
      hasHospitalAffiliation = null,
      hasPhysicianGroupAffiliation = null,
      hasNetworkAffiliation = null,
      taxonomyCodes = [],
      latitude = null,
      longitude = null,
      radius = null,
      limit = 500
    } = req.body;

    console.log('🔍 HCP Search:', {
      search: search ? `"${search}"` : 'none',
      states: states.length,
      specialties: consolidatedSpecialty.length,
      gender: gender.length,
      taxonomyCodes: taxonomyCodes.length,
      hasHospitalAffiliation,
      hasNetworkAffiliation,
      hasLocation: !!(latitude && longitude && radius),
      limit
    });

    // Check if this is a national (unfiltered) request that can be cached
    const isNationalRequest = !search && 
                              states.length === 0 && 
                              consolidatedSpecialty.length === 0 && 
                              gender.length === 0 && 
                              taxonomyCodes.length === 0 &&
                              hasHospitalAffiliation === null && 
                              hasPhysicianGroupAffiliation === null &&
                              hasNetworkAffiliation === null &&
                              !latitude && !longitude && !radius;
    
    if (isNationalRequest) {
      const cacheKey = `hcp-national-search-v3-limit-${limit}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        console.log('✅ Returning cached national HCP search results');
        return res.json({
          ...cached,
          cached: true
        });
      }
    }

    // Build WHERE clauses
    const whereClauses = ['npi_deactivation_date IS NULL'];
    const params = { limit: parseInt(limit) };

    // Search by name or NPI
    if (search && search.trim()) {
      whereClauses.push('(LOWER(name_full_formatted) LIKE @searchTerm OR npi LIKE @searchTerm)');
      params.searchTerm = `%${search.trim().toLowerCase()}%`;
    }

    // State filter
    if (states && Array.isArray(states) && states.length > 0) {
      whereClauses.push('primary_address_state_or_province IN UNNEST(@states)');
      params.states = states;
    }

    // Specialty filter
    if (consolidatedSpecialty && Array.isArray(consolidatedSpecialty) && consolidatedSpecialty.length > 0) {
      whereClauses.push('primary_taxonomy_consolidated_specialty IN UNNEST(@specialties)');
      params.specialties = consolidatedSpecialty;
    }

    // Gender filter
    if (gender && Array.isArray(gender) && gender.length > 0) {
      whereClauses.push('gender IN UNNEST(@gender)');
      params.gender = gender;
    }

    // Taxonomy code filter (primary taxonomy code)
    if (taxonomyCodes && Array.isArray(taxonomyCodes) && taxonomyCodes.length > 0) {
      whereClauses.push('primary_taxonomy_code IN UNNEST(@taxonomyCodes)');
      params.taxonomyCodes = taxonomyCodes;
    }

    // Hospital affiliation filter
    if (hasHospitalAffiliation === true) {
      whereClauses.push('atlas_affiliation_primary_hospital_parent_id IS NOT NULL');
    } else if (hasHospitalAffiliation === false) {
      whereClauses.push('atlas_affiliation_primary_hospital_parent_id IS NULL');
    }

    // Physician group affiliation filter
    if (hasPhysicianGroupAffiliation === true) {
      whereClauses.push('atlas_affiliation_primary_physician_group_parent_id IS NOT NULL');
    } else if (hasPhysicianGroupAffiliation === false) {
      whereClauses.push('atlas_affiliation_primary_physician_group_parent_id IS NULL');
    }

    // Network filter
    if (hasNetworkAffiliation === true) {
      whereClauses.push('atlas_affiliation_primary_network_id IS NOT NULL');
    } else if (hasNetworkAffiliation === false) {
      whereClauses.push('atlas_affiliation_primary_network_id IS NULL');
    }

    // Geographic filter (if provided)
    let selectClause = `
      npi,
      name_full_formatted as name,
      title,
      primary_taxonomy_consolidated_specialty as consolidated_specialty,
      primary_taxonomy_classification as taxonomy_classification,
      primary_taxonomy_code as taxonomy_code,
      primary_address_line_1 as address_line_1,
      primary_address_line_2 as address_line_2,
      primary_address_city as city,
      primary_address_state_or_province as state,
      primary_address_zip5 as zip,
      primary_address_phone_number_primary as phone,
      gender,
      birth_year,
      atlas_affiliation_primary_hospital_parent_id as hospital_affiliation,
      atlas_affiliation_primary_hospital_parent_name as hospital_name,
      atlas_affiliation_primary_physician_group_parent_id as physician_group_affiliation,
      atlas_affiliation_primary_physician_group_parent_name as physician_group_name,
      atlas_affiliation_primary_network_id as network_affiliation,
      atlas_affiliation_primary_network_name as network_name
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
      FROM \`aegis_access.hcp_flat\`
      WHERE ${whereClause}
    `;
    
    // Query 2: Get actual results (with limit)
    const resultsQuery = `
      SELECT ${selectClause}
      FROM \`aegis_access.hcp_flat\`
      WHERE ${whereClause}
      ORDER BY ${latitude && longitude && radius ? 'distance_miles ASC' : 'name_full_formatted ASC'}
      LIMIT @limit
    `;
    
    // Query 3: Get aggregated stats
    const statsQuery = `
      SELECT
        COUNT(DISTINCT primary_taxonomy_consolidated_specialty) as distinct_specialties,
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
        COUNTIF(LOWER(gender) = 'male') as male_count,
        COUNTIF(LOWER(gender) = 'female') as female_count,
        COUNTIF(atlas_affiliation_primary_hospital_parent_id IS NOT NULL) as with_hospital_affiliation,
        COUNTIF(atlas_affiliation_primary_network_id IS NOT NULL) as with_network
      FROM \`aegis_access.hcp_flat\`
      WHERE ${whereClause}
    `;

    console.log('📊 Executing search queries (count + results + stats + breakdowns)...');
    
    // Create params without limit for count/stats queries
    const countParams = { ...params };
    delete countParams.limit;
    
    // Breakdown queries - analyze ALL matching records
    const specialtiesBreakdownQuery = `
      SELECT
        primary_taxonomy_consolidated_specialty as specialty,
        COUNT(*) as count
      FROM \`aegis_access.hcp_flat\`
      WHERE ${whereClause}
        AND primary_taxonomy_consolidated_specialty IS NOT NULL
      GROUP BY primary_taxonomy_consolidated_specialty
      ORDER BY count DESC
      LIMIT 15
    `;
    
    const statesBreakdownQuery = `
      SELECT
        primary_address_state_or_province as state,
        COUNT(*) as count
      FROM \`aegis_access.hcp_flat\`
      WHERE ${whereClause}
        AND primary_address_state_or_province IS NOT NULL
      GROUP BY primary_address_state_or_province
      ORDER BY count DESC
      LIMIT 15
    `;
    
    const citiesBreakdownQuery = `
      SELECT
        CONCAT(primary_address_city, ', ', primary_address_state_or_province) as city,
        COUNT(*) as count
      FROM \`aegis_access.hcp_flat\`
      WHERE ${whereClause}
        AND primary_address_city IS NOT NULL
        AND primary_address_state_or_province IS NOT NULL
      GROUP BY primary_address_city, primary_address_state_or_province
      ORDER BY count DESC
      LIMIT 15
    `;
    
    const genderBreakdownQuery = `
      SELECT
        CASE 
          WHEN LOWER(gender) = 'male' THEN 'male'
          WHEN LOWER(gender) = 'female' THEN 'female'
          ELSE 'other'
        END as gender,
        COUNT(*) as count
      FROM \`aegis_access.hcp_flat\`
      WHERE ${whereClause}
      GROUP BY gender
    `;
    
    const affiliationsBreakdownQuery = `
      SELECT
        COUNTIF(atlas_affiliation_primary_hospital_parent_id IS NOT NULL) as hospital,
        COUNTIF(atlas_affiliation_primary_physician_group_parent_id IS NOT NULL) as physician_group,
        COUNTIF(atlas_affiliation_primary_network_id IS NOT NULL) as network,
        COUNTIF(atlas_affiliation_primary_hospital_parent_id IS NULL 
                AND atlas_affiliation_primary_physician_group_parent_id IS NULL 
                AND atlas_affiliation_primary_network_id IS NULL) as independent
      FROM \`aegis_access.hcp_flat\`
      WHERE ${whereClause}
    `;
    
    // For national requests, also fetch filter options
    let filterOptionsPromises = [];
    if (isNationalRequest) {
      // States query
      const statesQuery = `
        SELECT
          primary_address_state_or_province as state,
          COUNT(*) as count
        FROM \`aegis_access.hcp_flat\`
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
      
      // Specialties query
      const specialtiesQuery = `
        SELECT
          primary_taxonomy_consolidated_specialty as specialty,
          COUNT(*) as count
        FROM \`aegis_access.hcp_flat\`
        WHERE npi_deactivation_date IS NULL
          AND primary_taxonomy_consolidated_specialty IS NOT NULL
        GROUP BY primary_taxonomy_consolidated_specialty
        ORDER BY count DESC
        LIMIT 100
      `;
      
      filterOptionsPromises = [
        vendorBigQuery.query({ query: statesQuery }),
        vendorBigQuery.query({ query: specialtiesQuery })
      ];
    }
    
    // Execute queries in parallel (including breakdown queries)
    const queryResults = await Promise.all([
      vendorBigQuery.query({ query: countQuery, params: Object.keys(countParams).length > 0 ? countParams : undefined }),
      vendorBigQuery.query({ query: resultsQuery, params }),
      vendorBigQuery.query({ query: statsQuery, params: Object.keys(countParams).length > 0 ? countParams : undefined }),
      vendorBigQuery.query({ query: specialtiesBreakdownQuery, params: Object.keys(countParams).length > 0 ? countParams : undefined }),
      vendorBigQuery.query({ query: statesBreakdownQuery, params: Object.keys(countParams).length > 0 ? countParams : undefined }),
      vendorBigQuery.query({ query: citiesBreakdownQuery, params: Object.keys(countParams).length > 0 ? countParams : undefined }),
      vendorBigQuery.query({ query: genderBreakdownQuery, params: Object.keys(countParams).length > 0 ? countParams : undefined }),
      vendorBigQuery.query({ query: affiliationsBreakdownQuery, params: Object.keys(countParams).length > 0 ? countParams : undefined }),
      ...filterOptionsPromises
    ]);
    
    const [countResult] = queryResults[0];
    const [rows] = queryResults[1];
    const [statsResult] = queryResults[2];
    const [specialtiesBreakdown] = queryResults[3];
    const [statesBreakdown] = queryResults[4];
    const [citiesBreakdown] = queryResults[5];
    const [genderBreakdown] = queryResults[6];
    const [affiliationsBreakdown] = queryResults[7];
    
    const totalCount = parseInt(countResult[0].total);
    console.log(`✅ Found ${totalCount} total practitioners (showing ${rows.length})`);
    console.log(`📊 Stats:`, statsResult[0]);

    const response = {
      success: true,
      data: {
        practitioners: rows,
        count: rows.length,
        totalCount: totalCount,
        stats: statsResult[0],
        limited: totalCount > limit,
        breakdowns: {
          specialties: specialtiesBreakdown,
          states: statesBreakdown,
          cities: citiesBreakdown.map(c => ({ name: c.city, count: parseInt(c.count) })),
          gender: genderBreakdown.map(g => ({ gender: g.gender, count: parseInt(g.count) })),
          affiliations: affiliationsBreakdown[0]
        }
      },
      timestamp: new Date().toISOString()
    };
    
    // Add filter options for national requests
    if (isNationalRequest) {
      const baseIndex = 8; // Breakdown queries end at index 7
      const [statesData] = queryResults[baseIndex];
      const [specialtiesData] = queryResults[baseIndex + 1];
      
      response.data.filterOptions = {
        states: statesData,
        specialties: specialtiesData
      };
    }
    
    // Cache national requests
    if (isNationalRequest) {
      const cacheKey = `hcp-national-search-v3-limit-${limit}`;
      cache.set(cacheKey, response, 3600); // Cache for 1 hour (v3: added breakdowns)
      console.log('💾 Cached national HCP search results');
    }

    res.json(response);

  } catch (err) {
    console.error("❌ Error searching HCPs:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/hcp-data/taxonomy-density
 * Get HCP counts by taxonomy code within 10, 20, and 30 mile radius bands
 * Request body: { latitude, longitude, taxonomyCodes (optional) }
 * Returns: Taxonomy counts for each radius band
 */
router.post("/taxonomy-density", async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      taxonomyCodes = []
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "latitude and longitude are required"
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: "Invalid latitude or longitude"
      });
    }

    console.log('📊 HCP Taxonomy Density:', {
      location: `${lat}, ${lng}`,
      taxonomyCodes: taxonomyCodes.length > 0 ? taxonomyCodes.length : 'all'
    });

    const distanceFormula = getDistanceFormula(lat, lng);

    // Build WHERE clauses
    const whereClauses = [
      'npi_deactivation_date IS NULL',
      'primary_address_lat IS NOT NULL',
      'primary_address_long IS NOT NULL',
      'primary_taxonomy_code IS NOT NULL'
    ];
    const params = { lat, lon: lng };

    // Filter by taxonomy codes if provided
    if (taxonomyCodes && Array.isArray(taxonomyCodes) && taxonomyCodes.length > 0) {
      whereClauses.push('primary_taxonomy_code IN UNNEST(@taxonomyCodes)');
      params.taxonomyCodes = taxonomyCodes;
    }

    const whereClause = whereClauses.join(' AND ');

    // Query to get counts by taxonomy code for each radius band
    const query = `
      WITH hcp_with_distance AS (
        SELECT 
          primary_taxonomy_code,
          ${distanceFormula} as distance_miles
        FROM \`aegis_access.hcp_flat\`
        WHERE ${whereClause}
      )
      SELECT 
        primary_taxonomy_code as taxonomy_code,
        COUNTIF(distance_miles <= 10) as count_10mi,
        COUNTIF(distance_miles <= 20 AND distance_miles > 10) as count_10_20mi,
        COUNTIF(distance_miles <= 30 AND distance_miles > 20) as count_20_30mi,
        COUNTIF(distance_miles <= 10) + COUNTIF(distance_miles <= 20 AND distance_miles > 10) as count_20mi_total,
        COUNTIF(distance_miles <= 10) + COUNTIF(distance_miles <= 20 AND distance_miles > 10) + COUNTIF(distance_miles <= 30 AND distance_miles > 20) as count_30mi_total
      FROM hcp_with_distance
      GROUP BY primary_taxonomy_code
      HAVING COUNT(*) > 0
      ORDER BY count_30mi_total DESC
    `;

    const [rows] = await vendorBigQuery.query({
      query,
      params
    });

    console.log(`✅ Found ${rows.length} taxonomy codes with HCPs in the area`);

    res.json({
      success: true,
      data: rows.map(row => ({
        taxonomy_code: row.taxonomy_code,
        count_10mi: parseInt(row.count_10mi),
        count_10_20mi: parseInt(row.count_10_20mi),
        count_20_30mi: parseInt(row.count_20_30mi),
        count_20mi_total: parseInt(row.count_20mi_total),
        count_30mi_total: parseInt(row.count_30mi_total)
      })),
      location: { latitude: lat, longitude: lng },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Error fetching taxonomy density:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;

