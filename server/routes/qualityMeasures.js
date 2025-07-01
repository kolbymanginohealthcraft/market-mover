import express from "express";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

const router = express.Router();

const bigquery = new BigQuery({
  keyFilename: path.resolve("server", "google-service-account.json"),
  projectId: "market-mover-464517",
});

// Get quality measure dictionary (active measures only)
router.get("/qm_dictionary", async (req, res) => {
  try {
    // console.log("🔍 Fetching qm_dictionary...");
    const query = `
      SELECT 
        code, 
        label, 
        direction, 
        description, 
        name, 
        active,
        sort_order
      FROM \`market-mover-464517.quality.qm_dictionary\`
      WHERE active = true
      ORDER BY sort_order
    `;
    
    const options = {
      query,
      location: "US",
    };
    
    // console.log("🔍 BigQuery query:", query);
    const [rows] = await bigquery.query(options);
    // console.log("✅ qm_dictionary result:", rows.length, "rows");
    if (rows.length > 0) {
      // console.log("📋 Sample row:", rows[0]);
    }
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    // console.error("❌ BigQuery qm_dictionary query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get latest publish date
router.get("/qm_post/latest", async (req, res) => {
  try {
    // console.log("🔍 Fetching latest publish_date...");
    const query = `
      SELECT publish_date
      FROM \`market-mover-464517.quality.qm_post\`
      ORDER BY publish_date DESC
      LIMIT 1
    `;
    
    const options = {
      query,
      location: "US",
    };
    
    // console.log("🔍 BigQuery query:", query);
    const [rows] = await bigquery.query(options);
    // console.log("✅ Latest publish_date result:", rows);
    
    // Also check what publish dates are available
    const datesQuery = `
      SELECT DISTINCT publish_date
      FROM \`market-mover-464517.quality.qm_post\`
      ORDER BY publish_date DESC
      LIMIT 5
    `;
    const [dateRows] = await bigquery.query({ query: datesQuery, location: "US" });
    // console.log("📅 Available publish dates:", dateRows);
    
    res.status(200).json({ success: true, data: rows[0] || null });
  } catch (err) {
    // console.error("❌ BigQuery qm_post latest query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get national averages for a specific publish date
router.get("/qm_post/national-averages", async (req, res) => {
  try {
    const { publish_date } = req.query;
    
    if (!publish_date) {
      return res.status(400).json({ 
        success: false, 
        error: "publish_date parameter is required" 
      });
    }
    
    const query = `
      SELECT code, national
      FROM \`market-mover-464517.quality.qm_post\`
      WHERE publish_date = @publish_date
    `;
    
    const options = {
      query,
      location: "US",
      params: { publish_date },
    };
    
    const [rows] = await bigquery.query(options);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    // console.error("❌ BigQuery qm_post national averages query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get provider quality measure data for specific CCNs and publish date
router.post("/qm_provider/data", async (req, res) => {
  try {
    // console.log("🔍 Fetching qm_provider data...");
    // console.log("📋 Request body:", req.body);
    const { ccns, publish_date } = req.body;
    
    if (!Array.isArray(ccns) || ccns.length === 0) {
      // console.log("❌ No CCNs provided");
      return res.status(400).json({ 
        success: false, 
        error: "ccns (array) is required" 
      });
    }
    
    if (!publish_date) {
      // console.log("❌ No publish_date provided");
      return res.status(400).json({ 
        success: false, 
        error: "publish_date is required" 
      });
    }
    
    // console.log("📅 Using publish_date:", publish_date);
    // console.log("🏥 CCNs count:", ccns.length);
    
    const query = `
      SELECT ccn, code, score, percentile_column
      FROM \`market-mover-464517.quality.qm_provider\`
      WHERE ccn IN UNNEST(@ccns)
        AND publish_date = @publish_date
      ORDER BY ccn, code
      LIMIT 10000
    `;
    
    const options = {
      query,
      location: "US",
      params: { ccns, publish_date },
    };
    
    // console.log("🔍 BigQuery query:", query);
    // console.log("🔍 BigQuery params:", options.params);
    const [rows] = await bigquery.query(options);
    // console.log("✅ qm_provider data result:", rows.length, "rows");
    if (rows.length > 0) {
      // console.log("📋 Sample row:", rows[0]);
      // console.log("📋 All CCNs in result:", [...new Set(rows.map(r => r.ccn))]);
      // console.log("📋 All codes in result:", [...new Set(rows.map(r => r.code))]);
    }
    if (rows.length === 0) {
      // console.log("⚠️ No data found for CCNs:", ccns);
      // console.log("⚠️ Publish date:", publish_date);
    }
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    // console.error("❌ BigQuery qm_provider data query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get CCNs for specific DHC IDs (replaces the Supabase RPC function)
router.post("/ccns/by-dhc-ids", async (req, res) => {
  try {
    const { dhc_ids } = req.body;
    
    if (!Array.isArray(dhc_ids) || dhc_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "dhc_ids (array) is required" 
      });
    }
    
    const query = `
      SELECT
        org_dhc.dhc as provider_id,
        org_ccn.ccn
      FROM
        \`market-mover-464517.providers.org_dhc\` AS org_dhc
      JOIN
        \`market-mover-464517.providers.org_dhc_npi\` AS org_dhc_npi
        ON org_dhc.dhc = org_dhc_npi.dhc
      JOIN
        \`market-mover-464517.providers.org_npi\` AS org_npi
        ON org_dhc_npi.npi = org_npi.npi
      JOIN
        \`market-mover-464517.providers.org_npi_ccn\` AS org_npi_ccn
        ON org_npi.npi = org_npi_ccn.npi
      JOIN
        \`market-mover-464517.providers.org_ccn\` AS org_ccn
        ON org_npi_ccn.ccn = org_ccn.ccn
      WHERE
        org_dhc.dhc IN UNNEST(@dhc_ids)
    `;
    
    const options = {
      query,
      location: "US",
      params: { dhc_ids },
    };
    
    const [rows] = await bigquery.query(options);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    // console.error("❌ BigQuery CCNs by DHC IDs query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router; 