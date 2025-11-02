import { useState, useRef, useEffect } from 'react';
import styles from './TaxonomyTooltip.module.css';

export default function TaxonomyTooltip({ 
  code, 
  grouping, 
  classification, 
  specialization,
  definition,
  notes,
  children 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldOpenUp, setShouldOpenUp] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const estimatedTooltipHeight = 200;

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
            {grouping && <span className={styles.groupingBadge}>{grouping}</span>}
          </div>
          
          <div className={styles.tooltipClassification}>
            {classification || 'No classification available'}
          </div>
          
          {specialization && (
            <div className={styles.tooltipSpecialization}>
              {specialization}
            </div>
          )}
          
          {definition && (
            <div className={styles.tooltipDefinition}>
              {definition}
            </div>
          )}
          
          {notes && (
            <div className={styles.tooltipNotes}>
              {notes}
            </div>
          )}
        </div>
      )}
    </span>
  );
}

