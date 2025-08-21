import React, { createContext, useContext, useState } from 'react';

const ProviderContext = createContext();

export const useProviderContext = () => {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error('useProviderContext must be used within a ProviderContextProvider');
  }
  return context;
};

export const ProviderContextProvider = ({ children }) => {
  const [currentProvider, setCurrentProvider] = useState(null);

  const value = {
    currentProvider,
    setCurrentProvider,
  };

  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  );
};
