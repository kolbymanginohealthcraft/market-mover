import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Lock, ChevronDown } from 'lucide-react';
import { getTagColor, getTagLabel } from '../../utils/tagColors';
import styles from './ProviderTagBadge.module.css';

const ProviderTagBadgeComponent = ({
  providerId,
  hasTeam,
  teamLoading = false,
  primaryTag,
  isSaving = false,
  onAddTag,
  onRemoveTag,
  className = '',
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'default', // 'default', 'compact', 'inline'
  showRemoveOption = true,
  disabled = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [shouldOpenUp, setShouldOpenUp] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0, bottom: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const badgeRef = useRef(null);

  // Check if dropdown should open upward when it opens and calculate position
  useEffect(() => {
    if (isDropdownOpen) {
      const triggerElement = primaryTag ? badgeRef.current : buttonRef.current;
      if (triggerElement) {
        const triggerRect = triggerElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const estimatedDropdownHeight = 200;

        // Check if there's enough space below
        const hasSpaceBelow = triggerRect.bottom + estimatedDropdownHeight < viewportHeight;
        setShouldOpenUp(!hasSpaceBelow);
        
        // Calculate fixed position coordinates
        setDropdownPosition({
          left: triggerRect.left,
          top: triggerRect.bottom + 4,
          bottom: window.innerHeight - triggerRect.top + 4
        });
      }
    }
  }, [isDropdownOpen, primaryTag]);

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isDropdownOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen) {
        const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
        const clickedInsideButton = buttonRef.current && buttonRef.current.contains(event.target);
        const clickedInsideBadge = badgeRef.current && badgeRef.current.contains(event.target);
        
        // Close if click is outside all trigger elements and dropdown
        if (!clickedInsideDropdown && !clickedInsideButton && !clickedInsideBadge) {
          setIsDropdownOpen(false);
        }
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleButtonClick = useCallback((e) => {
    if (disabled || !hasTeam || teamLoading) return;
    
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  }, [disabled, hasTeam, teamLoading, isDropdownOpen]);

  const handleTagAction = useCallback(async (action, tagType) => {
    if (action === 'add') {
      await onAddTag(providerId, tagType);
    } else if (action === 'remove') {
      await onRemoveTag(providerId, primaryTag);
    }
    setIsDropdownOpen(false);
  }, [onAddTag, onRemoveTag, providerId, primaryTag]);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return styles.sizeSmall;
      case 'large':
        return styles.sizeLarge;
      default:
        return styles.sizeMedium;
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return styles.variantCompact;
      case 'inline':
        return styles.variantInline;
      default:
        return styles.variantDefault;
    }
  };

  // Get constrained icon size based on badge size
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 10;
      case 'large':
        return 14;
      default:
        return 12;
    }
  };

  const iconSize = getIconSize();

  if (!hasTeam && !teamLoading) {
    return (
      <div className={`${styles.taggingContainer} ${className}`}>
        <button
          className={`${styles.tagButton} ${styles.disabled} ${getSizeClasses()} ${getVariantClasses()}`}
          disabled
          title="Join or create a team to tag providers"
        >
          <Lock className={styles.icon} />
          Tag
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.taggingContainer} ${className}`} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Dropdown Menu - Rendered via Portal to escape container clipping */}
      {isDropdownOpen && createPortal(
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={{
            position: 'fixed',
            left: dropdownPosition.left,
            zIndex: 10001,
            // Intelligent positioning: down by default, up when needed
            top: shouldOpenUp ? 'auto' : dropdownPosition.top,
            bottom: shouldOpenUp ? dropdownPosition.bottom : 'auto'
          }}
        >
          <button
            className={styles.dropdownItem}
            onClick={() => handleTagAction('add', 'me')}
            disabled={isSaving}
          >
            <span className={styles.tagColorDot} style={{ backgroundColor: getTagColor('me') }}></span>
            {getTagLabel('me')}
          </button>
          <button
            className={styles.dropdownItem}
            onClick={() => handleTagAction('add', 'partner')}
            disabled={isSaving}
          >
            <span className={styles.tagColorDot} style={{ backgroundColor: getTagColor('partner') }}></span>
            {getTagLabel('partner')}
          </button>
          <button
            className={styles.dropdownItem}
            onClick={() => handleTagAction('add', 'competitor')}
            disabled={isSaving}
          >
            <span className={styles.tagColorDot} style={{ backgroundColor: getTagColor('competitor') }}></span>
            {getTagLabel('competitor')}
          </button>
          <button
            className={styles.dropdownItem}
            onClick={() => handleTagAction('add', 'target')}
            disabled={isSaving}
          >
            <span className={styles.tagColorDot} style={{ backgroundColor: getTagColor('target') }}></span>
            {getTagLabel('target')}
          </button>
          
          {showRemoveOption && primaryTag && (
            <>
              <div className={styles.dropdownDivider}></div>
              <button
                className={`${styles.dropdownItem} ${styles.removeOption}`}
                onClick={() => handleTagAction('remove')}
                disabled={isSaving}
              >
                Remove Tag
              </button>
            </>
          )}
        </div>,
        document.body
      )}

      {/* Tag Display */}
      <div className={styles.tagDisplay}>
        {primaryTag ? (
          // Show existing tag
          <span
            ref={badgeRef}
            className={`${styles.tagBadge} ${getSizeClasses()} ${getVariantClasses()} ${
              isSaving ? styles.saving : ''
            } ${isDropdownOpen ? 'dropdown-trigger-open' : ''}`}
            style={{
              backgroundColor: getTagColor(primaryTag),
              color: 'white'
            }}
            onClick={handleButtonClick}
            title="Click to change tag"
          >
            {getTagLabel(primaryTag)}
            <ChevronDown className={styles.chevron} />
          </span>
        ) : (
          // Show tag button
          <button
            ref={buttonRef}
            className={`${styles.tagButton} ${getSizeClasses()} ${getVariantClasses()} ${
              isDropdownOpen ? 'dropdown-trigger-open' : ''}`}
            onClick={handleButtonClick}
            disabled={teamLoading || disabled}
            title={teamLoading ? "Loading..." : "Click to add tag"}
          >
            {teamLoading ? "..." : "Tag"}
            <ChevronDown className={styles.chevron} />
          </button>
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ProviderTagBadge = memo(ProviderTagBadgeComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.providerId === nextProps.providerId &&
    prevProps.hasTeam === nextProps.hasTeam &&
    prevProps.teamLoading === nextProps.teamLoading &&
    prevProps.primaryTag === nextProps.primaryTag &&
    prevProps.isSaving === nextProps.isSaving &&
    prevProps.size === nextProps.size &&
    prevProps.variant === nextProps.variant &&
    prevProps.showRemoveOption === nextProps.showRemoveOption &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.className === nextProps.className
  );
});
