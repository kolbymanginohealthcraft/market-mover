// src/pages/public/PrivacyPolicy.jsx
import React, { useState, useEffect } from 'react';
import LegalContent from './LegalContent';
import { getLegalContent } from '../../../utils/legalContent';

const PrivacyPolicy = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const legalContent = await getLegalContent('privacy');
        setContent(legalContent);
      } catch (error) {
        console.error('Error loading privacy content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <LegalContent content={content} />;
};

export default PrivacyPolicy;
