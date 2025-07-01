import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";

const router = express.Router();

// Get quality measure dictionary (active measures only)
router.get("/qm_dictionary", async (req, res) => {
  try {
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
    
    const [rows] = await myBigQuery.query(options);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ BigQuery qm_dictionary query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get latest publish date
router.get("/qm_post/latest", async (req, res) => {
  try {
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
    
    const [rows] = await myBigQuery.query(options);
    res.status(200).json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error("❌ BigQuery qm_post latest query error:", err);
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
    
    const [rows] = await myBigQuery.query(options);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ BigQuery qm_post national averages query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get provider quality measure data for specific CCNs and publish date
router.post("/qm_provider/data", async (req, res) => {
  try {
    const { ccns, publish_date } = req.body;
    
    if (!Array.isArray(ccns) || ccns.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "ccns (array) is required" 
      });
    }
    
    if (!publish_date) {
      return res.status(400).json({ 
        success: false, 
        error: "publish_date is required" 
      });
    }
    
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
    
    const [rows] = await myBigQuery.query(options);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ BigQuery qm_provider data query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router; 