import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";

const router = express.Router();

/**
 * REFERRAL PATHWAYS ANALYSIS
 * 
 * Analyzes patient flow from outbound providers (e.g., hospitals) to inbound providers (e.g., SNFs)
 * Table: aegis_access.pathways_provider_overall (91.8 billion rows!)
 * 
 * Key Metrics:
 * - count: Number of patient pathways
 * - lead_up_period_days: Time between outbound and inbound visits
 * - charges_total: Total charges
 * 
 * Always requires filtering by inbound provider NPIs to avoid massive queries
 */

// Get top referral sources for specific inbound providers
router.post("/top-referral-sources", async (req, res) => {
  try {
    const { 
      inboundNPIs = [],          // Required: List of inbound provider NPIs (your facilities)
      limit = 100,
      groupBy = 'facility',       // 'facility', 'billing', 'service_location', 'performing'
      dateFrom = null,
      dateTo = null,
      maxLeadDays = 14,           // Maximum lead-up period in days (default: 14)
      minCount = 5,               // Minimum pathway count to include
      includePayorMix = false,
      includeTiming = false,
      includeGeography = false
    } = req.body;

    if (!inboundNPIs || inboundNPIs.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "At least one inbound provider NPI is required" 
      });
    }

    const startTime = Date.now();

    // Build WHERE clause
    const whereConditions = [];
    whereConditions.push(`inbound_billing_provider_npi IN (${inboundNPIs.map(npi => `'${npi}'`).join(',')})`);
    whereConditions.push(`lead_up_period_days_max <= ${maxLeadDays}`); // Filter by lead-up period
    
    if (dateFrom) {
      whereConditions.push(`date__month_grain >= '${dateFrom}'`);
    }
    if (dateTo) {
      whereConditions.push(`date__month_grain <= '${dateTo}'`);
    }
    
    const whereClause = whereConditions.join(' AND ');

    // Determine outbound provider fields based on groupBy
    const outboundFields = {
      facility: {
        npi: 'outbound_facility_provider_npi',
        name: 'outbound_facility_provider_name',
        city: 'outbound_facility_provider_city',
        state: 'outbound_facility_provider_state',
        taxonomy: 'outbound_facility_provider_taxonomy_classification'
      },
      billing: {
        npi: 'outbound_billing_provider_npi',
        name: 'outbound_billing_provider_name',
        city: 'outbound_billing_provider_city',
        state: 'outbound_billing_provider_state',
        taxonomy: 'outbound_billing_provider_taxonomy_classification'
      },
      service_location: {
        npi: 'outbound_service_location_provider_npi',
        name: 'outbound_service_location_provider_name',
        city: 'outbound_service_location_provider_city',
        state: 'outbound_service_location_provider_state',
        taxonomy: 'outbound_service_location_provider_taxonomy_classification'
      },
      performing: {
        npi: 'outbound_performing_provider_npi',
        name: 'outbound_performing_provider_name',
        city: 'outbound_performing_provider_city',
        state: 'outbound_performing_provider_state',
        taxonomy: 'outbound_performing_provider_taxonomy_classification'
      }
    };

    const fields = outboundFields[groupBy];

    // Build SELECT clause
    const selectFields = [
      `${fields.npi} as outbound_npi`,
      `${fields.name} as outbound_name`,
      `${fields.city} as outbound_city`,
      `${fields.state} as outbound_state`,
      `${fields.taxonomy} as outbound_taxonomy`,
      `SUM(inbound_count) as total_pathways`, // Use inbound_count
      `SUM(charges_total) as total_charges`,
    ];

    if (includeTiming) {
      selectFields.push(
        `ROUND(AVG(lead_up_period_days_total / NULLIF(inbound_count, 0)), 1) as avg_lead_days`,
        `MIN(lead_up_period_days_min) as min_lead_days`,
        `MAX(lead_up_period_days_max) as max_lead_days`
      );
    }

    if (includePayorMix) {
      selectFields.push(
        `STRING_AGG(DISTINCT inbound_payor_group, ', ' ORDER BY inbound_payor_group) as payor_groups`
      );
    }

    if (includeGeography) {
      selectFields.push(
        `COUNT(DISTINCT patient_state) as patient_states_count`,
        `STRING_AGG(DISTINCT patient_state, ', ' ORDER BY patient_state LIMIT 10) as patient_states`
      );
    }

    const query = `
      WITH filtered_pathways AS (
        SELECT *
        FROM \`aegis_access.pathways_provider_overall\`
        WHERE ${whereClause}
          AND ${fields.npi} IS NOT NULL
      )
      SELECT ${selectFields.join(',\n      ')}
      FROM filtered_pathways
      GROUP BY 
        ${fields.npi},
        ${fields.name},
        ${fields.city},
        ${fields.state},
        ${fields.taxonomy}
      HAVING SUM(inbound_count) >= ${minCount}
      ORDER BY total_pathways DESC
      LIMIT ${limit}
    `;

    console.log('Executing top referral sources query...');
    const [rows] = await vendorBigQueryClient.query({ query });

    const endTime = Date.now();
    const queryTime = ((endTime - startTime) / 1000).toFixed(2);

    res.json({
      success: true,
      data: rows,
      metadata: {
        inboundNPIs: inboundNPIs.length,
        groupBy,
        resultCount: rows.length,
        queryTimeSeconds: parseFloat(queryTime),
        filters: {
          dateFrom,
          dateTo,
          minCount
        }
      }
    });

  } catch (error) {
    console.error("Error fetching top referral sources:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get referral trends over time
router.post("/referral-trends", async (req, res) => {
  try {
    const {
      inboundNPIs = [],
      outboundNPIs = [],  // Optional: specific outbound providers to track
      maxLeadDays = 14,    // Maximum lead-up period in days
      groupByMonth = true,
      limit = 120  // Default to 10 years of monthly data
    } = req.body;

    if (!inboundNPIs || inboundNPIs.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one inbound provider NPI is required"
      });
    }

    const startTime = Date.now();

    const whereConditions = [
      `inbound_billing_provider_npi IN (${inboundNPIs.map(npi => `'${npi}'`).join(',')})`,
      `lead_up_period_days_max <= ${maxLeadDays}`
    ];

    if (outboundNPIs && outboundNPIs.length > 0) {
      whereConditions.push(
        `outbound_facility_provider_npi IN (${outboundNPIs.map(npi => `'${npi}'`).join(',')})`
      );
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        date__month_grain as month,
        COUNT(DISTINCT outbound_facility_provider_npi) as distinct_referral_sources,
        SUM(inbound_count) as total_pathways,
        SUM(charges_total) as total_charges,
        ROUND(AVG(lead_up_period_days_total / NULLIF(inbound_count, 0)), 1) as avg_lead_days
      FROM \`aegis_access.pathways_provider_overall\`
      WHERE ${whereClause}
      GROUP BY date__month_grain
      ORDER BY date__month_grain DESC
      LIMIT ${limit}
    `;

    console.log('Executing referral trends query...');
    const [rows] = await vendorBigQueryClient.query({ query });

    const endTime = Date.now();
    const queryTime = ((endTime - startTime) / 1000).toFixed(2);

    res.json({
      success: true,
      data: rows,
      metadata: {
        inboundNPIs: inboundNPIs.length,
        outboundNPIs: outboundNPIs?.length || 0,
        resultCount: rows.length,
        queryTimeSeconds: parseFloat(queryTime)
      }
    });

  } catch (error) {
    console.error("Error fetching referral trends:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get referral source details (drill-down for specific outbound provider)
router.post("/referral-source-detail", async (req, res) => {
  try {
    const {
      inboundNPIs = [],
      outboundNPI,  // Required for drill-down
      maxLeadDays = 14,
      dateFrom = null,
      dateTo = null,
      groupByMonth = false
    } = req.body;

    if (!inboundNPIs || inboundNPIs.length === 0 || !outboundNPI) {
      return res.status(400).json({
        success: false,
        error: "Both inbound NPIs and outbound NPI are required"
      });
    }

    const startTime = Date.now();

    const whereConditions = [
      `inbound_billing_provider_npi IN (${inboundNPIs.map(npi => `'${npi}'`).join(',')})`,
      `outbound_facility_provider_npi = '${outboundNPI}'`,
      `lead_up_period_days_max <= ${maxLeadDays}`
    ];

    if (dateFrom) whereConditions.push(`date__month_grain >= '${dateFrom}'`);
    if (dateTo) whereConditions.push(`date__month_grain <= '${dateTo}'`);

    const whereClause = whereConditions.join(' AND ');

    const groupByClause = groupByMonth ? 'date__month_grain,' : '';
    const dateSelect = groupByMonth ? 'date__month_grain as month,' : '';

    const query = `
      SELECT 
        ${dateSelect}
        inbound_payor_group as payor_group,
        patient_age_bracket,
        SUM(inbound_count) as total_pathways,
        SUM(charges_total) as total_charges,
        ROUND(AVG(lead_up_period_days_total / NULLIF(inbound_count, 0)), 1) as avg_lead_days,
        COUNT(DISTINCT patient_state) as patient_states_count
      FROM \`aegis_access.pathways_provider_overall\`
      WHERE ${whereClause}
      GROUP BY ${groupByClause} inbound_payor_group, patient_age_bracket
      ORDER BY ${groupByMonth ? 'month DESC,' : ''} total_pathways DESC
      LIMIT 500
    `;

    console.log('Executing referral source detail query...');
    const [rows] = await vendorBigQueryClient.query({ query });

    const endTime = Date.now();
    const queryTime = ((endTime - startTime) / 1000).toFixed(2);

    res.json({
      success: true,
      data: rows,
      metadata: {
        inboundNPIs: inboundNPIs.length,
        outboundNPI,
        resultCount: rows.length,
        queryTimeSeconds: parseFloat(queryTime)
      }
    });

  } catch (error) {
    console.error("Error fetching referral source detail:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get geographic distribution of referrals
router.post("/geographic-distribution", async (req, res) => {
  try {
    const {
      inboundNPIs = [],
      maxLeadDays = 14,
      dateFrom = null,
      dateTo = null,
      groupBy = 'state',  // 'state', 'county', 'city'
      limit = 100
    } = req.body;

    if (!inboundNPIs || inboundNPIs.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one inbound provider NPI is required"
      });
    }

    const startTime = Date.now();

    const whereConditions = [
      `inbound_billing_provider_npi IN (${inboundNPIs.map(npi => `'${npi}'`).join(',')})`,
      `lead_up_period_days_max <= ${maxLeadDays}`
    ];

    if (dateFrom) whereConditions.push(`date__month_grain >= '${dateFrom}'`);
    if (dateTo) whereConditions.push(`date__month_grain <= '${dateTo}'`);

    const whereClause = whereConditions.join(' AND ');

    // Determine fields based on groupBy
    const geoFields = {
      state: {
        field: 'outbound_facility_provider_state',
        label: 'state'
      },
      county: {
        fields: ['outbound_facility_provider_county', 'outbound_facility_provider_state'],
        labels: ['county', 'state']
      },
      city: {
        fields: ['outbound_facility_provider_city', 'outbound_facility_provider_state'],
        labels: ['city', 'state']
      }
    };

    let selectFields, groupByFields;
    
    if (groupBy === 'state') {
      selectFields = `${geoFields[groupBy].field} as ${geoFields[groupBy].label}`;
      groupByFields = geoFields[groupBy].field;
    } else {
      selectFields = geoFields[groupBy].fields.map((f, i) => 
        `${f} as ${geoFields[groupBy].labels[i]}`
      ).join(', ');
      groupByFields = geoFields[groupBy].fields.join(', ');
    }

    const query = `
      SELECT 
        ${selectFields},
        COUNT(DISTINCT outbound_facility_provider_npi) as distinct_facilities,
        SUM(inbound_count) as total_pathways,
        SUM(charges_total) as total_charges,
        ROUND(AVG(lead_up_period_days_total / NULLIF(inbound_count, 0)), 1) as avg_lead_days
      FROM \`aegis_access.pathways_provider_overall\`
      WHERE ${whereClause}
        AND outbound_facility_provider_npi IS NOT NULL
      GROUP BY ${groupByFields}
      ORDER BY total_pathways DESC
      LIMIT ${limit}
    `;

    console.log('Executing geographic distribution query...');
    const [rows] = await vendorBigQueryClient.query({ query });

    const endTime = Date.now();
    const queryTime = ((endTime - startTime) / 1000).toFixed(2);

    res.json({
      success: true,
      data: rows,
      metadata: {
        inboundNPIs: inboundNPIs.length,
        groupBy,
        resultCount: rows.length,
        queryTimeSeconds: parseFloat(queryTime)
      }
    });

  } catch (error) {
    console.error("Error fetching geographic distribution:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get payor mix by referral source
router.post("/payor-mix", async (req, res) => {
  try {
    const {
      inboundNPIs = [],
      outboundNPIs = [],  // Optional: filter to specific outbound providers
      maxLeadDays = 14,
      dateFrom = null,
      dateTo = null,
      limit = 100
    } = req.body;

    if (!inboundNPIs || inboundNPIs.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one inbound provider NPI is required"
      });
    }

    const startTime = Date.now();

    const whereConditions = [
      `inbound_billing_provider_npi IN (${inboundNPIs.map(npi => `'${npi}'`).join(',')})`,
      `lead_up_period_days_max <= ${maxLeadDays}`
    ];

    if (outboundNPIs && outboundNPIs.length > 0) {
      whereConditions.push(
        `outbound_facility_provider_npi IN (${outboundNPIs.map(npi => `'${npi}'`).join(',')})`
      );
    }

    if (dateFrom) whereConditions.push(`date__month_grain >= '${dateFrom}'`);
    if (dateTo) whereConditions.push(`date__month_grain <= '${dateTo}'`);

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        outbound_facility_provider_npi as outbound_npi,
        outbound_facility_provider_name as outbound_name,
        inbound_payor_group as payor_group,
        SUM(inbound_count) as total_pathways,
        SUM(charges_total) as total_charges,
        ROUND(AVG(lead_up_period_days_total / NULLIF(inbound_count, 0)), 1) as avg_lead_days
      FROM \`aegis_access.pathways_provider_overall\`
      WHERE ${whereClause}
        AND outbound_facility_provider_npi IS NOT NULL
        AND inbound_payor_group IS NOT NULL
      GROUP BY 
        outbound_facility_provider_npi,
        outbound_facility_provider_name,
        inbound_payor_group
      ORDER BY total_pathways DESC
      LIMIT ${limit}
    `;

    console.log('Executing payor mix query...');
    const [rows] = await vendorBigQueryClient.query({ query });

    const endTime = Date.now();
    const queryTime = ((endTime - startTime) / 1000).toFixed(2);

    res.json({
      success: true,
      data: rows,
      metadata: {
        inboundNPIs: inboundNPIs.length,
        outboundNPIs: outboundNPIs?.length || 0,
        resultCount: rows.length,
        queryTimeSeconds: parseFloat(queryTime)
      }
    });

  } catch (error) {
    console.error("Error fetching payor mix:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get summary statistics for inbound providers
router.post("/summary-stats", async (req, res) => {
  try {
    const {
      inboundNPIs = [],
      maxLeadDays = 14,
      dateFrom = null,
      dateTo = null
    } = req.body;

    if (!inboundNPIs || inboundNPIs.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one inbound provider NPI is required"
      });
    }

    const startTime = Date.now();

    const whereConditions = [
      `inbound_billing_provider_npi IN (${inboundNPIs.map(npi => `'${npi}'`).join(',')})`
    ];

    if (dateFrom) whereConditions.push(`date__month_grain >= '${dateFrom}'`);
    if (dateTo) whereConditions.push(`date__month_grain <= '${dateTo}'`);

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        COUNT(DISTINCT outbound_facility_provider_npi) as total_referral_sources,
        SUM(inbound_count) as total_pathways,
        SUM(charges_total) as total_charges,
        ROUND(AVG(lead_up_period_days_total / NULLIF(inbound_count, 0)), 1) as avg_lead_days,
        MIN(lead_up_period_days_min) as min_lead_days,
        MAX(lead_up_period_days_max) as max_lead_days,
        COUNT(DISTINCT inbound_payor_group) as distinct_payors,
        COUNT(DISTINCT patient_state) as patient_states_count,
        MIN(date__month_grain) as earliest_data,
        MAX(date__month_grain) as latest_data
      FROM \`aegis_access.pathways_provider_overall\`
      WHERE ${whereClause}
        AND outbound_facility_provider_npi IS NOT NULL
    `;

    console.log('Executing summary stats query...');
    const [rows] = await vendorBigQueryClient.query({ query });

    const endTime = Date.now();
    const queryTime = ((endTime - startTime) / 1000).toFixed(2);

    res.json({
      success: true,
      data: rows[0] || {},
      metadata: {
        inboundNPIs: inboundNPIs.length,
        queryTimeSeconds: parseFloat(queryTime),
        filters: {
          dateFrom,
          dateTo
        }
      }
    });

  } catch (error) {
    console.error("Error fetching summary stats:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

