import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";

const router = express.Router();

/**
 * PATIENT JOURNEY EXPLORER
 * 
 * Analyzes patient pathways using pathways_provider_procedure_code table
 * Table size: 240 billion rows
 * 
 * Key Concepts:
 * - OUTBOUND: Where patient came FROM (first visit)
 * - INBOUND: Where patient went TO (subsequent visit)
 * - DOWNSTREAM: Query outbound->inbound (where did my patients go next?)
 * - UPSTREAM: Query inbound->outbound (where did my patients come from?)
 */

// Field mapping: Claims fields to Pathway fields
const FIELD_MAPPINGS = {
  // Provider fields - these get direction prefix (outbound_ or inbound_)
  billing_provider_npi: '{direction}_billing_provider_npi',
  billing_provider_name: '{direction}_billing_provider_name',
  billing_provider_state: '{direction}_billing_provider_state',
  billing_provider_city: '{direction}_billing_provider_city',
  billing_provider_county: '{direction}_billing_provider_county',
  billing_provider_taxonomy_classification: '{direction}_billing_provider_taxonomy_classification',
  billing_provider_taxonomy_specialization: '{direction}_billing_provider_taxonomy_specialization',
  billing_provider_taxonomy_consolidated_specialty: '{direction}_billing_provider_taxonomy_consolidated_specialty',
  taxonomy_classification: '{direction}_billing_provider_taxonomy_classification', // Alias
  taxonomy_specialization: '{direction}_billing_provider_taxonomy_specialization', // Alias
  
  facility_provider_npi: '{direction}_facility_provider_npi',
  facility_provider_name: '{direction}_facility_provider_name',
  facility_provider_state: '{direction}_facility_provider_state',
  facility_provider_city: '{direction}_facility_provider_city',
  facility_provider_county: '{direction}_facility_provider_county',
  facility_provider_taxonomy_classification: '{direction}_facility_provider_taxonomy_classification',
  
  service_location_provider_npi: '{direction}_service_location_provider_npi',
  service_location_provider_name: '{direction}_service_location_provider_name',
  service_location_provider_state: '{direction}_service_location_provider_state',
  service_location_provider_city: '{direction}_service_location_provider_city',
  service_location_provider_county: '{direction}_service_location_provider_county',
  
  performing_provider_npi: '{direction}_performing_provider_npi',
  performing_provider_name: '{direction}_performing_provider_name',
  performing_provider_taxonomy_classification: '{direction}_performing_provider_taxonomy_classification',
  performing_provider_taxonomy_specialization: '{direction}_performing_provider_taxonomy_specialization',
  
  // Procedure/Service fields - only on INBOUND side
  code: 'inbound_code',
  code_description: 'inbound_code_description',
  code_system: 'inbound_code_system',
  service_category_description: 'inbound_service_category_description',
  service_line_description: 'inbound_service_line_description',
  subservice_line_description: 'inbound_subservice_line_description',
  
  // Payor fields - only on INBOUND side
  payor_group: 'inbound_payor_group',
  type_of_coverage: 'inbound_type_of_coverage',
  
  // Patient demographics - no direction (same for both)
  patient_age_bracket: 'patient_age_bracket',
  patient_gender: 'patient_gender',
  patient_state: 'patient_state',
  patient_zip3: 'patient_zip3',
  
  // Temporal - no direction
  date__month_grain: 'date__month_grain',
  
  // Metrics
  count: 'inbound_count',
  charges_total: 'charges_total',
  lead_up_period_days_max: 'lead_up_period_days_max'
};

// Map a field name from claims format to pathway format
function mapField(fieldName, direction = null) {
  // Handle null/undefined
  if (!fieldName) return fieldName;
  
  if (FIELD_MAPPINGS[fieldName]) {
    const mapped = FIELD_MAPPINGS[fieldName];
    if (mapped.includes('{direction}') && direction) {
      return mapped.replace('{direction}', direction);
    }
    return mapped;
  }
  
  // If no mapping exists, try to add direction prefix if direction is specified
  if (direction) {
    // Check if this is a provider field that should have direction
    if (fieldName.includes('provider') || fieldName.includes('taxonomy')) {
      return `${direction}_${fieldName}`;
    }
  }
  
  return fieldName; // Return as-is if no mapping
}

// Execute pathway query
router.post("/query", async (req, res) => {
  try {
    const {
      columns = [],           // Fields to select
      groupBy = [],          // Fields to group by (for aggregation)
      aggregates = [],       // Aggregate functions
      filters = {},          // WHERE conditions
      limit = 100,
      direction = 'current', // 'current', 'upstream', 'downstream'
      currentFilters = {}    // When doing upstream/downstream, these are the original filters
    } = req.body;

    console.log('Pathway query request:', { direction, groupBy: groupBy.length, filters: Object.keys(filters).length });

    const startTime = Date.now();

    // Determine which direction to use for field mapping
    let mappingDirection = null;
    if (direction === 'upstream') {
      // We're looking at where patients came FROM, so current filters map to INBOUND
      // and we want to see OUTBOUND providers
      mappingDirection = 'outbound';
    } else if (direction === 'downstream') {
      // We're looking at where patients went TO, so current filters map to OUTBOUND
      // and we want to see INBOUND providers
      mappingDirection = 'inbound';
    }

    // Build WHERE clause
    const whereConditions = [];
    
    // Default filters
    whereConditions.push('lead_up_period_days_max <= 14'); // Default to 14 days
    
    // Add date range filter (default to last 12 months)
    if (filters.date__month_grain) {
      // Handle date range - could be "2024-07,2025-06" or array
      const dateValue = filters.date__month_grain;
      if (typeof dateValue === 'string' && dateValue.includes(',')) {
        const [minDate, maxDate] = dateValue.split(',');
        whereConditions.push(`date__month_grain BETWEEN '${minDate}-01' AND '${maxDate}-01'`);
      } else if (Array.isArray(dateValue) && dateValue.length === 2) {
        whereConditions.push(`date__month_grain BETWEEN '${dateValue[0]}-01' AND '${dateValue[1]}-01'`);
      } else {
        whereConditions.push(`date__month_grain >= '${dateValue}'`);
      }
    } else {
      // Default to last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const dateString = twelveMonthsAgo.toISOString().split('T')[0];
      whereConditions.push(`date__month_grain >= '${dateString}'`);
    }

    // Process filters based on direction
    Object.entries(filters).forEach(([field, value]) => {
      if (field === 'date__month_grain') return; // Already handled
      if (!value) return; // Skip null/undefined values
      
      const pathwayField = direction === 'current' 
        ? mapField(field, 'outbound') // For initial query, use outbound
        : mapField(field, direction === 'upstream' ? 'inbound' : 'outbound');
      
      if (Array.isArray(value)) {
        if (value.length > 0) {
          // Escape single quotes in values
          const valueList = value.map(v => `'${String(v).replace(/'/g, "\\'")}'`).join(',');
          whereConditions.push(`${pathwayField} IN (${valueList})`);
        }
      } else if (value !== null && value !== undefined) {
        // Escape single quotes
        const escapedValue = String(value).replace(/'/g, "\\'");
        whereConditions.push(`${pathwayField} = '${escapedValue}'`);
      }
    });

    // Build SELECT clause
    let selectFields = [];
    let groupByFields = [];

    if (groupBy.length > 0) {
      // Aggregation query
      groupBy.forEach(field => {
        const pathwayField = mapField(field, mappingDirection || 'outbound');
        selectFields.push(`${pathwayField} as ${field}`);
        groupByFields.push(pathwayField);
      });

      // Add aggregates
      if (aggregates.length > 0) {
        aggregates.forEach(agg => {
          const func = agg.function;
          const col = agg.column === '*' ? '*' : mapField(agg.column, mappingDirection || 'outbound');
          const alias = agg.alias || `${func.toLowerCase()}_${agg.column}`;
          
          if (func === 'COUNT' && col === '*') {
            selectFields.push(`SUM(inbound_count) as ${alias}`);
          } else if (func === 'SUM') {
            selectFields.push(`SUM(${col}) as ${alias}`);
          } else if (func === 'AVG') {
            selectFields.push(`AVG(${col}) as ${alias}`);
          } else if (func === 'MIN') {
            selectFields.push(`MIN(${col}) as ${alias}`);
          } else if (func === 'MAX') {
            selectFields.push(`MAX(${col}) as ${alias}`);
          } else if (func === 'COUNT_DISTINCT') {
            selectFields.push(`COUNT(DISTINCT ${col}) as ${alias}`);
          }
        });
      } else {
        // Default aggregates
        selectFields.push('SUM(inbound_count) as total_count');
        selectFields.push('SUM(charges_total) as total_charges');
      }
    } else {
      // Raw query (limited use for this huge table)
      columns.forEach(field => {
        const pathwayField = mapField(field, mappingDirection || 'outbound');
        selectFields.push(`${pathwayField} as ${field}`);
      });
      
      if (selectFields.length === 0) {
        // Default columns
        selectFields = [
          'date__month_grain',
          `${mappingDirection || 'outbound'}_billing_provider_npi as billing_provider_npi`,
          `${mappingDirection || 'outbound'}_billing_provider_name as billing_provider_name`,
          'inbound_code as code',
          'inbound_code_description as code_description',
          'inbound_count as count',
          'charges_total'
        ];
      }
    }

    // Build query
    const whereClause = whereConditions.join(' AND ');
    const groupByClause = groupByFields.length > 0 
      ? `GROUP BY ${groupByFields.join(', ')}`
      : '';
    const orderByClause = groupByFields.length > 0
      ? 'ORDER BY total_count DESC'
      : 'ORDER BY date__month_grain DESC';

    const query = `
      SELECT ${selectFields.join(', ')}
      FROM \`aegis_access.pathways_provider_procedure_code\`
      WHERE ${whereClause}
      ${groupByClause}
      ${orderByClause}
      LIMIT ${limit}
    `;

    console.log('🔍 Executing pathway query...');
    console.log('📊 Direction:', direction);
    console.log('📊 Mapping direction:', mappingDirection);
    console.log('📊 WHERE conditions:', whereConditions.length);
    console.log('📊 SELECT fields:', selectFields.length);
    console.log('📊 GROUP BY fields:', groupByFields.length);
    console.log('\n🔍 Full query:\n', query);
    
    const [rows] = await vendorBigQueryClient.query({ query });

    const endTime = Date.now();
    const queryTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`Query completed in ${queryTime}s, returned ${rows.length} rows`);

    res.json({
      success: true,
      data: rows,
      metadata: {
        resultCount: rows.length,
        queryTimeSeconds: parseFloat(queryTime),
        direction,
        aggregated: groupByFields.length > 0
      }
    });

  } catch (error) {
    console.error("❌ Error executing pathway query:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
});

// Get distinct values for a field (for filter dropdowns)
router.post("/distinct-values", async (req, res) => {
  try {
    const {
      column,
      filters = {},
      limit = 100,
      direction = 'current'
    } = req.body;

    if (!column) {
      return res.status(400).json({
        success: false,
        error: "Column name is required"
      });
    }

    const startTime = Date.now();

    // Map the column to pathway field
    const pathwayField = mapField(column, direction === 'current' ? 'outbound' : direction);

    // Build WHERE clause from filters
    const whereConditions = [];
    whereConditions.push('lead_up_period_days_max <= 14');
    
    // Default date filter
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const dateString = twelveMonthsAgo.toISOString().split('T')[0];
    whereConditions.push(`date__month_grain >= '${dateString}'`);

    Object.entries(filters).forEach(([field, value]) => {
      const mappedField = mapField(field, direction === 'current' ? 'outbound' : direction);
      if (Array.isArray(value) && value.length > 0) {
        const valueList = value.map(v => `'${v}'`).join(',');
        whereConditions.push(`${mappedField} IN (${valueList})`);
      }
    });

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        ${pathwayField} as value,
        SUM(inbound_count) as count
      FROM \`aegis_access.pathways_provider_procedure_code\`
      WHERE ${whereClause}
        AND ${pathwayField} IS NOT NULL
      GROUP BY ${pathwayField}
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    const [rows] = await vendorBigQueryClient.query({ query });

    const endTime = Date.now();
    const queryTime = ((endTime - startTime) / 1000).toFixed(2);

    res.json({
      success: true,
      data: rows,
      metadata: {
        column,
        resultCount: rows.length,
        queryTimeSeconds: parseFloat(queryTime)
      }
    });

  } catch (error) {
    console.error("Error fetching distinct values:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get sample data
router.get("/sample", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const query = `
      SELECT 
        date__month_grain,
        outbound_billing_provider_npi,
        outbound_billing_provider_name,
        inbound_billing_provider_npi,
        inbound_billing_provider_name,
        inbound_code,
        inbound_code_description,
        inbound_count,
        charges_total,
        lead_up_period_days_max
      FROM \`aegis_access.pathways_provider_procedure_code\`
      WHERE lead_up_period_days_max <= 14
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      LIMIT ${limit}
    `;

    const [rows] = await vendorBigQueryClient.query({ query });

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error("Error fetching sample data:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

