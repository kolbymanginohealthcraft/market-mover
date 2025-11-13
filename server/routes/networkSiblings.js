import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";

const router = express.Router();

router.post("/network-siblings", async (req, res) => {
  try {
    const { npi, dhc } = req.body;

    if (!npi && !dhc) {
      return res.status(400).json({
        success: false,
        error: "Either npi or dhc is required",
      });
    }

    let providerQuery = "";
    let providerParams = {};

    if (dhc) {
      providerQuery = `
        SELECT 
          CAST(atlas_definitive_id AS STRING) AS dhc,
          CAST(npi AS STRING) AS npi,
          atlas_definitive_firm_type AS type,
          network_id,
          network_name,
          hospital_parent_id,
          hospital_parent_name,
          physician_group_parent_id,
          physician_group_parent_name
        FROM \`aegis_access.hco_flat\`
        WHERE atlas_definitive_id = CAST(@dhc AS INT64)
          AND atlas_definitive_id_primary_npi = TRUE
          AND npi_deactivation_date IS NULL
        LIMIT 1
      `;
      providerParams = { dhc: String(dhc) };
    } else {
      providerQuery = `
        SELECT 
          CAST(atlas_definitive_id AS STRING) AS dhc,
          CAST(npi AS STRING) AS npi,
          atlas_definitive_firm_type AS type,
          network_id,
          network_name,
          hospital_parent_id,
          hospital_parent_name,
          physician_group_parent_id,
          physician_group_parent_name
        FROM \`aegis_access.hco_flat\`
        WHERE CAST(npi AS STRING) = @npi
          AND atlas_definitive_id_primary_npi = TRUE
          AND npi_deactivation_date IS NULL
        LIMIT 1
      `;
      providerParams = { npi: String(npi) };
    }

    const [providerRows] = await vendorBigQuery.query({
      query: providerQuery,
      params: providerParams,
    });

    if (!providerRows || providerRows.length === 0) {
      return res.json({
        success: true,
        data: [],
        summary: {},
      });
    }

    const provider = providerRows[0];
    const relationshipConditions = [];
    const params = {};

    if (provider.network_id) {
      relationshipConditions.push("network_id = @network_id");
      params.network_id = provider.network_id;
    }

    if (provider.hospital_parent_id) {
      relationshipConditions.push("hospital_parent_id = @hospital_parent_id");
      params.hospital_parent_id = provider.hospital_parent_id;
    }

    if (provider.physician_group_parent_id) {
      relationshipConditions.push("physician_group_parent_id = @physician_group_parent_id");
      params.physician_group_parent_id = provider.physician_group_parent_id;
    }

    if (relationshipConditions.length === 0) {
      return res.json({
        success: true,
        data: [],
        summary: {},
      });
    }

    const relationshipClause = relationshipConditions.join(" OR ");

    const siblingsQuery = `
      SELECT 
        CAST(atlas_definitive_id AS STRING) AS dhc,
        CAST(npi AS STRING) AS npi,
        atlas_definitive_name AS definitive_name,
        atlas_definitive_firm_type AS type,
        primary_address_city AS city,
        primary_address_state_or_province AS state,
        primary_address_zip5 AS zip,
        primary_address_lat AS latitude,
        primary_address_long AS longitude,
        network_id,
        network_name,
        hospital_parent_id,
        hospital_parent_name,
        physician_group_parent_id,
        physician_group_parent_name
      FROM \`aegis_access.hco_flat\`
      WHERE (${relationshipClause})
        AND atlas_definitive_id_primary_npi = TRUE
        AND npi_deactivation_date IS NULL
        AND primary_address_lat IS NOT NULL
        AND primary_address_long IS NOT NULL
        AND atlas_definitive_id != CAST(@exclude_dhc AS INT64)
      ORDER BY atlas_definitive_name
      LIMIT 500
    `;

    params.exclude_dhc = provider.dhc || dhc || '0';

    const [siblingRows] = await vendorBigQuery.query({
      query: siblingsQuery,
      params,
    });

    const siblings = siblingRows.map((row) => ({
      dhc: row.dhc ? String(row.dhc) : null,
      npi: row.npi ? String(row.npi) : null,
      name: row.definitive_name ? String(row.definitive_name) : null,
      type: row.type ? String(row.type) : null,
      city: row.city ? String(row.city) : null,
      state: row.state ? String(row.state) : null,
      zip: row.zip ? String(row.zip) : null,
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
      networkId: row.network_id ? String(row.network_id) : null,
      networkName: row.network_name ? String(row.network_name) : null,
      hospitalParentId: row.hospital_parent_id ? String(row.hospital_parent_id) : null,
      hospitalParentName: row.hospital_parent_name ? String(row.hospital_parent_name) : null,
      physicianGroupParentId: row.physician_group_parent_id ? String(row.physician_group_parent_id) : null,
      physicianGroupParentName: row.physician_group_parent_name ? String(row.physician_group_parent_name) : null,
    }));

    const typeSummary = {};
    
    if (provider.type) {
      typeSummary[provider.type] = (typeSummary[provider.type] || 0) + 1;
    }
    
    siblings.forEach((sibling) => {
      if (sibling.type) {
        typeSummary[sibling.type] = (typeSummary[sibling.type] || 0) + 1;
      }
    });

    const summary = {
      totalSiblings: siblings.length + 1,
      providerTypes: Object.entries(typeSummary)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      networkName: provider.network_name || null,
      hospitalParentName: provider.hospital_parent_name || null,
      physicianGroupParentName: provider.physician_group_parent_name || null,
    };

    res.json({
      success: true,
      data: siblings,
      summary,
    });
  } catch (error) {
    console.error("Error fetching network siblings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch network siblings",
      details: error.message,
    });
  }
});

export default router;

