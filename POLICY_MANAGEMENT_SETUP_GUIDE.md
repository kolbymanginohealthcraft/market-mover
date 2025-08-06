# Complete Policy Management System Setup Guide

## Overview

This system provides a **complete policy management solution** with versioning, approval workflows, and dynamic policy creation. Your team can create new policies, edit existing ones, and manage the approval process - all within Market Mover.

## Key Features

### 🎯 **Dynamic Policy Creation**
- **Create new policies** on the fly (e.g., "Trial Account Policy")
- **Version control** with automatic numbering
- **Clone existing versions** to start editing
- **Rich text editing** with no markdown knowledge required

### 📋 **Approval Workflow**
- **Draft → Submit → Approve/Reject** workflow
- **You approve** as the boss (admin role)
- **Team creates content** without technical barriers
- **Version tracking** with timestamps and user attribution

### 🔄 **Version Management**
- **Multiple versions** per policy
- **Approved versions** automatically go live
- **Draft versions** for editing
- **Version history** with full audit trail

## Database Schema

### Tables Created:
1. **`policy_definitions`** - Policy types (Terms, Privacy, Refund, etc.)
2. **`policy_versions`** - Actual content with versioning
3. **`policy_approvals`** - Approval workflow tracking
4. **`policy_permissions`** - User access control

### Key Features:
- **Row Level Security** (RLS) for data protection
- **Automatic version numbering**
- **Status tracking** (draft, pending_approval, approved, rejected)
- **User attribution** for all changes
- **Effective date** support for policy changes

## Setup Instructions

### Step 1: Database Setup
1. **Run the SQL script** in Supabase:
   ```sql
   -- Copy and paste the contents of POLICY_MANAGEMENT_SYSTEM.sql
   -- into your Supabase SQL Editor and run it
   ```

2. **Verify the setup**:
   - Check that all tables are created
   - Confirm initial policies (Terms, Privacy, Refund) are loaded
   - Verify RLS policies are active

### Step 2: API Integration
The system automatically includes:
- **Policy CRUD operations**
- **Version management**
- **Approval workflows**
- **User permission checks**

### Step 3: User Access
1. **Admin users** (you) can:
   - Create new policies
   - Approve/reject versions
   - Manage all content

2. **Regular users** (your team) can:
   - Create draft versions
   - Edit their own drafts
   - Submit for approval
   - View approved content

## How It Works

### For Your Team (Content Creators)

#### Creating a New Policy
1. **Go to Settings → Platform → Manage Policies**
2. **Click "New Policy"**
3. **Fill in details**:
   - Slug: `trials` (unique identifier)
   - Nickname: `Trials` (display name)
   - Full Name: `Trial Account Policy`
   - Description: `Policy for trial account usage`
4. **Click "Create Policy"**

#### Creating a New Version
1. **Select a policy** from the list
2. **Click "New Version"**
3. **Choose to clone** from existing version or start fresh
4. **Add title, summary, effective date** (optional)
5. **Edit content** using the rich text editor
6. **Save as draft** or submit for approval

#### Editing Process
1. **Select a policy** and version
2. **Use rich text editor** (no markdown needed)
3. **Format with toolbar** (B, I, H1, H2, H3, Lists, Links)
4. **Save changes** automatically
5. **Submit for approval** when ready

### For You (Admin/Boss)

#### Approval Process
1. **Go to "Approvals" tab**
2. **Review pending submissions**
3. **Click "Approve"** or "Reject"
4. **Add comments** if rejecting
5. **Approved versions** automatically go live

#### Managing Policies
1. **View all policies** in the main tab
2. **See version history** for each policy
3. **Monitor drafts** and submissions
4. **Export content** for backup

## Example Workflow

### Creating "Trial Account Policy"

1. **Admin creates policy**:
   ```
   Slug: trials
   Nickname: Trials
   Full Name: Trial Account Policy
   Description: Guidelines for trial account usage
   ```

2. **Team member creates version**:
   - Clones from existing Terms policy
   - Edits content for trial-specific rules
   - Adds title: "Trial Account Policy v1"
   - Sets effective date: 2024-01-15

3. **Team member submits** for approval

4. **Admin reviews** and approves

5. **Policy goes live** automatically

## API Endpoints

### Policy Management
- `GET /api/policies/policies` - List all policies
- `POST /api/policies/policies` - Create new policy (admin)
- `GET /api/policies/policies/:slug/latest` - Get latest approved version
- `GET /api/policies/policies/:slug/versions` - Get all versions

### Version Management
- `POST /api/policies/policies/:slug/versions` - Create new version
- `PUT /api/policies/versions/:id` - Update draft version
- `POST /api/policies/versions/:id/submit` - Submit for approval

### Approval Workflow
- `GET /api/policies/approvals/pending` - Get pending approvals (admin)
- `POST /api/policies/versions/:id/approve` - Approve/reject version (admin)
- `GET /api/policies/drafts` - Get user's drafts

## Benefits

### ✅ **No Technical Barriers**
- Rich text editing (no markdown)
- Visual interface
- Familiar workflow

### ✅ **Complete Control**
- You approve everything
- Version history tracking
- Audit trail for compliance

### ✅ **Scalable System**
- Add unlimited policies
- Multiple versions per policy
- Team collaboration

### ✅ **Production Ready**
- Supabase backend
- Real-time updates
- Secure access control

## Migration from Old System

If you have existing legal content:

1. **Export current content** from markdown files
2. **Create policies** in the new system
3. **Import content** as version 1
4. **Approve versions** to go live
5. **Remove old system** once confirmed working

## Best Practices

### Policy Organization
1. **Use clear slugs** (terms, privacy, refund, trials)
2. **Descriptive nicknames** for easy identification
3. **Version titles** that explain changes
4. **Effective dates** for policy changes

### Workflow Management
1. **Draft → Submit → Approve** process
2. **Review before approving**
3. **Add comments** for rejections
4. **Monitor version history**

### Team Training
1. **Show the interface** to your team
2. **Demonstrate rich text editing**
3. **Explain approval workflow**
4. **Practice with sample content**

## Troubleshooting

### Common Issues

**Issue**: "Cannot create policy"
- **Solution**: Ensure user has admin role

**Issue**: "Cannot submit for approval"
- **Solution**: Check that version is in draft status

**Issue**: "Cannot approve version"
- **Solution**: Verify admin permissions

**Issue**: "Content not updating"
- **Solution**: Check that version is approved

### Support
- **For technical issues**: Check Supabase logs
- **For workflow questions**: Review approval process
- **For content issues**: Use version history

This system gives you complete control over policy management while making it easy for your team to create and edit content! 