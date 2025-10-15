/**
 * Value Mappers - Frontend to Backend Data Transformation
 * 
 * These functions convert user-friendly form values to database format
 * required by the backend API.
 * 
 * Usage:
 * - Frontend displays user-friendly values (e.g., "Roman Catholic", "Male")
 * - Forms validate using these user-friendly values
 * - Before API submission, use these mappers to transform to backend format
 */

/**
 * Map frontend gender to backend format
 * @param {string} gender - "Male" or "Female"
 * @returns {number|null} - 1 for Male, 2 for Female, null if invalid
 */
export const mapGenderToBackend = (gender) => {
  const genderMap = {
    'Male': 1,
    'Female': 2
  }
  return genderMap[gender] || null
}

/**
 * Map backend gender code to frontend format
 * @param {number} genderCode - 1 or 2
 * @returns {string} - "Male" or "Female"
 */
export const mapGenderToFrontend = (genderCode) => {
  const genderMap = {
    1: 'Male',
    2: 'Female'
  }
  return genderMap[genderCode] || ''
}

/**
 * Map frontend religion to backend format
 * @param {string} religion - User-friendly religion name
 * @returns {string|null} - Backend ENUM format or null
 */
export const mapReligionToBackend = (religion) => {
  const religionMap = {
    'Roman Catholic': 'ROMAN_CATHOLIC',
    'Protestant': 'PROTESTANT',
    'Iglesia ni Cristo': 'IGLESIA_NI_CRISTO',
    'Islam': 'ISLAM',
    'Buddhism': 'BUDDHIST',
    'Others': 'OTHERS'
  }
  return religionMap[religion] || null
}

/**
 * Map backend religion to frontend format
 * @param {string} religionCode - Backend ENUM format
 * @returns {string} - User-friendly religion name
 */
export const mapReligionToFrontend = (religionCode) => {
  const religionMap = {
    'ROMAN_CATHOLIC': 'Roman Catholic',
    'PROTESTANT': 'Protestant',
    'IGLESIA_NI_CRISTO': 'Iglesia ni Cristo',
    'ISLAM': 'Islam',
    'BUDDHIST': 'Buddhism',
    'OTHERS': 'Others'
  }
  return religionMap[religionCode] || religionCode
}

/**
 * Map frontend occupation to backend format
 * @param {string} occupation - User-friendly occupation name
 * @returns {string|null} - Backend ENUM format or null
 */
export const mapOccupationToBackend = (occupation) => {
  const occupationMap = {
    'Employed': 'EMPLOYED',
    'Self-employed': 'SELF_EMPLOYED',
    'Unemployed': 'UNEMPLOYED',
    'Retired': 'RETIRED',
    'Others': 'OTHERS'
  }
  return occupationMap[occupation] || null
}

/**
 * Map backend occupation to frontend format
 * @param {string} occupationCode - Backend ENUM format
 * @returns {string} - User-friendly occupation name
 */
export const mapOccupationToFrontend = (occupationCode) => {
  const occupationMap = {
    'EMPLOYED': 'Employed',
    'SELF_EMPLOYED': 'Self-employed',
    'UNEMPLOYED': 'Unemployed',
    'RETIRED': 'Retired',
    'OTHERS': 'Others'
  }
  return occupationMap[occupationCode] || occupationCode
}

/**
 * Map frontend special category to backend format
 * @param {string} category - User-friendly category name
 * @returns {string|null} - Backend ENUM format or null
 */
export const mapSpecialCategoryToBackend = (category) => {
  if (!category) return null
  const categoryMap = {
    'PWD': 'PWD',
    'Solo Parent': 'SOLO_PARENT',
    'Indigent': 'INDIGENT',
    'Student': 'STUDENT'
  }
  return categoryMap[category] || null
}

/**
 * Map backend special category to frontend format
 * @param {string} categoryCode - Backend ENUM format
 * @returns {string} - User-friendly category name
 */
export const mapSpecialCategoryToFrontend = (categoryCode) => {
  if (!categoryCode) return ''
  const categoryMap = {
    'PWD': 'PWD',
    'SOLO_PARENT': 'Solo Parent',
    'INDIGENT': 'Indigent',
    'STUDENT': 'Student'
  }
  return categoryMap[categoryCode] || categoryCode
}

/**
 * Map frontend suffix to backend format (numeric codes)
 * @param {string} suffix - User-friendly suffix (Jr., Sr., II, etc.)
 * @returns {number|null} - Backend numeric code or null
 */
export const mapSuffixToBackend = (suffix) => {
  if (!suffix) return null
  const suffixMap = {
    'Jr.': 1,
    'Sr.': 2,
    'II': 3,
    'III': 4,
    'IV': 5,
    'V': 6
  }
  return suffixMap[suffix] || null
}

/**
 * Map backend suffix code to frontend format
 * @param {number} suffixCode - Backend numeric code
 * @returns {string} - User-friendly suffix
 */
export const mapSuffixToFrontend = (suffixCode) => {
  if (!suffixCode) return ''
  const suffixMap = {
    1: 'Jr.',
    2: 'Sr.',
    3: 'II',
    4: 'III',
    5: 'IV',
    6: 'V'
  }
  return suffixMap[suffixCode] || ''
}

/**
 * Extract purok number from "Purok X" format
 * @param {string} purok - "Purok 1", "Purok 2", etc.
 * @returns {number|null} - Numeric purok number or null
 */
export const extractPurokNumber = (purok) => {
  if (!purok) return null
  // Handle both "Purok 1" format and plain number format
  if (typeof purok === 'number') return purok
  const match = purok.toString().match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

/**
 * Format purok number to display format
 * @param {number} purokNumber - Numeric purok (1-7)
 * @returns {string} - "Purok X" format
 */
export const formatPurokDisplay = (purokNumber) => {
  if (!purokNumber) return ''
  return `Purok ${purokNumber}`
}

/**
 * Validation arrays for frontend forms
 * These are the user-friendly values that appear in dropdowns
 */
export const VALIDATION_VALUES = {
  genders: ['Male', 'Female'],
  civilStatuses: ['Single', 'Married', 'Widowed', 'Separated'],
  religions: ['Roman Catholic', 'Protestant', 'Iglesia ni Cristo', 'Islam', 'Buddhism', 'Others'],
  occupations: ['Employed', 'Self-employed', 'Unemployed', 'Retired', 'Others'],
  specialCategories: ['', 'PWD', 'Solo Parent', 'Indigent', 'Student'],
  suffixes: ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'],
  puroks: ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7']
}
