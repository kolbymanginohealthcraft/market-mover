import React from 'react';
import LegalPage from '../../Public/Legal/LegalPage';

const LegalTab = () => {
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
      <LegalPage />
    </div>
  );
};

export default LegalTab;
