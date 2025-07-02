import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";

const router = express.Router();

// Get quality measure dictionary (active measures only)
router.get("/qm_dictionary", async (req, res) => {
  try {
    // First, let's check if the table exists
    const checkTableQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.quality.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name = 'qm_dictionary'
    `;
    
    const checkOptions = {
      query: checkTableQuery,
      location: "US",
    };
    
    const [checkRows] = await myBigQuery.query(checkOptions);
    
    if (checkRows.length === 0) {
      // Table doesn't exist, return empty array
      console.log("⚠️ qm_dictionary table not found, returning empty data");
      res.status(200).json({ success: true, data: [] });
      return;
    }
    
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
    // Return empty array instead of error
    res.status(200).json({ success: true, data: [] });
  }
});

// Get latest publish date
router.get("/qm_post/latest", async (req, res) => {
  try {
    // First, let's check if the table exists
    const checkTableQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.quality.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name = 'qm_post'
    `;
    
    const checkOptions = {
      query: checkTableQuery,
      location: "US",
    };
    
    const [checkRows] = await myBigQuery.query(checkOptions);
    
    if (checkRows.length === 0) {
      // Table doesn't exist, return null
      console.log("⚠️ qm_post table not found, returning null");
      res.status(200).json({ 
        success: true, 
        data: null
      });
      return;
    }
    
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
    const latestDate = rows[0]?.publish_date?.value || rows[0]?.publish_date;
    res.status(200).json({ success: true, data: { publish_date: latestDate } || null });
  } catch (err) {
    console.error("❌ BigQuery qm_post latest query error:", err);
    // Return null instead of error
    res.status(200).json({ 
      success: true, 
      data: null
    });
  }
});

// Get all available publish dates
router.get("/qm_post/available-dates", async (req, res) => {
  try {
    // First, let's check what tables exist in the quality dataset
    const listTablesQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.quality.INFORMATION_SCHEMA.TABLES\`
      ORDER BY table_name
    `;
    
    const listOptions = {
      query: listTablesQuery,
      location: "US",
    };
    
    const [listRows] = await myBigQuery.query(listOptions);
    console.log("🔍 Available tables in quality dataset:", listRows.map(r => r.table_name));
    
    // Check if qm_post table exists
    const checkTableQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.quality.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name = 'qm_post'
    `;
    
    const checkOptions = {
      query: checkTableQuery,
      location: "US",
    };
    
    const [checkRows] = await myBigQuery.query(checkOptions);
    console.log("🔍 Table check results:", checkRows);
    
    if (checkRows.length === 0) {
      // Table doesn't exist, return empty array
      console.log("⚠️ qm_post table not found, returning empty array");
      res.status(200).json({ 
        success: true, 
        data: []
      });
      return;
    }
    
    console.log("✅ qm_post table found, proceeding with data query");
    
    const query = `
      SELECT DISTINCT publish_date
      FROM \`market-mover-464517.quality.qm_post\`
      ORDER BY publish_date DESC
    `;
    
    const options = {
      query,
      location: "US",
    };
    
    const [rows] = await myBigQuery.query(options);
    console.log("🔍 Raw BigQuery results for available dates:", rows.slice(0, 3));
    
    // Always return an array of strings
    const publishDates = rows.map(row => {
      if (typeof row.publish_date === 'string') return row.publish_date;
      if (row.publish_date && typeof row.publish_date === 'object' && row.publish_date.value) return row.publish_date.value;
      if (row.publish_date) return String(row.publish_date);
      return null;
    }).filter(Boolean);
    
    console.log("📅 Processed publish dates:", publishDates);
    res.status(200).json({ success: true, data: publishDates });
  } catch (err) {
    console.error("❌ BigQuery qm_post available dates query error:", err);
    // Return empty array instead of error
    res.status(200).json({ 
      success: true, 
      data: []
    });
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
    
    // First, let's check if the table exists
    const checkTableQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.quality.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name = 'qm_post'
    `;
    
    const checkOptions = {
      query: checkTableQuery,
      location: "US",
    };
    
    const [checkRows] = await myBigQuery.query(checkOptions);
    
    if (checkRows.length === 0) {
      // Table doesn't exist, return empty array
      console.log("⚠️ qm_post table not found, returning empty national averages");
      res.status(200).json({ success: true, data: [] });
      return;
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
    // Return empty array instead of error
    res.status(200).json({ success: true, data: [] });
  }
});

// Get provider quality measure data for specific CCNs and publish date
router.post("/qm_provider/data", async (req, res) => {
  try {
    const { ccns, publish_date } = req.body;
    
    console.log("🔍 qm_provider/data request:", { 
      ccnsCount: ccns?.length, 
      publish_date,
      sampleCcns: ccns?.slice(0, 5) // Show first 5 CCNs
    });
    
    if (!Array.isArray(ccns) || ccns.length === 0) {
      console.log("❌ No CCNs provided");
      return res.status(400).json({ 
        success: false, 
        error: "ccns (array) is required" 
      });
    }
    
    if (!publish_date) {
      console.log("❌ No publish_date provided");
      return res.status(400).json({ 
        success: false, 
        error: "publish_date is required" 
      });
    }
    
    // First, let's check if the table exists
    const checkTableQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.quality.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name = 'qm_provider'
    `;
    
    const checkOptions = {
      query: checkTableQuery,
      location: "US",
    };
    
    const [checkRows] = await myBigQuery.query(checkOptions);
    
    if (checkRows.length === 0) {
      // Table doesn't exist, return empty array
      console.log("⚠️ qm_provider table not found, returning empty data");
      res.status(200).json({ success: true, data: [] });
      return;
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
    console.log("✅ Returning rows to frontend:", rows.length, rows.slice(0, 3));
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ BigQuery qm_provider data query error:", err);
    // Return empty array instead of error
    res.status(200).json({ success: true, data: [] });
  }
});

export default router; 