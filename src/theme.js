// Theme-aware color utilities
// These functions return colors that work in both light and dark mode

const isDarkMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const theme = {
  // Background colors
  get bgPrimary() { return isDarkMode() ? '#1a1a1a' : '#ffffff'; },
  get bgSecondary() { return isDarkMode() ? '#242424' : '#f9fafb'; },
  get bgTertiary() { return isDarkMode() ? '#2d2d2d' : '#f3f4f6'; },
  
  // Text colors
  get textPrimary() { return isDarkMode() ? '#e5e7eb' : '#1f2937'; },
  get textSecondary() { return isDarkMode() ? '#9ca3af' : '#6b7280'; },
  get textMuted() { return isDarkMode() ? '#6b7280' : '#9ca3af'; },
  
  // Border colors
  get border() { return isDarkMode() ? '#404040' : '#d1d5db'; },
  get borderLight() { return isDarkMode() ? '#525252' : '#e5e7eb'; },
  
  // Card backgrounds
  get cardBg() { return isDarkMode() ? '#242424' : '#ffffff'; },
  
  // Input styles
  get inputBg() { return isDarkMode() ? '#1a1a1a' : '#ffffff'; },
  get inputBorder() { return isDarkMode() ? '#525252' : '#d1d5db'; },
  get inputDisabledBg() { return isDarkMode() ? '#2d2d2d' : '#f3f4f6'; },
  
  // Label colors
  get labelColor() { return isDarkMode() ? '#d1d5db' : '#374151'; },
  
  // Hover states
  get hoverBg() { return isDarkMode() ? '#2d2d2d' : '#f3f4f6'; },
};
