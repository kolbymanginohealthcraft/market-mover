import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/Buttons/Button';
import ButtonGroup from '../../../../components/Buttons/ButtonGroup';
import MarkdownEditor from '../../../../components/MarkdownEditor';
import styles from './LegalContentEditor.module.css';

const LegalContentEditor = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('terms');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const legalTypes = [
    { value: 'terms', label: 'Terms & Conditions' },
    { value: 'privacy', label: 'Privacy Policy' },
    { value: 'refund', label: 'Refund Policy' }
  ];

  useEffect(() => {
    loadContent();
  }, [selectedType]);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/legal-content/${selectedType}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      } else {
        setMessage('Failed to load content');
      }
    } catch (error) {
      setMessage('Error loading content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    
    try {
      const response = await fetch(`/api/admin/legal-content/${selectedType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setMessage('Content saved successfully!');
      } else {
        setMessage('Failed to save content');
      }
    } catch (error) {
      setMessage('Error saving content');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Preview - ${legalTypes.find(t => t.value === selectedType)?.label}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            h2 { color: #555; margin-top: 30px; }
            h3 { color: #666; }
            ul, ol { margin-left: 20px; }
            a { color: #007bff; }
            strong { font-weight: bold; }
            em { font-style: italic; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
  };

  const handleExport = () => {
    // Create a downloadable file
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedType}-policy.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target.result);
        setMessage('File imported successfully!');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button
          variant="gray"
          size="sm"
          onClick={() => navigate('/app/settings')}
          className={styles.backButton}
        >
          ← Back to Settings
        </Button>
        <h1>Legal Content Editor</h1>
      </div>

      <div className={styles.container}>
        <div className={styles.sidebar}>
          <h3>Select Document</h3>
          <ButtonGroup
            options={legalTypes.map(t => t.value)}
            selected={selectedType}
            onSelect={setSelectedType}
            size="sm"
            variant="blue"
          />

          <div className={styles.importExport}>
            <h3>Import/Export</h3>
            <div className={styles.fileActions}>
              <input
                type="file"
                accept=".md,.txt,.doc,.docx"
                onChange={handleImport}
                id="file-import"
                style={{ display: 'none' }}
              />
              <label htmlFor="file-import" className={styles.fileButton}>
                Import File
              </label>
              <Button
                onClick={handleExport}
                variant="gray"
                size="sm"
              >
                Export as .md
              </Button>
            </div>
          </div>

          <div className={styles.help}>
            <h3>Rich Text Editor</h3>
            <div className={styles.helpContent}>
              <p><strong>Formatting:</strong> Use the toolbar buttons above</p>
              <p><strong>Headers:</strong> Click H1, H2, or H3 buttons</p>
              <p><strong>Lists:</strong> Click • List or 1. List buttons</p>
              <p><strong>Links:</strong> Click Link button and enter URL</p>
              <p><strong>Nested Lists:</strong> Press Tab/Shift+Tab to indent</p>
            </div>
          </div>
        </div>

        <div className={styles.mainContent}>
          {isLoading ? (
            <div className={styles.loading}>Loading content...</div>
          ) : (
            <>
              <div className={styles.editorHeader}>
                <h2>{legalTypes.find(t => t.value === selectedType)?.label}</h2>
                <div className={styles.actions}>
                  <Button
                    onClick={handlePreview}
                    variant="gray"
                    size="sm"
                  >
                    Preview
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    variant="blue"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>

              <MarkdownEditor
                content={content}
                onContentChange={setContent}
                placeholder="Start typing your legal content..."
              />

              {message && (
                <div className={`${styles.message} ${
                  message.includes('success') ? styles.success : styles.error
                }`}>
                  {message}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalContentEditor; 