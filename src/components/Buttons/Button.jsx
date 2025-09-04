import React from 'react';
import PropTypes from 'prop-types';
import './new-button-styles.css';

/**
 * Flexible Button components with new modern styles.
 *
 * Props:
 * - variant: "green" | "gold" | "accent" | "red" | "teal" | "blue" | "aqua" | "gray"
 * - size: "sm" | "md" | "lg"
 * - isFilter: boolean (uses filter style)
 * - isActive: boolean (applies to active filter buttons)
 * - outline: boolean (outline button)
 * - ghost: boolean (ghost button)
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
    classList.push('filterButton');
    if (isActive) classList.push('filterButtonActive');
  } else {
    // Map old variants to new button classes
    switch (variant) {
      case 'glassmorphism':
        classList.push('glassmorphismButton');
        break;
      case 'blue':
        classList.push('primaryButton');
        break;
      case 'green':
        classList.push('successButton');
        break;
      case 'red':
        classList.push('dangerButton');
        break;
      case 'gray':
        classList.push('secondaryButton');
        break;
      case 'teal':
        classList.push('primaryButton');
        break;
      case 'accent':
        classList.push('primaryButton');
        break;
      case 'aqua':
        classList.push('primaryButton');
        break;
      case 'gold':
        classList.push('successButton');
        break;
      default:
        classList.push('primaryButton');
    }

    // Handle outline and ghost variants
    if (outline) {
      classList.push('secondaryButton');
    } else if (ghost) {
      classList.push('actionButton');
    }
  }

  // Size modifiers
  if (size === 'sm') classList.push('buttonSmall');
  if (size === 'lg') classList.push('buttonLarge');

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
    'glassmorphism', 'green', 'gold', 'accent', 'red', 'teal', 'blue', 'aqua', 'gray'
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  isFilter: PropTypes.bool,
  isActive: PropTypes.bool,
  outline: PropTypes.bool,
  ghost: PropTypes.bool,
  banner: PropTypes.bool,
  bannerVariant: PropTypes.oneOf(['default', 'active', 'primary']),
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};
