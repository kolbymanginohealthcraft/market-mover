import express from "express";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

const router = express.Router();

const bigquery = new BigQuery({
  keyFilename: path.resolve("server", "google-service-account.json"),
  projectId: "market-mover-464517",
});

router.get("/org_dhc/nearby", async (req, res) => {
  const { lat, lon, radius } = req.query;
  
  if (!lat || !lon || !radius) {
    return res.status(400).json({ 
      error: "lat, lon, and radius are required" 
    });
  }

  const radiusMeters = Number(radius) * 1609.34; // miles to meters

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
    const [rows] = await bigquery.query(options);
    
    if (rows && rows.length > 0) {
      // console.log("Sample row from BigQuery:", rows[0]);
    }
    // Convert distance to miles and add to each row
    const providersWithDistance = rows.map(row => ({
      ...row,
      distance: row.distance_meters / 1609.34, // Store as number
      distance_meters: undefined // Remove the meters field
    }));

    if (providersWithDistance && providersWithDistance.length > 0) {
      // console.log("Sample providerWithDistance:", providersWithDistance[0]);
    }

    res.json({ 
      success: true, 
      data: providersWithDistance,
      count: providersWithDistance.length
    });
  } catch (err) {
    console.error("BigQuery nearby providers error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

export default router; 