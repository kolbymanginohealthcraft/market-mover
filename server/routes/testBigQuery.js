import express from "express";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

const router = express.Router();

const bigquery = new BigQuery({
  keyFilename: path.resolve("server", "google-service-account.json"),
  projectId: "market-mover-464517", // updated project id
});

// Test route
router.get("/test-bigquery", async (req, res) => {
  try {
    const query = "SELECT 1 AS result"; // or use a real public table from the vendor
    const options = {
      query,
      location: "US",
    };

    const [rows] = await bigquery.query(options);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ BigQuery query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// New route for org_dhc table
router.get("/org_dhc", async (req, res) => {
  try {
    let query;
    const { dhc, search } = req.query;
    if (dhc) {
      query = `SELECT * FROM \`market-mover-464517.providers.org_dhc\` WHERE dhc = @dhc`;
    } else if (search) {
      // Search by name, network, city, state, zip, or phone (case-insensitive)
      query = `SELECT * FROM \`market-mover-464517.providers.org_dhc\` WHERE 
        LOWER(name) LIKE LOWER(@search) OR
        LOWER(network) LIKE LOWER(@search) OR
        LOWER(city) LIKE LOWER(@search) OR
        LOWER(state) LIKE LOWER(@search) OR
        LOWER(zip) LIKE LOWER(@search) OR
        LOWER(phone) LIKE LOWER(@search)`;
    } else {
      query = "SELECT * FROM `market-mover-464517.providers.org_dhc`";
    }
    
    const options = {
      query,
      location: "US",
      params: dhc ? { dhc: Number(dhc) } : search ? { search: `%${search}%` } : {},
    };
    
    const [rows] = await bigquery.query(options);
    
    if (dhc) {
      res.status(200).json({ success: true, data: rows[0] || null });
    } else {
      res.status(200).json({ success: true, data: rows });
    }
  } catch (err) {
    console.error("❌ BigQuery org_dhc query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// New route for fetching CCNs by DHC IDs (POST, JSON body)
router.post("/org_ccn/by-dhc-ids", async (req, res) => {
  try {
    // console.log("[CCN DEBUG] Received POST /org_ccn/by-dhc-ids");
    // console.log("[CCN DEBUG] req.body:", req.body);
    // console.log("[CCN DEBUG] dhc_ids type:", Array.isArray(dhc_ids) ? 'array' : typeof dhc_ids, "length:", dhc_ids && dhc_ids.length);
    // console.log("[CCN DEBUG] BigQuery options:", options);
    const { dhc_ids } = req.body;
    if (!Array.isArray(dhc_ids) || dhc_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "dhc_ids (array) is required" 
      });
    }
    const query = `
      SELECT
        org_dhc.dhc,
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
    res.status(200).json({ 
      success: true, 
      data: rows 
    });
  } catch (err) {
    console.error("❌ BigQuery org_ccn query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
