import React, { useState, useEffect } from 'react';
import { getLegalContent } from '../utils/legalContent';
import LegalContent from './LegalContent';

const DynamicLegalContent = ({ policySlug }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const legalContent = await getLegalContent(policySlug);
        setContent(legalContent);
      } catch (error) {
        console.error('Error loading policy content:', error);
        setContent('# Content Not Available\n\nPlease contact support for assistance.');
      } finally {
        setLoading(false);
      }
    };

    if (policySlug) {
      loadContent();
    }
  }, [policySlug]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <LegalContent content={content} />;
};

export default DynamicLegalContent; 