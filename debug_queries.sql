-- Quality Measures Debug Queries
-- Run these in BigQuery to understand the data structure

-- 1. Check what tables exist in the quality dataset
SELECT table_name 
FROM `market-mover-464517.quality.INFORMATION_SCHEMA.TABLES`
ORDER BY table_name;

-- 2. Check qm_dictionary structure and data
SELECT 
  code,
  name,
  label,
  sort_order,
  direction,
  source,
  metric_group,
  description,
  active,
  setting
FROM `market-mover-464517.quality.qm_dictionary`
WHERE active = true
ORDER BY sort_order
LIMIT 20;

-- 3. Check qm_post structure and data
SELECT 
  code,
  publish_date,
  start_date,
  end_date,
  national
FROM `market-mover-464517.quality.qm_post`
ORDER BY publish_date DESC
LIMIT 20;

-- 4. Check qm_provider structure and data
SELECT 
  ccn,
  code,
  score,
  percentile_column,
  publish_date
FROM `market-mover-464517.quality.qm_provider`
ORDER BY publish_date DESC
LIMIT 20;

-- 5. Get latest publish date for each setting
SELECT 
  d.setting,
  MAX(p.publish_date) as latest_date
FROM `market-mover-464517.quality.qm_dictionary` d
INNER JOIN `market-mover-464517.quality.qm_post` p ON d.code = p.code
WHERE d.active = true
GROUP BY d.setting
ORDER BY d.setting;

-- 6. Check what CCNs have data for each setting
SELECT 
  d.setting,
  COUNT(DISTINCT pr.ccn) as unique_ccns,
  COUNT(*) as total_records,
  MIN(pr.publish_date) as earliest_date,
  MAX(pr.publish_date) as latest_date
FROM `market-mover-464517.quality.qm_dictionary` d
INNER JOIN `market-mover-464517.quality.qm_provider` pr ON d.code = pr.code
WHERE d.active = true
GROUP BY d.setting
ORDER BY d.setting;

-- 7. Check specific CCNs for IRF data (replace with actual CCNs from your market)
SELECT 
  pr.ccn,
  d.setting,
  d.code,
  pr.score,
  pr.percentile_column,
  pr.publish_date
FROM `market-mover-464517.quality.qm_dictionary` d
INNER JOIN `market-mover-464517.quality.qm_provider` pr ON d.code = pr.code
WHERE d.active = true 
  AND d.setting = 'IRF'
  AND pr.publish_date = '2025-06-01'
  AND pr.ccn IN ('450890', '450891', '450853', '450885', '450840') -- Replace with your actual CCNs
ORDER BY pr.ccn, d.code;

-- 8. Check what measures exist for each setting
SELECT 
  setting,
  COUNT(*) as measure_count,
  STRING_AGG(code, ', ' ORDER BY code) as measure_codes
FROM `market-mover-464517.quality.qm_dictionary`
WHERE active = true
GROUP BY setting
ORDER BY setting;

-- 9. Check data availability for recent dates
SELECT 
  publish_date,
  COUNT(DISTINCT ccn) as unique_ccns,
  COUNT(DISTINCT code) as unique_measures,
  COUNT(*) as total_records
FROM `market-mover-464517.quality.qm_provider`
WHERE publish_date >= '2025-01-01'
GROUP BY publish_date
ORDER BY publish_date DESC;
