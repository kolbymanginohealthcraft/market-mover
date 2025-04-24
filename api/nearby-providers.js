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
  const { id, radius = 5 } = req.query;
  if (!id) return res.status(400).json({ error: "Missing provider ID" });

  const selectedQuery = `
    SELECT id, latitude, longitude
    FROM \`market-mover-test.test_data.org_dhc\`
    WHERE id = @id
  `;

  try {
    console.log("📍 Incoming query:", req.query);

    const [selectedRows] = await bigquery.query({
      query: selectedQuery,
      params: { id: Number(id) },
    });

    console.log("✅ Selected provider result:", selectedRows);

    if (!selectedRows.length) return res.status(404).json({ error: "Selected provider not found" });

    const { latitude, longitude } = selectedRows[0];
    const radiusMeters = Number(radius) * 1609.34;

    const query = `
      SELECT 
        id, name, street, city, state, type, latitude, longitude,
        ST_DISTANCE(
          ST_GEOGPOINT(longitude, latitude),
          ST_GEOGPOINT(@lng, @lat)
        ) / 1609.34 AS distance_miles
      FROM \`market-mover-test.test_data.org_dhc\`
      WHERE 
        latitude IS NOT NULL AND longitude IS NOT NULL
        AND id != @id
        AND ST_DWITHIN(
          ST_GEOGPOINT(longitude, latitude),
          ST_GEOGPOINT(@lng, @lat),
          @radiusMeters
        )
      ORDER BY distance_miles ASC
    `;

    const [rows] = await bigquery.query({
      query,
      params: {
        id: Number(id),
        lat: latitude,
        lng: longitude,
        radiusMeters,
      },
    });

    // Include selected provider at distance = 0
    rows.unshift({ ...selectedRows[0], distance_miles: 0 });

    res.json(rows);
  } catch (err) {
    console.error("❌ BigQuery error in nearby-providers:", err);
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

export default router;
