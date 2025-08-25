/**
 * Role helper functions for the new four-tier role system
 */

// Role hierarchy (from highest to lowest privileges)
export const ROLES = {
  PLATFORM_ADMIN: 'Platform Admin',
  PLATFORM_SUPPORT: 'Platform Support', 
  TEAM_ADMIN: 'Team Admin',
  TEAM_MEMBER: 'Team Member'
};

/**
 * Check if user has platform admin privileges
 * @param {string} role - User's role
 * @returns {boolean}
 */
export const isPlatformAdmin = (role) => {
  return role === ROLES.PLATFORM_ADMIN;
};

/**
 * Check if user has platform support privileges
 * @param {string} role - User's role
 * @returns {boolean}
 */
export const isPlatformSupport = (role) => {
  return role === ROLES.PLATFORM_SUPPORT;
};

/**
 * Check if user has team admin privileges
 * @param {string} role - User's role
 * @returns {boolean}
 */
export const isTeamAdmin = (role) => {
  return role === ROLES.TEAM_ADMIN || role === ROLES.PLATFORM_ADMIN || role === ROLES.PLATFORM_SUPPORT;
};

/**
 * Check if user has platform-level access (admin or support)
 * @param {string} role - User's role
 * @returns {boolean}
 */
export const hasPlatformAccess = (role) => {
  return role === ROLES.PLATFORM_ADMIN || role === ROLES.PLATFORM_SUPPORT;
};

/**
 * Get display name for role
 * @param {string} role - User's role
 * @returns {string}
 */
export const getRoleDisplayName = (role) => {
  switch (role) {
    case ROLES.PLATFORM_ADMIN:
      return 'Platform Admin';
    case ROLES.PLATFORM_SUPPORT:
      return 'Platform Support';
    case ROLES.TEAM_ADMIN:
      return 'Team Admin';
    case ROLES.TEAM_MEMBER:
      return 'Team Member';
    default:
      return 'Team Member';
  }
};

/**
 * Get role description
 * @param {string} role - User's role
 * @returns {string}
 */
export const getRoleDescription = (role) => {
  switch (role) {
    case ROLES.PLATFORM_ADMIN:
      return 'Full platform access with system administration privileges';
    case ROLES.PLATFORM_SUPPORT:
      return 'Platform support access for content and user management';
    case ROLES.TEAM_ADMIN:
      return 'Team administration with member and subscription management';
    case ROLES.TEAM_MEMBER:
      return 'Standard team member with access to team features';
    default:
      return 'Standard team member with access to team features';
  }
}; 