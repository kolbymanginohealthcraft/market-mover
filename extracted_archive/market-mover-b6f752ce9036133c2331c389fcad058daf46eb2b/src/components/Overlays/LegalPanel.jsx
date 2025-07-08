// src/components/Overlays/LegalPanel.jsx

import React, { useEffect, useState, useRef } from "react";
import styles from "./SidePanel.module.css";
import Button from "../Buttons/Button";
import ButtonGroup from "../Buttons/ButtonGroup";
import TermsAndConditions from "../../pages/Public/TermsAndConditions";
import PrivacyPolicy from "../../pages/Public/PrivacyPolicy";
import RefundPolicy from "../../pages/Public/RefundPolicy";
import html2pdf from "html2pdf.js";
import { FaTimes } from "react-icons/fa";

const LegalPanel = ({ isOpen, onClose, initialTab = "terms" }) => {
  const [tab, setTab] = useState(initialTab);
  const contentRef = useRef();

  // Close panel on ESC key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  // Reset tab if initialTab changes while open
  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [initialTab, isOpen]);

  // Scroll to top on tab change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [tab]);

  const exportToPDF = () => {
    if (!contentRef.current) return;
    html2pdf()
      .from(contentRef.current)
      .set({
        margin: 0.5,
        filename: `${tab}-MarketMover.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      })
      .save();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>Legal Information</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <FaTimes />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "1rem",
            alignItems: "center",
          }}
        >
          <ButtonGroup
            options={["terms", "privacy", "refund"]}
            selected={tab}
            onSelect={setTab}
            size="sm"
            variant="blue"
          />
          <Button variant="blue" size="sm" onClick={exportToPDF}>
            Export PDF
          </Button>
        </div>

        <div className={styles.content} ref={contentRef}>
          {tab === "terms" && <TermsAndConditions />}
          {tab === "privacy" && <PrivacyPolicy />}
          {tab === "refund" && <RefundPolicy />}
        </div>
      </div>
    </>
  );
};

export default LegalPanel;
