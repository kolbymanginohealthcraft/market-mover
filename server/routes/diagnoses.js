import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";

const router = express.Router();

// Get diagnosis volume data for the last 12 months
router.get("/diagnoses-volume", async (req, res) => {
  try {
    console.log("🔍 Fetching diagnosis volume data...");
    
    const query = `
      SELECT 
        date__month_grain,
        CAST(date__month_grain AS STRING) as date_string,
        SUM(count) as total_count
      FROM \`aegis_access.volume_diagnosis\`
      GROUP BY date__month_grain
      ORDER BY date__month_grain DESC
      LIMIT 12
    `;
    
    const [rows] = await vendorBigQueryClient.query({ query });
    
    console.log(`✅ Retrieved ${rows.length} months of diagnosis volume data`);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching diagnosis volume data:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch diagnosis volume data",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Diagnostic endpoint to check what data is available
router.get("/diagnoses-debug", async (req, res) => {
  try {
    console.log("🔍 Running diagnostic query for diagnosis data...");
    
    const query = `
      SELECT 
        MIN(date__month_grain) as earliest_month,
        MAX(date__month_grain) as latest_month,
        COUNT(DISTINCT date__month_grain) as total_months,
        SUM(count) as total_diagnoses
      FROM \`aegis_access.volume_diagnosis\`
    `;
    
    const [summaryRows] = await vendorBigQueryClient.query({ query });
    const summary = summaryRows[0];
    
    // Also get the last 20 months to see the pattern
    const recentQuery = `
      SELECT 
        date__month_grain,
        CAST(date__month_grain AS STRING) as date_string,
        SUM(count) as total_count
      FROM \`aegis_access.volume_diagnosis\`
      GROUP BY date__month_grain
      ORDER BY date__month_grain DESC
      LIMIT 20
    `;
    
    const [recentRows] = await vendorBigQueryClient.query({ query: recentQuery });
    
    console.log("📊 Diagnostic results:", summary);
    console.log("📅 Recent months:", recentRows.map(r => r.date_string));
    
    res.json({
      success: true,
      summary: summary,
      recent_months: recentRows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error running diagnostic query:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to run diagnostic query",
      error: error.message
    });
  }
});

export default router; 