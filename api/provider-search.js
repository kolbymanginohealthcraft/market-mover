// api/provider-search.js
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
  const { queryText = "", type, state } = req.query;
  const tokens = queryText
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  let whereClauses = [];
  let params = {};

  // REGEXP_CONTAINS handles more fuzzy matching across all fields
  tokens.forEach((token, index) => {
    const param = `token${index}`;
    params[param] = token;
    whereClauses.push(`
      REGEXP_CONTAINS(
        LOWER(CONCAT(IFNULL(name, ''), ' ', IFNULL(street, ''), ' ', IFNULL(city, ''), ' ', IFNULL(state, ''), ' ', IFNULL(type, ''), ' ', CAST(id AS STRING))),
        @${param}
      )
    `);
  });

  // Optional filters
  if (type && type !== "All") {
    whereClauses.push(`LOWER(type) = @providerType`);
    params.providerType = type.toLowerCase();
  }

  if (state && state !== "All") {
    whereClauses.push(`state = @state`);
    params.state = state;
  }

  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const query = `
    SELECT 
      id, 
      name, 
      street, 
      city, 
      state, 
      type AS provider_type
    FROM \`market-mover-test.test_data.org_dhc\`
    ${whereSQL}
    ORDER BY name
    LIMIT 200
  `;

  try {
    const [rows] = await bigquery.query({ query, params });
    console.log(`✅ Returned ${rows.length} results for "${queryText}"`);
    res.json(rows);
  } catch (err) {
    console.error("❌ BigQuery error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

export default router;
