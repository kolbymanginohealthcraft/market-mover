import React from 'react';
import FAQPage from '../../Public/FAQ/FAQPage';

const FAQTab = () => {
  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      zIndex: 10,
      background: 'var(--white)'
    }}>
      <FAQPage />
    </div>
  );
};

export default FAQTab;
