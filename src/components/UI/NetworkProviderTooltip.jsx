import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getTagColor, getTagLabel } from '../../utils/tagColors';
import { sanitizeProviderName } from '../../utils/providerName';
import styles from './NetworkProviderTooltip.module.css';

export default function NetworkProviderTooltip({ 
  zipCode,
  providersByTag, // Object mapping tag types to arrays of providers
  children 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return;
        
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const tooltipWidth = 300;
        // Estimate height based on number of tags and providers
        const tagCount = providersByTag ? Object.keys(providersByTag).length : 0;
        const totalProviders = providersByTag ? Object.values(providersByTag).reduce((sum, arr) => sum + arr.length, 0) : 0;
        const tooltipHeight = Math.min(400, 100 + (tagCount * 30) + (totalProviders * 35)); // Dynamic height estimation
        const padding = 10;

        // Calculate horizontal position
        const triggerCenterX = triggerRect.left + triggerRect.width / 2;
        const tooltipHalfWidth = tooltipWidth / 2;
        
        let left;
        
        // Check if centered tooltip would overflow left
        if (triggerCenterX - tooltipHalfWidth < padding) {
          // Position to the right of trigger
          left = triggerRect.right + padding;
        }
        // Check if centered tooltip would overflow right
        else if (triggerCenterX + tooltipHalfWidth > viewportWidth - padding) {
          // Position to the left of trigger
          left = triggerRect.left - tooltipWidth - padding;
        }
        // Center it
        else {
          left = triggerCenterX - tooltipHalfWidth;
        }

        // Ensure tooltip stays within viewport bounds
        left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));

        // Calculate vertical position - prefer staying close to trigger
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        const minSpaceNeeded = 100; // Minimum space needed to show tooltip
        
        let top;
        
        // If there's enough space below, position below trigger
        if (spaceBelow >= minSpaceNeeded) {
          top = triggerRect.bottom + padding;
        }
        // If there's enough space above, position above trigger
        else if (spaceAbove >= minSpaceNeeded) {
          top = triggerRect.top - tooltipHeight - padding;
        }
        // If neither side has enough space, position as close as possible
        else {
          // Prefer below if there's more space below, even if not ideal
          if (spaceBelow >= spaceAbove) {
            top = triggerRect.bottom + padding;
            // Clamp to viewport if it overflows
            if (top + tooltipHeight > viewportHeight - padding) {
              top = viewportHeight - tooltipHeight - padding;
            }
          } else {
            top = triggerRect.top - tooltipHeight - padding;
            // Clamp to viewport if it overflows
            if (top < padding) {
              top = padding;
            }
          }
        }

        setTooltipPosition({ top, left });
      };

      updatePosition();
      
      // Update on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  if (!providersByTag || Object.keys(providersByTag).length === 0) {
    return <span>{children}</span>;
  }

  const tooltipContent = isVisible ? (
    <div 
      className={styles.tooltip}
      style={{
        position: 'fixed',
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
        zIndex: 10000
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className={styles.tooltipHeader}>
        <span style={{ fontWeight: '600' }}>
          Network Providers
        </span>
        <span className={styles.tooltipZipCode}>ZIP: {zipCode}</span>
      </div>
      
      <div className={styles.tooltipProviders}>
        {Object.entries(providersByTag).map(([tag, providers]) => (
          <div key={tag} className={styles.tooltipTagSection}>
            <div 
              className={styles.tooltipTagHeader}
              style={{ color: getTagColor(tag) }}
            >
              {getTagLabel(tag)} ({providers.length})
            </div>
            {providers.map((provider, idx) => (
              <div key={idx} className={styles.tooltipProvider}>
                {sanitizeProviderName(provider.name) || provider.name}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <>
      <span 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={styles.triggerWrapper}
      >
        <span className={styles.trigger}>
          {children}
        </span>
      </span>
      
      {typeof document !== 'undefined' && tooltipContent
        ? createPortal(tooltipContent, document.body)
        : tooltipContent}
    </>
  );
}

