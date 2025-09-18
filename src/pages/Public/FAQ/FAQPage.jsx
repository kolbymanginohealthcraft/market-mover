import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import classNames from 'classnames';
import styles from './FAQPage.module.css';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ControlsRow from '../../../components/Layouts/ControlsRow';
import faqSections from './faqData';
import { Search } from 'lucide-react'; // Added import for Search icon

// Memoized FAQ item component to prevent unnecessary re-renders
const FAQItem = React.memo(({ faq, isOpen, onToggle, searchQuery, sectionIndex, itemIndex }) => {
  // Memoize highlighted text to prevent recalculation
  const highlightedQuestion = useMemo(() => {
    if (!searchQuery.trim()) {
      return faq.question;
    }
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = faq.question.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className={styles.highlight}>{part}</mark>
      ) : (
        part
      )
    );
  }, [faq.question, searchQuery]);

  const highlightedAnswer = useMemo(() => {
    if (!searchQuery.trim()) {
      return faq.answer;
    }
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = faq.answer.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className={styles.highlight}>{part}</mark>
      ) : (
        part
      )
    );
  }, [faq.answer, searchQuery]);

  return (
    <div className={styles.faqItem}>
      <button
        className={styles.faqQuestion}
        onClick={() => onToggle(sectionIndex, itemIndex)}
      >
        <span className={styles.questionText}>
          {highlightedQuestion}
        </span>
        <span className={styles.chevron}>
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>
      <div className={classNames(styles.faqAnswer, {
        [styles.open]: isOpen
      })}>
        <p dangerouslySetInnerHTML={{ __html: highlightedAnswer }} />
      </div>
    </div>
  );
});

FAQItem.displayName = 'FAQItem';

const FAQPage = () => {
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const debounceTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Auto-focus search input on page load
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Debounce search to prevent excessive filtering
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const toggleItem = useCallback((sectionIndex, itemIndex) => {
    const key = `${sectionIndex}-${itemIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  // Filter FAQ sections and items based on search query
  const filteredFaqSections = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return faqSections;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return faqSections.map(section => {
      const filteredItems = section.items.filter(item =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
      );

      return filteredItems.length > 0 ? {
        ...section,
        items: filteredItems
      } : null;
    }).filter(Boolean);
  }, [debouncedSearchQuery]);

  const totalResults = useMemo(() => {
    return filteredFaqSections.reduce((total, section) => total + section.items.length, 0);
  }, [filteredFaqSections]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (searchQuery) {
        handleSearchClear();
      } else {
        e.target.blur();
      }
    }
  };

  return (
    <div className={styles.page}>
      {/* Controls Row with Search */}
      <ControlsRow>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search FAQ..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              className={styles.clearButton}
              onClick={handleSearchClear}
              type="button"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        {searchQuery && (
          <span className={styles.resultsCount}>
            {totalResults} result{totalResults !== 1 ? 's' : ''}
          </span>
        )}
      </ControlsRow>

      {/* FAQ Content - 3 Column Layout */}
      <div className={styles.faqContent}>
        <div className={styles.faqGrid}>
          {filteredFaqSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <div className={styles.faqList}>
                {section.items.map((faq, itemIndex) => {
                  const key = `${sectionIndex}-${itemIndex}`;
                  const isOpen = openItems[key];
                  
                  return (
                    <FAQItem
                      key={key}
                      faq={faq}
                      isOpen={isOpen}
                      onToggle={toggleItem}
                      searchQuery={debouncedSearchQuery}
                      sectionIndex={sectionIndex}
                      itemIndex={itemIndex}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
