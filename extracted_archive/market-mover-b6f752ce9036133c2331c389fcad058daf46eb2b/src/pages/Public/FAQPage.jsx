import React, { useState } from 'react';
import classNames from 'classnames';
import styles from './FAQPage.module.css';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Button from '../../components/Buttons/Button';
import LegalPanel from '../../components/Overlays/LegalPanel';
import faqSections from './faqData';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [showLegalPanel, setShowLegalPanel] = useState(false);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  let globalIndex = 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Frequently Asked Questions</h1>

      {faqSections.map((section, sIdx) => (
        <div key={sIdx}>
          <h2 style={{ color: '#3599b8', marginTop: '32px', fontSize: '1.25rem' }}>
            {section.title}
          </h2>
          <div className={styles.faqList}>
            {section.items.map((faq, i) => {
              const currentIndex = globalIndex++;
              const isOpen = openIndex === currentIndex;
              return (
                <div
                  key={currentIndex}
                  className={classNames(styles.faqItem, {
                    [styles.faqItemOpen]: isOpen,
                  })}
                  onClick={() => toggleFAQ(currentIndex)}
                >
                  <h3 className={styles.question}>
                    {faq.question}
                    <span className={styles.icon}>
                      {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                  </h3>
                  <div className={styles.answerWrapper}>
                    <p className={styles.answer}>{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className={styles.ctaBox}>
  <p className={styles.ctaText}>Still have questions?</p>
  <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
    <Button
      variant="blue"
      size="sm"
      outline
      onClick={() => (window.location.href = 'mailto:info@healthcraftcreative.com')}
    >
      Contact Us
    </Button>
    <Button
      variant="blue"
      size="sm"
      outline
      onClick={() => setShowLegalPanel(true)}
    >
      Legal Info
    </Button>
  </div>
</div>


      <LegalPanel isOpen={showLegalPanel} onClose={() => setShowLegalPanel(false)} />
    </div>
  );
};

export default FAQPage;
