// server/routes/getNearbyProviders.js

import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";

const router = express.Router();

router.get("/org_dhc/nearby", async (req, res) => {
  const { lat, lon, radius } = req.query;

  if (!lat || !lon || !radius) {
    return res.status(400).json({
      success: false,
      error: "lat, lon, and radius are required"
    });
  }

  const radiusMeters = Number(radius) * 1609.34;

  const query = `
    SELECT
      dhc,
      name,
      network,
      type,
      street,
      city,
      state,
      zip,
      phone,
      latitude,
      longitude,
      beds,
      fips,
      distance_meters,
      rn
    FROM (
      SELECT 
        dhc,
        name,
        network,
        type,
        street,
        city,
        state,
        zip,
        phone,
        latitude,
        longitude,
        beds,
        fips,
        ST_DISTANCE(
          ST_GEOGPOINT(CAST(longitude AS FLOAT64), CAST(latitude AS FLOAT64)),
          ST_GEOGPOINT(@lon, @lat)
        ) as distance_meters,
        ROW_NUMBER() OVER (PARTITION BY dhc ORDER BY ST_DISTANCE(
          ST_GEOGPOINT(CAST(longitude AS FLOAT64), CAST(latitude AS FLOAT64)),
          ST_GEOGPOINT(@lon, @lat)
        ) ASC) as rn
      FROM \`market-mover-464517.providers.org_dhc\`
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        AND ST_DISTANCE(
          ST_GEOGPOINT(CAST(longitude AS FLOAT64), CAST(latitude AS FLOAT64)),
          ST_GEOGPOINT(@lon, @lat)
        ) <= @radiusMeters
    )
    WHERE rn = 1
    ORDER BY distance_meters ASC
  `;

  const options = {
    query,
    location: "US",
    params: {
      lon: Number(lon),
      lat: Number(lat),
      radiusMeters,
    },
  };

  try {
    const [rows] = await myBigQuery.query(options);

    const providersWithDistance = rows.map(row => ({
      ...row,
      distance: row.distance_meters / 1609.34,
      distance_meters: undefined,
    }));

    res.status(200).json({
      success: true,
      data: providersWithDistance,
      count: providersWithDistance.length
    });
  } catch (err) {
    console.error("❌ BigQuery nearby providers error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
