import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/buttons.css';

/**
 * Unified and flexible Button component
 *
 * Props:
 * - variant: "primary" | "gold" | "accent" (applies color scheme)
 * - size: "sm" | "md" | "lg" (applies sizing)
 * - isFilter: boolean (filter-style layout and interaction)
 * - isActive: boolean (used with isFilter to highlight selected filter)
 * - outline: boolean (adds outline style)
 * - ghost: boolean (adds ghost style)
 * - className: string (optional additional classes)
 * - ...rest: all other native <button> props (onClick, type, etc.)
 */

export default function Button({
  variant = 'primary',
  size = 'md',
  isFilter = false,
  isActive = false,
  outline = false,
  ghost = false,
  className = '',
  children,
  ...rest
}) {
  const base = isFilter ? 'filter-button' : 'button';

  const classes = [
    base,
    !isFilter && variant,
    isFilter && isActive && 'active',
    size === 'sm' && 'button-sm',
    size === 'lg' && 'button-lg',
    outline && 'button-outline',
    ghost && 'button-ghost',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'gold', 'accent']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  isFilter: PropTypes.bool,
  isActive: PropTypes.bool,
  outline: PropTypes.bool,
  ghost: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};
