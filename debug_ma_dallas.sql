-- Debug MA Enrollment Data for Dallas Area
-- Counties: Dallas (48113), Collin (48085), Rockwall (48397)

-- 1. Check what FIPS codes exist in MA tables
SELECT 
  'ma_enrollment' as table_name,
  COUNT(DISTINCT fips) as unique_fips_count,
  COUNT(*) as total_rows
FROM `market-mover-464517.payers.ma_enrollment`
WHERE fips IN ('48113', '48085', '48397')

UNION ALL

SELECT 
  'ma_penetration' as table_name,
  COUNT(DISTINCT fips) as unique_fips_count,
  COUNT(*) as total_rows
FROM `market-mover-464517.payers.ma_penetration`
WHERE fips IN ('48113', '48085', '48397')

UNION ALL

SELECT 
  'ma_plan' as table_name,
  COUNT(DISTINCT plan_id) as unique_fips_count,
  COUNT(*) as total_rows
FROM `market-mover-464517.payers.ma_plan`

UNION ALL

SELECT 
  'ma_contract' as table_name,
  COUNT(DISTINCT contract_id) as unique_fips_count,
  COUNT(*) as total_rows
FROM `market-mover-464517.payers.ma_contract`;

-- 2. Check sample FIPS codes in MA tables to see what areas are covered
SELECT 
  'ma_enrollment' as table_name,
  fips,
  COUNT(*) as row_count
FROM `market-mover-464517.payers.ma_enrollment`
GROUP BY fips
ORDER BY row_count DESC
LIMIT 20;

-- 3. Check if there's any data for Texas counties (48xxx)
SELECT 
  'ma_enrollment' as table_name,
  fips,
  COUNT(*) as row_count
FROM `market-mover-464517.payers.ma_enrollment`
WHERE fips LIKE '48%'
GROUP BY fips
ORDER BY fips;

-- 4. Check publish dates available for Dallas area
SELECT 
  publish_date,
  COUNT(*) as row_count
FROM `market-mover-464517.payers.ma_enrollment`
WHERE fips IN ('48113', '48085', '48397')
GROUP BY publish_date
ORDER BY publish_date DESC;

-- 5. Check if there's any data at all for the specific publish date we're using
SELECT 
  'ma_enrollment' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT fips) as unique_fips
FROM `market-mover-464517.payers.ma_enrollment`
WHERE publish_date = '2025-03-01'

UNION ALL

SELECT 
  'ma_penetration' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT fips) as unique_fips
FROM `market-mover-464517.payers.ma_penetration`
WHERE publish_date = '2025-03-01';

-- 6. Check what publish dates are available
SELECT 
  'ma_enrollment' as table_name,
  publish_date,
  COUNT(*) as row_count
FROM `market-mover-464517.payers.ma_enrollment`
GROUP BY publish_date
ORDER BY publish_date DESC
LIMIT 10

UNION ALL

SELECT 
  'ma_penetration' as table_name,
  publish_date,
  COUNT(*) as row_count
FROM `market-mover-464517.payers.ma_penetration`
GROUP BY publish_date
ORDER BY publish_date DESC
LIMIT 10;

-- 7. Check if there's any data for any Texas counties
SELECT 
  fips,
  COUNT(*) as row_count
FROM `market-mover-464517.payers.ma_enrollment`
WHERE fips LIKE '48%'
GROUP BY fips
ORDER BY fips; 