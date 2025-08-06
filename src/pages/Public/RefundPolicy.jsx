// src/pages/public/RefundPolicy.jsx
import React, { useState, useEffect } from 'react';
import LegalContent from '../../components/LegalContent';
import { getLegalContent } from '../../utils/legalContent';

const RefundPolicy = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const legalContent = await getLegalContent('refund');
        setContent(legalContent);
      } catch (error) {
        console.error('Error loading refund content:', error);
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

export default RefundPolicy;
