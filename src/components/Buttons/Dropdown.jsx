import React, { useEffect, useRef, useState } from 'react';

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
  const [shouldOpenUp, setShouldOpenUp] = useState(false);

  // Check if dropdown should open upward when it opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const estimatedDropdownHeight = 200;
      
      // Check if there's enough space below
      const hasSpaceBelow = triggerRect.bottom + estimatedDropdownHeight < viewportHeight;
      setShouldOpenUp(!hasSpaceBelow);
    }
  }, [isOpen]);

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
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={className}
          style={{
            position: 'absolute',
            left: 0,
            zIndex: 9999,
            // Intelligent positioning: down by default, up when needed
            top: shouldOpenUp ? 'auto' : '110%',
            bottom: shouldOpenUp ? '110%' : 'auto',
            ...style
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
