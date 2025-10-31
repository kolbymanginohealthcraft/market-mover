import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

/**
 * REFERRAL PATHWAYS ANALYSIS
 * 
 * Analyzes facility-to-facility referral patterns using pathways_provider_overall table
 * Focus: Which facilities (hospitals, SNFs, etc.) are sending patients to a specific facility
 * 
 * Key Concepts:
 * - OUTBOUND facility: Where patient came FROM (e.g., hospitals)
 * - INBOUND facility: Where patient went TO (your facility - SNF, home health, etc.)
 * - We use inbound_count as the volume metric
 */

// Valid table names (for security - prevent SQL injection)
const VALID_TABLE_NAMES = [
  'pathways_provider_overall',
  'medicare_pathways_provider_overall'
];

/**
 * Get the pathways table name from request, with validation
 * @param {string} tableName - Table name from request (query param or body)
 * @returns {string} Valid table name, defaults to 'pathways_provider_overall'
 */
function getPathwaysTableName(tableName) {
  // Default to the original table
  if (!tableName) {
    return 'pathways_provider_overall';
  }
  
  // Validate table name for security
  if (VALID_TABLE_NAMES.includes(tableName)) {
    return tableName;
  }
  
  // If invalid, log warning and default to original
  console.warn(`⚠️ Invalid table name "${tableName}", defaulting to pathways_provider_overall`);
  return 'pathways_provider_overall';
}

/**
 * Get the field prefix based on NPI type
 * @param {string} npiType - 'facility' or 'service_location'
 * @returns {string} Field prefix: 'facility_provider' or 'service_location_provider'
 */
function getNpiTypePrefix(npiType) {
  // Default to facility
  if (!npiType || npiType === 'facility') {
    return 'facility_provider';
  }
  
  // Validate and return service_location
  if (npiType === 'service_location') {
    return 'service_location_provider';
  }
  
  // If invalid, log warning and default to facility
  console.warn(`⚠️ Invalid NPI type "${npiType}", defaulting to facility`);
  return 'facility_provider';
}

// Get metadata for the pathways table (max_date)
router.get("/metadata", async (req, res) => {
  try {
    const tableName = getPathwaysTableName(req.query.tableName);
    console.log("📊 Referral Pathways: Fetching metadata for table:", tableName);

    const query = `
      SELECT max_date
      FROM \`aegis_access.reference_metadata\`
      WHERE view_name = @viewName
      LIMIT 1
    `;

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: { viewName: tableName }
    });

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No metadata found for ${tableName}`
      });
    }

    console.log("📊 Metadata result:", {
      maxDate: rows[0].max_date,
      maxDateType: typeof rows[0].max_date,
      maxDateValue: rows[0].max_date?.value || rows[0].max_date
    });

    res.json({
      success: true,
      data: {
        viewName: tableName,
        maxDate: rows[0].max_date
      }
    });
  } catch (error) {
    console.error("❌ Error fetching metadata:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get facility location (for map)
router.get("/facility-location/:npi", async (req, res) => {
  try {
    const { npi } = req.params;
    
    console.log("📍 Referral Pathways: Fetching facility location for", npi);

    const query = `
      SELECT 
        npi,
        definitive_id,
        definitive_name,
        primary_address_lat as latitude,
        primary_address_long as longitude,
        primary_taxonomy_classification as taxonomy_classification
      FROM \`aegis_access.hco_flat\`
      WHERE npi = @npi
      LIMIT 1
    `;

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: { npi }
    });

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Facility not found"
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error("❌ Error fetching facility location:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get referral sources for a specific inbound facility
router.post("/referral-sources", async (req, res) => {
  try {
    const { 
      inboundNPI,
      dateFrom,
      dateTo,
      groupByField = null, // Will be set based on npiType
      leadUpPeriodMax = null,
      filters = {},
      limit = 100,
      tableName = null, // Optional: specify which pathways table to use
      npiType = 'facility' // 'facility' or 'service_location'
    } = req.body;

    const pathwaysTable = getPathwaysTableName(tableName);
    const npiPrefix = getNpiTypePrefix(npiType);
    
    // Set default groupByField based on NPI type
    const defaultGroupBy = groupByField || `outbound_${npiPrefix}_taxonomy_classification`;

    console.log("🏥 Referral Pathways: Fetching referral sources", {
      inboundNPI,
      dateFrom,
      dateTo,
      groupByField: defaultGroupBy,
      leadUpPeriodMax,
      filters: Object.keys(filters).length,
      pathwaysTable,
      npiType,
      npiPrefix
    });

    // Validate inputs
    if (!inboundNPI) {
      return res.status(400).json({
        success: false,
        message: "inboundNPI is required"
      });
    }

    // Build WHERE clause with dynamic field names
    const whereClauses = [
      `inbound_${npiPrefix}_npi = @inboundNPI`,
      `outbound_${npiPrefix}_npi IS NOT NULL`,
      `inbound_${npiPrefix}_npi IS NOT NULL`,
      `outbound_${npiPrefix}_npi != inbound_${npiPrefix}_npi`, // Exclude self-referrals
      `outbound_${npiPrefix}_npi_type = '2'`, // Only Type 2 organizations
      `inbound_${npiPrefix}_npi_type = '2'` // Only Type 2 organizations
    ];
    
    const params = { 
      inboundNPI,
      limit: parseInt(limit)
    };

    // Add date filters
    if (dateFrom) {
      whereClauses.push('date__month_grain >= @dateFrom');
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      whereClauses.push('date__month_grain <= @dateTo');
      params.dateTo = dateTo;
    }

    // Add lead-up period filter
    if (leadUpPeriodMax !== null && leadUpPeriodMax !== undefined) {
      whereClauses.push('lead_up_period_days_max <= @leadUpPeriodMax');
      params.leadUpPeriodMax = parseInt(leadUpPeriodMax);
    }

    // Add custom filters
    Object.entries(filters).forEach(([column, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const paramName = column.replace(/[^a-zA-Z0-9_]/g, '_');
        
        if (Array.isArray(value) && value.length > 0) {
          whereClauses.push(`${column} IN UNNEST(@${paramName})`);
          params[paramName] = value;
        } else if (typeof value === 'string' && value.includes(',')) {
          const values = value.split(',').map(v => v.trim()).filter(v => v !== '');
          if (values.length > 0) {
            whereClauses.push(`${column} IN UNNEST(@${paramName})`);
            params[paramName] = values;
          }
        } else {
          whereClauses.push(`${column} = @${paramName}`);
          params[paramName] = value;
        }
      }
    });

    const whereClause = whereClauses.join(' AND ');

    // Determine which fields to select based on groupByField (with dynamic NPI prefix)
    let selectFields = '';
    let groupByFields = '';
    
    // Normalize groupByField to work with either facility or service_location
    const normalizedGroupBy = defaultGroupBy.replace(/_(facility_provider|service_location_provider)_/, `_${npiPrefix}_`);
    
    if (normalizedGroupBy === `outbound_${npiPrefix}_npi`) {
      selectFields = `
        outbound_${npiPrefix}_npi,
        MAX(outbound_${npiPrefix}_name) as outbound_${npiPrefix}_name,
        MAX(outbound_${npiPrefix}_city) as outbound_${npiPrefix}_city,
        MAX(outbound_${npiPrefix}_state) as outbound_${npiPrefix}_state,
        MAX(outbound_${npiPrefix}_county) as outbound_${npiPrefix}_county,
        MAX(outbound_${npiPrefix}_taxonomy_classification) as outbound_${npiPrefix}_taxonomy_classification,
        MAX(outbound_${npiPrefix}_taxonomy_specialization) as outbound_${npiPrefix}_taxonomy_specialization
      `;
      groupByFields = `outbound_${npiPrefix}_npi`;
    } else if (normalizedGroupBy === `outbound_${npiPrefix}_taxonomy_classification`) {
      selectFields = `
        outbound_${npiPrefix}_taxonomy_classification
      `;
      groupByFields = `outbound_${npiPrefix}_taxonomy_classification`;
    } else if (normalizedGroupBy === `outbound_${npiPrefix}_taxonomy_specialization`) {
      selectFields = `
        outbound_${npiPrefix}_taxonomy_specialization,
        MAX(outbound_${npiPrefix}_taxonomy_classification) as outbound_${npiPrefix}_taxonomy_classification
      `;
      groupByFields = `outbound_${npiPrefix}_taxonomy_specialization`;
    } else if (normalizedGroupBy === `outbound_${npiPrefix}_state`) {
      selectFields = `
        outbound_${npiPrefix}_state
      `;
      groupByFields = `outbound_${npiPrefix}_state`;
    } else if (normalizedGroupBy === `outbound_${npiPrefix}_county`) {
      selectFields = `
        outbound_${npiPrefix}_county,
        MAX(outbound_${npiPrefix}_state) as outbound_${npiPrefix}_state
      `;
      groupByFields = `outbound_${npiPrefix}_county`;
    } else {
      // Default to classification
      selectFields = `
        outbound_${npiPrefix}_taxonomy_classification
      `;
      groupByFields = `outbound_${npiPrefix}_taxonomy_classification`;
    }

    const query = `
      SELECT 
        ${selectFields},
        COUNT(DISTINCT outbound_${npiPrefix}_npi) as unique_facilities,
        SUM(inbound_count) as total_referrals,
        SUM(charges_total) as total_charges,
        MIN(date__month_grain) as earliest_referral,
        MAX(date__month_grain) as latest_referral,
        COUNT(DISTINCT date__month_grain) as months_with_activity
      FROM \`aegis_access.${pathwaysTable}\`
      WHERE ${whereClause}
      GROUP BY ${groupByFields}
      ORDER BY total_referrals DESC
      LIMIT @limit
    `;

    console.log("🔍 Executing query:", query.substring(0, 200) + "...");
    console.log("🔍 Params:", JSON.stringify(params, null, 2));

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });

    console.log(`✅ Retrieved ${rows.length} referral sources`);

    // Sanitize date objects (use let so we can reassign after aggregation)
    let sanitizedRows = rows.map(row => {
      const sanitizedRow = {};
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (value instanceof Date) {
          sanitizedRow[key] = value.toISOString().split('T')[0];
        } else if (value && typeof value === 'object' && value.value !== undefined) {
          if (value.value instanceof Date) {
            sanitizedRow[key] = value.value.toISOString().split('T')[0];
          } else {
            sanitizedRow[key] = value.value;
          }
        } else {
          sanitizedRow[key] = value;
        }
      });
      return sanitizedRow;
    });

    // If grouping by NPI, enrich with definitive names from hco_flat (fast lookup on small result set)
    if (normalizedGroupBy === `outbound_${npiPrefix}_npi` && sanitizedRows.length > 0) {
      try {
        // Use dynamic field names based on NPI type
        const npiField = `outbound_${npiPrefix}_npi`;
        const nameField = `outbound_${npiPrefix}_name`;
        
        const npis = sanitizedRows.map(row => row[npiField]).filter(Boolean);
        
        if (npis.length > 0) {
          console.log(`🏥 Fetching definitive names and locations for ${npis.length} ${npiType} providers from hco_flat`);
          
          const nameQuery = `
            SELECT 
              npi,
              definitive_id,
              definitive_name,
              primary_address_lat as latitude,
              primary_address_long as longitude
            FROM \`aegis_access.hco_flat\`
            WHERE npi IN UNNEST(@npis)
          `;
          
          const [nameRows] = await vendorBigQueryClient.query({ 
            query: nameQuery,
            params: { npis }
          });
          
          // Create lookup map
          const nameMap = {};
          nameRows.forEach(row => {
            nameMap[row.npi] = {
              definitive_id: row.definitive_id,
              definitive_name: row.definitive_name,
              latitude: row.latitude,
              longitude: row.longitude
            };
          });
          
          console.log(`✅ Retrieved definitive names and locations for ${Object.keys(nameMap).length} providers`);
          
          // Enrich results with definitive names and locations
          sanitizedRows.forEach(row => {
            const npiValue = row[npiField];
            if (npiValue && nameMap[npiValue]) {
              const definitiveInfo = nameMap[npiValue];
              row.definitive_id = definitiveInfo.definitive_id;
              row.definitive_name = definitiveInfo.definitive_name;
              row.latitude = definitiveInfo.latitude;
              row.longitude = definitiveInfo.longitude;
            }
          });

          // Post-aggregate by definitive_id to deduplicate providers with multiple NPIs
          const definitiveMap = {};
          sanitizedRows.forEach(row => {
            const npiValue = row[npiField];
            const defId = row.definitive_id || npiValue; // Fallback to NPI if no definitive_id
            
            if (!definitiveMap[defId]) {
              // First occurrence of this definitive facility
              definitiveMap[defId] = {
                ...row,
                total_referrals: Number(row.total_referrals) || 0,
                total_charges: Number(row.total_charges) || 0,
                unique_facilities: Number(row.unique_facilities) || 0,
                months_with_activity: Number(row.months_with_activity) || 0,
                latitude: row.latitude, // Keep first lat/long
                longitude: row.longitude,
                npis: [npiValue], // Track all NPIs for this provider
                original_names: row[nameField] ? [row[nameField]] : []
              };
            } else {
              // Merge with existing provider
              definitiveMap[defId].unique_facilities += Number(row.unique_facilities) || 0;
              definitiveMap[defId].total_referrals += Number(row.total_referrals) || 0;
              definitiveMap[defId].total_charges += Number(row.total_charges) || 0;
              definitiveMap[defId].months_with_activity = Math.max(
                definitiveMap[defId].months_with_activity || 0,
                Number(row.months_with_activity) || 0
              );
              // Keep the most recent latest_referral
              if (row.latest_referral > definitiveMap[defId].latest_referral) {
                definitiveMap[defId].latest_referral = row.latest_referral;
              }
              // Keep the earliest earliest_referral if present
              if (row.earliest_referral && (!definitiveMap[defId].earliest_referral || row.earliest_referral < definitiveMap[defId].earliest_referral)) {
                definitiveMap[defId].earliest_referral = row.earliest_referral;
              }
              // Use first available lat/long if not already set
              if (!definitiveMap[defId].latitude && row.latitude) {
                definitiveMap[defId].latitude = row.latitude;
                definitiveMap[defId].longitude = row.longitude;
              }
              // Track all NPIs
              definitiveMap[defId].npis.push(npiValue);
              if (row[nameField] && !definitiveMap[defId].original_names.includes(row[nameField])) {
                definitiveMap[defId].original_names.push(row[nameField]);
              }
            }
          });

          // Convert back to array and sort by total_referrals
          sanitizedRows = Object.values(definitiveMap)
            .sort((a, b) => b.total_referrals - a.total_referrals)
            .slice(0, parseInt(limit)); // Re-apply limit after aggregation

          console.log(`✅ Aggregated ${sanitizedRows.length} unique ${npiType} providers (from ${npis.length} NPIs) in referral-sources`);
          
          // Debug: Check for duplicates
          const defIdCounts = {};
          sanitizedRows.forEach(row => {
            const defId = row.definitive_id || row[npiField];
            defIdCounts[defId] = (defIdCounts[defId] || 0) + 1;
          });
          const duplicates = Object.entries(defIdCounts).filter(([id, count]) => count > 1);
          if (duplicates.length > 0) {
            console.warn(`⚠️ Still have duplicates after aggregation:`, duplicates);
          }
        }
      } catch (err) {
        console.error('⚠️ Error fetching definitive names (non-fatal):', err.message);
        // Don't fail the whole request if name lookup fails
      }
    }

    res.json({
      success: true,
      data: sanitizedRows,
      metadata: {
        rowCount: rows.length,
        inboundNPI,
        groupByField,
        dateRange: { from: dateFrom, to: dateTo }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error fetching referral sources:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch referral sources",
      error: error.message
    });
  }
});

// Get detailed list of specific facilities (drill-down from taxonomy level)
router.post("/facility-details", async (req, res) => {
  try {
    const { 
      inboundNPI,
      dateFrom,
      dateTo,
      leadUpPeriodMax = null,
      taxonomyClassification = null,
      taxonomySpecialization = null,
      state = null,
      county = null,
      limit = 100,
      tableName = null, // Optional: specify which pathways table to use
      npiType = 'facility' // 'facility' or 'service_location'
    } = req.body;

    const pathwaysTable = getPathwaysTableName(tableName);
    const npiPrefix = getNpiTypePrefix(npiType);

    console.log("🏥 Referral Pathways: Fetching facility details", {
      inboundNPI,
      leadUpPeriodMax,
      taxonomyClassification,
      taxonomySpecialization,
      state,
      county,
      pathwaysTable,
      npiType,
      npiPrefix
    });

    // Validate inputs
    if (!inboundNPI) {
      return res.status(400).json({
        success: false,
        message: "inboundNPI is required"
      });
    }

    // Build WHERE clause with dynamic field names
    const whereClauses = [
      `inbound_${npiPrefix}_npi = @inboundNPI`,
      `outbound_${npiPrefix}_npi IS NOT NULL`,
      `inbound_${npiPrefix}_npi IS NOT NULL`,
      `outbound_${npiPrefix}_npi != inbound_${npiPrefix}_npi`, // Exclude self-referrals
      `outbound_${npiPrefix}_npi_type = '2'`, // Only Type 2 organizations
      `inbound_${npiPrefix}_npi_type = '2'` // Only Type 2 organizations
    ];
    
    const params = { 
      inboundNPI,
      limit: parseInt(limit)
    };

    // Add date filters
    if (dateFrom) {
      whereClauses.push('date__month_grain >= @dateFrom');
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      whereClauses.push('date__month_grain <= @dateTo');
      params.dateTo = dateTo;
    }

    // Add lead-up period filter
    if (leadUpPeriodMax !== null && leadUpPeriodMax !== undefined) {
      whereClauses.push('lead_up_period_days_max <= @leadUpPeriodMax');
      params.leadUpPeriodMax = parseInt(leadUpPeriodMax);
    }

    // Add taxonomy filters for drill-down
    if (taxonomyClassification) {
      whereClauses.push(`outbound_${npiPrefix}_taxonomy_classification = @taxonomyClassification`);
      params.taxonomyClassification = taxonomyClassification;
    }
    if (taxonomySpecialization) {
      whereClauses.push(`outbound_${npiPrefix}_taxonomy_specialization = @taxonomySpecialization`);
      params.taxonomySpecialization = taxonomySpecialization;
    }
    if (state) {
      whereClauses.push(`outbound_${npiPrefix}_state = @state`);
      params.state = state;
    }
    if (county) {
      whereClauses.push(`outbound_${npiPrefix}_county = @county`);
      params.county = county;
    }

    const whereClause = whereClauses.join(' AND ');

    const query = `
      SELECT 
        outbound_${npiPrefix}_npi,
        MAX(outbound_${npiPrefix}_name) as outbound_${npiPrefix}_name,
        MAX(outbound_${npiPrefix}_city) as outbound_${npiPrefix}_city,
        MAX(outbound_${npiPrefix}_state) as outbound_${npiPrefix}_state,
        MAX(outbound_${npiPrefix}_county) as outbound_${npiPrefix}_county,
        MAX(outbound_${npiPrefix}_taxonomy_classification) as outbound_${npiPrefix}_taxonomy_classification,
        MAX(outbound_${npiPrefix}_taxonomy_specialization) as outbound_${npiPrefix}_taxonomy_specialization,
        SUM(inbound_count) as total_referrals,
        SUM(charges_total) as total_charges,
        MIN(date__month_grain) as earliest_referral,
        MAX(date__month_grain) as latest_referral,
        COUNT(DISTINCT date__month_grain) as months_with_activity,
        ROUND(SUM(inbound_count) / COUNT(DISTINCT date__month_grain), 1) as avg_monthly_referrals
      FROM \`aegis_access.${pathwaysTable}\`
      WHERE ${whereClause}
      GROUP BY outbound_${npiPrefix}_npi
      ORDER BY total_referrals DESC
      LIMIT @limit
    `;

    console.log("🔍 Executing facility details query");

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });

    console.log(`✅ Retrieved ${rows.length} facilities`);

    // Sanitize date objects (use let so we can reassign after aggregation)
    let sanitizedRows = rows.map(row => {
      const sanitizedRow = {};
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (value instanceof Date) {
          sanitizedRow[key] = value.toISOString().split('T')[0];
        } else if (value && typeof value === 'object' && value.value !== undefined) {
          if (value.value instanceof Date) {
            sanitizedRow[key] = value.value.toISOString().split('T')[0];
          } else {
            sanitizedRow[key] = value.value;
          }
        } else {
          sanitizedRow[key] = value;
        }
      });
      return sanitizedRow;
    });

    // Enrich with definitive names from hco_flat (fast lookup on small result set)
    if (sanitizedRows.length > 0) {
      try {
        const npis = sanitizedRows.map(row => row.outbound_facility_provider_npi).filter(Boolean);
        
        if (npis.length > 0) {
          console.log(`🏥 Fetching definitive names and locations for ${npis.length} facilities from hco_flat`);
          
          const nameQuery = `
            SELECT 
              npi,
              definitive_id,
              definitive_name,
              primary_address_lat as latitude,
              primary_address_long as longitude
            FROM \`aegis_access.hco_flat\`
            WHERE npi IN UNNEST(@npis)
          `;
          
          const [nameRows] = await vendorBigQueryClient.query({ 
            query: nameQuery,
            params: { npis }
          });
          
          // Create lookup map
          const nameMap = {};
          nameRows.forEach(row => {
            nameMap[row.npi] = {
              definitive_id: row.definitive_id,
              definitive_name: row.definitive_name,
              latitude: row.latitude,
              longitude: row.longitude
            };
          });
          
          console.log(`✅ Retrieved definitive names and locations for ${Object.keys(nameMap).length} facilities`);
          
          // Enrich results with definitive names and locations
          sanitizedRows.forEach(row => {
            if (row.outbound_facility_provider_npi && nameMap[row.outbound_facility_provider_npi]) {
              const definitiveInfo = nameMap[row.outbound_facility_provider_npi];
              row.definitive_id = definitiveInfo.definitive_id;
              row.definitive_name = definitiveInfo.definitive_name;
              row.latitude = definitiveInfo.latitude;
              row.longitude = definitiveInfo.longitude;
            }
          });

          // Post-aggregate by definitive_id to deduplicate facilities with multiple NPIs
          const definitiveMap = {};
          sanitizedRows.forEach(row => {
            const defId = row.definitive_id || row.outbound_facility_provider_npi; // Fallback to NPI if no definitive_id
            
            if (!definitiveMap[defId]) {
              // First occurrence of this definitive facility
              definitiveMap[defId] = {
                ...row,
                total_referrals: Number(row.total_referrals) || 0,
                total_charges: Number(row.total_charges) || 0,
                avg_monthly_referrals: Number(row.avg_monthly_referrals) || 0,
                months_with_activity: Number(row.months_with_activity) || 0,
                latitude: row.latitude, // Keep first lat/long
                longitude: row.longitude,
                npis: [row.outbound_facility_provider_npi], // Track all NPIs for this facility
                original_names: row.outbound_facility_provider_name ? [row.outbound_facility_provider_name] : []
              };
            } else {
              // Merge with existing facility
              definitiveMap[defId].total_referrals += Number(row.total_referrals) || 0;
              definitiveMap[defId].total_charges += Number(row.total_charges) || 0;
              definitiveMap[defId].avg_monthly_referrals += Number(row.avg_monthly_referrals) || 0;
              definitiveMap[defId].months_with_activity = Math.max(
                definitiveMap[defId].months_with_activity || 0,
                Number(row.months_with_activity) || 0
              );
              // Keep the most recent latest_referral
              if (row.latest_referral > definitiveMap[defId].latest_referral) {
                definitiveMap[defId].latest_referral = row.latest_referral;
              }
              // Keep the earliest earliest_referral if present
              if (row.earliest_referral && (!definitiveMap[defId].earliest_referral || row.earliest_referral < definitiveMap[defId].earliest_referral)) {
                definitiveMap[defId].earliest_referral = row.earliest_referral;
              }
              // Use first available lat/long if not already set
              if (!definitiveMap[defId].latitude && row.latitude) {
                definitiveMap[defId].latitude = row.latitude;
                definitiveMap[defId].longitude = row.longitude;
              }
              // Track all NPIs
              definitiveMap[defId].npis.push(row.outbound_facility_provider_npi);
              if (row.outbound_facility_provider_name && !definitiveMap[defId].original_names.includes(row.outbound_facility_provider_name)) {
                definitiveMap[defId].original_names.push(row.outbound_facility_provider_name);
              }
            }
          });

          // Convert back to array and sort by total_referrals
          sanitizedRows = Object.values(definitiveMap)
            .sort((a, b) => b.total_referrals - a.total_referrals)
            .slice(0, parseInt(limit)); // Re-apply limit after aggregation

          console.log(`✅ Aggregated ${sanitizedRows.length} unique facilities (from ${npis.length} NPIs) in facility-details`);
          
          // Debug: Check for duplicates
          const defIdCounts = {};
          sanitizedRows.forEach(row => {
            const defId = row.definitive_id || row.outbound_facility_provider_npi;
            defIdCounts[defId] = (defIdCounts[defId] || 0) + 1;
          });
          const duplicates = Object.entries(defIdCounts).filter(([id, count]) => count > 1);
          if (duplicates.length > 0) {
            console.warn(`⚠️ Still have duplicates after aggregation:`, duplicates);
          }
        }
      } catch (err) {
        console.error('⚠️ Error fetching definitive names (non-fatal):', err.message);
        // Don't fail the whole request if name lookup fails
      }
    }

    res.json({
      success: true,
      data: sanitizedRows,
      metadata: {
        rowCount: rows.length,
        inboundNPI,
        filters: { taxonomyClassification, taxonomySpecialization, state, county }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error fetching facility details:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch facility details",
      error: error.message
    });
  }
});

// Get available filter values for taxonomy levels
router.post("/filter-options", async (req, res) => {
  try {
    const { 
      inboundNPI,
      dateFrom,
      dateTo,
      column,
      tableName = null // Optional: specify which pathways table to use
    } = req.body;

    const pathwaysTable = getPathwaysTableName(tableName);

    console.log("🔍 Referral Pathways: Fetching filter options", {
      inboundNPI,
      column,
      pathwaysTable
    });

    if (!inboundNPI || !column) {
      return res.status(400).json({
        success: false,
        message: "inboundNPI and column are required"
      });
    }

    // Check cache (include table name in cache key)
    const cacheKey = `referral-pathways-filter-${pathwaysTable}-${inboundNPI}-${column}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log(`✅ Using cached filter options for ${column}`);
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Build WHERE clause
    const whereClauses = [
      'inbound_facility_provider_npi = @inboundNPI',
      'outbound_facility_provider_npi IS NOT NULL',
      `${column} IS NOT NULL`
    ];
    
    const params = { inboundNPI };

    if (dateFrom) {
      whereClauses.push('date__month_grain >= @dateFrom');
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      whereClauses.push('date__month_grain <= @dateTo');
      params.dateTo = dateTo;
    }

    const whereClause = whereClauses.join(' AND ');

    const query = `
      SELECT DISTINCT ${column} as value
      FROM \`aegis_access.${pathwaysTable}\`
      WHERE ${whereClause}
      ORDER BY value ASC
      LIMIT 500
    `;

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });

    console.log(`✅ Retrieved ${rows.length} filter options for ${column}`);

    // Cache for 5 minutes
    cache.set(cacheKey, rows);

    res.json({
      success: true,
      data: rows,
      metadata: {
        column,
        count: rows.length
      }
    });

  } catch (error) {
    console.error("❌ Error fetching filter options:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch filter options",
      error: error.message
    });
  }
});

// Get trend data (monthly breakdown)
router.post("/trends", async (req, res) => {
  try {
    const { 
      inboundNPI,
      dateFrom,
      dateTo,
      leadUpPeriodMax = null,
      filters = {},
      tableName = null // Optional: specify which pathways table to use
    } = req.body;

    const pathwaysTable = getPathwaysTableName(tableName);

    console.log("📈 Referral Pathways: Fetching trends", {
      inboundNPI,
      dateFrom,
      dateTo,
      leadUpPeriodMax,
      pathwaysTable
    });

    if (!inboundNPI) {
      return res.status(400).json({
        success: false,
        message: "inboundNPI is required"
      });
    }

    // Build WHERE clause
    const whereClauses = [
      'inbound_facility_provider_npi = @inboundNPI',
      'outbound_facility_provider_npi IS NOT NULL',
      'outbound_facility_provider_npi != inbound_facility_provider_npi', // Exclude self-referrals
      "outbound_facility_provider_npi_type = '2'", // Only Type 2 organizations (string comparison)
      "inbound_facility_provider_npi_type = '2'" // Only Type 2 organizations (string comparison)
    ];
    
    const params = { inboundNPI };

    if (dateFrom) {
      whereClauses.push('date__month_grain >= @dateFrom');
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      whereClauses.push('date__month_grain <= @dateTo');
      params.dateTo = dateTo;
    }

    // Add lead-up period filter
    if (leadUpPeriodMax !== null && leadUpPeriodMax !== undefined) {
      whereClauses.push('lead_up_period_days_max <= @leadUpPeriodMax');
      params.leadUpPeriodMax = parseInt(leadUpPeriodMax);
    }

    // Add custom filters
    Object.entries(filters).forEach(([column, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const paramName = column.replace(/[^a-zA-Z0-9_]/g, '_');
        whereClauses.push(`${column} = @${paramName}`);
        params[paramName] = value;
      }
    });

    const whereClause = whereClauses.join(' AND ');

    const query = `
      SELECT 
        date__month_grain as month,
        COUNT(DISTINCT outbound_facility_provider_npi) as unique_facilities,
        SUM(inbound_count) as total_referrals,
        SUM(charges_total) as total_charges
      FROM \`aegis_access.${pathwaysTable}\`
      WHERE ${whereClause}
      GROUP BY date__month_grain
      ORDER BY date__month_grain DESC
      LIMIT 36
    `;

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });

    console.log(`✅ Retrieved ${rows.length} months of trend data`);

    // Sanitize date objects
    const sanitizedRows = rows.map(row => {
      const sanitizedRow = {};
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (value instanceof Date) {
          sanitizedRow[key] = value.toISOString().substring(0, 7); // YYYY-MM
        } else if (value && typeof value === 'object' && value.value !== undefined) {
          if (value.value instanceof Date) {
            sanitizedRow[key] = value.value.toISOString().substring(0, 7);
          } else if (typeof value.value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value.value)) {
            sanitizedRow[key] = value.value.substring(0, 7);
          } else {
            sanitizedRow[key] = value.value;
          }
        } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
          sanitizedRow[key] = value.substring(0, 7);
        } else {
          sanitizedRow[key] = value;
        }
      });
      return sanitizedRow;
    });

    res.json({
      success: true,
      data: sanitizedRows,
      metadata: {
        rowCount: rows.length,
        inboundNPI
      }
    });

  } catch (error) {
    console.error("❌ Error fetching trends:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch trends",
      error: error.message
    });
  }
});

// Get downstream facilities (where does this facility send patients?)
router.post("/downstream-facilities", async (req, res) => {
  try {
    const { 
      outboundNPI,
      dateFrom,
      dateTo,
      leadUpPeriodMax = null,
      filterByTaxonomy = null, // Filter to only show same type of facilities
      limit = 100,
      tableName = null, // Optional: specify which pathways table to use
      npiType = 'facility' // 'facility' or 'service_location'
    } = req.body;

    const pathwaysTable = getPathwaysTableName(tableName);
    const npiPrefix = getNpiTypePrefix(npiType);

    console.log("⬇️ Referral Pathways: Fetching downstream facilities", {
      outboundNPI,
      dateFrom,
      dateTo,
      leadUpPeriodMax,
      filterByTaxonomy,
      pathwaysTable,
      npiType,
      npiPrefix
    });

    if (!outboundNPI) {
      return res.status(400).json({
        success: false,
        message: "outboundNPI is required"
      });
    }

    // Build WHERE clause - FLIP the perspective (with dynamic field names)
    const whereClauses = [
      `outbound_${npiPrefix}_npi = @outboundNPI`, // This facility is sending
      `inbound_${npiPrefix}_npi IS NOT NULL`,
      `outbound_${npiPrefix}_npi != inbound_${npiPrefix}_npi`, // No self-referrals
      `outbound_${npiPrefix}_npi_type = '2'`,
      `inbound_${npiPrefix}_npi_type = '2'`
    ];
    
    const params = { 
      outboundNPI,
      limit: parseInt(limit)
    };

    if (dateFrom) {
      whereClauses.push('date__month_grain >= @dateFrom');
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      whereClauses.push('date__month_grain <= @dateTo');
      params.dateTo = dateTo;
    }
    if (leadUpPeriodMax !== null && leadUpPeriodMax !== undefined) {
      whereClauses.push('lead_up_period_days_max <= @leadUpPeriodMax');
      params.leadUpPeriodMax = parseInt(leadUpPeriodMax);
    }

    // Filter by taxonomy classification if provided (to compare with same type of facilities)
    if (filterByTaxonomy) {
      whereClauses.push(`inbound_${npiPrefix}_taxonomy_classification = @filterByTaxonomy`);
      params.filterByTaxonomy = filterByTaxonomy;
    }

    const whereClause = whereClauses.join(' AND ');

    // Query for INBOUND facilities (where this facility sends patients)
    const query = `
      SELECT 
        inbound_${npiPrefix}_npi as outbound_${npiPrefix}_npi,
        MAX(inbound_${npiPrefix}_name) as outbound_${npiPrefix}_name,
        MAX(inbound_${npiPrefix}_city) as outbound_${npiPrefix}_city,
        MAX(inbound_${npiPrefix}_state) as outbound_${npiPrefix}_state,
        MAX(inbound_${npiPrefix}_county) as outbound_${npiPrefix}_county,
        MAX(inbound_${npiPrefix}_taxonomy_classification) as outbound_${npiPrefix}_taxonomy_classification,
        SUM(inbound_count) as total_referrals,
        SUM(charges_total) as total_charges,
        MIN(date__month_grain) as earliest_referral,
        MAX(date__month_grain) as latest_referral,
        COUNT(DISTINCT date__month_grain) as months_with_activity,
        ROUND(SUM(inbound_count) / COUNT(DISTINCT date__month_grain), 1) as avg_monthly_referrals
      FROM \`aegis_access.${pathwaysTable}\`
      WHERE ${whereClause}
      GROUP BY inbound_${npiPrefix}_npi
      ORDER BY total_referrals DESC
      LIMIT @limit
    `;

    console.log("🔍 Executing downstream query");

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });

    console.log(`✅ Retrieved ${rows.length} downstream facilities`);

    // Sanitize dates
    let sanitizedRows = rows.map(row => {
      const sanitizedRow = {};
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (value instanceof Date) {
          sanitizedRow[key] = value.toISOString().split('T')[0];
        } else if (value && typeof value === 'object' && value.value !== undefined) {
          if (value.value instanceof Date) {
            sanitizedRow[key] = value.value.toISOString().split('T')[0];
          } else {
            sanitizedRow[key] = value.value;
          }
        } else {
          sanitizedRow[key] = value;
        }
      });
      return sanitizedRow;
    });

    // Enrich with definitive names from hco_flat
    if (sanitizedRows.length > 0) {
      try {
        const npis = sanitizedRows.map(row => row.outbound_facility_provider_npi).filter(Boolean);
        
        if (npis.length > 0) {
          console.log(`🏥 Fetching definitive names and locations for ${npis.length} downstream facilities`);
          
          const nameQuery = `
            SELECT 
              npi,
              definitive_id,
              definitive_name,
              primary_address_lat as latitude,
              primary_address_long as longitude
            FROM \`aegis_access.hco_flat\`
            WHERE npi IN UNNEST(@npis)
          `;
          
          const [nameRows] = await vendorBigQueryClient.query({ 
            query: nameQuery,
            params: { npis }
          });
          
          const nameMap = {};
          nameRows.forEach(row => {
            nameMap[row.npi] = {
              definitive_id: row.definitive_id,
              definitive_name: row.definitive_name,
              latitude: row.latitude,
              longitude: row.longitude
            };
          });
          
          sanitizedRows.forEach(row => {
            if (row.outbound_facility_provider_npi && nameMap[row.outbound_facility_provider_npi]) {
              const definitiveInfo = nameMap[row.outbound_facility_provider_npi];
              row.definitive_id = definitiveInfo.definitive_id;
              row.definitive_name = definitiveInfo.definitive_name;
              row.latitude = definitiveInfo.latitude;
              row.longitude = definitiveInfo.longitude;
            }
          });

          // Aggregate by definitive_id
          const definitiveMap = {};
          sanitizedRows.forEach(row => {
            const defId = row.definitive_id || row.outbound_facility_provider_npi;
            
            if (!definitiveMap[defId]) {
              definitiveMap[defId] = {
                ...row,
                total_referrals: Number(row.total_referrals) || 0,
                total_charges: Number(row.total_charges) || 0,
                avg_monthly_referrals: Number(row.avg_monthly_referrals) || 0,
                months_with_activity: Number(row.months_with_activity) || 0,
                latitude: row.latitude,
                longitude: row.longitude,
                npis: [row.outbound_facility_provider_npi],
                original_names: row.outbound_facility_provider_name ? [row.outbound_facility_provider_name] : []
              };
            } else {
              definitiveMap[defId].total_referrals += Number(row.total_referrals) || 0;
              definitiveMap[defId].total_charges += Number(row.total_charges) || 0;
              definitiveMap[defId].avg_monthly_referrals += Number(row.avg_monthly_referrals) || 0;
              definitiveMap[defId].months_with_activity = Math.max(
                definitiveMap[defId].months_with_activity || 0,
                Number(row.months_with_activity) || 0
              );
              if (row.latest_referral > definitiveMap[defId].latest_referral) {
                definitiveMap[defId].latest_referral = row.latest_referral;
              }
              if (!definitiveMap[defId].latitude && row.latitude) {
                definitiveMap[defId].latitude = row.latitude;
                definitiveMap[defId].longitude = row.longitude;
              }
              definitiveMap[defId].npis.push(row.outbound_facility_provider_npi);
              if (row.outbound_facility_provider_name && !definitiveMap[defId].original_names.includes(row.outbound_facility_provider_name)) {
                definitiveMap[defId].original_names.push(row.outbound_facility_provider_name);
              }
            }
          });

          sanitizedRows = Object.values(definitiveMap)
            .sort((a, b) => b.total_referrals - a.total_referrals)
            .slice(0, parseInt(limit));

          console.log(`✅ Aggregated ${sanitizedRows.length} unique downstream facilities`);
        }
      } catch (err) {
        console.error('⚠️ Error fetching definitive names (non-fatal):', err.message);
      }
    }

    res.json({
      success: true,
      data: sanitizedRows,
      metadata: {
        rowCount: sanitizedRows.length,
        outboundNPI
      }
    });

  } catch (error) {
    console.error("❌ Error fetching downstream facilities:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch downstream facilities",
      error: error.message
    });
  }
});

export default router;


