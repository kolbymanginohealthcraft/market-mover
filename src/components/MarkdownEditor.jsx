import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import Button from './Buttons/Button';
import styles from './MarkdownEditor.module.css';

const MarkdownEditor = ({ 
  content = '', 
  onContentChange, 
  placeholder = "Start typing your markdown content...",
  readOnly = false 
}) => {
  const [text, setText] = useState(content);
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef(null);

  // Update content when prop changes
  useEffect(() => {
    if (content !== text) {
      setText(content);
    }
  }, [content]);

  // Debounced content change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (text !== content) {
        onContentChange(text);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [text, content, onContentChange]);

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const insertAtCursor = (insertText) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + insertText + after;
    
    setText(newText);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      const newPosition = start + insertText.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  // Formatting functions
  const makeBold = () => {
    const selected = getSelectedText();
    if (selected) {
      insertAtCursor(`**${selected}**`);
    } else {
      insertAtCursor('**bold text**');
    }
  };

  const makeItalic = () => {
    const selected = getSelectedText();
    if (selected) {
      insertAtCursor(`*${selected}*`);
    } else {
      insertAtCursor('*italic text*');
    }
  };

  const addHeading = (level) => {
    const hashes = '#'.repeat(level);
    const selected = getSelectedText();
    if (selected) {
      insertAtCursor(`${hashes} ${selected}`);
    } else {
      insertAtCursor(`${hashes} `);
    }
  };

  const addBulletList = () => {
    const selected = getSelectedText();
    if (selected) {
      const lines = selected.split('\n');
      const bulletedLines = lines.map(line => line.trim() ? `- ${line}` : line);
      insertAtCursor(bulletedLines.join('\n'));
    } else {
      insertAtCursor('- ');
    }
  };

  const addNumberedList = () => {
    const selected = getSelectedText();
    if (selected) {
      const lines = selected.split('\n');
      const numberedLines = lines.map((line, index) => 
        line.trim() ? `${index + 1}. ${line}` : line
      );
      insertAtCursor(numberedLines.join('\n'));
    } else {
      insertAtCursor('1. ');
    }
  };

  const addLink = () => {
    const selected = getSelectedText();
    const url = window.prompt('Enter URL:');
    if (url) {
      if (selected) {
        insertAtCursor(`[${selected}](${url})`);
      } else {
        insertAtCursor(`[link text](${url})`);
      }
    }
  };

  const addHorizontalRule = () => {
    insertAtCursor('\n---\n');
  };

  const getSelectedText = () => {
    const textarea = textareaRef.current;
    if (!textarea) return '';
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    return text.substring(start, end);
  };

  // Keyboard shortcuts
  const handleKeyDown = (e) => {
    if (readOnly) return;

    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      makeBold();
    }
    
    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      makeItalic();
    }

    // Tab for indentation (disabled to prevent issues)
    if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor('  ');
    }
  };

  return (
    <div className={styles.editorContainer}>
      {!readOnly && (
        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <Button
              onClick={makeBold}
              variant="gray"
              size="sm"
              title="Bold (Ctrl+B)"
            >
              B
            </Button>
            <Button
              onClick={makeItalic}
              variant="gray"
              size="sm"
              title="Italic (Ctrl+I)"
            >
              I
            </Button>
          </div>

          <div className={styles.toolbarGroup}>
            <Button
              onClick={() => addHeading(1)}
              variant="gray"
              size="sm"
            >
              H1
            </Button>
            <Button
              onClick={() => addHeading(2)}
              variant="gray"
              size="sm"
            >
              H2
            </Button>
            <Button
              onClick={() => addHeading(3)}
              variant="gray"
              size="sm"
            >
              H3
            </Button>
          </div>

          <div className={styles.toolbarGroup}>
            <Button
              onClick={addBulletList}
              variant="gray"
              size="sm"
            >
              • List
            </Button>
            <Button
              onClick={addNumberedList}
              variant="gray"
              size="sm"
            >
              1. List
            </Button>
          </div>

          <div className={styles.toolbarGroup}>
            <Button
              onClick={addLink}
              variant="gray"
              size="sm"
            >
              Link
            </Button>
            <Button
              onClick={addHorizontalRule}
              variant="gray"
              size="sm"
            >
              —
            </Button>
          </div>

          <div className={styles.toolbarGroup}>
            <Button
              onClick={() => setIsPreview(!isPreview)}
              variant={isPreview ? "blue" : "gray"}
              size="sm"
            >
              {isPreview ? "Edit" : "Preview"}
            </Button>
          </div>
        </div>
      )}

      <div className={styles.editorContent}>
        {isPreview ? (
          <div className={styles.preview}>
            <div 
              className={styles.previewContent}
              dangerouslySetInnerHTML={{ 
                __html: marked(text || '', { 
                  breaks: true, 
                  gfm: true 
                }) 
              }}
            />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            readOnly={readOnly}
            className={styles.textarea}
            spellCheck={true}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        )}
      </div>

      {readOnly && (
        <div className={styles.readOnlyNotice}>
          <small>Read-only mode</small>
        </div>
      )}

      <div className={styles.helpText}>
        <small>
          <strong>Markdown:</strong> **bold**, *italic*, # heading, - list, [link](url)
        </small>
      </div>
    </div>
  );
};

export default MarkdownEditor; 