import {
  Activity,
  MapPin,
  Network,
  Pill,
  Stethoscope,
  Syringe,
  Users
} from 'lucide-react';

export const SEGMENTATION_WORKBENCH_ICON_MAP = Object.freeze({
  savedMarkets: MapPin,
  network: Network,
  procedures: Syringe,
  diagnoses: Stethoscope,
  taxonomies: Pill,
  metrics: Activity,
  population: Users
});

export const SEGMENTATION_ICON_DEFAULT_PROPS = Object.freeze({
  size: 16,
  strokeWidth: 1.6,
  focusable: 'false',
  'aria-hidden': true
});

export const getSegmentationIcon = (key) =>
  SEGMENTATION_WORKBENCH_ICON_MAP[key] || null;

export const getSegmentationIconProps = (overrides = {}) => ({
  ...SEGMENTATION_ICON_DEFAULT_PROPS,
  ...overrides
});

