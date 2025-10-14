/**
 * Time Utilities - Handle PostgreSQL TIME type values with timezone safety
 * 
 * PostgreSQL TIME values can sometimes be returned from Supabase with timezone context,
 * especially if the database timezone differs from the client timezone.
 * These utilities ensure consistent HH:MM format regardless of the source format.
 */

/**
 * Extract time in HH:MM format from various possible time formats
 * Handles:
 * - Plain time strings: "10:00", "10:00:00"
 * - Time with timezone: "10:00:00-05:00", "10:00:00+00:00"  
 * - ISO timestamps: "2024-01-01T10:00:00Z", "2024-01-01T10:00:00-05:00"
 * - Date objects
 * 
 * @param {string|Date} timeValue - Time value in various formats
 * @returns {string|null} Time in HH:MM format, or null if invalid
 */
export const extractTimeOnly = (timeValue) => {
  if (!timeValue) return null;
  
  try {
    // Handle Date objects
    if (timeValue instanceof Date) {
      const hours = timeValue.getHours().toString().padStart(2, '0');
      const minutes = timeValue.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // Handle string values
    if (typeof timeValue === 'string') {
      // If it contains 'T' it's likely an ISO timestamp
      if (timeValue.includes('T')) {
        const date = new Date(timeValue);
        if (!isNaN(date.getTime())) {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        }
      }
      
      // Remove any timezone info (e.g., "10:00:00-05:00" -> "10:00:00")
      // Split on + or - that appears after the time part
      const timeOnly = timeValue.split(/(?=[+-]\d{2}:?\d{2}$)/)[0];
      
      // Extract just HH:MM from HH:MM:SS or HH:MM
      const parts = timeOnly.split(':');
      if (parts.length >= 2) {
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    }
    
    console.warn('Unable to extract time from value:', timeValue);
    return null;
  } catch (error) {
    console.error('Error extracting time:', error, 'from value:', timeValue);
    return null;
  }
};

/**
 * Ensure a time value is in HH:MM format
 * Similar to extractTimeOnly but with a fallback default
 * 
 * @param {string|Date} timeValue - Time value in various formats
 * @param {string} defaultValue - Default time to use if extraction fails
 * @returns {string} Time in HH:MM format
 */
export const normalizeTime = (timeValue, defaultValue = '09:00') => {
  const extracted = extractTimeOnly(timeValue);
  return extracted || defaultValue;
};
