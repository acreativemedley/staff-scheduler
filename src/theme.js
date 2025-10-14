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
  // Semantic colors
  get primary() { return isDarkMode() ? '#2563eb' : '#3b82f6'; },
  get primaryText() { return '#ffffff'; },
  get primaryBg() { return isDarkMode() ? '#1e3a8a' : '#dbeafe'; },
  get primaryBgHover() { return isDarkMode() ? '#1e40af' : '#bfdbfe'; },
  
  get success() { return isDarkMode() ? '#059669' : '#16a34a'; },
  get successText() { return isDarkMode() ? '#86efac' : '#16a34a'; },
  get successBg() { return isDarkMode() ? '#166534' : '#f0fdf4'; },
  get successBgLight() { return isDarkMode() ? '#14532d' : '#ecfdf5'; },
  get successBorder() { return isDarkMode() ? '#15803d' : '#bbf7d0'; },
  
  get danger() { return isDarkMode() ? '#991b1b' : '#dc2626'; },
  get dangerText() { return isDarkMode() ? '#fca5a5' : '#dc2626'; },
  get dangerBg() { return isDarkMode() ? '#991b1b' : '#fef2f2'; },
  get dangerBorder() { return isDarkMode() ? '#b91c1c' : '#fecaca'; },
  
  get warning() { return isDarkMode() ? '#854d0e' : '#d97706'; },
  get warningText() { return isDarkMode() ? '#fde68a' : '#92400e'; },
  get warningBg() { return isDarkMode() ? '#854d0e' : '#fffbeb'; },
  get warningBgLight() { return isDarkMode() ? '#78350f' : '#fef3c7'; },
  get warningBorder() { return isDarkMode() ? '#a16207' : '#fed7aa'; },
  
  get info() { return isDarkMode() ? '#0369a1' : '#0284c7'; },
  get infoText() { return isDarkMode() ? '#7dd3fc' : '#0284c7'; },
  get infoBg() { return isDarkMode() ? '#075985' : '#f0f9ff'; },
  get infoBgLight() { return isDarkMode() ? '#0c4a6e' : '#e0f2fe'; },
  get infoBorder() { return isDarkMode() ? '#0ea5e9' : '#bae6fd'; },
  
  get purple() { return isDarkMode() ? '#6d28d9' : '#7c3aed'; },
  get purpleText() { return isDarkMode() ? '#c7d2fe' : '#3730a3'; },
  get purpleBg() { return isDarkMode() ? '#4338ca' : '#e0e7ff'; },
  
  get orange() { return isDarkMode() ? '#c2410c' : '#ea580c'; },
  
  get gray() { return isDarkMode() ? '#52525b' : '#6b7280'; },
  get grayBg() { return isDarkMode() ? '#27272a' : '#e5e7eb'; },
  get grayText() { return isDarkMode() ? '#a1a1aa' : '#6b7280'; },
  
  get white() { return '#ffffff'; },
  get black() { return '#000000'; },
  
  // Button disabled state
  get buttonDisabled() { return isDarkMode() ? '#52525b' : '#9ca3af'; },
};
