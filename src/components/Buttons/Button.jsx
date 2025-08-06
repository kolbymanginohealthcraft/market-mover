import React from 'react';
import PropTypes from 'prop-types';
import './buttons.css';

/**
 * Flexible Button component with color, size, and style modifiers.
 *
 * Props:
 * - variant: "green" | "gold" | "accent" | "red" | "teal" | "blue" | "aqua" | "gray"
 * - size: "sm" | "md" | "lg"
 * - isFilter: boolean (uses filter style)
 * - isActive: boolean (applies to active filter buttons)
 * - outline: boolean (outline button)
 * - ghost: boolean (ghost button)
 * - darkBg: boolean (dark background variant)
 * - banner: boolean (banner button style)
 * - bannerVariant: "default" | "active" | "primary" (for banner buttons)
 * - className: additional custom class names
 * - ...rest: other native button props
 */
export default function Button({
  variant = 'green',
  size = 'md',
  isFilter = false,
  isActive = false,
  outline = false,
  ghost = false,
  darkBg = false,
  banner = false,
  bannerVariant = 'default',
  className = '',
  children,
  ...rest
}) {
  const classList = [];

  // Base button style
  if (banner) {
    classList.push('banner-button', bannerVariant);
  } else if (isFilter) {
    classList.push('filter-button');
  } else {
    classList.push('button');
  }

  // Dark background modifier
  if (darkBg) classList.push('dark-bg');

  // Style modifiers (only for non-banner buttons)
  if (!banner && !isFilter && outline) {
    classList.push('button-outline', variant);
  } else if (!banner && !isFilter && ghost) {
    classList.push('button-ghost', variant);
  } else if (!banner && !isFilter) {
    classList.push(variant);
  }

  // Size modifiers
  if (size === 'sm') classList.push('button-sm');
  if (size === 'lg') classList.push('button-lg');

  // Filter active state
  if (isFilter && isActive) classList.push('active');

  // Custom className prop
  if (className) classList.push(className);

  return (
    <button className={classList.join(' ')} {...rest}>
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf([
    'green', 'gold', 'accent', 'red', 'teal', 'blue', 'aqua', 'gray'
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  isFilter: PropTypes.bool,
  isActive: PropTypes.bool,
  outline: PropTypes.bool,
  ghost: PropTypes.bool,
  darkBg: PropTypes.bool,
  banner: PropTypes.bool,
  bannerVariant: PropTypes.oneOf(['default', 'active', 'primary']),
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};
