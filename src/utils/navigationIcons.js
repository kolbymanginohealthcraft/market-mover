import { Building2, FileSpreadsheet, PieChart } from 'lucide-react';

export const NAVIGATION_ICON_MAP = Object.freeze({
  claims: FileSpreadsheet,
  enrollment: PieChart,
  provider: Building2,
  searchOrganizations: Building2
});

export const NAVIGATION_ICON_DEFAULT_PROPS = Object.freeze({
  size: 16,
  strokeWidth: 1.6,
  focusable: 'false',
  'aria-hidden': true
});

export const getNavigationIcon = (key) =>
  NAVIGATION_ICON_MAP[key] || null;

export const getNavigationIconProps = (overrides = {}) => ({
  ...NAVIGATION_ICON_DEFAULT_PROPS,
  ...overrides
});

