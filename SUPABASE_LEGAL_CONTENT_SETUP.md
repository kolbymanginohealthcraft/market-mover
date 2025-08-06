# Supabase Legal Content Setup Guide

## Overview

This guide will help you set up the legal content management system using Supabase as the database backend. This approach provides better scalability, version control, and multi-environment support.

## Step 1: Create the Database Table

### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `LEGAL_CONTENT_SUPABASE_SETUP.sql`
4. Click **Run** to execute the script

### Option B: Using Supabase CLI
```bash
supabase db push
```

## Step 2: Verify the Setup

After running the SQL script, you should see:

### Database Table
- `legal_content` table created with columns:
  - `id` (Primary Key)
  - `content_type` (Unique: 'terms', 'privacy', 'refund')
  - `content` (Text field for markdown content)
  - `version` (Auto-incrementing version number)
  - `created_at` (Timestamp)
  - `updated_at` (Auto-updating timestamp)
  - `created_by` (User ID reference)
  - `updated_by` (User ID reference)

### Initial Data
- Three records inserted with default content:
  - Terms & Conditions
  - Privacy Policy
  - Refund Policy

### Row Level Security (RLS)
- Read access for all authenticated users
- Write access only for admin users
- Automatic timestamp updates

## Step 3: Environment Variables

Ensure your server has these environment variables:

```env
SUPABASE_URL=your_supabase_project_url
SERVICE_ROLE_KEY=your_service_role_key
```

## Step 4: Test the System

### Test the API Endpoints
```bash
# Get content
curl -X GET http://localhost:5000/api/admin/legal-content/terms

# Update content (requires admin auth)
curl -X PUT http://localhost:5000/api/admin/legal-content/terms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"content": "# Updated Terms\n\nNew content here..."}'
```

### Test the Web Interface
1. Start your development server
2. Navigate to `/app/settings`
3. Click **Platform** tab
4. Click **Edit Legal Content**
5. Try editing and saving content

## Benefits of Supabase Approach

### ✅ Advantages
- **Multi-environment support**: Dev, staging, and production environments
- **Version control**: Track changes with version numbers
- **User tracking**: Know who made changes and when
- **Backup and recovery**: Supabase handles backups automatically
- **Scalability**: Handles multiple concurrent users
- **Real-time updates**: Changes appear instantly across all users
- **Security**: Row-level security and authentication
- **No file system dependencies**: Works in serverless environments

### 🔄 Migration from File System
If you were using the file-based system:

1. **Export existing content** from the file system
2. **Run the Supabase setup script**
3. **Import content** through the web interface
4. **Test thoroughly** before removing file-based code

## Security Considerations

### Authentication
- Only authenticated users can read content
- Only admin users can modify content
- JWT tokens are validated on each request

### Data Validation
- Content type validation (terms, privacy, refund only)
- Content length limits (configurable)
- Markdown sanitization (recommended)

### Backup Strategy
- Supabase handles automatic backups
- Consider exporting content periodically
- Version history is maintained in the database

## Monitoring and Maintenance

### Database Monitoring
```sql
-- Check content versions
SELECT content_type, version, updated_at, updated_by 
FROM legal_content 
ORDER BY updated_at DESC;

-- Check for recent changes
SELECT content_type, version, updated_at 
FROM legal_content 
WHERE updated_at > NOW() - INTERVAL '7 days';
```

### Content Backup
```sql
-- Export all content
SELECT content_type, content, version, updated_at 
FROM legal_content;
```

## Troubleshooting

### Common Issues

**Issue**: "Failed to load content"
- **Solution**: Check Supabase connection and RLS policies

**Issue**: "Admin access required"
- **Solution**: Ensure user has admin role in profiles table

**Issue**: "Invalid content type"
- **Solution**: Only 'terms', 'privacy', 'refund' are valid

**Issue**: Content not updating
- **Solution**: Check version conflicts and try refreshing

### Debug Commands
```bash
# Check Supabase connection
curl -X GET "https://your-project.supabase.co/rest/v1/legal_content" \
  -H "apikey: YOUR_ANON_KEY"

# Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'legal_content';
```

## Next Steps

1. **Deploy to production** with proper environment variables
2. **Set up monitoring** for content changes
3. **Train users** on the new interface
4. **Remove file-based code** once confirmed working
5. **Set up automated backups** if needed

## Support

For technical issues:
- Check Supabase logs in dashboard
- Verify environment variables
- Test API endpoints directly
- Review RLS policies

For content management:
- Use the web interface for editing
- Export content for backup
- Monitor version history
- Train non-technical users 