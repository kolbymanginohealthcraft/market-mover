import React from 'react';
import styles from './Banner.module.css';
import Button from './Button';

export default function Banner({
  title,
  subtitle,
  gradient = "blue", // "blue", "green", or custom gradients
  cards = [],
  buttons = [],
  className = "",
  activeCard = null,
  buttonsUnderText = false,
  statusIndicators = [],
  quickStats = [],
  searchBar = null,
  progressBar = null
}) {
  const getGradientClass = () => {
    switch (gradient) {
      case "blue":
        return styles.blueGradient;
      case "green":
        return styles.greenGradient;
      case "gray":
        return styles.grayGradient;
      default:
        return styles.blueGradient; // fallback
    }
  };

  return (
    <div className={`${styles.banner} ${getGradientClass()} ${className}`}>
      <div className={styles.bannerContent}>
        <div className={styles.textSection}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          
          {buttonsUnderText && (buttons.length > 0 || searchBar) && (
            <div className={styles.buttonsUnderText}>
              {searchBar && (
                <div className={styles.searchUnderText}>
                  <input
                    type="text"
                    placeholder={searchBar.placeholder || "Search..."}
                    className={styles.searchInputUnderText}
                    value={searchBar.value || ""}
                    onChange={searchBar.onChange}
                    onKeyPress={searchBar.onKeyPress}
                    ref={searchBar.inputRef}
                  />
                </div>
              )}
              {buttons.map((button, index) => (
                <button
                  key={index}
                  className={`${styles.buttonUnderText} ${button.variant ? styles[button.variant] : ''}`}
                  onClick={button.onClick}
                  disabled={button.disabled}
                >
                  {button.icon && <span className={styles.buttonIcon}>{button.icon}</span>}
                  {button.text}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {cards.length > 0 && (
          <div className={styles.cardsSection}>
            {cards.map((card, index) => (
              <div 
                key={index} 
                className={`${styles.card} ${activeCard === card.label ? styles.active : ''}`} 
                onClick={card.onClick}
              >
                <span className={styles.cardValue}>
                  {typeof card.value === 'number' && card.value >= 1000 
                    ? card.value.toLocaleString() 
                    : card.value}
                </span>
                <span className={styles.cardLabel}>{card.label}</span>
              </div>
            ))}
          </div>
        )}

        {statusIndicators.length > 0 && (
          <div className={styles.statusSection}>
            {statusIndicators.map((indicator, index) => (
              <div key={index} className={styles.statusIndicator}>
                <span className={styles.statusDot} style={{ backgroundColor: indicator.color }}></span>
                <span className={styles.statusText}>{indicator.text}</span>
              </div>
            ))}
          </div>
        )}

        {quickStats.length > 0 && (
          <div className={styles.statsSection}>
            {quickStats.map((stat, index) => (
              <div key={index} className={styles.quickStat}>
                <span className={styles.statValue}>
                  {typeof stat.value === 'number' && stat.value >= 1000 
                    ? stat.value.toLocaleString() 
                    : stat.value}
                </span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {searchBar && !buttonsUnderText && (
          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder={searchBar.placeholder || "Search..."}
              className={styles.searchInput}
              value={searchBar.value || ""}
              onChange={searchBar.onChange}
              onKeyPress={searchBar.onKeyPress}
              ref={searchBar.inputRef}
            />
            {searchBar.filters && (
              <div className={styles.filterChips}>
                {searchBar.filters.map((filter, index) => (
                  <span key={index} className={styles.filterChip}>
                    {filter}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {progressBar && (
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progressBar.percentage}%` }}
              ></div>
            </div>
            <span className={styles.progressText}>{progressBar.text}</span>
          </div>
        )}
        
        {!buttonsUnderText && buttons.length > 0 && (
          <div className={styles.buttonsSection}>
                          {buttons.map((button, index) => {
                // Check if this button should be grouped with the next one
                const isGrouped = button.group && buttons[index + 1] && buttons[index + 1].group === button.group;
                const isInGroup = index > 0 && buttons[index - 1] && buttons[index - 1].group === button.group;
                
                if (isInGroup) {
                  return null; // Skip this button as it will be rendered in the group
                }
                
                if (isGrouped) {
                  // Render a button group
                  const groupButtons = buttons.slice(index).filter(b => b.group === button.group);
                  return (
                    <div key={`group-${index}`} style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                      {groupButtons.map((groupButton, groupIndex) => (
                        <Button
                          key={`${index}-${groupIndex}`}
                          banner={true}
                          bannerVariant={groupButton.variant || 'default'}
                          size={groupButton.size || 'sm'}
                          onClick={groupButton.onClick}
                          disabled={groupButton.disabled}
                        >
                          {groupButton.icon && <span>{groupButton.icon}</span>}
                          {groupButton.text}
                        </Button>
                      ))}
                    </div>
                  );
                }
                
                return (
                  <Button
                    key={index}
                    banner={true}
                    bannerVariant={button.variant || 'default'}
                    size={button.size || 'md'}
                    onClick={button.onClick}
                    disabled={button.disabled}
                  >
                    {button.icon && <span>{button.icon}</span>}
                    {button.text}
                  </Button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
} 