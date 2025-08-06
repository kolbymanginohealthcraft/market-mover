# Policy Management System - User Guide

## Overview

The Policy Management System allows non-technical users to create, edit, and manage legal policies with full version control and approval workflows. This system is accessible through **Settings > Platform > Policy Management**.

## Key Features

### 🎯 **Create New Policies**
- Create entirely new policy types (e.g., "Trial Account Policy", "Data Usage Policy")
- Each policy gets a unique slug and can have multiple versions
- Policies are automatically organized and searchable

### 📝 **Edit Existing Policies**
- Create new versions of existing policies (Terms, Privacy, Refund)
- Clone approved versions to start editing
- Rich text editor with no markdown knowledge required
- Automatic version numbering

### ✅ **Approval Workflow**
- **Draft**: Create and edit content
- **Submit for Approval**: Send to admin for review
- **Approved**: Goes live automatically
- **Rejected**: Can be revised and resubmitted

## How to Use

### Accessing Policy Management

1. Go to **Settings** in your account
2. Click on **Platform** tab (requires admin access)
3. Click **Manage Policies** button

### Creating a New Policy

1. Click **+ New Policy** button
2. Fill in the form:
   - **Slug**: Unique identifier (e.g., "trials", "data-usage")
   - **Nickname**: Short name (e.g., "Trials", "Data Usage")
   - **Full Name**: Complete title (e.g., "Trial Account Policy")
   - **Description**: Brief description (optional)
3. Click **Create Policy**

### Creating a New Version

1. Select a policy from the list
2. Click **+ New Version** button
3. Choose options:
   - **Clone from existing version**: Start with content from an approved version
   - **Start from scratch**: Begin with empty content
4. Fill in optional fields:
   - **Title**: Version title (e.g., "Updated Terms for 2024")
   - **Summary**: Brief description of changes
   - **Effective Date**: When the policy takes effect
5. Click **Create & Edit**

### Using the Rich Text Editor

The editor provides a familiar word processor interface:

- **Bold** and *Italic* text
- **Headings** (H1, H2, H3)
- **Bullet lists**, numbered lists, and alphabetical lists (a, b, c)
- **Nested lists** with unlimited levels (use Tab/Shift+Tab to indent/outdent)
- **Links** to external websites
- **Text alignment** (left, center, right)
- **Horizontal rules** for section breaks

#### Working with Nested Lists

The editor supports complex nested list structures:

**Creating Nested Lists:**
1. Start a bullet, numbered, or alphabetical list
2. Press `Tab` to indent (create nested level)
3. Press `Shift+Tab` to outdent (move back up)
4. Use `Enter` to create new items at the same level

**List Types Available:**
- **• List**: Bullet points (•, ◦, ▪)
- **1. List**: Numbered lists (1, 2, 3)
- **a. List**: Alphabetical lists (a, b, c)

**Example Structure:**
```
• Section A
  • Subsection i
  • Subsection ii
  • Subsection iii
  • Subsection iv
• Section B
  • Subsection i
  • Subsection ii
  • Subsection iii
  • Subsection iv
```

**Visual Indicators:**
- Different bullet styles for each nesting level (disc, circle, square)
- Different numbering styles for ordered lists (1,2,3 → a,b,c → i,ii,iii)
- Visual indentation and border indicators

### Submitting for Approval

1. After editing your content, click **Save Version**
2. The version will appear in your **Drafts** tab
3. Click **Submit for Approval** to send to admin
4. The version moves to **Pending Approvals**

### Approving Versions (Admin Only)

1. Go to **Approvals** tab
2. Review pending versions
3. Click **Approve** or **Reject**
4. If rejecting, provide a reason

## Policy Types

### Standard Policies
- **Terms**: Terms and Conditions
- **Privacy**: Privacy Policy  
- **Refund**: Refund Policy

### Custom Policies
You can create any additional policies you need:
- Trial Account Policy
- Data Usage Policy
- Service Level Agreement
- Acceptable Use Policy
- etc.

## Best Practices

### Content Guidelines
- Use clear, simple language
- Include contact information
- Specify effective dates
- Keep versions organized with descriptive titles

### Workflow Tips
- Always clone from the latest approved version
- Provide clear summaries of changes
- Test content in the preview before submitting
- Communicate with your team about policy updates

### Version Management
- Use descriptive version titles
- Include effective dates for important changes
- Keep draft versions organized
- Archive old versions when no longer needed

## Troubleshooting

### Common Issues

**"Failed to create policy"**
- Check that the slug is unique
- Ensure all required fields are filled
- Verify you have admin permissions

**"Failed to submit for approval"**
- Make sure you're logged in
- Check that the version is in draft status
- Verify you have permission to submit

**Rich text editor not loading**
- Refresh the page
- Check your internet connection
- Clear browser cache if needed

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Contact your system administrator
3. Review the policy management documentation

## Technical Notes

- All content is stored securely in Supabase
- Versions are automatically numbered
- Approval workflow is tracked with timestamps
- Content is automatically converted to markdown for storage
- Rich text editor supports standard formatting options 