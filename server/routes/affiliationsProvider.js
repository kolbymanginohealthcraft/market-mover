import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";

const router = express.Router();

/**
 * PROVIDER AFFILIATIONS ANALYSIS
 * 
 * Analyzes provider-to-provider affiliations using affiliations_provider_overall table
 * Focus: Which performing providers (physicians) work at which service locations (facilities)
 * 
 * Key Concepts:
 * - service_location_provider_npi: Where care is delivered (facility)
 * - performing_provider_npi: Who delivered care (physician/provider)
 * - claim_count: Number of claims for this affiliation
 * - unique_patient_count: Number of unique patients
 * - date__quarter_grain: Time period (quarterly)
 */

// Get unique quarter values to understand the data format
router.get("/unique-quarters", async (req, res) => {
  try {
    console.log("📊 Provider Affiliations: Fetching unique quarter values");

    const query = `
      SELECT DISTINCT 
        date__quarter_grain,
        CAST(date__quarter_grain AS STRING) as date_string,
        EXTRACT(YEAR FROM date__quarter_grain) as year,
        EXTRACT(QUARTER FROM date__quarter_grain) as quarter,
        EXTRACT(MONTH FROM date__quarter_grain) as month,
        EXTRACT(DAY FROM date__quarter_grain) as day,
        FORMAT_DATE('%Y-%m-%d', date__quarter_grain) as formatted_date,
        FORMAT_DATE('%Y-Q%Q', date__quarter_grain) as quarter_format
      FROM \`aegis_access.affiliations_provider_overall\`
      ORDER BY date__quarter_grain DESC
      LIMIT 50
    `;

    const [rows] = await vendorBigQueryClient.query({ query });

    const sanitizeDate = (value) => {
      if (value instanceof Date) {
        return value.toISOString();
      } else if (value && typeof value === 'object' && value.value !== undefined) {
        if (value.value instanceof Date) {
          return value.value.toISOString();
        } else {
          return value.value;
        }
      }
      return value;
    };

    const sanitizedRows = rows.map(row => {
      const sanitizedRow = {};
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (key.includes('date') || key.includes('Date') || key.includes('quarter') || key.includes('Quarter')) {
          sanitizedRow[key] = sanitizeDate(value);
        } else {
          sanitizedRow[key] = value;
        }
      });
      return sanitizedRow;
    });

    res.json({
      success: true,
      data: sanitizedRows,
      count: sanitizedRows.length,
      sample: sanitizedRows.slice(0, 10)
    });
  } catch (error) {
    console.error("❌ Error fetching unique quarters:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get metadata for the affiliations table
router.get("/metadata", async (req, res) => {
  try {
    console.log("📊 Provider Affiliations: Fetching metadata");

    const query = `
      SELECT 
        MIN(date__quarter_grain) as min_date,
        MAX(date__quarter_grain) as max_date,
        COUNT(*) as total_records,
        COUNT(DISTINCT service_location_provider_npi) as unique_service_locations,
        COUNT(DISTINCT performing_provider_npi) as unique_performing_providers,
        SUM(claim_count) as total_claims,
        SUM(unique_patient_count) as total_unique_patients
      FROM \`aegis_access.affiliations_provider_overall\`
    `;

    const [rows] = await vendorBigQueryClient.query({ query });

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found in affiliations_provider_overall"
      });
    }

    const stats = rows[0];

    const sanitizeDate = (value) => {
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      } else if (value && typeof value === 'object' && value.value !== undefined) {
        if (value.value instanceof Date) {
          return value.value.toISOString().split('T')[0];
        } else {
          return value.value;
        }
      }
      return value;
    };

    const sanitizedStats = {};
    Object.keys(stats).forEach(key => {
      const value = stats[key];
      if (key.includes('date') || key.includes('Date')) {
        sanitizedStats[key] = sanitizeDate(value);
      } else {
        sanitizedStats[key] = value;
      }
    });

    res.json({
      success: true,
      data: {
        ...sanitizedStats,
        mostRecentQuarter: sanitizedStats.max_date
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

// Get sample data
router.post("/sample", async (req, res) => {
  try {
    const {
      serviceLocationNpi = null,
      performingProviderNpi = null,
      dateFrom = null,
      dateTo = null,
      limit = 100
    } = req.body;

    console.log("🔍 Provider Affiliations: Fetching sample data", {
      serviceLocationNpi,
      performingProviderNpi,
      dateFrom,
      dateTo,
      limit
    });

    const whereConditions = [];
    const params = {};

    if (serviceLocationNpi) {
      whereConditions.push("a.service_location_provider_npi = @serviceLocationNpi");
      params.serviceLocationNpi = String(serviceLocationNpi);
    }

    if (performingProviderNpi) {
      whereConditions.push("a.performing_provider_npi = @performingProviderNpi");
      params.performingProviderNpi = String(performingProviderNpi);
    }

    if (dateFrom) {
      whereConditions.push("a.date__quarter_grain >= @dateFrom");
      params.dateFrom = dateFrom;
    }

    if (dateTo) {
      whereConditions.push("a.date__quarter_grain <= @dateTo");
      params.dateTo = dateTo;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const query = `
      SELECT 
        a.service_location_provider_npi,
        a.performing_provider_npi,
        a.date__quarter_grain,
        a.claim_count,
        a.unique_patient_count,
        hco.atlas_definitive_id as service_location_dhc,
        hco.atlas_definitive_name as service_location_name,
        hco.atlas_definitive_firm_type as service_location_type,
        hcp.name_full_formatted as performing_provider_name,
        hcp.primary_taxonomy_consolidated_specialty as performing_provider_specialty
      FROM \`aegis_access.affiliations_provider_overall\` a
      LEFT JOIN \`aegis_access.hco_flat\` hco 
        ON CAST(hco.npi AS STRING) = a.service_location_provider_npi
        AND hco.atlas_definitive_id_primary_npi = TRUE
        AND hco.npi_deactivation_date IS NULL
      LEFT JOIN \`aegis_access.hcp_flat\` hcp 
        ON CAST(hcp.npi AS STRING) = a.performing_provider_npi
        AND hcp.npi_deactivation_date IS NULL
      ${whereClause}
      ORDER BY a.claim_count DESC, a.date__quarter_grain DESC
      LIMIT @limit
    `;

    params.limit = limit;

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
    });

    const sanitizeDate = (value) => {
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      } else if (value && typeof value === 'object' && value.value !== undefined) {
        if (value.value instanceof Date) {
          return value.value.toISOString().split('T')[0];
        } else {
          return value.value;
        }
      }
      return value;
    };

    const sanitizedRows = rows.map(row => {
      const sanitizedRow = {};
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (key.includes('date') || key.includes('Date') || key.includes('quarter') || key.includes('Quarter')) {
          sanitizedRow[key] = sanitizeDate(value);
        } else {
          sanitizedRow[key] = value;
        }
      });
      return sanitizedRow;
    });

    res.json({
      success: true,
      data: sanitizedRows,
      count: sanitizedRows.length
    });
  } catch (error) {
    console.error("❌ Error fetching sample data:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get affiliations for a specific service location
router.post("/by-service-location", async (req, res) => {
  try {
    const {
      serviceLocationNpi,
      dateFrom = null,
      dateTo = null,
      limit = 100
    } = req.body;

    if (!serviceLocationNpi) {
      return res.status(400).json({
        success: false,
        message: "serviceLocationNpi is required"
      });
    }

    console.log("🏥 Provider Affiliations: Fetching by service location", {
      serviceLocationNpi,
      dateFrom,
      dateTo
    });

    const whereConditions = ["a.service_location_provider_npi = @serviceLocationNpi"];
    const params = { serviceLocationNpi: String(serviceLocationNpi) };

    if (dateFrom) {
      whereConditions.push("a.date__quarter_grain >= @dateFrom");
      params.dateFrom = dateFrom;
    }

    if (dateTo) {
      whereConditions.push("a.date__quarter_grain <= @dateTo");
      params.dateTo = dateTo;
    }

    const query = `
      SELECT 
        a.performing_provider_npi,
        SUM(a.claim_count) as total_claim_count,
        SUM(a.unique_patient_count) as total_unique_patients,
        COUNT(DISTINCT a.date__quarter_grain) as quarters_active,
        MIN(a.date__quarter_grain) as first_quarter,
        MAX(a.date__quarter_grain) as last_quarter,
        hcp.name_full_formatted as performing_provider_name,
        hcp.primary_taxonomy_consolidated_specialty as performing_provider_specialty
      FROM \`aegis_access.affiliations_provider_overall\` a
      LEFT JOIN \`aegis_access.hcp_flat\` hcp 
        ON CAST(hcp.npi AS STRING) = a.performing_provider_npi
        AND hcp.npi_deactivation_date IS NULL
      WHERE ${whereConditions.join(" AND ")}
      GROUP BY a.performing_provider_npi, hcp.name_full_formatted, hcp.primary_taxonomy_consolidated_specialty
      ORDER BY total_claim_count DESC
      LIMIT @limit
    `;

    params.limit = limit;

    const [rows] = await vendorBigQueryClient.query({ query, params });

    console.log(`✅ Found ${rows.length} results for service location NPI: ${serviceLocationNpi}`);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error("❌ Error fetching by service location:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get affiliations for a specific performing provider
router.post("/by-performing-provider", async (req, res) => {
  try {
    const {
      performingProviderNpi,
      dateFrom = null,
      dateTo = null,
      limit = 100
    } = req.body;

    if (!performingProviderNpi) {
      return res.status(400).json({
        success: false,
        message: "performingProviderNpi is required"
      });
    }

    console.log("👨‍⚕️ Provider Affiliations: Fetching by performing provider", {
      performingProviderNpi,
      dateFrom,
      dateTo
    });

    const whereConditions = ["a.performing_provider_npi = @performingProviderNpi"];
    const params = { performingProviderNpi: String(performingProviderNpi) };

    if (dateFrom) {
      whereConditions.push("a.date__quarter_grain >= @dateFrom");
      params.dateFrom = dateFrom;
    }

    if (dateTo) {
      whereConditions.push("a.date__quarter_grain <= @dateTo");
      params.dateTo = dateTo;
    }

    const query = `
      SELECT 
        a.service_location_provider_npi,
        SUM(a.claim_count) as total_claim_count,
        SUM(a.unique_patient_count) as total_unique_patients,
        COUNT(DISTINCT a.date__quarter_grain) as quarters_active,
        MIN(a.date__quarter_grain) as first_quarter,
        MAX(a.date__quarter_grain) as last_quarter,
        hco.atlas_definitive_id as service_location_dhc,
        hco.atlas_definitive_name as service_location_name,
        hco.atlas_definitive_firm_type as service_location_type
      FROM \`aegis_access.affiliations_provider_overall\` a
      LEFT JOIN \`aegis_access.hco_flat\` hco 
        ON CAST(hco.npi AS STRING) = a.service_location_provider_npi
        AND hco.atlas_definitive_id_primary_npi = TRUE
        AND hco.npi_deactivation_date IS NULL
      WHERE ${whereConditions.join(" AND ")}
      GROUP BY a.service_location_provider_npi, hco.atlas_definitive_id, hco.atlas_definitive_name, hco.atlas_definitive_firm_type
      ORDER BY total_claim_count DESC
      LIMIT @limit
    `;

    params.limit = limit;

    const [rows] = await vendorBigQueryClient.query({ query, params });

    console.log(`✅ Found ${rows.length} results for performing provider NPI: ${performingProviderNpi}`);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error("❌ Error fetching by performing provider:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get aggregated summary by time period
router.post("/summary", async (req, res) => {
  try {
    const {
      dateFrom = null,
      dateTo = null,
      groupBy = "quarter" // 'quarter', 'year', or 'all'
    } = req.body;

    console.log("📊 Provider Affiliations: Fetching summary", {
      dateFrom,
      dateTo,
      groupBy
    });

    const whereConditions = [];
    const params = {};

    if (dateFrom) {
      whereConditions.push("a.date__quarter_grain >= @dateFrom");
      params.dateFrom = dateFrom;
    }

    if (dateTo) {
      whereConditions.push("a.date__quarter_grain <= @dateTo");
      params.dateTo = dateTo;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    let groupByClause = "";
    let selectFields = "";

    if (groupBy === "quarter") {
      groupByClause = "GROUP BY a.date__quarter_grain";
      selectFields = "a.date__quarter_grain as period,";
    } else if (groupBy === "year") {
      groupByClause = "GROUP BY EXTRACT(YEAR FROM a.date__quarter_grain)";
      selectFields = "EXTRACT(YEAR FROM a.date__quarter_grain) as period,";
    } else {
      selectFields = "";
    }

    const query = `
      SELECT 
        ${selectFields}
        COUNT(DISTINCT a.service_location_provider_npi) as unique_service_locations,
        COUNT(DISTINCT a.performing_provider_npi) as unique_performing_providers,
        COUNT(DISTINCT CONCAT(a.service_location_provider_npi, '-', a.performing_provider_npi)) as unique_affiliations,
        SUM(a.claim_count) as total_claims,
        SUM(a.unique_patient_count) as total_unique_patients,
        AVG(a.claim_count) as avg_claims_per_affiliation,
        AVG(a.unique_patient_count) as avg_patients_per_affiliation
      FROM \`aegis_access.affiliations_provider_overall\` a
      ${whereClause}
      ${groupByClause}
      ORDER BY period DESC
    `;

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
    });

    const sanitizeDate = (value) => {
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      } else if (value && typeof value === 'object' && value.value !== undefined) {
        if (value.value instanceof Date) {
          return value.value.toISOString().split('T')[0];
        } else {
          return value.value;
        }
      }
      return value;
    };

    const sanitizedRows = rows.map(row => {
      const sanitizedRow = {};
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (key.includes('date') || key.includes('Date') || key.includes('quarter') || key.includes('Quarter')) {
          sanitizedRow[key] = sanitizeDate(value);
        } else {
          sanitizedRow[key] = value;
        }
      });
      return sanitizedRow;
    });

    res.json({
      success: true,
      data: sanitizedRows,
      count: sanitizedRows.length
    });
  } catch (error) {
    console.error("❌ Error fetching summary:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get top affiliations by claim count
router.post("/top-affiliations", async (req, res) => {
  try {
    const {
      dateFrom = null,
      dateTo = null,
      limit = 50
    } = req.body;

    console.log("🏆 Provider Affiliations: Fetching top affiliations", {
      dateFrom,
      dateTo,
      limit
    });

    const whereConditions = [];
    const params = {};

    if (dateFrom) {
      whereConditions.push("a.date__quarter_grain >= @dateFrom");
      params.dateFrom = dateFrom;
    }

    if (dateTo) {
      whereConditions.push("a.date__quarter_grain <= @dateTo");
      params.dateTo = dateTo;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const query = `
      SELECT 
        a.service_location_provider_npi,
        a.performing_provider_npi,
        SUM(a.claim_count) as total_claim_count,
        SUM(a.unique_patient_count) as total_unique_patients,
        COUNT(DISTINCT a.date__quarter_grain) as quarters_active,
        MIN(a.date__quarter_grain) as first_quarter,
        MAX(a.date__quarter_grain) as last_quarter,
        hco.atlas_definitive_id as service_location_dhc,
        hco.atlas_definitive_name as service_location_name,
        hco.atlas_definitive_firm_type as service_location_type,
        hcp.name_full_formatted as performing_provider_name,
        hcp.primary_taxonomy_consolidated_specialty as performing_provider_specialty
      FROM \`aegis_access.affiliations_provider_overall\` a
      LEFT JOIN \`aegis_access.hco_flat\` hco 
        ON CAST(hco.npi AS STRING) = a.service_location_provider_npi
        AND hco.atlas_definitive_id_primary_npi = TRUE
        AND hco.npi_deactivation_date IS NULL
      LEFT JOIN \`aegis_access.hcp_flat\` hcp 
        ON CAST(hcp.npi AS STRING) = a.performing_provider_npi
        AND hcp.npi_deactivation_date IS NULL
      ${whereClause}
      GROUP BY a.service_location_provider_npi, a.performing_provider_npi, hco.atlas_definitive_id, hco.atlas_definitive_name, hco.atlas_definitive_firm_type, hcp.name_full_formatted, hcp.primary_taxonomy_consolidated_specialty
      ORDER BY total_claim_count DESC
      LIMIT @limit
    `;

    params.limit = limit;

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
    });

    const sanitizeDate = (value) => {
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      } else if (value && typeof value === 'object' && value.value !== undefined) {
        if (value.value instanceof Date) {
          return value.value.toISOString().split('T')[0];
        } else {
          return value.value;
        }
      }
      return value;
    };

    const sanitizedRows = rows.map(row => {
      const sanitizedRow = {};
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (key.includes('date') || key.includes('Date') || key.includes('quarter') || key.includes('Quarter')) {
          sanitizedRow[key] = sanitizeDate(value);
        } else {
          sanitizedRow[key] = value;
        }
      });
      return sanitizedRow;
    });

    res.json({
      success: true,
      data: sanitizedRows,
      count: sanitizedRows.length
    });
  } catch (error) {
    console.error("❌ Error fetching top affiliations:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;

