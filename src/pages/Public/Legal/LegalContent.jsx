import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import styles from './TermsAndConditions.module.css';

const LegalContent = ({ content, className }) => {
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
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default LegalContent; 