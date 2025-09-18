import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import classNames from 'classnames';
import styles from './FAQPage.module.css';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ControlsRow from '../../../components/Layouts/ControlsRow';
import faqSections from './faqData';
import { Search } from 'lucide-react';

// Lazy-loaded section component
const FAQSection = React.memo(({ section, sectionIndex, filteredFaqSections, openItems, toggleItem, debouncedSearchQuery, highlightRegex }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className={styles.section}>
      <h2 className={styles.sectionTitle}>{section.title}</h2>
      <div className={styles.faqList}>
        {isVisible && section.items.map((faq, itemIndex) => {
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
              highlightRegex={highlightRegex}
            />
          );
        })}
      </div>
    </div>
  );
});

FAQSection.displayName = 'FAQSection';

// Memoized FAQ item component to prevent unnecessary re-renders
const FAQItem = React.memo(({ faq, isOpen, onToggle, searchQuery, sectionIndex, itemIndex, highlightRegex }) => {
  // Memoize highlighted text to prevent recalculation
  const highlightedQuestion = useMemo(() => {
    if (!searchQuery.trim()) {
      return faq.question;
    }
    const parts = faq.question.split(highlightRegex);
    return parts.map((part, index) => 
      highlightRegex.test(part) ? (
        <mark key={index} className={styles.highlight}>{part}</mark>
      ) : (
        part
      )
    );
  }, [faq.question, searchQuery, highlightRegex]);

  const highlightedAnswer = useMemo(() => {
    if (!searchQuery.trim()) {
      return faq.answer;
    }
    return faq.answer.replace(highlightRegex, `<mark class="${styles.highlight}">$1</mark>`);
  }, [faq.answer, searchQuery, highlightRegex]);

  return (
    <div className={styles.faqItem}>
      <button
        className={classNames(styles.faqQuestion, {
          [styles.expanded]: isOpen
        })}
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

  // Create regex once for highlighting to avoid recreation on every render
  const highlightRegex = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return null;
    return new RegExp(`(${debouncedSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  }, [debouncedSearchQuery]);

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
    const result = [];
    
    for (const section of faqSections) {
      const filteredItems = [];
      
      for (const item of section.items) {
        if (item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)) {
          filteredItems.push(item);
        }
      }
      
      if (filteredItems.length > 0) {
        result.push({
          ...section,
          items: filteredItems
        });
      }
    }
    
    return result;
  }, [debouncedSearchQuery]);

  // Auto-expand matching FAQ items when searching (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!debouncedSearchQuery.trim()) {
        // Clear all open items when search is cleared
        setOpenItems({});
        return;
      }

      const newOpenItems = {};
      
      // Use filtered sections to ensure consistent indexing
      filteredFaqSections.forEach((section, sectionIndex) => {
        section.items.forEach((item, itemIndex) => {
          // Since we're using filtered sections, all items here match the search
          const key = `${sectionIndex}-${itemIndex}`;
          newOpenItems[key] = true;
        });
      });

      setOpenItems(newOpenItems);
    }, 50); // Small delay to prevent excessive updates

    return () => clearTimeout(timeoutId);
  }, [debouncedSearchQuery, filteredFaqSections]);

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
            <FAQSection
              key={sectionIndex}
              section={section}
              sectionIndex={sectionIndex}
              filteredFaqSections={filteredFaqSections}
              openItems={openItems}
              toggleItem={toggleItem}
              debouncedSearchQuery={debouncedSearchQuery}
              highlightRegex={highlightRegex}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
