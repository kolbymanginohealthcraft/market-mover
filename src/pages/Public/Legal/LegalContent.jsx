import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import styles from './TermsAndConditions.module.css';

const LegalContent = ({ content, className }) => {
  // Sanitize content to fix malformed HTML attributes
  const sanitizeContent = (rawContent) => {
    if (!rawContent || typeof rawContent !== 'string') return rawContent;
    
    // Fix common malformed attributes like type"a" -> type="a"
    let sanitized = rawContent
      // Fix type"a" -> type="a" (missing equals sign)
      .replace(/type"([^"]*)"/g, 'type="$1"')
      // Fix other common malformed attributes with missing equals sign
      .replace(/(\w+)"([^"]*)"/g, (match, attr, value) => {
        // Only fix if it looks like a malformed attribute (no equals sign before quote)
        if (match.includes('"') && !match.includes('="')) {
          return `${attr}="${value}"`;
        }
        return match;
      })
      // Fix any remaining malformed attributes that might have spaces but no equals
      .replace(/(\w+)\s+"([^"]*)"/g, '$1="$2"');
    
    return sanitized;
  };

  const sanitizedContent = sanitizeContent(content);

  // Debug: Check for malformed attributes in content
  useEffect(() => {
    if (content && typeof content === 'string') {
      // Look for malformed attributes like type"a" (missing space or quote)
      const malformedPattern = /type"[^"]*"/g;
      const matches = content.match(malformedPattern);
      if (matches) {
        console.warn('Found malformed attributes in legal content:', matches);
        console.warn('Content snippet:', content.substring(0, 500));
      }
    }
  }, [content]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom styling for markdown elements
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          p: ({ children, ...props }) => <p {...props}>{children}</p>,
          ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
          ol: ({ children, ...props }) => <ol {...props}>{children}</ol>,
          li: ({ children, ...props }) => <li {...props}>{children}</li>,
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          u: ({ children, ...props }) => <u {...props}>{children}</u>,
          hr: () => <hr />,
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default LegalContent; 