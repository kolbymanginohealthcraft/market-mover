import express from "express";
import fetch from "node-fetch";
import myBigQuery from "../utils/myBigQueryClient.js";

const router = express.Router();

const DEFAULT_RADIUS_MILES = 10;
const DEFAULT_FEATURE_TYPE_LIMIT = 20;
const DEFAULT_CLASS_LIMIT = 50;
const DEFAULT_TAG_KEY_LIMIT = 40;
const DEFAULT_TAG_VALUES_PER_KEY = 6;
const DEFAULT_TAG_KEYS_PER_FEATURE = 6;
const DEFAULT_TAG_SAMPLE_NAME_LIMIT = 10;
const DEFAULT_SAMPLE_LIMIT = 40;
const DEFAULT_SIMPLIFY_TOLERANCE = 30;
const FEATURE_DETAILS_LIMIT = 500;
const SAMPLE_TAG_KEYS = [
  "name",
  "highway",
  "amenity",
  "landuse",
  "building",
  "place",
  "natural",
  "leisure",
  "shop",
  "man_made",
  "tourism",
  "railway",
  "waterway"
];

const CLASSIFICATION_KEYS = [
  "highway",
  "amenity",
  "building",
  "landuse",
  "natural",
  "place",
  "railway",
  "route",
  "waterway",
  "leisure",
  "shop",
  "man_made",
  "tourism"
];


const featureTypeQuery = `
  DECLARE center GEOGRAPHY;
  DECLARE area GEOGRAPHY;

  SET center = ST_GEOGPOINT(@lng, @lat);
  SET area = ST_BUFFER(center, @radiusMeters);

  WITH classification_order AS (
    SELECT classification_key AS key, idx
    FROM UNNEST(@classificationKeys) AS classification_key WITH OFFSET AS idx
  ),
  filtered AS (
    SELECT
      feature_type,
      all_tags
    FROM \`bigquery-public-data.geo_openstreetmap.planet_features\`
    WHERE feature_type IS NOT NULL
      AND ST_INTERSECTS(geometry, area)
      AND (
        @onlyPoints = FALSE
        OR REPLACE(UPPER(ST_GEOMETRYTYPE(geometry)), 'ST_', '') IN ('POINT', 'MULTIPOINT')
      )
      AND EXISTS (
        SELECT 1
        FROM UNNEST(all_tags) AS name_tag
        WHERE name_tag.key = 'name'
          AND name_tag.value IS NOT NULL
          AND name_tag.value != ''
      )
  ),
  feature_counts AS (
    SELECT
      feature_type,
      COUNT(*) AS feature_count
    FROM filtered
    GROUP BY feature_type
  ),
  feature_classification AS (
    SELECT
      feature_type,
      IFNULL(
        ARRAY_AGG(IF(co.idx IS NULL, NULL, tag.value) IGNORE NULLS ORDER BY co.idx LIMIT 1)[OFFSET(0)],
        'unclassified'
      ) AS feature_class
    FROM filtered
    LEFT JOIN UNNEST(all_tags) AS tag
    LEFT JOIN classification_order co
      ON co.key = tag.key
    GROUP BY feature_type, all_tags
  ),
  class_counts AS (
    SELECT
      feature_type,
      feature_class,
      COUNT(*) AS class_count
    FROM feature_classification
    GROUP BY feature_type, feature_class
  ),
  top_classes AS (
    SELECT
      feature_type,
      ARRAY_AGG(STRUCT(feature_class, class_count) ORDER BY class_count DESC LIMIT @classLimit) AS top_classes
    FROM class_counts
    GROUP BY feature_type
  ),
  tag_key_counts AS (
    SELECT
      feature_type,
      tag.key AS tag_key,
      COUNT(*) AS tag_count
    FROM filtered
    LEFT JOIN UNNEST(all_tags) AS tag
    WHERE tag.key IS NOT NULL
    GROUP BY feature_type, tag_key
  ),
  top_tag_keys AS (
    SELECT
      feature_type,
      ARRAY_AGG(STRUCT(tag_key, tag_count) ORDER BY tag_count DESC LIMIT @tagKeysPerFeature) AS top_tag_keys
    FROM tag_key_counts
    GROUP BY feature_type
  )
  SELECT
    fc.feature_type,
    fc.feature_count,
    IFNULL(tc.top_classes, ARRAY<STRUCT<feature_class STRING, class_count INT64>>[]) AS top_classes,
    IFNULL(ttk.top_tag_keys, ARRAY<STRUCT<tag_key STRING, tag_count INT64>>[]) AS top_tag_keys
  FROM feature_counts fc
  LEFT JOIN top_classes tc
    ON tc.feature_type = fc.feature_type
  LEFT JOIN top_tag_keys ttk
    ON ttk.feature_type = fc.feature_type
  ORDER BY fc.feature_count DESC
  LIMIT @featureTypeLimit;
`;

const tagSummaryQuery = `
  DECLARE center GEOGRAPHY;
  DECLARE area GEOGRAPHY;

  SET center = ST_GEOGPOINT(@lng, @lat);
  SET area = ST_BUFFER(center, @radiusMeters);

  WITH filtered AS (
    SELECT all_tags
    FROM \`bigquery-public-data.geo_openstreetmap.planet_features\`
    WHERE ST_INTERSECTS(geometry, area)
      AND (
        @onlyPoints = FALSE
        OR REPLACE(UPPER(ST_GEOMETRYTYPE(geometry)), 'ST_', '') IN ('POINT', 'MULTIPOINT')
      )
      AND EXISTS (
        SELECT 1
        FROM UNNEST(all_tags) AS name_tag
        WHERE name_tag.key = 'name'
          AND name_tag.value IS NOT NULL
          AND name_tag.value != ''
      )
  ),
  exploded AS (
    SELECT
      tag.key AS tag_key,
      tag.value AS tag_value,
      (
        SELECT name_tag.value
        FROM UNNEST(f.all_tags) AS name_tag
        WHERE name_tag.key = 'name'
        LIMIT 1
      ) AS feature_name
    FROM filtered f
    LEFT JOIN UNNEST(f.all_tags) AS tag
    WHERE tag.key IS NOT NULL
  ),
  aggregated AS (
    SELECT
      tag_key,
      tag_value,
      COUNT(*) AS value_count,
      ARRAY_AGG(DISTINCT feature_name IGNORE NULLS ORDER BY feature_name LIMIT @tagSampleNameLimit) AS sample_names
    FROM exploded
    GROUP BY tag_key, tag_value
  ),
  key_totals AS (
    SELECT
      tag_key,
      SUM(value_count) AS tag_count
    FROM aggregated
    GROUP BY tag_key
  )
  SELECT
    kt.tag_key AS key,
    kt.tag_count,
    ARRAY_AGG(
      STRUCT(ag.tag_value AS value, ag.value_count, ag.sample_names)
      ORDER BY ag.value_count DESC
      LIMIT @tagValuesPerKey
    ) AS top_values
  FROM key_totals kt
  JOIN aggregated ag
    ON ag.tag_key = kt.tag_key
  GROUP BY kt.tag_key, kt.tag_count
  ORDER BY kt.tag_count DESC
  LIMIT @tagKeyLimit;
`;

const sampleFeaturesQuery = `
  DECLARE center GEOGRAPHY;
  DECLARE area GEOGRAPHY;

  SET center = ST_GEOGPOINT(@lng, @lat);
  SET area = ST_BUFFER(center, @radiusMeters);

  SELECT
    CAST(osm_id AS STRING) AS osm_id,
    feature_type,
    ST_GEOMETRYTYPE(geometry) AS geometry_type,
    (
      SELECT name_tag.value
      FROM UNNEST(all_tags) AS name_tag
      WHERE name_tag.key = 'name'
      LIMIT 1
    ) AS feature_name,
    IFNULL((
      SELECT tag.value
      FROM UNNEST(all_tags) AS tag
      WHERE tag.key IN UNNEST(@classificationKeys)
      ORDER BY (
        SELECT idx
        FROM UNNEST(GENERATE_ARRAY(0, ARRAY_LENGTH(@classificationKeys) - 1)) AS idx
        WHERE @classificationKeys[OFFSET(idx)] = tag.key
      )
      LIMIT 1
    ), 'unclassified') AS feature_class,
    ARRAY(
      SELECT AS STRUCT t.key, t.value
      FROM UNNEST(all_tags) AS t
      WHERE t.key IN UNNEST(@sampleTagKeys)
      ORDER BY t.key
    ) AS focused_tags,
    ARRAY(
      SELECT AS STRUCT t.key, t.value
      FROM UNNEST(all_tags) AS t
      WHERE t.key NOT IN UNNEST(@sampleTagKeys)
      ORDER BY t.key
      LIMIT 10
    ) AS extra_tags,
    ST_X(ST_CENTROID(geometry)) AS lon,
    ST_Y(ST_CENTROID(geometry)) AS lat,
    ST_ASGEOJSON(ST_SIMPLIFY(geometry, @simplifyTolerance)) AS geometry_geojson
  FROM \`bigquery-public-data.geo_openstreetmap.planet_features\`
  WHERE ST_INTERSECTS(geometry, area)
    AND (
      @onlyPoints = FALSE
      OR REPLACE(UPPER(ST_GEOMETRYTYPE(geometry)), 'ST_', '') IN ('POINT', 'MULTIPOINT')
    )
  ORDER BY feature_type, osm_id
  LIMIT @sampleLimit;
`;

const featureDetailsQuery = `
  DECLARE center GEOGRAPHY;
  DECLARE area GEOGRAPHY;
  DECLARE search_term STRING DEFAULT LOWER(@searchTerm);
  DECLARE match_all_type BOOL DEFAULT (@featureType = 'ALL');
  DECLARE match_all_class BOOL DEFAULT (@featureClass = 'ALL');
  DECLARE tag_key_filter STRING DEFAULT IFNULL(@tagKey, '');
  DECLARE has_tag_key_filter BOOL DEFAULT (tag_key_filter != '');
  DECLARE has_search_term BOOL DEFAULT (search_term != '');

  SET center = ST_GEOGPOINT(@lng, @lat);
  SET area = ST_BUFFER(center, @radiusMeters);

  WITH classification_order AS (
    SELECT classification_key AS key, idx
    FROM UNNEST(@classificationKeys) AS classification_key WITH OFFSET AS idx
  ),
  filtered AS (
    SELECT
      CAST(osm_id AS STRING) AS osm_id,
      feature_type,
      all_tags,
      geometry,
      ST_GEOMETRYTYPE(geometry) AS geometry_type
    FROM \`bigquery-public-data.geo_openstreetmap.planet_features\`
    WHERE ST_INTERSECTS(geometry, area)
      AND (
        @onlyPoints = FALSE
        OR REPLACE(UPPER(ST_GEOMETRYTYPE(geometry)), 'ST_', '') IN ('POINT', 'MULTIPOINT')
        OR (@includeAreas = TRUE AND REPLACE(UPPER(ST_GEOMETRYTYPE(geometry)), 'ST_', '') IN ('POLYGON', 'MULTIPOLYGON'))
      )
      AND (match_all_type OR feature_type = @featureType)
      AND (
        NOT has_tag_key_filter
        OR EXISTS (
          SELECT 1
          FROM UNNEST(all_tags) AS tag
          WHERE tag.key = tag_key_filter
            AND (
              NOT has_search_term
              OR LOWER(IFNULL(tag.value, '')) LIKE CONCAT('%', search_term, '%')
            )
        )
      )
  ),
  enriched AS (
    SELECT
      f.osm_id,
      f.feature_type,
      IFNULL((
        SELECT tag.value
        FROM UNNEST(f.all_tags) AS tag
        JOIN classification_order co
          ON co.key = tag.key
        ORDER BY co.idx
        LIMIT 1
      ), 'unclassified') AS feature_class,
      f.geometry,
      f.geometry_type,
      f.all_tags,
      ST_X(ST_CENTROID(f.geometry)) AS lon,
      ST_Y(ST_CENTROID(f.geometry)) AS lat,
      (
        SELECT value
        FROM UNNEST(f.all_tags)
        WHERE key = 'name'
        LIMIT 1
      ) AS name,
      ARRAY(
        SELECT AS STRUCT t.key, t.value
        FROM UNNEST(f.all_tags) AS t
        WHERE t.key IN UNNEST(@sampleTagKeys)
        ORDER BY t.key
      ) AS focused_tags,
      ARRAY(
        SELECT AS STRUCT t.key, t.value
        FROM UNNEST(f.all_tags) AS t
        WHERE t.key NOT IN UNNEST(@sampleTagKeys)
        ORDER BY t.key
        LIMIT 20
      ) AS extra_tags,
      ARRAY(
        SELECT LOWER(t.value)
        FROM UNNEST(f.all_tags) AS t
        WHERE t.value IS NOT NULL
      ) AS searchable_values
    FROM filtered f
  )
  SELECT
    osm_id,
    feature_type,
    feature_class,
    geometry_type,
    lon,
    lat,
    name,
    focused_tags,
    extra_tags
  FROM enriched
  WHERE (match_all_class OR feature_class = @featureClass)
    AND name IS NOT NULL
    AND name != ''
    AND (
      NOT has_search_term
      OR (
        has_tag_key_filter
        AND has_search_term
      )
      OR (
        NOT has_tag_key_filter
        AND (
          (name IS NOT NULL AND LOWER(name) LIKE CONCAT('%', search_term, '%'))
          OR EXISTS (
            SELECT 1
            FROM UNNEST(searchable_values) AS val
            WHERE val LIKE CONCAT('%', search_term, '%')
          )
        )
      )
    )
  ORDER BY feature_type, feature_class, name, osm_id
  LIMIT @featureLimit;
`;

router.get("/planet-features/summary", async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius,
      featureTypeLimit,
      classLimit,
      tagKeyLimit,
      tagValuesPerKey,
      tagKeysPerFeature,
      onlyPoints: rawOnlyPoints,
      tagSampleNameLimit,
      sampleLimit
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Missing latitude or longitude"
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        error: "Invalid latitude or longitude"
      });
    }

    const radiusMiles = Number(radius || DEFAULT_RADIUS_MILES);
    if (!Number.isFinite(radiusMiles) || radiusMiles <= 0) {
      return res.status(400).json({
        success: false,
        error: "Radius must be a positive number"
      });
    }

    const radiusMeters = radiusMiles * 1609.34;

    const resolvedFeatureTypeLimit = Number(featureTypeLimit || DEFAULT_FEATURE_TYPE_LIMIT);
    const resolvedClassLimit = Number(classLimit || DEFAULT_CLASS_LIMIT);
    const resolvedTagKeyLimit = Number(tagKeyLimit || DEFAULT_TAG_KEY_LIMIT);
    const resolvedTagValuesPerKey = Number(tagValuesPerKey || DEFAULT_TAG_VALUES_PER_KEY);
    const resolvedTagKeysPerFeature = Number(tagKeysPerFeature || DEFAULT_TAG_KEYS_PER_FEATURE);
    const resolvedTagSampleNameLimit = Number(tagSampleNameLimit || DEFAULT_TAG_SAMPLE_NAME_LIMIT);
    const resolvedSampleLimit = Number(sampleLimit || DEFAULT_SAMPLE_LIMIT);
    const onlyPoints = rawOnlyPoints === undefined ? true : String(rawOnlyPoints).toLowerCase() === "true";

    const baseParams = {
      lat,
      lng,
      radiusMeters,
      onlyPoints
    };

    const featureTypeParams = {
      ...baseParams,
      classificationKeys: CLASSIFICATION_KEYS,
      featureTypeLimit: resolvedFeatureTypeLimit,
      classLimit: resolvedClassLimit,
      tagKeysPerFeature: resolvedTagKeysPerFeature
    };

    const tagParams = {
      ...baseParams,
      tagKeyLimit: resolvedTagKeyLimit,
      tagValuesPerKey: resolvedTagValuesPerKey,
      tagSampleNameLimit: resolvedTagSampleNameLimit
    };

    const sampleParams = {
      ...baseParams,
      classificationKeys: CLASSIFICATION_KEYS,
      sampleLimit: resolvedSampleLimit,
      sampleTagKeys: SAMPLE_TAG_KEYS,
      simplifyTolerance: DEFAULT_SIMPLIFY_TOLERANCE
    };

    console.log(
      `🗺️ Planet features summary requested lat=${lat}, lng=${lng}, radius=${radiusMiles}mi, pointsOnly=${onlyPoints}`
    );

    if (onlyPoints) {
      try {
        const diagParams = { lat, lng, radiusMeters };
        const [geometryDiag] = await myBigQuery.query({
          query: `
            DECLARE center GEOGRAPHY;
            DECLARE area GEOGRAPHY;
            SET center = ST_GEOGPOINT(@lng, @lat);
            SET area = ST_BUFFER(center, @radiusMeters);

            SELECT
              ST_GEOMETRYTYPE(geometry) AS geom_type,
              COUNT(*) AS geom_count
            FROM \`bigquery-public-data.geo_openstreetmap.planet_features\`
            WHERE ST_INTERSECTS(geometry, area)
            GROUP BY geom_type
            ORDER BY geom_count DESC
            LIMIT 10;
          `,
          params: diagParams,
          location: "US"
        });

        console.log("📐 Nearby geometry type counts:", geometryDiag);
      } catch (diagError) {
        console.warn("⚠️ Failed geometry diagnostic query:", diagError.message);
      }
    }

    const [[featureTypeRows], [tagRows], [sampleRows]] = await Promise.all([
      myBigQuery.query({
        query: featureTypeQuery,
        params: featureTypeParams,
        location: "US"
      }),
      myBigQuery.query({
        query: tagSummaryQuery,
        params: tagParams,
        location: "US"
      }),
      myBigQuery.query({
        query: sampleFeaturesQuery,
        params: sampleParams,
        location: "US"
      })
    ]);

    const totals = featureTypeRows.reduce(
      (acc, row) => {
        acc.featureCount += Number(row.feature_count || 0);
        return acc;
      },
      { featureCount: 0 }
    );

    const tagTotals = tagRows.reduce(
      (acc, row) => {
        acc.tagCount += Number(row.tag_count || 0);
        return acc;
      },
      { tagCount: 0 }
    );

    const parsedSamples = sampleRows.map((row) => {
      let geometry = null;
      if (row.geometry_geojson) {
        try {
          geometry = JSON.parse(row.geometry_geojson);
        } catch (error) {
          console.warn("⚠️ Failed to parse geometry_geojson for osm_id", row.osm_id, error.message);
        }
      }

      const lat = Number(row.lat);
      const lon = Number(row.lon);

      return {
        osmId: row.osm_id,
        featureType: row.feature_type,
        geometryType: row.geometry_type,
        name: row.feature_name || null,
        featureClass: row.feature_class,
        focusedTags: row.focused_tags || [],
        extraTags: row.extra_tags || [],
        centroid: Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null,
        geometry
      };
    });

    return res.json({
      success: true,
      data: {
        featureTypes: featureTypeRows,
        tagKeys: tagRows,
        samples: parsedSamples,
        totals: {
          featureCount: totals.featureCount,
          tagKeyCount: tagTotals.tagCount
        },
        query: {
          latitude: lat,
          longitude: lng,
          radiusMiles,
          featureTypeLimit: resolvedFeatureTypeLimit,
          classLimit: resolvedClassLimit,
          tagKeyLimit: resolvedTagKeyLimit,
          tagValuesPerKey: resolvedTagValuesPerKey,
          tagKeysPerFeature: resolvedTagKeysPerFeature,
          tagSampleNameLimit: resolvedTagSampleNameLimit,
          onlyPoints,
          sampleLimit: resolvedSampleLimit,
          executedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error("❌ Planet features summary error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch planet features summary",
      details: error.message
    });
  }
});

router.get("/planet-features/features", async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius,
      featureType,
      featureClass,
      searchTerm,
      tagKey,
      featureLimit,
      includeAreas,
      onlyPoints: rawOnlyPoints
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, error: "Missing latitude or longitude" });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, error: "Invalid latitude or longitude" });
    }

    const radiusMiles = Number(radius || DEFAULT_RADIUS_MILES);
    if (!Number.isFinite(radiusMiles) || radiusMiles <= 0) {
      return res.status(400).json({ success: false, error: "Radius must be a positive number" });
    }

    const radiusMeters = radiusMiles * 1609.34;
    const onlyPoints = rawOnlyPoints === undefined ? true : String(rawOnlyPoints).toLowerCase() === "true";
    const requestedLimit = Number(featureLimit);
    const resolvedFeatureLimit = Math.min(
      Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : FEATURE_DETAILS_LIMIT,
      FEATURE_DETAILS_LIMIT
    );

    const featureTypeParam = (featureType && featureType !== 'null') ? featureType : 'ALL';
    const featureClassParam = (featureClass && featureClass !== 'null') ? featureClass : 'ALL';
    const searchTermParam = typeof searchTerm === 'string' ? searchTerm.trim().toLowerCase() : '';
    const tagKeyParam = typeof tagKey === 'string' ? tagKey.trim() : '';
    const includeAreasParam = includeAreas === undefined ? false : String(includeAreas).toLowerCase() === 'true';

    const requestOptions = {
      query: featureDetailsQuery,
      params: {
        lat: Number(latitude),
        lng: Number(longitude),
        radiusMeters,
        featureType: featureTypeParam,
        featureClass: featureClassParam,
        featureLimit: resolvedFeatureLimit,
        onlyPoints,
        classificationKeys: CLASSIFICATION_KEYS,
        sampleTagKeys: SAMPLE_TAG_KEYS,
        searchTerm: searchTermParam,
        tagKey: tagKeyParam,
        includeAreas: includeAreasParam,
      },
    };

    console.debug('[Planet Features] Detail query params', requestOptions.params);

    const [rows] = await myBigQuery.query(requestOptions);

    const features = rows.map((row) => ({
      osmId: row.osm_id,
      featureType: row.feature_type,
      featureClass: row.feature_class,
      geometryType: row.geometry_type,
      lon: Number(row.lon),
      lat: Number(row.lat),
      name: row.name || null,
      focusedTags: row.focused_tags || [],
      extraTags: row.extra_tags || [],
    }));

    return res.json({
      success: true,
      data: {
        features,
        query: {
          latitude: lat,
          longitude: lng,
          radiusMiles,
          featureType: featureType || null,
          featureClass: featureClass || null,
          onlyPoints,
          limit: resolvedFeatureLimit,
          returnedCount: features.length,
          executedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error("❌ Planet features detail error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch planet feature details",
      details: error.message
    });
  }
});

export default router;

