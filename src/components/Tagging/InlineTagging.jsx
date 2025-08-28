import React, { useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import styles from './InlineTagging.module.css';

export const InlineTagging = ({
  providerId,
  hasTeam,
  teamLoading = false,
  taggingProviderId,
  dropdownPosition,
  primaryTag,
  isSaving,
  onOpenDropdown,
  onCloseDropdown,
  onAddTag,
  onRemoveTag,
  className = ''
}) => {
  const isOpen = taggingProviderId === providerId;
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCloseDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCloseDropdown]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        onCloseDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onCloseDropdown]);

  // Calculate dropdown position (upward if low on page)
  const getDropdownStyle = () => {
    if (!isOpen) return {};
    
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return {};

    const viewportHeight = window.innerHeight;
    const dropdownHeight = 140; // Increased height to accommodate remove option
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Position upward if not enough space below
    const shouldPositionUpward = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
    
    return {
      position: 'fixed',
      top: shouldPositionUpward ? `${rect.top - dropdownHeight}px` : `${rect.bottom}px`,
      left: `${rect.left}px`,
      zIndex: 9999
    };
  };

  const handleButtonClick = (e) => {
    if (isOpen) {
      onCloseDropdown();
    } else {
      onOpenDropdown(providerId, e);
    }
  };

  // Function to capitalize the first letter of tag text
  const formatTagText = (tag) => {
    if (!tag) return '';
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  };

  return (
    <div className={`${styles.taggingContainer} ${className}`}>
      {isOpen && (
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={getDropdownStyle()}
        >
          <button
            className={styles.tagButton}
            onClick={() => onAddTag(providerId, 'me')}
            disabled={isSaving}
          >
            Me
          </button>
          <button
            className={styles.tagButton}
            onClick={() => onAddTag(providerId, 'partner')}
            disabled={isSaving}
          >
            Partner
          </button>
          <button
            className={styles.tagButton}
            onClick={() => onAddTag(providerId, 'competitor')}
            disabled={isSaving}
          >
            Competitor
          </button>
          <button
            className={styles.tagButton}
            onClick={() => onAddTag(providerId, 'target')}
            disabled={isSaving}
          >
            Target
          </button>
          {primaryTag && (
            <button
              className={`${styles.tagButton} ${styles.removeButton}`}
              onClick={() => {
                onRemoveTag(providerId, primaryTag);
                onCloseDropdown();
              }}
              disabled={isSaving}
            >
              Remove
            </button>
          )}
        </div>
      )}
      <div className={styles.tagDisplay}>
        {primaryTag ? (
          <span
            className={`${styles.tagBadge} ${
              primaryTag === 'me' ? styles.meBadge :
              primaryTag === 'partner' ? styles.partnerBadge :
              primaryTag === 'competitor' ? styles.competitorBadge :
              primaryTag === 'target' ? styles.targetBadge :
              styles.tagDefault
            } ${isSaving ? styles.animatePulse : ''}`}
            onClick={handleButtonClick}
          >
            {formatTagText(primaryTag)}
          </span>
        ) : (
          <button
            ref={buttonRef}
            className={styles.tagButton}
            onClick={handleButtonClick}
            disabled={!hasTeam || teamLoading}
            title={!hasTeam && !teamLoading ? "Join or create a team to tag providers" : teamLoading ? "Loading..." : ""}
          >
            {teamLoading ? "..." : "Tag"}
            {!hasTeam && !teamLoading && <Lock size={10} style={{ marginLeft: '4px' }} />}
          </button>
        )}
      </div>
    </div>
  );
};
