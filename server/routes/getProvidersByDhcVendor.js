// Experimental route using vendor BigQuery hco_flat instead of org_dhc
import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";

const router = express.Router();

// Experimental route using vendor BigQuery hco_flat table
// This uses definitive_id as the DHC equivalent
router.post("/getProvidersByDhcVendor", async (req, res) => {
  const { dhc_ids } = req.body;
  console.log("🔍 [VENDOR] getProvidersByDhcVendor called with dhc_ids:", dhc_ids);
  
  if (!Array.isArray(dhc_ids) || dhc_ids.length === 0) {
    console.log("❌ [VENDOR] Invalid dhc_ids:", dhc_ids);
    return res.status(400).json({ success: false, error: "dhc_ids (array) is required" });
  }
  
  try {
    // Convert string DHCs to integers for BigQuery
    const numericDhcIds = dhc_ids.map(id => {
      const num = parseInt(id);
      if (isNaN(num)) {
        console.warn(`⚠️ [VENDOR] Invalid DHC ID: ${id}`);
        return null;
      }
      return num;
    }).filter(id => id !== null);
    
    if (numericDhcIds.length === 0) {
      console.log("❌ [VENDOR] No valid numeric DHC IDs found");
      return res.status(400).json({ success: false, error: "No valid numeric DHC IDs provided" });
    }
    
    console.log("🔍 [VENDOR] Converted DHC IDs:", numericDhcIds);
    
    // Use atlas_definitive_id from hco_flat as the DHC equivalent
    // Map vendor BigQuery fields to match the org_dhc schema
    const query = `
      SELECT 
        atlas_definitive_id as dhc,
        atlas_definitive_name as name,
        primary_address_line_1 as street,
        primary_address_city as city,
        primary_address_state_or_province as state,
        primary_address_zip5 as zip,
        atlas_network_name as network,
        atlas_definitive_firm_type as type,
        primary_address_lat as latitude,
        primary_address_long as longitude
      FROM \`aegis_access.hco_flat\`
      WHERE atlas_definitive_id IN UNNEST(@dhc_ids)
        AND atlas_definitive_id IS NOT NULL
        AND atlas_definitive_id_primary_npi = TRUE
        AND npi_deactivation_date IS NULL
    `;
    
    console.log("🔍 [VENDOR] Executing vendor BigQuery query with params:", { dhc_ids: numericDhcIds });
    
    const [rows] = await vendorBigQuery.query({ 
      query, 
      params: { dhc_ids: numericDhcIds } 
    });
    
    console.log("✅ [VENDOR] Vendor BigQuery returned", rows.length, "providers");
    
    res.status(200).json({ success: true, providers: rows });
  } catch (err) {
    console.error("❌ [VENDOR] Vendor BigQuery error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

