# Enhanced User Invitation System

## Overview

The enhanced user invitation system provides a comprehensive solution for inviting new users to join teams in Market Mover. It integrates with Supabase's authentication system while adding custom team-based access control and license management.

## Key Features

### 🔐 **Security & Permissions**
- **Role-based Invitation**: Only Team Admins, Platform Admins, and Platform Support can invite users
- **License Management**: Automatically checks available licenses before sending invitations
- **Team Validation**: Ensures inviter belongs to the target team

### 📧 **Email System**
- **Custom Email Template**: Branded invitation emails with team context
- **Gmail Compatible**: Inline CSS for consistent rendering across email clients
- **Team Information**: Includes team name, inviter name, and role details

### 👤 **User Management**
- **New User Creation**: Automatically creates user accounts for new email addresses
- **Existing User Handling**: Links existing users to teams if they're not already part of one
- **Profile Setup**: Seamless onboarding flow for new team members

### 🎯 **First-Time Login Flow**
- **Automatic Redirect**: New users are guided through profile completion
- **Team Context**: Shows team information during onboarding
- **Skip Option**: Users can complete profile setup later

## System Components

### 1. **Enhanced Edge Function** (`supabase/functions/invite_user/index.ts`)

**Key Improvements:**
- Validates inviter permissions
- Checks license availability
- Handles both new and existing users
- Uses Supabase's built-in invitation system
- Provides detailed response data

**Request Payload:**
```json
{
  "email": "user@example.com",
  "team_id": "uuid",
  "team_name": "Team Name",
  "inviter_id": "uuid"
}
```

**Response:**
```json
{
  "message": "User invited successfully",
  "isNewUser": true,
  "teamName": "Team Name",
  "availableLicenses": 4
}
```

### 2. **Team Invitation Email Template** (`email-templates/team-invitation.html`)

**Features:**
- Matches app's modern design
- Gmail-compatible inline CSS
- Team-specific information
- Clear call-to-action button
- Security notices and expectations

**Template Variables:**
- `{{ .TeamName }}` - Team name
- `{{ .InviterName }}` - Name of person who sent invitation
- `{{ .ConfirmationURL }}` - Supabase-generated invitation link

### 3. **Team Onboarding Component** (`src/pages/Auth/TeamOnboarding.jsx`)

**Purpose:**
- Handles first-time login for invited users
- Collects required profile information
- Shows team context and role information
- Provides skip option for later completion

**Features:**
- Auto-focus on first name field
- Pre-fills existing data
- Real-time validation
- Success feedback and redirect

### 4. **First-Time Login Hook** (`src/hooks/useFirstTimeLogin.js`)

**Functionality:**
- Checks if user needs profile completion
- Handles team invitation redirects
- Manages onboarding flow
- Prevents dashboard access until setup complete

### 5. **Updated Users Tab** (`src/pages/Private/Settings/Users/UsersTab.jsx`)

**Enhancements:**
- Passes inviter_id to invitation function
- Better error handling and user feedback
- License availability checking
- Real-time team member updates

## User Flow

### For Team Admins (Inviting Users)

1. **Navigate to Settings > Users**
2. **Click "Invite Users"** (only visible to team admins)
3. **Enter email address** of person to invite
4. **Click "Send Invite"**
5. **System validates:**
   - Admin permissions
   - Available licenses
   - Email format
6. **Invitation sent** with team context
7. **User appears in team list** immediately

### For Invited Users

1. **Receive invitation email** with team details
2. **Click "Accept Invitation"** button
3. **Redirected to login/signup** (if needed)
4. **Automatically redirected to onboarding** (`/team-onboarding`)
5. **Complete profile setup:**
   - First Name (required)
   - Last Name (required)
   - Job Title (optional)
6. **Redirected to dashboard** with full team access

## Database Integration

### Profiles Table Updates
The system automatically updates the `profiles` table with:
- `team_id` - Links user to team
- `role` - Set to "Team Member"
- `access_type` - Set to "join"
- `updated_at` - Timestamp of team assignment

### User Metadata
New users get metadata stored in Supabase Auth:
- `team_id` - Team they're joining
- `invited_by` - ID of person who invited them
- `team_name` - Name of the team

## Error Handling

### Common Error Scenarios

1. **No Available Licenses**
   - Error: "No available licenses on this team"
   - Solution: Upgrade subscription or remove inactive users

2. **User Already on Team**
   - Error: "User is already part of a team"
   - Solution: User must leave current team first

3. **Invalid Permissions**
   - Error: "You don't have permission to invite users to this team"
   - Solution: Only team admins can invite users

4. **Invalid Email**
   - Error: "Please enter a valid email address"
   - Solution: Check email format

## Configuration

### Environment Variables Required

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EDGE_INVITE_SECRET=your_invite_secret

# Site Configuration
SITE_URL=https://your-domain.com
```

### Email Template Setup

1. **Upload template** to Supabase Auth settings
2. **Configure redirect URL** to point to your domain
3. **Test email delivery** in Supabase dashboard

## Security Considerations

### Permission Validation
- Inviter must be authenticated
- Inviter must belong to target team
- Inviter must have admin privileges
- Team must have available licenses

### Data Protection
- Email addresses are validated
- User metadata is encrypted
- Team assignments are logged
- Profile updates are tracked

### Rate Limiting
- Supabase handles email rate limiting
- Edge function includes error handling
- User feedback prevents spam

## Testing

### Test Scenarios

1. **New User Invitation**
   - Send invite to new email
   - Verify account creation
   - Test onboarding flow

2. **Existing User Invitation**
   - Send invite to existing user
   - Verify team assignment
   - Test profile completion

3. **Permission Testing**
   - Try inviting as non-admin
   - Verify error handling
   - Test license limits

4. **Email Delivery**
   - Check Gmail rendering
   - Verify template variables
   - Test mobile responsiveness

## Troubleshooting

### Common Issues

1. **Invitation Not Received**
   - Check spam folder
   - Verify email address
   - Check Supabase email logs

2. **Onboarding Not Triggering**
   - Check URL parameters
   - Verify user authentication
   - Check profile data

3. **Team Assignment Failed**
   - Check database permissions
   - Verify team exists
   - Check user metadata

### Debug Steps

1. **Check Edge Function Logs**
   - Monitor Supabase function logs
   - Verify request/response data
   - Check error messages

2. **Verify Database State**
   - Check profiles table
   - Verify team assignments
   - Check user metadata

3. **Test Email Delivery**
   - Use Supabase email testing
   - Check template variables
   - Verify redirect URLs

## Future Enhancements

### Potential Improvements

1. **Bulk Invitations**
   - Invite multiple users at once
   - CSV import functionality
   - Batch processing

2. **Advanced Role Assignment**
   - Custom role selection
   - Role-based permissions
   - Temporary access

3. **Invitation Management**
   - Track invitation status
   - Resend invitations
   - Cancel pending invitations

4. **Analytics**
   - Invitation success rates
   - Time to acceptance
   - User engagement metrics

## Support

For issues or questions about the invitation system:

1. **Check this documentation**
2. **Review error logs**
3. **Test with different scenarios**
4. **Contact development team**

---

*This system provides a robust, secure, and user-friendly way to invite new team members while maintaining proper access controls and license management.*
