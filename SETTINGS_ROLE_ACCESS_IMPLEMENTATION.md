# Settings Role-Based Access Control Implementation

## Overview
Implemented role-based access control for the Settings page, restricting tabs based on user roles and subscription tiers. Free tier users (null roles) have limited access to prevent access to premium features including color customization.

## Role Hierarchy
- **Platform Admin** (highest rank - developers)
- **Platform Support** (lower rank - developers) 
- **Team Admin** (end user admin)
- **Team Member** (end user regular)
- **null** (free tier - no role assigned)

## Implementation Details

### 1. SettingsTabs.jsx Changes
- Added user role fetching logic using `useEffect`
- Added conditional rendering for the Platform tab using `hasPlatformAccess()` helper
- Added conditional rendering for the Subscription tab using `isTeamAdmin()` helper
- Added conditional rendering for the Users tab using `isTeamAdmin()` helper
- Added conditional rendering for the Network tab using `userRole !== null` check
- Added conditional rendering for the Colors tab using `userRole !== null` check
- Platform tab only shows for users with "Platform Admin" or "Platform Support" roles
- Subscription tab only shows for users with "Platform Admin", "Platform Support", or "Team Admin" roles
- Users tab only shows for users with "Platform Admin", "Platform Support", or "Team Admin" roles
- Network tab only shows for users with any assigned role (not null)
- Colors tab only shows for users with any assigned role (not null)
- Added loading state while fetching user role

### 2. Settings.jsx Changes  
- Added user role fetching logic
- Added route protection for direct URL access to `/app/settings/platform`
- Added route protection for direct URL access to `/app/settings/subscription`
- Added route protection for direct URL access to `/app/settings/users`
- Added route protection for direct URL access to `/app/settings/network`
- Added route protection for direct URL access to `/app/settings/colors`
- Users without platform access are redirected to `/app/settings/profile`
- Users without subscription access are redirected to `/app/settings/profile`
- Users without team access are redirected to `/app/settings/profile`
- Users without network access are redirected to `/app/settings/profile`
- Users without colors access are redirected to `/app/settings/profile`
- Maintains existing functionality for all other tabs

### 3. Access Control Logic
```javascript
// Platform tab access
const canAccessPlatform = hasPlatformAccess(userRole);
// hasPlatformAccess() returns true for:
// - "Platform Admin" 
// - "Platform Support"
// Returns false for all other roles

// Subscription tab access  
const canAccessSubscription = isTeamAdmin(userRole);
// isTeamAdmin() returns true for:
// - "Platform Admin"
// - "Platform Support" 
// - "Team Admin"
// Returns false for "Team Member" and null roles

// Users tab access
const canAccessTeam = isTeamAdmin(userRole);
// isTeamAdmin() returns true for:
// - "Platform Admin"
// - "Platform Support" 
// - "Team Admin"
// Returns false for "Team Member" and null roles

// Network tab access
const canAccessTaggedProviders = userRole !== null;
// Returns true for any assigned role
// Returns false for null roles (free tier)

// Colors tab access
const canAccessColors = userRole !== null;
// Returns true for any assigned role
// Returns false for null roles (free tier)
```

## Files Modified
- `src/pages/Private/Settings/SettingsTabs.jsx`
- `src/pages/Private/Settings/Settings.jsx`

## Testing
- **Platform tab**: Only visible to Platform Admin and Platform Support users
- **Subscription tab**: Only visible to Platform Admin, Platform Support, and Team Admin users
- **Users tab**: Only visible to Platform Admin, Platform Support, and Team Admin users
- **Network tab**: Only visible to users with assigned roles (not null)
- **Colors tab**: Only visible to users with assigned roles (not null)
- **Free tier users (null role)**: Cannot see Platform, Subscription, Users, Network, or Colors tabs
- Direct URL access to restricted tabs redirects unauthorized users to profile tab
- All other settings tabs remain accessible to all users

## Access Matrix
| Role | Platform Tab | Subscription Tab | Users Tab | Network Tab | Colors Tab | Other Tabs |
|------|-------------|------------------|----------|---------------------|------------|------------|
| Platform Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Platform Support | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Team Admin | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Team Member | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| null (free tier) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## Free Tier Restrictions
Users with null roles (free tier) are restricted from:
- Platform administration features
- Subscription management
- Team management
- Network functionality
- Color customization features

This ensures free tier users cannot access premium features while maintaining access to basic settings like Profile only.

## Next Steps
This implementation provides the foundation for further role-based access control across the application. Additional tabs or features can be restricted using similar patterns with the existing role helper functions. 