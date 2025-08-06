# Legal Content Management

## Overview

Legal documents (Terms & Conditions, Privacy Policy, Refund Policy) are now stored as Markdown files in `src/data/legal/` and rendered using React Markdown.

## File Structure

```
src/data/legal/
├── terms-and-conditions.md
├── privacy-policy.md
└── refund-policy.md
```

## How It Works

1. **Content Storage**: Legal documents are stored as Markdown files in `src/data/legal/`
2. **Content Loading**: The `src/utils/legalContent.js` utility loads markdown content using Vite's `?raw` import
3. **Rendering**: The `src/components/LegalContent.jsx` component renders markdown with React Markdown
4. **Styling**: Uses existing CSS from `TermsAndConditions.module.css`

## Benefits

- **Easy Updates**: Non-technical team members can edit markdown files
- **Rich Formatting**: Supports headers, lists, links, bold, italic, etc.
- **Version Control**: Track changes to legal documents
- **Consistent Styling**: Maintains existing visual design
- **PDF Export**: Existing PDF export functionality still works

## Updating Content

To update legal content:

1. Edit the appropriate `.md` file in `src/data/legal/`
2. Use standard Markdown syntax:
   - `#` for main headings
   - `##` for section headings
   - `###` for subsection headings
   - `-` or `*` for bullet lists
   - `**text**` for bold
   - `*text*` for italic
   - `[link text](url)` for links

## Markdown Features Supported

- Headers (H1, H2, H3)
- Paragraphs
- Bullet and numbered lists
- Links (internal and external)
- Bold and italic text
- Horizontal rules
- Line breaks

## Technical Details

- Uses `react-markdown` for rendering
- Uses `remark-gfm` for GitHub Flavored Markdown support
- Content is cached in memory for performance
- Fallback content is provided if files fail to load
- Maintains existing styling and PDF export functionality

## Migration Notes

The old hardcoded JSX content has been replaced with this dynamic system. All existing functionality (PDF export, styling, navigation) remains unchanged. 