import React from 'react';
import classNames from 'classnames';
import styles from './Button.module.css';

/**
 * Custom Button component
 * 
 * Props:
 * - variant: "primary" | "gold" | "accent"
 * - className: optional additional classes
 * - ...rest: any other button props (onClick, type, disabled, etc.)
 */
export default function Button({ variant = 'primary', className, children, ...rest }) {
  const buttonClass = classNames(
    styles.button,
    styles[variant],
    className
  );

  return (
    <button className={buttonClass} {...rest}>
      {children}
    </button>
  );
}
