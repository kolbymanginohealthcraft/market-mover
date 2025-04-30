import React from 'react';
import PropTypes from 'prop-types';

/**
 * Unified Button component
 * 
 * Props:
 * - variant: "primary" | "gold" | "accent" (only for regular buttons)
 * - isActive: true/false (only for filter-style buttons)
 * - isFilter: true/false (if true, uses filter-button class)
 * - className: extra classes
 */
export default function Button({
  variant = 'primary',
  isActive = false,
  isFilter = false,
  className = '',
  children,
  ...rest
}) {
  const baseClass = isFilter ? 'filter-button' : 'button';
  const classes = [
    baseClass,
    !isFilter && variant, // Apply variant only if not filter
    isFilter && isActive && 'active',
    className
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
  variant: PropTypes.string,
  isActive: PropTypes.bool,
  isFilter: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};
