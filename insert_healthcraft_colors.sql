-- Insert Healthcraft color palette for team 65891f17-35cd-46c6-86b8-55b4161b6872
-- Using actual Healthcraft brand colors from button classes and CSS variables

INSERT INTO team_custom_colors (team_id, color_name, color_hex, color_order) VALUES
-- Primary brand colors (from CSS variables)
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Healthcraft Green', '#265947', 0),
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Healthcraft Gold', '#f1b62c', 1),
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Healthcraft Teal', '#26d9d8', 2),

-- Secondary brand colors
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Healthcraft Blue', '#3599b8', 3),
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Healthcraft Aqua', '#4ac5bb', 4),
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Healthcraft Accent', '#3fb985', 5),

-- Action colors
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Healthcraft Red', '#d64550', 6),
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Healthcraft Gray', '#5f6b6d', 7),

-- Light variants (for charts and data)
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Green Light', '#3d6f5b', 8),
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Gold Light', '#ffd85e', 9),
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Teal Light', '#4ee7e5', 10),
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Blue Light', '#2983a1', 11),

-- Dark variants (for emphasis)
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Green Dark', '#4f846e', 12),
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Gold Dark', '#e3a917', 13),
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Teal Dark', '#1abdbb', 14),
('65891f17-35cd-46c6-86b8-55b4161b6872', 'Blue Dark', '#226f8b', 15);

-- Verify the insertion
SELECT 
  color_name,
  color_hex,
  color_order
FROM team_custom_colors 
WHERE team_id = '65891f17-35cd-46c6-86b8-55b4161b6872'
ORDER BY color_order; 