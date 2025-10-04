/**
 * Suffix name constants
 * Used for displaying and storing suffix values
 */
export const SUFFIX_OPTIONS = [
  { value: '', label: 'None' },
  { value: 1, label: 'Jr.' },
  { value: 2, label: 'Sr.' },
  { value: 3, label: 'II' },
  { value: 4, label: 'III' },
  { value: 5, label: 'IV' },
  { value: 6, label: 'V' }
]

/**
 * Get suffix label from numeric value
 * @param {number} value - Numeric suffix value
 * @returns {string} - Suffix label (e.g., 'Jr.', 'Sr.')
 */
export const getSuffixLabel = (value) => {
  const suffix = SUFFIX_OPTIONS.find(opt => opt.value === value)
  return suffix ? suffix.label : ''
}

/**
 * Get suffix value from label
 * @param {string} label - Suffix label
 * @returns {number} - Numeric suffix value
 */
export const getSuffixValue = (label) => {
  const suffix = SUFFIX_OPTIONS.find(opt => opt.label === label)
  return suffix ? suffix.value : ''
}

/**
 * User role constants
 * Used for role-based access control
 */
export const USER_ROLES = {
  ADMIN: 1,
  STAFF: 2,
  RESIDENT: 3
}

/**
 * Get role name from numeric value
 * @param {number} roleId - Numeric role ID
 * @returns {string} - Role name (e.g., 'admin', 'staff', 'resident')
 */
export const getRoleName = (roleId) => {
  const roleMap = {
    [USER_ROLES.ADMIN]: 'admin',
    [USER_ROLES.STAFF]: 'staff',
    [USER_ROLES.RESIDENT]: 'resident'
  }
  return roleMap[roleId] || 'unknown'
}

/**
 * Check if user has admin privileges
 * @param {number} roleId - Numeric role ID
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (roleId) => roleId === USER_ROLES.ADMIN

/**
 * Check if user has staff privileges (staff or admin)
 * @param {number} roleId - Numeric role ID
 * @returns {boolean} - True if user is staff or admin
 */
export const isStaff = (roleId) => roleId === USER_ROLES.STAFF || roleId === USER_ROLES.ADMIN
