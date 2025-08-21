import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const Dropdown = ({ 
  trigger, 
  children, 
  isOpen, 
  onToggle, 
  className = '',
  style = {}
}) => {
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const estimatedDropdownHeight = 200;
        
        // Check if dropdown should go up instead of down
        const shouldGoUp = triggerRect.bottom + estimatedDropdownHeight > viewportHeight;
        
        // Calculate position relative to viewport
        let top, left;
        
        if (shouldGoUp) {
          top = triggerRect.top - estimatedDropdownHeight;
        } else {
          top = triggerRect.bottom;
        }
        
        left = triggerRect.left;
        
        // Ensure dropdown doesn't go off-screen
        if (shouldGoUp && top < 10) {
          top = 10;
        } else if (!shouldGoUp && top + estimatedDropdownHeight > viewportHeight) {
          top = viewportHeight - estimatedDropdownHeight - 10;
        }
        
        setDropdownStyle({
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          zIndex: 9999,
          ...style
        });
      };

      // Position after a small delay to ensure the portal is rendered
      setTimeout(updatePosition, 10);
      
      // Update position on scroll and resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, style]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        onToggle(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onToggle(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onToggle]);

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    onToggle(!isOpen);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div ref={triggerRef} onClick={handleTriggerClick}>
        {trigger}
      </div>
      
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className={className}
          style={dropdownStyle}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dropdown;
