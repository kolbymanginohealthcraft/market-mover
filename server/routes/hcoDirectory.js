// server/routes/hcoDirectory.js
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
 * POST /api/hco-directory/search
 * Comprehensive HCO directory search with filtering
 * Supports: name search, taxonomy filters, market filters, firm type, state, etc.
 */
router.post("/search", async (req, res) => {
  try {
    const {
      search = '',
      states = [],
      cities = [],
      firmTypes = [],
      taxonomyClassifications = [],
      taxonomyConsolidatedSpecialties = [],
      taxonomyGroupings = [],
      hasHospitalParent = null,
      hasPhysicianGroup = null,
      hasNetwork = null,
      hasDefinitiveId = null,
      marketId = null,
      marketLatitude = null,
      marketLongitude = null,
      marketRadius = null,
      sortBy = 'name', // name, distance, firm_type
      sortOrder = 'asc', // asc, desc
      page = 1,
      pageSize = 100
    } = req.body;

    console.log('🏥 HCO Directory Search:', {
      search: search ? `"${search}"` : 'none',
      filters: {
        states: states.length,
        cities: cities.length,
        firmTypes: firmTypes.length,
        taxonomies: taxonomyClassifications.length,
        specialties: taxonomyConsolidatedSpecialties.length,
        groupings: taxonomyGroupings.length
      },
      market: marketId || (marketLatitude && marketLongitude) ? 'yes' : 'no',
      page,
      pageSize
    });

    // Build WHERE clauses
    const whereClauses = ['npi_deactivation_date IS NULL'];
    const params = {};

    // Search by name or NPI
    if (search && search.trim()) {
      whereClauses.push('(LOWER(healthcare_organization_name) LIKE @searchTerm OR LOWER(name) LIKE @searchTerm OR CAST(npi AS STRING) LIKE @searchTerm)');
      params.searchTerm = `%${search.trim().toLowerCase()}%`;
    }

    // State filter - only add if has values
    if (states && Array.isArray(states) && states.length > 0) {
      const stateList = states.map(s => `'${s}'`).join(',');
      whereClauses.push(`primary_address_state_or_province IN (${stateList})`);
    }

    // City filter - only add if has values
    if (cities && Array.isArray(cities) && cities.length > 0) {
      const cityList = cities.map(c => `'${c.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`primary_address_city IN (${cityList})`);
    }

    // Firm type filter - only add if has values
    if (firmTypes && Array.isArray(firmTypes) && firmTypes.length > 0) {
      const firmTypeList = firmTypes.map(f => `'${f.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`definitive_firm_type IN (${firmTypeList})`);
    }

    // Taxonomy classification filter - only add if has values
    if (taxonomyClassifications && Array.isArray(taxonomyClassifications) && taxonomyClassifications.length > 0) {
      const taxonomyList = taxonomyClassifications.map(t => `'${t.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`primary_taxonomy_classification IN (${taxonomyList})`);
    }

    // Taxonomy consolidated specialty filter - only add if has values
    if (taxonomyConsolidatedSpecialties && Array.isArray(taxonomyConsolidatedSpecialties) && taxonomyConsolidatedSpecialties.length > 0) {
      const specialtyList = taxonomyConsolidatedSpecialties.map(s => `'${s.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`primary_taxonomy_consolidated_specialty IN (${specialtyList})`);
    }

    // Taxonomy grouping filter - only add if has values
    if (taxonomyGroupings && Array.isArray(taxonomyGroupings) && taxonomyGroupings.length > 0) {
      const groupingList = taxonomyGroupings.map(g => `'${g.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`primary_taxonomy_grouping IN (${groupingList})`);
    }

    // Hospital parent filter
    if (hasHospitalParent === true) {
      whereClauses.push('hospital_parent_id IS NOT NULL');
    } else if (hasHospitalParent === false) {
      whereClauses.push('hospital_parent_id IS NULL');
    }

    // Physician group filter
    if (hasPhysicianGroup === true) {
      whereClauses.push('physician_group_parent_id IS NOT NULL');
    } else if (hasPhysicianGroup === false) {
      whereClauses.push('physician_group_parent_id IS NULL');
    }

    // Network filter
    if (hasNetwork === true) {
      whereClauses.push('network_id IS NOT NULL');
    } else if (hasNetwork === false) {
      whereClauses.push('network_id IS NULL');
    }

    // Definitive ID filter
    if (hasDefinitiveId === true) {
      whereClauses.push('definitive_id IS NOT NULL');
    } else if (hasDefinitiveId === false) {
      whereClauses.push('definitive_id IS NULL');
    }

    // Geographic filter (if market provided)
    let distanceClause = '';
    let distanceFormula = '';
    if (marketLatitude && marketLongitude && marketRadius) {
      const lat = parseFloat(marketLatitude);
      const lng = parseFloat(marketLongitude);
      const rad = parseFloat(marketRadius);
      
      distanceFormula = `
        ST_DISTANCE(
          ST_GEOGPOINT(${lng}, ${lat}),
          ST_GEOGPOINT(primary_address_long, primary_address_lat)
        ) / 1609.34
      `;
      
      whereClauses.push(`primary_address_lat IS NOT NULL AND primary_address_long IS NOT NULL`);
      whereClauses.push(`${distanceFormula} <= ${rad}`);
      distanceClause = `, ${distanceFormula} as distance_miles`;
    }

    const whereClause = whereClauses.join(' AND ');

    // Build ORDER BY clause
    let orderByClause = 'healthcare_organization_name ASC';
    if (sortBy === 'distance' && distanceClause) {
      orderByClause = `distance_miles ${sortOrder.toUpperCase()}`;
    } else if (sortBy === 'firm_type') {
      orderByClause = `definitive_firm_type ${sortOrder.toUpperCase()}, healthcare_organization_name ASC`;
    } else if (sortBy === 'name') {
      orderByClause = `healthcare_organization_name ${sortOrder.toUpperCase()}`;
    }

    // Calculate offset
    const offset = (page - 1) * pageSize;
    params.pageSize = parseInt(pageSize);
    params.offset = parseInt(offset);

    // Query 1: Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
    `;

    // Query 2: Get paginated results
    const resultsQuery = `
      SELECT
        npi,
        COALESCE(healthcare_organization_name, name) as name,
        definitive_id,
        definitive_name,
        definitive_firm_type,
        definitive_firm_type_full,
        primary_taxonomy_classification,
        primary_taxonomy_consolidated_specialty,
        primary_taxonomy_grouping,
        primary_taxonomy_code,
        primary_address_line_1,
        primary_address_city,
        primary_address_state_or_province as state,
        primary_address_zip5 as zip,
        primary_address_county,
        primary_address_lat as latitude,
        primary_address_long as longitude,
        hospital_parent_id,
        hospital_parent_name,
        physician_group_parent_id,
        physician_group_parent_name,
        network_id,
        network_name
        ${distanceClause}
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT @pageSize
      OFFSET @offset
    `;

    // Query 3: Get filter options (for dynamic filtering)
    const filterOptionsQuery = `
      SELECT
        COUNT(DISTINCT primary_address_state_or_province) as distinct_states,
        COUNT(DISTINCT primary_address_city) as distinct_cities,
        COUNT(DISTINCT definitive_firm_type) as distinct_firm_types,
        COUNT(DISTINCT primary_taxonomy_classification) as distinct_taxonomies,
        COUNT(DISTINCT primary_taxonomy_consolidated_specialty) as distinct_specialties,
        COUNT(DISTINCT primary_taxonomy_grouping) as distinct_groupings
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
    `;

    console.log('📊 Executing HCO directory queries...');

    // Prepare params for count/filter queries (without pagination)
    const countParams = { ...params };
    delete countParams.pageSize;
    delete countParams.offset;

    // Execute queries in parallel
    const [
      [countResult],
      [rows],
      [filterStats]
    ] = await Promise.all([
      vendorBigQuery.query({ query: countQuery, params: countParams }),
      vendorBigQuery.query({ query: resultsQuery, params: params }),
      vendorBigQuery.query({ query: filterOptionsQuery, params: countParams })
    ]);

    const totalCount = parseInt(countResult[0].total);
    const totalPages = Math.ceil(totalCount / pageSize);

    console.log(`✅ Found ${totalCount} organizations (page ${page}/${totalPages})`);

    res.json({
      success: true,
      data: {
        organizations: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        filterStats: filterStats[0]
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Error searching HCO directory:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/hco-directory/filter-options
 * Get available filter options based on current filters
 * Used to populate filter dropdowns dynamically
 */
router.post("/filter-options", async (req, res) => {
  try {
    const {
      states = [],
      cities = [],
      firmTypes = [],
      taxonomyClassifications = [],
      marketLatitude = null,
      marketLongitude = null,
      marketRadius = null,
      optionType = 'all' // all, states, cities, firmTypes, taxonomies, specialties, groupings
    } = req.body;

    // Build WHERE clauses based on current filters
    const whereClauses = ['npi_deactivation_date IS NULL'];

    if (states && Array.isArray(states) && states.length > 0) {
      const stateList = states.map(s => `'${s}'`).join(',');
      whereClauses.push(`primary_address_state_or_province IN (${stateList})`);
    }

    if (cities && Array.isArray(cities) && cities.length > 0) {
      const cityList = cities.map(c => `'${c.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`primary_address_city IN (${cityList})`);
    }

    if (firmTypes && Array.isArray(firmTypes) && firmTypes.length > 0) {
      const firmTypeList = firmTypes.map(f => `'${f.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`definitive_firm_type IN (${firmTypeList})`);
    }

    if (taxonomyClassifications && Array.isArray(taxonomyClassifications) && taxonomyClassifications.length > 0) {
      const taxonomyList = taxonomyClassifications.map(t => `'${t.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`primary_taxonomy_classification IN (${taxonomyList})`);
    }

    if (marketLatitude && marketLongitude && marketRadius) {
      const lat = parseFloat(marketLatitude);
      const lng = parseFloat(marketLongitude);
      const rad = parseFloat(marketRadius);
      
      const distanceFormula = `
        ST_DISTANCE(
          ST_GEOGPOINT(${lng}, ${lat}),
          ST_GEOGPOINT(primary_address_long, primary_address_lat)
        ) / 1609.34
      `;
      
      whereClauses.push(`primary_address_lat IS NOT NULL AND primary_address_long IS NOT NULL`);
      whereClauses.push(`${distanceFormula} <= ${rad}`);
    }

    const whereClause = whereClauses.join(' AND ');

    // Build queries based on option type
    const queries = {};

    if (optionType === 'all' || optionType === 'states') {
      queries.states = `
        SELECT
          primary_address_state_or_province as value,
          primary_address_state_or_province as label,
          COUNT(*) as count
        FROM \`aegis_access.hco_flat\`
        WHERE ${whereClause}
          AND primary_address_state_or_province IS NOT NULL
        GROUP BY primary_address_state_or_province
        ORDER BY count DESC
      `;
    }

    if (optionType === 'all' || optionType === 'cities') {
      queries.cities = `
        SELECT
          primary_address_city as value,
          CONCAT(primary_address_city, ', ', primary_address_state_or_province) as label,
          COUNT(*) as count
        FROM \`aegis_access.hco_flat\`
        WHERE ${whereClause}
          AND primary_address_city IS NOT NULL
        GROUP BY primary_address_city, primary_address_state_or_province
        ORDER BY count DESC
        LIMIT 500
      `;
    }

    if (optionType === 'all' || optionType === 'firmTypes') {
      queries.firmTypes = `
        SELECT
          definitive_firm_type as value,
          definitive_firm_type as label,
          COUNT(*) as count
        FROM \`aegis_access.hco_flat\`
        WHERE ${whereClause}
          AND definitive_firm_type IS NOT NULL
        GROUP BY definitive_firm_type
        ORDER BY count DESC
      `;
    }

    if (optionType === 'all' || optionType === 'taxonomies') {
      queries.taxonomies = `
        SELECT
          primary_taxonomy_classification as value,
          primary_taxonomy_classification as label,
          COUNT(*) as count
        FROM \`aegis_access.hco_flat\`
        WHERE ${whereClause}
          AND primary_taxonomy_classification IS NOT NULL
        GROUP BY primary_taxonomy_classification
        ORDER BY count DESC
      `;
    }

    if (optionType === 'all' || optionType === 'specialties') {
      queries.specialties = `
        SELECT
          primary_taxonomy_consolidated_specialty as value,
          primary_taxonomy_consolidated_specialty as label,
          COUNT(*) as count
        FROM \`aegis_access.hco_flat\`
        WHERE ${whereClause}
          AND primary_taxonomy_consolidated_specialty IS NOT NULL
        GROUP BY primary_taxonomy_consolidated_specialty
        ORDER BY count DESC
      `;
    }

    if (optionType === 'all' || optionType === 'groupings') {
      queries.groupings = `
        SELECT
          primary_taxonomy_grouping as value,
          primary_taxonomy_grouping as label,
          COUNT(*) as count
        FROM \`aegis_access.hco_flat\`
        WHERE ${whereClause}
          AND primary_taxonomy_grouping IS NOT NULL
        GROUP BY primary_taxonomy_grouping
        ORDER BY count DESC
      `;
    }

    // Execute queries in parallel (no params needed since we're using inline values)
    const queryPromises = Object.entries(queries).map(async ([key, query]) => {
      const [results] = await vendorBigQuery.query({ query });
      return [key, results];
    });

    const results = await Promise.all(queryPromises);
    const options = Object.fromEntries(results);

    res.json({
      success: true,
      data: options,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Error fetching filter options:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/hco-directory/profile/:npi
 * Get detailed profile for a single HCO
 * Query params:
 *   - perspective: billing, facility, service_location, performing (default: billing)
 *   - upstreamPerspective: billing, facility, service_location, performing (default: billing)
 *   - downstreamPerspective: billing, facility, service_location, performing (default: billing)
 */
router.get("/profile/:npi", async (req, res) => {
  try {
    const { npi } = req.params;
    const { 
      perspective = 'billing',
      upstreamPerspective = 'billing',
      downstreamPerspective = 'billing'
    } = req.query;

    if (!npi) {
      return res.status(400).json({
        success: false,
        error: "NPI is required"
      });
    }

    console.log(`🏥 Fetching HCO profile for NPI: ${npi}`);
    console.log(`📊 Perspectives - Main: ${perspective}, Upstream: ${upstreamPerspective}, Downstream: ${downstreamPerspective}`);

    // First, get the max dates from reference metadata
    const procedureMaxDateQuery = `
      SELECT max_date
      FROM \`aegis_access.reference_metadata\`
      WHERE view_name = 'volume_procedure'
      LIMIT 1
    `;

    const diagnosisMaxDateQuery = `
      SELECT max_date
      FROM \`aegis_access.reference_metadata\`
      WHERE view_name = 'volume_diagnosis'
      LIMIT 1
    `;

    const [
      [procedureMaxDateResult],
      [diagnosisMaxDateResult]
    ] = await Promise.all([
      vendorBigQuery.query({ query: procedureMaxDateQuery }),
      vendorBigQuery.query({ query: diagnosisMaxDateQuery })
    ]);

    const procedureMaxDate = procedureMaxDateResult[0]?.max_date;
    const diagnosisMaxDate = diagnosisMaxDateResult[0]?.max_date;

    console.log(`📅 Max dates - Procedures: ${procedureMaxDate}, Diagnoses: ${diagnosisMaxDate}`);

    // Get full HCO record
    const profileQuery = `
      SELECT *
      FROM \`aegis_access.hco_flat\`
      WHERE npi = '${npi}'
      LIMIT 1
    `;

    // Determine NPI field based on perspective
    const npiField = `${perspective}_provider_npi`;

    // Get procedure volume for last 12 months
    const procedureVolumeQuery = `
      SELECT
        SUM(count) as total_procedures,
        SUM(charge_total) as total_charges,
        COUNT(DISTINCT code) as unique_procedures,
        COUNT(DISTINCT date__month_grain) as months_with_data
      FROM \`aegis_access.volume_procedure\`
      WHERE ${npiField} = '${npi}'
        AND date__month_grain >= DATE_SUB(DATE('${procedureMaxDate.value}'), INTERVAL 11 MONTH)
        AND date__month_grain <= DATE('${procedureMaxDate.value}')
    `;

    // Get top procedures
    const topProceduresQuery = `
      SELECT
        code,
        code_description,
        service_line_description,
        SUM(count) as procedure_count,
        SUM(charge_total) as total_charges
      FROM \`aegis_access.volume_procedure\`
      WHERE ${npiField} = '${npi}'
        AND date__month_grain >= DATE_SUB(DATE('${procedureMaxDate.value}'), INTERVAL 11 MONTH)
        AND date__month_grain <= DATE('${procedureMaxDate.value}')
        AND code IS NOT NULL
      GROUP BY code, code_description, service_line_description
      ORDER BY procedure_count DESC
      LIMIT 20
    `;

    // Get diagnosis volume for last 12 months
    const diagnosisVolumeQuery = `
      SELECT
        SUM(count) as total_diagnoses,
        COUNT(DISTINCT code) as unique_diagnoses,
        COUNT(DISTINCT date__month_grain) as months_with_data
      FROM \`aegis_access.volume_diagnosis\`
      WHERE ${npiField} = '${npi}'
        AND date__month_grain >= DATE_SUB(DATE('${diagnosisMaxDate.value}'), INTERVAL 11 MONTH)
        AND date__month_grain <= DATE('${diagnosisMaxDate.value}')
    `;

    // Get top diagnoses
    const topDiagnosesQuery = `
      SELECT
        code,
        code_description,
        SUM(count) as diagnosis_count
      FROM \`aegis_access.volume_diagnosis\`
      WHERE ${npiField} = '${npi}'
        AND date__month_grain >= DATE_SUB(DATE('${diagnosisMaxDate.value}'), INTERVAL 11 MONTH)
        AND date__month_grain <= DATE('${diagnosisMaxDate.value}')
        AND code IS NOT NULL
      GROUP BY code, code_description
      ORDER BY diagnosis_count DESC
      LIMIT 20
    `;

    const [
      [profileResults],
      [volumeResults],
      [procedureResults],
      [diagnosisVolumeResults],
      [diagnosisResults]
    ] = await Promise.all([
      vendorBigQuery.query({ query: profileQuery }),
      vendorBigQuery.query({ query: procedureVolumeQuery }),
      vendorBigQuery.query({ query: topProceduresQuery }),
      vendorBigQuery.query({ query: diagnosisVolumeQuery }),
      vendorBigQuery.query({ query: topDiagnosesQuery })
    ]);

    if (!profileResults || profileResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Organization not found"
      });
    }

    const profile = profileResults[0];
    const volume = volumeResults[0] || {};
    const topProcedures = procedureResults || [];
    const diagnosisVolume = diagnosisVolumeResults[0] || {};
    const topDiagnoses = diagnosisResults || [];

    console.log(`✅ Profile loaded for ${profile.healthcare_organization_name || profile.name}`);

    // Now get pathways data
    console.log(`🔄 Fetching pathways data for NPI: ${npi}`);

    // Map perspective to field prefix
    const getPerspectiveFields = (perspectiveType, direction) => {
      const prefix = `${direction}_${perspectiveType}_provider`;
      return {
        npi: `${prefix}_npi`,
        name: `${prefix}_name`,
        taxonomy: `${prefix}_taxonomy_classification`,
        state: `${prefix}_state`,
        city: `${prefix}_city`
      };
    };

    // Get field names for current HCO perspective
    const inboundFields = getPerspectiveFields(perspective, 'inbound');
    const outboundFields = getPerspectiveFields(perspective, 'outbound');
    
    // Get field names for upstream providers
    const upstreamProviderFields = getPerspectiveFields(upstreamPerspective, 'outbound');
    
    // Get field names for downstream providers
    const downstreamProviderFields = getPerspectiveFields(downstreamPerspective, 'inbound');

    // UPSTREAM: Where did patients come FROM before this HCO?
    // Using pathways_provider_overall for speed (pre-aggregated)
    // Filter: inbound provider (current perspective) = this HCO (patients arrived here)
    // Group by: outbound provider (upstream perspective - where they came from)
    const upstreamQuery = `
      SELECT
        ${upstreamProviderFields.npi} as npi,
        ${upstreamProviderFields.name} as provider_name,
        ${upstreamProviderFields.taxonomy} as taxonomy,
        ${upstreamProviderFields.state} as state,
        ${upstreamProviderFields.city} as city,
        SUM(inbound_count) as patient_count
      FROM \`aegis_access.pathways_provider_overall\`
      WHERE ${inboundFields.npi} = '${npi}'
        AND date__month_grain >= DATE_SUB(DATE('${procedureMaxDate.value}'), INTERVAL 11 MONTH)
        AND date__month_grain <= DATE('${procedureMaxDate.value}')
        AND lead_up_period_days_max <= 14
        AND ${upstreamProviderFields.npi} IS NOT NULL
        AND ${upstreamProviderFields.name} IS NOT NULL
      GROUP BY 
        ${upstreamProviderFields.npi},
        ${upstreamProviderFields.name},
        ${upstreamProviderFields.taxonomy},
        ${upstreamProviderFields.state},
        ${upstreamProviderFields.city}
      ORDER BY patient_count DESC
      LIMIT 50
    `;

    // DOWNSTREAM: Where did patients go TO after this HCO?
    // Using pathways_provider_overall for speed (pre-aggregated)
    // Filter: outbound provider (current perspective) = this HCO (patients left from here)
    // Group by: inbound provider (downstream perspective - where they went to)
    const downstreamQuery = `
      SELECT
        ${downstreamProviderFields.npi} as npi,
        ${downstreamProviderFields.name} as provider_name,
        ${downstreamProviderFields.taxonomy} as taxonomy,
        ${downstreamProviderFields.state} as state,
        ${downstreamProviderFields.city} as city,
        SUM(inbound_count) as patient_count
      FROM \`aegis_access.pathways_provider_overall\`
      WHERE ${outboundFields.npi} = '${npi}'
        AND date__month_grain >= DATE_SUB(DATE('${procedureMaxDate.value}'), INTERVAL 11 MONTH)
        AND date__month_grain <= DATE('${procedureMaxDate.value}')
        AND lead_up_period_days_max <= 14
        AND ${downstreamProviderFields.npi} IS NOT NULL
        AND ${downstreamProviderFields.name} IS NOT NULL
      GROUP BY 
        ${downstreamProviderFields.npi},
        ${downstreamProviderFields.name},
        ${downstreamProviderFields.taxonomy},
        ${downstreamProviderFields.state},
        ${downstreamProviderFields.city}
      ORDER BY patient_count DESC
      LIMIT 50
    `;

    const [
      [upstreamResults],
      [downstreamResults]
    ] = await Promise.all([
      vendorBigQuery.query({ query: upstreamQuery }),
      vendorBigQuery.query({ query: downstreamQuery })
    ]);

    console.log(`✅ Pathways loaded - Upstream: ${upstreamResults.length}, Downstream: ${downstreamResults.length}`);

    res.json({
      success: true,
      data: {
        profile,
        volumeMetrics: {
          totalProcedures: parseInt(volume.total_procedures || 0),
          totalCharges: parseFloat(volume.total_charges || 0),
          uniqueProcedures: parseInt(volume.unique_procedures || 0),
          monthsWithData: parseInt(volume.months_with_data || 0)
        },
        topProcedures,
        diagnosisMetrics: {
          totalDiagnoses: parseInt(diagnosisVolume.total_diagnoses || 0),
          uniqueDiagnoses: parseInt(diagnosisVolume.unique_diagnoses || 0),
          monthsWithData: parseInt(diagnosisVolume.months_with_data || 0)
        },
        topDiagnoses,
        pathways: {
          upstream: upstreamResults,
          downstream: downstreamResults
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Error fetching HCO profile:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;

