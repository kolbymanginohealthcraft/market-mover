// Experimental route using vendor BigQuery hco_flat instead of org_dhc
import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";

const router = express.Router();

/**
 * GET /api/search-providers-vendor
 * Experimental version using vendor BigQuery hco_flat
 *
 * Query params:
 *   - search: Search string (optional)
 *   - dhc: DHC ID (optional)
 *
 * Returns: Array of provider objects matching the search or DHC.
 *
 * NOTE: This route ONLY handles provider search by text or DHC.
 *       Uses vendor BigQuery hco_flat with definitive_id as DHC.
 */
router.get("/search-providers-vendor", async (req, res) => {
  const { dhc, search, types, networks, cities, states, dhcs, lat, lon, radius } = req.query;

  try {
    let query, params;

    if (dhc) {
      query = `
        SELECT 
          atlas_definitive_id as dhc,
          npi,
          atlas_definitive_name as name,
          healthcare_organization_name,
          primary_address_line_1 as street,
          primary_address_city as city,
          primary_address_state_or_province as state,
          primary_address_zip5 as zip,
          primary_address_phone_number_primary as phone,
          atlas_network_name as network,
          atlas_definitive_firm_type as type,
          primary_address_lat as latitude,
          primary_address_long as longitude
        FROM \`aegis_access.hco_flat\`
        WHERE atlas_definitive_id = @dhc
          AND atlas_definitive_id IS NOT NULL
          AND npi_deactivation_date IS NULL
      `;
      params = { dhc: Number(dhc) };
    } else {
      // Build WHERE conditions
      let whereConditions = [
        'npi_deactivation_date IS NULL',
        'atlas_definitive_id IS NOT NULL',
        'atlas_definitive_id_primary_npi = TRUE'
      ];
      
      const queryParams = {};

      // Search term condition
      if (search) {
        // Split search into individual words
        const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
        
        // For multiple terms, each term must match somewhere (AND logic across terms)
        // But each term can match ANY field (OR logic within term)
        const termConditions = searchTerms.map((term, idx) => {
          const paramKey = `search_${idx}`;
          queryParams[paramKey] = `%${term}%`;
          return `(
            LOWER(atlas_definitive_name) LIKE LOWER(@${paramKey}) OR
            LOWER(healthcare_organization_name) LIKE LOWER(@${paramKey}) OR
            LOWER(atlas_network_name) LIKE LOWER(@${paramKey}) OR
            LOWER(primary_address_city) LIKE LOWER(@${paramKey}) OR
            LOWER(primary_address_state_or_province) LIKE LOWER(@${paramKey}) OR
            LOWER(primary_address_zip5) LIKE LOWER(@${paramKey}) OR
            LOWER(primary_address_phone_number_primary) LIKE LOWER(@${paramKey}) OR
            LOWER(primary_address_line_1) LIKE LOWER(@${paramKey})
          )`;
        });
        
        // All terms must match (AND between terms)
        whereConditions.push(`(${termConditions.join(' AND ')})`);
      }

      // Filter conditions
      const filterTypes = types ? (Array.isArray(types) ? types : [types]) : [];
      const filterNetworks = networks ? (Array.isArray(networks) ? networks : [networks]) : [];
      const filterCities = cities ? (Array.isArray(cities) ? cities : [cities]) : [];
      const filterStates = states ? (Array.isArray(states) ? states : [states]) : [];

      if (filterTypes.length > 0) {
        whereConditions.push('atlas_definitive_firm_type IN UNNEST(@types)');
        queryParams.types = filterTypes;
      }

      if (filterNetworks.length > 0) {
        whereConditions.push('atlas_network_name IN UNNEST(@networks)');
        queryParams.networks = filterNetworks;
      }

      if (filterCities.length > 0) {
        whereConditions.push('primary_address_city IN UNNEST(@cities)');
        queryParams.cities = filterCities;
      }

      if (filterStates.length > 0) {
        whereConditions.push('primary_address_state_or_province IN UNNEST(@states)');
        queryParams.states = filterStates;
      }

      // DHC IDs filter (for tagged providers)
      if (dhcs) {
        const dhcIds = Array.isArray(dhcs) ? dhcs : dhcs.split(',');
        whereConditions.push('atlas_definitive_id IN UNNEST(@dhcIds)');
        queryParams.dhcIds = dhcIds.map(id => Number(id));
      }

      // Location filter (for saved markets)
      if (lat && lon && radius) {
        const radiusMeters = Number(radius) * 1609.34;
        whereConditions.push('primary_address_lat IS NOT NULL');
        whereConditions.push('primary_address_long IS NOT NULL');
        whereConditions.push(`ST_DISTANCE(
          ST_GEOGPOINT(CAST(primary_address_long AS FLOAT64), CAST(primary_address_lat AS FLOAT64)),
          ST_GEOGPOINT(@lon, @lat)
        ) <= @radiusMeters`);
        queryParams.lat = Number(lat);
        queryParams.lon = Number(lon);
        queryParams.radiusMeters = radiusMeters;
      }

      // Build ORDER BY
      let orderBy = 'atlas_definitive_name';
      // Note: Complex relevance scoring would require changes - keeping simple alphabetical for now

      query = `
        SELECT 
          atlas_definitive_id as dhc,
          npi,
          atlas_definitive_name as name,
          healthcare_organization_name,
          primary_address_line_1 as street,
          primary_address_city as city,
          primary_address_state_or_province as state,
          primary_address_zip5 as zip,
          primary_address_phone_number_primary as phone,
          atlas_network_name as network,
          atlas_definitive_firm_type as type,
          primary_address_lat as latitude,
          primary_address_long as longitude
        FROM \`aegis_access.hco_flat\`
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ${orderBy}
      `;
      params = queryParams;
    }

    const [rows] = await vendorBigQuery.query({
      query,
      params,
    });

    console.log(`✅ [VENDOR] Search returned ${rows.length} providers`);

    res.status(200).json({
      success: true,
      data: dhc ? rows[0] || null : rows,
    });
  } catch (err) {
    console.error("❌ [VENDOR] BigQuery search-providers error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/search-providers-vendor/national-overview
 * Get national-level statistics and filter options for providers
 * Returns aggregated statistics and all unique filter values
 */
router.get("/search-providers-vendor/national-overview", async (req, res) => {
  try {
    console.log('📊 Fetching provider search national overview...');

    // Overall statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_providers,
        COUNT(DISTINCT atlas_definitive_firm_type) as distinct_types,
        COUNT(DISTINCT atlas_network_name) as distinct_networks,
        COUNT(DISTINCT primary_address_city) as distinct_cities,
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
        END) as distinct_states
      FROM \`aegis_access.hco_flat\`
      WHERE atlas_definitive_id IS NOT NULL
        AND atlas_definitive_id_primary_npi = TRUE
        AND npi_deactivation_date IS NULL
    `;

    // All unique provider types
    const typesQuery = `
      SELECT
        atlas_definitive_firm_type as type,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE atlas_definitive_id IS NOT NULL
        AND atlas_definitive_id_primary_npi = TRUE
        AND npi_deactivation_date IS NULL
        AND atlas_definitive_firm_type IS NOT NULL
      GROUP BY atlas_definitive_firm_type
      ORDER BY atlas_definitive_firm_type
    `;

    // All unique networks
    const networksQuery = `
      SELECT
        atlas_network_name as network,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE atlas_definitive_id IS NOT NULL
        AND atlas_definitive_id_primary_npi = TRUE
        AND npi_deactivation_date IS NULL
        AND atlas_network_name IS NOT NULL
      GROUP BY atlas_network_name
      ORDER BY atlas_network_name
      LIMIT 500
    `;

    // All unique cities
    const citiesQuery = `
      SELECT
        primary_address_city as city,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE atlas_definitive_id IS NOT NULL
        AND atlas_definitive_id_primary_npi = TRUE
        AND npi_deactivation_date IS NULL
        AND primary_address_city IS NOT NULL
      GROUP BY primary_address_city
      ORDER BY primary_address_city
      LIMIT 500
    `;

    // All unique states
    const statesQuery = `
      SELECT
        primary_address_state_or_province as state,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE atlas_definitive_id IS NOT NULL
        AND atlas_definitive_id_primary_npi = TRUE
        AND npi_deactivation_date IS NULL
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
      ORDER BY primary_address_state_or_province
    `;

    // Top provider types for breakdown
    const topTypesQuery = `
      SELECT
        atlas_definitive_firm_type as type,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE atlas_definitive_id IS NOT NULL
        AND atlas_definitive_id_primary_npi = TRUE
        AND npi_deactivation_date IS NULL
        AND atlas_definitive_firm_type IS NOT NULL
      GROUP BY atlas_definitive_firm_type
      ORDER BY count DESC
      LIMIT 10
    `;

    // Top states for breakdown
    const topStatesQuery = `
      SELECT
        primary_address_state_or_province as state,
        COUNT(*) as count
      FROM \`aegis_access.hco_flat\`
      WHERE atlas_definitive_id IS NOT NULL
        AND atlas_definitive_id_primary_npi = TRUE
        AND npi_deactivation_date IS NULL
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
      LIMIT 10
    `;

    const [
      [overallStats],
      [types],
      [networks],
      [cities],
      [states],
      [topTypes],
      [topStates]
    ] = await Promise.all([
      vendorBigQuery.query({ query: statsQuery }),
      vendorBigQuery.query({ query: typesQuery }),
      vendorBigQuery.query({ query: networksQuery }),
      vendorBigQuery.query({ query: citiesQuery }),
      vendorBigQuery.query({ query: statesQuery }),
      vendorBigQuery.query({ query: topTypesQuery }),
      vendorBigQuery.query({ query: topStatesQuery })
    ]);

    const result = {
      success: true,
      data: {
        overall: overallStats[0],
        filterOptions: {
          types: types.map(t => t.type || "Unknown"),
          networks: networks.map(n => n.network),
          cities: cities.map(c => c.city),
          states: states.map(s => s.state)
        },
        breakdowns: {
          types: topTypes.map(t => ({ name: t.type || "Unknown", count: parseInt(t.count) })),
          states: topStates.map(s => ({ name: s.state, count: parseInt(s.count) }))
        }
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Provider search national overview complete: ${overallStats[0].total_providers?.toLocaleString()} providers`);

    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching provider search national overview:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;

