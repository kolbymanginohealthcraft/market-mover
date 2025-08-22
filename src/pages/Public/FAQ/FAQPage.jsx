import React, { useState, useMemo } from 'react';
import classNames from 'classnames';
import styles from './FAQPage.module.css';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ControlsRow from '../../../components/Layouts/ControlsRow';
import SearchInput from '../../../components/Buttons/SearchInput';
import faqSections from './faqData';

const FAQPage = () => {
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (sectionIndex, itemIndex) => {
    const key = `${sectionIndex}-${itemIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Function to highlight search terms in text
  const highlightText = (text, query) => {
    if (!query.trim()) {
      return text;
    }

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className={styles.highlight}>{part}</mark>
      ) : (
        part
      )
    );
  };

  // Filter FAQ sections and items based on search query
  const filteredFaqSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqSections;
    }

    const query = searchQuery.toLowerCase();
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
  }, [searchQuery]);

  const totalResults = useMemo(() => {
    return filteredFaqSections.reduce((total, section) => total + section.items.length, 0);
  }, [filteredFaqSections]);

  return (
    <div className={styles.page}>
      {/* Controls Row with Search */}
      <ControlsRow>
        <SearchInput
          placeholder="Search FAQ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
                    <div key={itemIndex} className={styles.faqItem}>
                      <button
                        className={styles.faqQuestion}
                        onClick={() => toggleItem(sectionIndex, itemIndex)}
                      >
                        <span className={styles.questionText}>
                          {highlightText(faq.question, searchQuery)}
                        </span>
                        <span className={styles.chevron}>
                          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                      </button>
                      <div className={classNames(styles.faqAnswer, {
                        [styles.open]: isOpen
                      })}>
                        <p>{highlightText(faq.answer, searchQuery)}</p>
                      </div>
                    </div>
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
