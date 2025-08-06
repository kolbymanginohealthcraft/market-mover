import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { marked } from 'marked';
import Button from './Buttons/Button';
import styles from './RichTextEditor.module.css';

// Use standard StarterKit
const AlphabeticalList = StarterKit;

const RichTextEditor = ({ 
  content, 
  onContentChange, 
  placeholder = "Start typing your content...",
  readOnly = false 
}) => {
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [lastContentRef, setLastContentRef] = useState('');
  const [selectionUpdate, setSelectionUpdate] = useState(0);

  const debounceTimeoutRef = useRef(null);

  // Update isEditing when readOnly prop changes
  useEffect(() => {
    setIsEditing(!readOnly);
  }, [readOnly]);

  const debouncedContentChange = useCallback((newContent) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      // Only call onContentChange if the content has actually changed
      if (newContent !== lastContentRef) {
        onContentChange(newContent);
      }
    }, 300); // Increased debounce time to prevent rapid updates
  }, [onContentChange, lastContentRef]);

  const editor = useEditor({
    extensions: [
      AlphabeticalList,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'link',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      if (!readOnly) {
        const markdown = editorToMarkdown(editor);
        if (markdown !== lastContentRef) {
          setLastContentRef(markdown);
          debouncedContentChange(markdown);
        }
      }
    },
    onSelectionUpdate: () => {
      // Force re-render when selection changes
      setSelectionUpdate(prev => prev + 1);
    },
    onFocus: () => {
      // Update active state when editor gains focus
      setSelectionUpdate(prev => prev + 1);
    },
    onKeyDown: ({ event }) => {
      // Disable tab key to prevent nested lists
      if (event.key === 'Tab') {
        console.log('Tab key pressed - preventing nested lists');
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      
      // Handle backspace when text is selected (including lists)
      if (event.key === 'Backspace' && editor.state.selection.empty === false) {
        console.log('Backspace with selection detected - clearing selection');
        // Force clear the selection by replacing with empty content
        const { from, to } = editor.state.selection;
        editor.commands.deleteRange({ from, to });
        event.preventDefault();
        return;
      }
      
      // Handle backspace at the beginning of a list item
      if (event.key === 'Backspace' && editor.state.selection.empty) {
        const { from } = editor.state.selection;
        const $from = editor.state.doc.resolve(from);
        
        // Check if we're at the beginning of a list item
        if ($from.parent.type.name === 'listItem' && from === $from.start()) {
          console.log('Backspace at beginning of list item - converting to paragraph');
          // Convert list item to paragraph instead of deleting
          editor.commands.liftListItem('listItem');
          event.preventDefault();
          return;
        }
        
        // Check if we're at the end of a list item with no content
        if ($from.parent.type.name === 'listItem' && from === $from.end()) {
          const listItemContent = $from.parent.textContent.trim();
          if (listItemContent === '') {
            console.log('Backspace at end of empty list item - deleting item');
            // Delete the empty list item
            editor.commands.deleteNode('listItem');
            event.preventDefault();
            return;
          }
        }
      }
      
      // Handle Ctrl+A + Backspace to clear content
      if (event.key === 'Backspace' && event.ctrlKey) {
        console.log('Ctrl+Backspace detected - clearing content');
        editor.commands.clearContent();
        setLastContentRef('');
        debouncedContentChange('');
        event.preventDefault();
      }
    },
  });

  // Update editor editable state when isEditing changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  // Convert markdown to editor content - DISABLED TO PREVENT LOOP
  // useEffect(() => {
  //   if (editor && content !== lastContentRef) {
  //     const currentEditorContent = editorToMarkdown(editor);
  //     if (content !== currentEditorContent) {
  //       if (!content || content.trim() === '') {
  //         console.log('Clearing editor content');
  //         editor.commands.clearContent();
  //       } else {
  //         const html = markdownToHtml(content);
  //         editor.commands.setContent(html);
  //       }
  //       setLastContentRef(content);
  //     }
  //   }
  // }, [content, editor, lastContentRef]);

  // Initialize content when editor is first created - SIMPLIFIED
  useEffect(() => {
    if (editor && content && !lastContentRef) {
      const html = markdownToHtml(content);
      editor.commands.setContent(html);
      setLastContentRef(content);
    }
  }, [editor, content, lastContentRef]);



  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const editorToMarkdown = (editor) => {
    // Simple, reliable conversion without complex processing
    let markdown = '';
    const doc = editor.state.doc;

    // Check if editor is essentially empty
    if (doc.textContent.trim() === '') {
      return '';
    }

    const processNode = (node, depth = 0) => {
      if (node.type.name === 'paragraph') {
        const text = node.textContent;
        if (text && text.trim()) {
          markdown += text + '\n\n';
        }
      } else if (node.type.name === 'heading') {
        const level = node.attrs.level;
        const text = node.textContent;
        if (text && text.trim()) {
          const hashes = '#'.repeat(level);
          markdown += `${hashes} ${text}\n\n`;
        }
      } else if (node.type.name === 'bulletList') {
        let hasContent = false;
        node.forEach((item, index) => {
          if (item.type.name === 'listItem') {
            const text = item.textContent;
            if (text && text.trim()) {
              markdown += `- ${text}\n`;
              hasContent = true;
            }
          }
        });
        if (hasContent) {
          markdown += '\n';
        }
      } else if (node.type.name === 'orderedList') {
        let hasContent = false;
        node.forEach((item, index) => {
          if (item.type.name === 'listItem') {
            const indent = '  '.repeat(depth);
            const text = item.textContent;
            if (text && text.trim()) {
              markdown += `${indent}${index + 1}. ${text}\n`;
              hasContent = true;
            }
            
            // Process nested content within the list item
            item.forEach((child) => {
              if (child.type.name === 'bulletList' || child.type.name === 'orderedList') {
                processNode(child, depth + 1);
              }
            });
          }
        });
        if (hasContent) {
          markdown += '\n';
        }
      } else if (node.type.name === 'horizontalRule') {
        markdown += '---\n\n';
      }
    };

    // Process only the top-level nodes to avoid duplication
    doc.forEach((node) => {
      processNode(node);
    });

    return markdown.trim();
  };

  const markdownToHtml = (markdown) => {
    // Simple, reliable conversion without regex
    if (!markdown || markdown.trim() === '') {
      return '';
    }
    
    // Use marked library with minimal processing
    try {
      return marked.parse(markdown, {
        breaks: false,
        gfm: false,
        headerIds: false,
        mangle: false,
        sanitize: false
      });
    } catch (error) {
      console.error('Error parsing markdown:', error);
      // If parsing fails, just return the raw text
      return markdown;
    }
  };

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleHeading = (level) => editor?.chain().focus().toggleHeading({ level }).run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };
  const addHorizontalRule = () => editor?.chain().focus().setHorizontalRule().run();

  // Helper function to get comprehensive active state info
  const getActiveStateInfo = () => {
    if (!editor) return {};
    
    const { from, to } = editor.state.selection;
    const $from = editor.state.doc.resolve(from);
    const $to = editor.state.doc.resolve(to);
    
    // Check for marks (bold, italic, etc.)
    const marks = editor.isActive('bold') ? ['bold'] : [];
    if (editor.isActive('italic')) marks.push('italic');
    
    // Check for nodes (headings, lists, etc.)
    const nodes = [];
    if (editor.isActive('heading', { level: 1 })) nodes.push('h1');
    if (editor.isActive('heading', { level: 2 })) nodes.push('h2');
    if (editor.isActive('heading', { level: 3 })) nodes.push('h3');
    if (editor.isActive('bulletList')) nodes.push('ul');
    if (editor.isActive('orderedList')) nodes.push('ol');
    
    return { marks, nodes, $from, $to };
  };

  // Enhanced active state detection
  const isHeadingActive = (level) => {
    if (!editor) return false;
    return editor.isActive('heading', { level });
  };

  const isListActive = (type) => {
    if (!editor) return false;
    return editor.isActive(type);
  };

  // Check if cursor is inside a list item that contains a heading
  const isInListWithHeading = () => {
    if (!editor) return false;
    
    const { from } = editor.state.selection;
    const $pos = editor.state.doc.resolve(from);
    
    // Walk up the node tree to find list and heading nodes
    let depth = $pos.depth;
    let foundList = false;
    let foundHeading = false;
    
    while (depth > 0) {
      const node = $pos.node(depth);
      if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
        foundList = true;
      }
      if (node.type.name === 'heading') {
        foundHeading = true;
      }
      depth--;
    }
    
    return foundList && foundHeading;
  };

  // Enhanced detection for combined states
  const getCombinedActiveStates = () => {
    if (!editor) return {};
    
    // Force recalculation when selection changes
    const _ = selectionUpdate;
    
    const { from } = editor.state.selection;
    const $pos = editor.state.doc.resolve(from);
    
    // Get all parent nodes
    const parentNodes = [];
    for (let depth = $pos.depth; depth > 0; depth--) {
      const node = $pos.node(depth);
      parentNodes.push({
        type: node.type.name,
        attrs: node.attrs,
        depth: depth
      });
    }
    
    // Check for marks at current position
    const marks = $pos.marks().map(mark => mark.type.name);
    
    // Check for current node
    const currentNode = $pos.parent;
    
    // Check for specific list types
    const orderedListNode = parentNodes.find(n => n.type === 'orderedList');
    const isAlphabeticalList = orderedListNode && orderedListNode.attrs.class === 'alphabetical-list';
    const isRegularOrderedList = orderedListNode && orderedListNode.attrs.class !== 'alphabetical-list';
    
    const states = {
      bold: marks.includes('bold'),
      italic: marks.includes('italic'),
      h1: currentNode.type.name === 'heading' && currentNode.attrs.level === 1,
      h2: currentNode.type.name === 'heading' && currentNode.attrs.level === 2,
      h3: currentNode.type.name === 'heading' && currentNode.attrs.level === 3,
      bulletList: parentNodes.some(n => n.type === 'bulletList'),
      orderedList: isRegularOrderedList,
      alphabeticalList: isAlphabeticalList,
      listItem: parentNodes.some(n => n.type === 'listItem'),
      paragraph: currentNode.type.name === 'paragraph',
      parentNodes: parentNodes.map(n => n.type),
      currentNode: currentNode.type.name,
      marks: marks
    };
    
    return states;
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className={styles.editorContainer}>
      {!readOnly && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.toolbarGroup}>
              <Button
                onClick={toggleBold}
                variant={getCombinedActiveStates().bold ? 'blue' : 'gray'}
                size="sm"
              >
                B
              </Button>
              <Button
                onClick={toggleItalic}
                variant={getCombinedActiveStates().italic ? 'blue' : 'gray'}
                size="sm"
              >
                I
              </Button>
            </div>

            <div className={styles.toolbarGroup}>
              <Button
                onClick={() => toggleHeading(1)}
                variant={getCombinedActiveStates().h1 ? 'blue' : 'gray'}
                size="sm"
              >
                H1
              </Button>
              <Button
                onClick={() => toggleHeading(2)}
                variant={getCombinedActiveStates().h2 ? 'blue' : 'gray'}
                size="sm"
              >
                H2
              </Button>
              <Button
                onClick={() => toggleHeading(3)}
                variant={getCombinedActiveStates().h3 ? 'blue' : 'gray'}
                size="sm"
              >
                H3
              </Button>
            </div>

            <div className={styles.toolbarGroup}>
              <Button
                onClick={toggleBulletList}
                variant={getCombinedActiveStates().bulletList ? 'blue' : 'gray'}
                size="sm"
              >
                • List
              </Button>
              <Button
                onClick={toggleOrderedList}
                variant={getCombinedActiveStates().orderedList ? 'blue' : 'gray'}
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
          </div>
        </>
      )}

      <div className={styles.editorContent}>
        <EditorContent editor={editor} />
      </div>

      {readOnly && (
        <div className={styles.readOnlyNotice}>
          <small>Read-only mode</small>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor; 