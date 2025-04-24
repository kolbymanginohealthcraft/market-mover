// api/provider-detail.js
import express from "express";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bigquery = new BigQuery({
  keyFilename: path.join(__dirname, "../service-account.json"),
});

router.get("/", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing provider ID" });

  const query = `
    SELECT id, name, address, city, state, provider_type, latitude, longitude
    FROM \`market-mover-test.test_data.org_dhc\`
    WHERE id = @id
    LIMIT 1
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { id: Number(id) },
    });
    if (rows.length === 0) return res.status(404).json({ error: "Provider not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("BigQuery error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
