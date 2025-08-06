// src/components/Overlays/LegalPanel.jsx

import React, { useEffect, useState } from "react";
import LegalFullScreenModal from "./LegalFullScreenModal";

const LegalPanel = ({ isOpen, onClose, initialTab = "terms" }) => {
  const [tab, setTab] = useState(initialTab);

  // Reset tab if initialTab changes while open
  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [initialTab, isOpen]);

  return (
    <LegalFullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      initialTab={tab}
    />
  );
};

export default LegalPanel;
