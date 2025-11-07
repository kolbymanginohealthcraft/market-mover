import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

// Get quality measure dictionary (active measures only)
router.get("/qm_dictionary", async (req, res) => {
  try {
    // Check cache first
    const cachedData = cache.get('qm_dictionary', {});
    if (cachedData) {
      console.log('📦 Serving qm_dictionary from cache');
      return res.status(200).json({ success: true, data: cachedData });
    }

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
      const emptyData = [];
      cache.set('qm_dictionary', {}, emptyData);
      res.status(200).json({ success: true, data: emptyData });
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
        sort_order,
        setting,
        source
      FROM \`market-mover-464517.quality.qm_dictionary\`
      WHERE active = true
      ORDER BY sort_order
    `;
    
    const options = {
      query,
      location: "US",
    };
    
    const [rows] = await myBigQuery.query(options);
    
    // Cache the result
    cache.set('qm_dictionary', {}, rows);
    
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

// Combined endpoint for all quality measure data
router.post("/qm_combined", async (req, res) => {
  try {
    const { ccns, publish_date, measures } = req.body;
    
    console.log("🔍 qm_combined request:", { 
      ccnsCount: ccns?.length, 
      publish_date,
      sampleCcns: ccns?.slice(0, 5)
    });
    
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

    // Check if tables exist
    const checkTablesQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.quality.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name IN ('qm_dictionary', 'qm_provider', 'qm_post')
    `;
    
    const [checkRows] = await myBigQuery.query({ query: checkTablesQuery, location: "US" });
    const existingTables = checkRows.map(row => row.table_name);
    
    if (!existingTables.includes('qm_provider')) {
      return res.status(200).json({ 
        success: true, 
        data: {
          measures: [],
          providerData: [],
          nationalAverages: {},
          availableDates: []
        }
      });
    }

    // First, get available dates to determine the actual publish date to use
    let actualPublishDate = publish_date;
    let availableDates = [];
    
    // Try to get dates from qm_post first
    if (existingTables.includes('qm_post')) {
      let postDatesQuery = `SELECT DISTINCT publish_date FROM \`market-mover-464517.quality.qm_post\``;
      let queryParams = {};
      
      // If specific measures are provided, filter by those measures
      if (measures && Array.isArray(measures) && measures.length > 0) {
        postDatesQuery += ` WHERE code IN UNNEST(@measures)`;
        queryParams.measures = measures;
        console.log("📅 Filtering qm_post dates by specific measures:", measures.slice(0, 3), '...');
      }
      
      postDatesQuery += ` ORDER BY publish_date DESC`;
      
      const [datesRows] = await myBigQuery.query({
        query: postDatesQuery,
        location: "US",
        params: queryParams
      });
      
      availableDates = datesRows.map(row => {
        if (typeof row.publish_date === 'string') return row.publish_date;
        if (row.publish_date && typeof row.publish_date === 'object' && row.publish_date.value) return row.publish_date.value;
        if (row.publish_date) return String(row.publish_date);
        return null;
      }).filter(Boolean);
    }
    
    // If no dates from qm_post, try qm_provider as fallback
    if (availableDates.length === 0 && existingTables.includes('qm_provider')) {
      console.log("📅 No dates found in qm_post, checking qm_provider...");
      
      let providerDatesQuery = `SELECT DISTINCT publish_date FROM \`market-mover-464517.quality.qm_provider\``;
      let queryParams = {};
      
      // If specific measures are provided, filter by those measures
      if (measures && Array.isArray(measures) && measures.length > 0) {
        providerDatesQuery += ` WHERE code IN UNNEST(@measures)`;
        queryParams.measures = measures;
        console.log("📅 Filtering dates by specific measures:", measures.slice(0, 3), '...');
      }
      
      providerDatesQuery += ` ORDER BY publish_date DESC`;
      
      const [providerDatesRows] = await myBigQuery.query({
        query: providerDatesQuery,
        location: "US",
        params: queryParams
      });
      
      availableDates = providerDatesRows.map(row => {
        if (typeof row.publish_date === 'string') return row.publish_date;
        if (row.publish_date && typeof row.publish_date === 'object' && row.publish_date.value) return row.publish_date.value;
        if (row.publish_date) return String(row.publish_date);
        return null;
      }).filter(Boolean);
      
      console.log("📅 Found dates in qm_provider:", availableDates);
    }
    
    // If publish_date is 'latest' or not found in available dates, use the most recent
    if (publish_date === 'latest' || !availableDates.includes(publish_date)) {
      actualPublishDate = availableDates[0] || null;
    }
    
    console.log('📅 Using publish date:', actualPublishDate, 'from available dates:', availableDates);
    
    // If no valid publish date found, return empty data
    if (!actualPublishDate) {
      console.log("⚠️ No valid publish date found");
      return res.status(200).json({ 
        success: true, 
        data: {
          measures: [],
          providerData: [],
          nationalAverages: {},
          availableDates: []
        }
      });
    }
    
         // OPTIMIZATION: Use a single query to get all data at once instead of 3 separate queries
     const combinedQuery = `
       WITH measures AS (
         SELECT code, label, direction, description, name, active, sort_order, setting, source 
         FROM \`market-mover-464517.quality.qm_dictionary\` 
         WHERE active = true
       ),
      provider_data AS (
        SELECT ccn, code, score, percentile_column 
        FROM \`market-mover-464517.quality.qm_provider\` 
        WHERE ccn IN UNNEST(@ccns) 
        AND publish_date = @publish_date
      ),
      national_data AS (
        SELECT code, national 
        FROM \`market-mover-464517.quality.qm_post\` 
        WHERE publish_date = @publish_date
      )
             SELECT 
         'measure' as data_type,
         code,
         label,
         direction,
         description,
         name,
         active,
         sort_order,
         setting,
         source,
         NULL as ccn,
         NULL as score,
         NULL as percentile_column,
         NULL as national
       FROM measures
      UNION ALL
             SELECT 
         'provider' as data_type,
         code,
         NULL as label,
         NULL as direction,
         NULL as description,
         NULL as name,
         NULL as active,
         NULL as sort_order,
         NULL as setting,
         NULL as source,
         ccn,
         score,
         percentile_column,
         NULL as national
       FROM provider_data
      UNION ALL
             SELECT 
         'national' as data_type,
         code,
         NULL as label,
         NULL as direction,
         NULL as description,
         NULL as name,
         NULL as active,
         NULL as sort_order,
         NULL as setting,
         NULL as source,
         NULL as ccn,
         NULL as score,
         NULL as percentile_column,
         national
       FROM national_data
      ORDER BY data_type, code
    `;
    
    const [combinedRows] = await myBigQuery.query({
      query: combinedQuery,
      location: "US",
      params: { ccns, publish_date: actualPublishDate }
    });

         // Process the combined results
     const measuresData = [];
     const providerData = [];
     const nationalAverages = {};

           combinedRows.forEach(row => {
        if (row.data_type === 'measure') {
          measuresData.push({
            code: row.code,
            label: row.label,
            direction: row.direction,
            description: row.description,
            name: row.name,
            active: row.active,
            sort_order: row.sort_order,
            setting: row.setting,
            source: row.source
          });
       } else if (row.data_type === 'provider') {
         providerData.push({
           ccn: row.ccn,
           code: row.code,
           score: row.score,
           percentile_column: row.percentile_column
         });
       } else if (row.data_type === 'national') {
         nationalAverages[row.code] = {
           score: row.national,
           percentile: 0.5 // 50th percentile
         };
       }
     });

     // Sort measures by sort_order
     measuresData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    console.log("✅ Combined endpoint returning (optimized):", {
      measuresCount: measuresData.length,
      providerDataCount: providerData.length,
      nationalAveragesCount: Object.keys(nationalAverages).length,
      availableDatesCount: availableDates.length
    });

    const responseData = {
      measures: measuresData,
      providerData,
      nationalAverages,
      availableDates
    };

    res.status(200).json({ 
      success: true, 
      data: responseData
    });
  } catch (err) {
    console.error("❌ BigQuery qm_combined query error:", err);
    res.status(200).json({ 
      success: true, 
      data: {
        measures: [],
        providerData: [],
        nationalAverages: {},
        availableDates: []
      }
    });
  }
});

// Debug endpoint to check what data is available
router.get("/qm_debug", async (req, res) => {
  try {
    console.log("🔍 Running quality measures debug query...");
    
    // Check what tables exist
    const checkTablesQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.quality.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name IN ('qm_dictionary', 'qm_provider', 'qm_post')
      ORDER BY table_name
    `;
    
    const [checkRows] = await myBigQuery.query({ query: checkTablesQuery, location: "US" });
    const existingTables = checkRows.map(row => row.table_name);
    
    console.log("📋 Existing tables:", existingTables);
    
    const debugData = {
      existingTables,
      qm_dictionary: null,
      qm_provider: null,
      qm_post: null
    };
    
    // Check qm_dictionary if it exists
    if (existingTables.includes('qm_dictionary')) {
      const [dictRows] = await myBigQuery.query({
        query: `SELECT COUNT(*) as count FROM \`market-mover-464517.quality.qm_dictionary\` WHERE active = true`,
        location: "US"
      });
      debugData.qm_dictionary = {
        activeMeasures: dictRows[0]?.count || 0
      };
    }
    
    // Check qm_post if it exists
    if (existingTables.includes('qm_post')) {
      const [postRows] = await myBigQuery.query({
        query: `SELECT DISTINCT publish_date FROM \`market-mover-464517.quality.qm_post\` ORDER BY publish_date DESC LIMIT 10`,
        location: "US"
      });
      debugData.qm_post = {
        availableDates: postRows.map(row => {
          if (typeof row.publish_date === 'string') return row.publish_date;
          if (row.publish_date && typeof row.publish_date === 'object' && row.publish_date.value) return row.publish_date.value;
          if (row.publish_date) return String(row.publish_date);
          return null;
        }).filter(Boolean)
      };
    }
    
    // Check qm_provider if it exists
    if (existingTables.includes('qm_provider')) {
      const [providerRows] = await myBigQuery.query({
        query: `SELECT COUNT(*) as count FROM \`market-mover-464517.quality.qm_provider\` LIMIT 1`,
        location: "US"
      });
      debugData.qm_provider = {
        totalRecords: providerRows[0]?.count || 0
      };
      
      // If we have publish dates, check provider data for the most recent date
      if (debugData.qm_post?.availableDates?.length > 0) {
        const latestDate = debugData.qm_post.availableDates[0];
        const [latestProviderRows] = await myBigQuery.query({
          query: `SELECT COUNT(*) as count FROM \`market-mover-464517.quality.qm_provider\` WHERE publish_date = @latest_date`,
          location: "US",
          params: { latest_date: latestDate }
        });
        debugData.qm_provider.latestDateRecords = latestProviderRows[0]?.count || 0;
        debugData.qm_provider.latestDate = latestDate;
      }
    }
    
    console.log("📊 Debug data:", debugData);
    
    res.status(200).json({ 
      success: true, 
      data: debugData,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ BigQuery qm_debug query error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all available dates from qm_post for given CCNs
router.post("/qm_post_dates", async (req, res) => {
  try {
    const { ccns } = req.body;
    
    if (!Array.isArray(ccns) || ccns.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "ccns (array) is required" 
      });
    }

    // Check if qm_post table exists
    const checkTableQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.quality.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name = 'qm_post'
    `;
    
    const [checkRows] = await myBigQuery.query({ query: checkTableQuery, location: "US" });
    
    if (checkRows.length === 0) {
      console.log("⚠️ qm_post table not found");
      return res.status(200).json({ success: true, data: [] });
    }

    // Get all available dates from qm_post, ordered by most recent first
    const query = `
      SELECT DISTINCT publish_date 
      FROM \`market-mover-464517.quality.qm_post\`
      ORDER BY publish_date DESC
    `;
    
    const [rows] = await myBigQuery.query({ query, location: "US" });
    
    const availableDates = rows.map(row => {
      if (typeof row.publish_date === 'string') return row.publish_date;
      if (row.publish_date && typeof row.publish_date === 'object' && row.publish_date.value) return row.publish_date.value;
      if (row.publish_date) return String(row.publish_date);
      return null;
    }).filter(Boolean);

    console.log(`📅 Found ${availableDates.length} available dates from qm_post`);
    
    res.status(200).json({ success: true, data: availableDates });
  } catch (err) {
    console.error("❌ BigQuery qm_post_dates query error:", err);
    res.status(200).json({ success: true, data: [] });
  }
});

// Get dates that have data for specific measures and CCNs
router.post("/qm_setting_dates", async (req, res) => {
  try {
    const { ccns, measures } = req.body;
    
    if (!Array.isArray(ccns) || ccns.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "ccns (array) is required" 
      });
    }

    if (!Array.isArray(measures) || measures.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "measures (array) is required" 
      });
    }

    // Check if qm_provider table exists
    const checkTableQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.quality.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name = 'qm_provider'
    `;
    
    const [checkRows] = await myBigQuery.query({ query: checkTableQuery, location: "US" });
    
    if (checkRows.length === 0) {
      console.log("⚠️ qm_provider table not found");
      return res.status(200).json({ success: true, data: [] });
    }

    // Get dates that have data for the specific measures and CCNs
    const query = `
      SELECT DISTINCT publish_date 
      FROM \`market-mover-464517.quality.qm_provider\`
      WHERE ccn IN UNNEST(@ccns) 
      AND code IN UNNEST(@measures)
      ORDER BY publish_date DESC
    `;
    
    const [rows] = await myBigQuery.query({ 
      query, 
      location: "US",
      params: { ccns, measures }
    });
    
    const availableDates = rows.map(row => {
      if (typeof row.publish_date === 'string') return row.publish_date;
      if (row.publish_date && typeof row.publish_date === 'object' && row.publish_date.value) return row.publish_date.value;
      if (row.publish_date) return String(row.publish_date);
      return null;
    }).filter(Boolean);

    console.log(`📅 Found ${availableDates.length} dates with data for measures:`, measures.slice(0, 3), '...');
    
    res.status(200).json({ success: true, data: availableDates });
  } catch (err) {
    console.error("❌ BigQuery qm_setting_dates query error:", err);
    res.status(200).json({ success: true, data: [] });
  }
});

// Cache clearing endpoint
router.post("/clear-cache", async (req, res) => {
  try {
    // Import the cache module
    const cache = await import('../utils/cache.js');
    cache.default.clear();
    
    console.log("🧹 Cache cleared via API endpoint");
    res.status(200).json({ 
      success: true, 
      message: "Cache cleared successfully",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ Cache clearing error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 