import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ProviderCard.module.css';

export const ProviderCard = ({
  provider,
  isSelected,
  onSelect,
  onCheckboxChange
}) => {
  const handleCardClick = () => {
    onSelect(provider);
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onCheckboxChange(provider.dhc, !isSelected);
  };

  return (
    <div 
      className={`${styles.providerCard} ${isSelected ? styles.selected : ''}`}
      onClick={handleCardClick}
    >
      <div className={styles.cardHeader}>
        <div className={styles.checkboxContainer}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxClick}
            className={styles.checkbox}
          />
        </div>
        
        <div className={styles.providerInfo}>
          <h4 className={styles.providerName}>{provider.name}</h4>
          <p className={styles.providerType}>{provider.type || 'Provider'}</p>
          <p className={styles.providerLocation}>
            {provider.city}, {provider.state}
          </p>
        </div>

        <div className={styles.cardActions}>
          <Link
            to={`/app/provider/${provider.dhc}/overview`}
            className={styles.viewDetailsButton}
            onClick={(e) => e.stopPropagation()}
          >
            View Details
          </Link>
        </div>
      </div>

      <div className={styles.cardDetails}>
        {provider.network && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Network:</span>
            <span className={styles.detailValue}>{provider.network}</span>
          </div>
        )}
        
        {provider.ccn && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>CCN:</span>
            <span className={styles.detailValue}>{provider.ccn}</span>
          </div>
        )}

        {provider.npi && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>NPI:</span>
            <span className={styles.detailValue}>{provider.npi}</span>
          </div>
        )}
      </div>

      {provider.latitude && provider.longitude && (
        <div className={styles.locationInfo}>
          <span className={styles.locationIcon}>📍</span>
          <span className={styles.locationText}>
            {provider.latitude.toFixed(4)}, {provider.longitude.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}; 