# Legal Content Editor Guide

## Overview

The Legal Content Editor allows non-technical users to edit Terms & Conditions, Privacy Policy, and Refund Policy directly through a web interface. The content is stored as Markdown files and supports rich formatting.

## How to Access

1. **Navigate to Settings**: Go to `/app/settings`
2. **Click Platform Tab**: Select the "Platform" tab
3. **Click "Edit Legal Content"**: This opens the legal content editor

## Features

### 📝 Rich Text Editing
- **Headers**: Use `#` for main titles, `##` for sections, `###` for subsections
- **Lists**: Use `-` for bullet points, `1.` for numbered lists
- **Formatting**: Use `**bold**` and `*italic*` for emphasis
- **Links**: Use `[link text](url)` for links
- **Horizontal Rules**: Use `---` for section breaks

### 📁 File Import/Export
- **Import**: Upload `.md`, `.txt`, `.doc`, or `.docx` files
- **Export**: Download content as `.md` files
- **Preview**: View formatted content in a new window

### 🔄 Real-time Updates
- Changes are saved immediately to the server
- Content appears instantly on your legal pages
- No code deployment required

## Workflow for Non-Technical Users

### Option 1: Direct Web Editing (Recommended)
1. **Access the editor** through Settings → Platform → Edit Legal Content
2. **Select the document** you want to edit (Terms, Privacy, or Refund)
3. **Edit the content** using the text editor
4. **Use Markdown formatting** (see help panel on the right)
5. **Preview** your changes before saving
6. **Save** your changes

### Option 2: Import from Microsoft Word/Adobe
1. **Export your document** as plain text or Markdown
2. **Import the file** using the "Import File" button
3. **Review and edit** the imported content
4. **Save** your changes

### Option 3: Copy/Paste from External Documents
1. **Copy content** from your Word/Adobe document
2. **Paste into the editor**
3. **Add Markdown formatting** as needed
4. **Save** your changes

## Markdown Formatting Guide

### Headers
```markdown
# Main Title
## Section Heading
### Subsection Heading
```

### Lists
```markdown
- Bullet point 1
- Bullet point 2
- Bullet point 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3
```

### Formatting
```markdown
**Bold text**
*Italic text*
***Bold and italic***

[Link text](https://example.com)
```

### Special Elements
```markdown
---
Horizontal rule
---

> Blockquote
```

## File Compatibility

### Supported Import Formats
- **Markdown (.md)**: Best compatibility
- **Plain text (.txt)**: Good compatibility
- **Word documents (.doc/.docx)**: Basic compatibility
- **Adobe PDF**: Limited compatibility (text extraction)

### Export Format
- **Markdown (.md)**: Standard format for version control

## Technical Details

### Storage Location
- Files are stored in `src/data/legal/`
- `terms-policy.md`
- `privacy-policy.md`
- `refund-policy.md`

### API Endpoints
- `GET /api/admin/legal-content/:type` - Load content
- `PUT /api/admin/legal-content/:type` - Save content

### Security
- Admin authentication required
- File validation and sanitization
- Backup system recommended

## Best Practices

### Content Management
1. **Backup regularly**: Export files before major changes
2. **Version control**: Use descriptive commit messages
3. **Test changes**: Preview before publishing
4. **Collaborate**: Share exported files with legal team

### Formatting Tips
1. **Use clear headers**: Help users navigate the document
2. **Keep paragraphs short**: Improve readability
3. **Use lists**: Make information scannable
4. **Include links**: Reference related policies

### Legal Compliance
1. **Review regularly**: Update policies as needed
2. **Version tracking**: Keep track of policy versions
3. **Effective dates**: Include when policies take effect
4. **Contact information**: Ensure contact details are current

## Troubleshooting

### Common Issues
- **Content not saving**: Check internet connection
- **Formatting lost**: Ensure proper Markdown syntax
- **Import errors**: Try converting to plain text first
- **Preview not working**: Check browser popup settings

### Support
For technical issues, contact the development team.
For legal content questions, contact your legal team.

## Migration from Old System

The old hardcoded JSX content has been replaced with this dynamic system. All existing functionality (PDF export, styling, navigation) remains unchanged.

### Benefits of New System
- ✅ Non-technical users can edit content
- ✅ Rich formatting support
- ✅ File import/export capabilities
- ✅ Real-time preview
- ✅ Version control friendly
- ✅ No code deployment required
- ✅ Maintains existing styling and functionality 