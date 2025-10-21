import { useState, useRef, useEffect } from 'react';
import styles from './ProcedureTooltip.module.css';

export default function ProcedureTooltip({ 
  code, 
  summary, 
  description, 
  category,
  serviceLine,
  subserviceLine,
  isSurgery,
  children 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldOpenUp, setShouldOpenUp] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  // Check if tooltip should open upward when it becomes visible (same logic as Dropdown)
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const estimatedTooltipHeight = 200;

      // Check if there's enough space below
      const hasSpaceBelow = triggerRect.bottom + estimatedTooltipHeight < viewportHeight;
      setShouldOpenUp(!hasSpaceBelow);
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <span 
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={styles.triggerWrapper}
    >
      <span className={styles.trigger}>
        {children}
      </span>
      
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={`${styles.tooltip} ${shouldOpenUp ? styles.tooltipUp : styles.tooltipDown}`}
        >
          <div className={styles.tooltipHeader}>
            <code className={styles.tooltipCode}>{code}</code>
            {isSurgery && <span className={styles.surgeryBadge}>Surgery</span>}
          </div>
          
          <div className={styles.tooltipSummary}>
            {summary || 'No summary available'}
          </div>
          
          {description && description !== summary && (
            <div className={styles.tooltipDescription}>
              {description}
            </div>
          )}
          
          <div className={styles.tooltipMeta}>
            {category && <span className={styles.metaItem}>{category}</span>}
            {serviceLine && <span className={styles.metaItem}>{serviceLine}</span>}
            {subserviceLine && <span className={styles.metaItem}>{subserviceLine}</span>}
          </div>
        </div>
      )}
    </span>
  );
}

