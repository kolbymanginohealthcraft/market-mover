import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/buttons.css';

/**
 * Flexible Button component with color, size, style modifiers
 *
 * Props:
 * - variant: "green" | "gold" | "accent" | "red" | "teal" | "blue" | "aqua" | "gray"
 * - size: "sm" | "md" | "lg"
 * - isFilter: boolean (if true, uses filter style)
 * - isActive: boolean (used for active filter buttons)
 * - outline: boolean (applies outline style)
 * - ghost: boolean (applies ghost style)
 * - className: additional class names
 * - ...rest: native button props
 */
export default function Button({
  variant = 'green',
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
    isFilter && isActive && 'active',
    !isFilter && !outline && !ghost && variant,      // filled
    !isFilter && outline && 'button-outline',
    !isFilter && outline && variant,                // outline color
    !isFilter && ghost && 'button-ghost',
    !isFilter && ghost && variant,                  // ghost color
    size === 'sm' && 'button-sm',
    size === 'lg' && 'button-lg',
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
  variant: PropTypes.oneOf([
    'green', 'gold', 'accent', 'red', 'teal', 'blue', 'aqua', 'gray'
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  isFilter: PropTypes.bool,
  isActive: PropTypes.bool,
  outline: PropTypes.bool,
  ghost: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};
