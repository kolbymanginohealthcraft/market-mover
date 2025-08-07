import React, { useEffect, useState, useRef } from "react";
import Button from "../../../../components/Buttons/Button";
import ButtonGroup from "../../../../components/Buttons/ButtonGroup";
import DynamicLegalContent from "./DynamicLegalContent";
import { getAllApprovedPolicies } from "../../../../utils/legalContent";
import { jsPDF } from "jspdf";
import styles from "./LegalFullScreenModal.module.css";

const LegalFullScreenModal = ({ isOpen, onClose, initialTab = "terms" }) => {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [contentRef, setContentRef] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load approved policies on mount
  useEffect(() => {
    const loadPolicies = async () => {
      try {
        setLoading(true);
        const approvedPolicies = await getAllApprovedPolicies();
        setPolicies(approvedPolicies);
        
        // Set initial selected policy
        if (approvedPolicies.length > 0) {
          const initialPolicy = approvedPolicies.find(p => p.slug === initialTab) || approvedPolicies[0];
          setSelectedPolicy(initialPolicy);
        }
      } catch (error) {
        console.error('Error loading policies:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadPolicies();
    }
  }, [isOpen, initialTab]);

  // Update selected policy when initialTab changes
  useEffect(() => {
    if (policies.length > 0) {
      const policy = policies.find(p => p.slug === initialTab) || policies[0];
      setSelectedPolicy(policy);
    }
  }, [initialTab, policies]);

  // Scroll to top on policy change
  useEffect(() => {
    if (contentRef) {
      contentRef.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [selectedPolicy, contentRef]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside modal
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const exportToPDF = () => {
    if (!contentRef || !selectedPolicy) return;

    // Create PDF document
    const pdf = new jsPDF('p', 'pt', 'letter');
    
    // Add Work Sans font (if available, otherwise fallback to helvetica)
    try {
      // Note: jsPDF has limited font support, so we'll use helvetica which is very similar to Work Sans
      // For true Work Sans support, we'd need to embed the font file
    } catch (error) {
      console.log('Using fallback font: helvetica');
    }
    
    // Set margins (in points)
    const margin = 72; // 1 inch = 72 points
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;
    
    // Helper function to add text with word wrapping
    const addWrappedText = (text, fontSize, isBold = false, maxWidth = contentWidth, indent = 0) => {
      // Use Work Sans font family (fallback to helvetica if not available)
      const font = isBold ? 'helvetica-bold' : 'helvetica';
      pdf.setFont(font);
      pdf.setFontSize(fontSize);
      
      const lines = pdf.splitTextToSize(text, maxWidth - indent);
      
      if (yPosition + (lines.length * fontSize * 1.2) > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.text(lines, margin + indent, yPosition);
      yPosition += lines.length * fontSize * 1.2;
      
      return lines.length;
    };
    
    // Add title banner with two-line layout
    // First line: Company name (left, largest font)
    const companyName = 'Healthcraft Market Mover';
    const effectiveDateText = selectedPolicy.effective_date 
      ? `Effective Date: ${new Date(selectedPolicy.effective_date).toLocaleDateString()}`
      : 'Effective Date: Not specified';
    
    // First line: Company name (largest font)
    pdf.setFont('helvetica-bold');
    pdf.setFontSize(18);
    pdf.text(companyName, margin, yPosition);
    
    yPosition += 20;
    
    // Second line: Policy name (left) and Effective date (right)
    pdf.setFont('helvetica-bold');
    pdf.setFontSize(14);
    pdf.text(selectedPolicy.full_name, margin, yPosition);
    
    // Add effective date on the right
    pdf.setFontSize(12);
    const effectiveDateWidth = pdf.getTextWidth(effectiveDateText);
    pdf.text(effectiveDateText, pageWidth - margin - effectiveDateWidth, yPosition);
    
    yPosition += 20;
    
    // Add a line separator
    pdf.setDrawColor(100, 100, 100);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 20;
    
    // Get the rendered HTML content from the DOM
    const renderedContent = contentRef.innerHTML;
    
    // Create a temporary div to parse the rendered HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderedContent;
    
    // Function to process HTML nodes recursively
    const processNode = (node, level = 0) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          addWrappedText(text, 10, false, contentWidth, level * 20);
        }
        return;
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      
      const tagName = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes);
      
      switch (tagName) {
        case 'h1':
          yPosition += 10;
          addWrappedText(node.textContent.trim(), 16, true);
          yPosition += 8;
          break;
          
        case 'h2':
          yPosition += 8;
          addWrappedText(node.textContent.trim(), 14, true);
          yPosition += 6;
          break;
          
        case 'h3':
          yPosition += 6;
          addWrappedText(node.textContent.trim(), 12, true);
          yPosition += 4;
          break;
          
        case 'p':
          children.forEach(child => processNode(child, level));
          yPosition += 5;
          break;
          
        case 'ul':
          children.forEach(child => processNode(child, level + 1));
          yPosition += 3;
          break;
          
        case 'ol':
          const listType = node.getAttribute('type');
          let counter = 1;
          children.forEach(child => {
            if (child.tagName && child.tagName.toLowerCase() === 'li') {
              let prefix = '';
              if (listType === 'a') {
                prefix = String.fromCharCode(96 + counter) + '. ';
              } else if (listType === 'i') {
                prefix = romanize(counter) + '. ';
              } else {
                prefix = counter + '. ';
              }
              addWrappedText(prefix + child.textContent.trim(), 10, false, contentWidth, (level + 1) * 20);
              counter++;
            } else {
              processNode(child, level + 1);
            }
          });
          yPosition += 3;
          break;
          
        case 'li':
          if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'ul') {
            addWrappedText('• ' + node.textContent.trim(), 10, false, contentWidth, (level + 1) * 20);
          } else {
            children.forEach(child => processNode(child, level));
          }
          break;
          
        case 'u':
          addWrappedText(node.textContent.trim(), 10, false, contentWidth, level * 20);
          break;
          
        case 'strong':
        case 'b':
          addWrappedText(node.textContent.trim(), 10, true, contentWidth, level * 20);
          break;
          
        case 'em':
        case 'i':
          addWrappedText(node.textContent.trim(), 10, false, contentWidth, level * 20);
          break;
          
        case 'hr':
          yPosition += 10;
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 10;
          break;
          
        case 'br':
          yPosition += 7;
          break;
          
        default:
          children.forEach(child => processNode(child, level));
          break;
      }
    };
    
    // Helper function to convert numbers to Roman numerals
    const romanize = (num) => {
      const romanNumerals = [
        { value: 50, numeral: 'L' },
        { value: 40, numeral: 'XL' },
        { value: 10, numeral: 'X' },
        { value: 9, numeral: 'IX' },
        { value: 5, numeral: 'V' },
        { value: 4, numeral: 'IV' },
        { value: 1, numeral: 'I' }
      ];
      
      let result = '';
      for (let i = 0; i < romanNumerals.length; i++) {
        while (num >= romanNumerals[i].value) {
          result += romanNumerals[i].numeral;
          num -= romanNumerals[i].value;
        }
      }
      return result;
    };
    
    // Process all child nodes
    Array.from(tempDiv.childNodes).forEach(child => processNode(child));
    
    // Add page numbers
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
    }
    
    // Save the PDF
    pdf.save(`${selectedPolicy.slug}-MarketMover.pdf`);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className={styles.overlay} onClick={handleOverlayClick}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h2 className={styles.title}>Legal Information</h2>
            <Button
              variant="gray"
              size="sm"
              onClick={onClose}
              className={styles.closeButton}
            >
              ✕
            </Button>
          </div>
          <div className={styles.content}>
            <div>Loading policies...</div>
          </div>
        </div>
      </div>
    );
  }

  const policyOptions = policies.map(policy => ({
    value: policy.slug,
    label: policy.nickname
  }));

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Legal Information</h2>
          <Button
            variant="gray"
            size="sm"
            onClick={onClose}
            className={styles.closeButton}
          >
            ✕
          </Button>
        </div>

        <div className={styles.tabsContainer}>
          <ButtonGroup
            options={policyOptions}
            selected={selectedPolicy?.slug}
            onSelect={(slug) => {
              const policy = policies.find(p => p.slug === slug);
              setSelectedPolicy(policy);
            }}
            size="sm"
            variant="blue"
          />
          <div className={styles.actions}>
            <Button variant="blue" size="sm" onClick={exportToPDF}>
              Export PDF
            </Button>
          </div>
        </div>

        <div 
          ref={setContentRef}
          className={styles.content}
        >
          {selectedPolicy && (
            <DynamicLegalContent policySlug={selectedPolicy.slug} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalFullScreenModal; 