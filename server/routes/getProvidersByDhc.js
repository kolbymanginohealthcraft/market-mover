import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";
const router = express.Router();

// Test route to verify the endpoint is registered
router.get("/getProvidersByDhc", (req, res) => {
  res.json({ message: "getProvidersByDhc route is working!" });
});

router.post("/getProvidersByDhc", async (req, res) => {
  const { dhc_ids } = req.body;
  console.log("🔍 getProvidersByDhc called with dhc_ids:", dhc_ids);
  
  if (!Array.isArray(dhc_ids) || dhc_ids.length === 0) {
    console.log("❌ Invalid dhc_ids:", dhc_ids);
    return res.status(400).json({ success: false, error: "dhc_ids (array) is required" });
  }
  
  try {
    const query = `
      SELECT dhc, name, street, city, state, zip, network, type
      FROM \`market-mover-464517.providers.org_dhc\`
      WHERE dhc IN UNNEST(@dhc_ids)
    `;
    console.log("🔍 Executing BigQuery query with params:", { dhc_ids });
    
    const [rows] = await myBigQuery.query({ query, location: "US", params: { dhc_ids } });
    console.log("✅ BigQuery returned", rows.length, "providers:", rows);
    
    res.status(200).json({ success: true, providers: rows });
  } catch (err) {
    console.error("❌ BigQuery error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
export default router; 