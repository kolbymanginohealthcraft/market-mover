/**
 * Centralized tag color utility for consistent tag styling across the application
 */

// Standard tag colors used throughout the application
export const TAG_COLORS = {
  me: '#265947',        // Green from palette
  partner: '#3599b8',   // Blue from palette
  competitor: '#d64550', // Red from palette
  target: '#f1b62c',    // Gold from palette
  default: '#00c08b'    // Primary teal (untagged/default) - matches header icon color
};

// Standard tag labels
export const TAG_LABELS = {
  me: 'Me',
  partner: 'Partner',
  competitor: 'Competitor',
  target: 'Target',
  default: 'Untagged'
};

/**
 * Get the color for a specific tag type
 * @param {string} tagType - The tag type (me, partner, competitor, target)
 * @returns {string} The hex color code
 */
export const getTagColor = (tagType) => {
  return TAG_COLORS[tagType] || TAG_COLORS.default;
};

/**
 * Get the display label for a specific tag type
 * @param {string} tagType - The tag type (me, partner, competitor, target)
 * @returns {string} The display label
 */
export const getTagLabel = (tagType) => {
  return TAG_LABELS[tagType] || TAG_LABELS.default;
};

/**
 * Get all available tag types
 * @returns {Array} Array of tag type strings
 */
export const getTagTypes = () => {
  return Object.keys(TAG_COLORS).filter(key => key !== 'default');
};

/**
 * Get tag colors as an array (useful for charts and other visualizations)
 * @returns {Array} Array of hex color codes
 */
export const getTagColorArray = () => {
  return Object.values(TAG_COLORS);
};

/**
 * Get tag colors for Mapbox/MapLibre expressions
 * @returns {Array} Array formatted for Mapbox case expressions
 */
export const getMapboxTagColors = () => {
  return [
    'case',
    ['==', ['get', 'tag'], 'me'], TAG_COLORS.me,
    ['==', ['get', 'tag'], 'partner'], TAG_COLORS.partner,
    ['==', ['get', 'tag'], 'competitor'], TAG_COLORS.competitor,
    ['==', ['get', 'tag'], 'target'], TAG_COLORS.target,
    TAG_COLORS.default
  ];
};

/**
 * Get tag colors for Mapbox/MapLibre expressions with custom property name
 * @param {string} propertyName - The property name to check (e.g., 'primaryTag', 'tag')
 * @returns {Array} Array formatted for Mapbox case expressions
 */
export const getMapboxTagColorsWithProperty = (propertyName = 'tag') => {
  return [
    'case',
    ['==', ['get', propertyName], 'me'], TAG_COLORS.me,
    ['==', ['get', propertyName], 'partner'], TAG_COLORS.partner,
    ['==', ['get', propertyName], 'competitor'], TAG_COLORS.competitor,
    ['==', ['get', propertyName], 'target'], TAG_COLORS.target,
    TAG_COLORS.default
  ];
};
