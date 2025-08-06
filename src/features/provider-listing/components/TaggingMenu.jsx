import React from 'react';
import styles from './TaggingMenu.module.css';

export const TaggingMenu = ({ providerDhc, onTag, onCancel }) => {
  return (
    <div className={styles.inlineTaggingMenu}>
      <label>
        <input
          type="radio"
          name={`tag-${providerDhc}`}
          onClick={() => onTag(providerDhc, "partner")}
        />
        Partner
      </label>
      <label>
        <input
          type="radio"
          name={`tag-${providerDhc}`}
          onClick={() => onTag(providerDhc, "competitor")}
        />
        Competitor
      </label>
      <button onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}; 