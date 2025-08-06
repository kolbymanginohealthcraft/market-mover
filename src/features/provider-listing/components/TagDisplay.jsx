import React from 'react';
import styles from './TagDisplay.module.css';

export const TagDisplay = ({ tag, providerDhc, savingTagId, onTagClick, onUntag }) => {
  return (
    <div className={styles.tagContainer}>
      <span
        className={`${
          tag === "partner"
            ? styles.partnerBadge
            : tag === "competitor"
            ? styles.competitorBadge
            : styles.tagDefault
        } ${
          savingTagId === providerDhc ? styles.animatePulse : ""
        }`}
        onClick={onTagClick}
      >
        {tag || "Tag"}
      </span>
      {tag && (
        <button
          className={styles.untagButton}
          onClick={(e) => {
            e.stopPropagation();
            onUntag(providerDhc);
          }}
          title="Remove tag"
        >
          ✕
        </button>
      )}
    </div>
  );
}; 