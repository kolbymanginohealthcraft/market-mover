import React, { useState } from 'react';
import classNames from 'classnames';
import styles from './FAQPage.module.css';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Button from '../../../components/Buttons/Button';
import LegalPanel from '../../../components/Overlays/LegalPanel';
import faqSections from './faqData';

const FAQPage = () => {
  const [openItems, setOpenItems] = useState({});
  const [showLegalPanel, setShowLegalPanel] = useState(false);

  const toggleItem = (sectionIndex, itemIndex) => {
    const key = `${sectionIndex}-${itemIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className={styles.page}>
      {/* Hero Banner Section */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>Frequently Asked Questions</h1>
            <p className={styles.heroSubtitle}>
              Find answers to common questions about Market Mover<sup>®</sup> and how we help healthcare organizations make smarter decisions.
            </p>
          </div>
          <div className={styles.heroActions}>
            <Button
              variant="blue"
              size="md"
              banner={true}
              bannerVariant="default"
              onClick={() => setShowLegalPanel(true)}
            >
              Legal Info
            </Button>
            <Button
              variant="blue"
              size="md"
              banner={true}
              bannerVariant="default"
              onClick={() => (window.location.href = 'mailto:info@healthcraftcreative.com')}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ Content - 3 Column Layout */}
      <div className={styles.faqContent}>
        <div className={styles.faqGrid}>
          {faqSections.map((section, sectionIndex) => (
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
                        <span className={styles.questionText}>{faq.question}</span>
                        <span className={styles.chevron}>
                          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                      </button>
                      <div className={classNames(styles.faqAnswer, {
                        [styles.open]: isOpen
                      })}>
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <LegalPanel isOpen={showLegalPanel} onClose={() => setShowLegalPanel(false)} />
    </div>
  );
};

export default FAQPage;
