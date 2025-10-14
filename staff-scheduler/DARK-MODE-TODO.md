# Dark Mode - Remaining Fixes TODO

## Completed ✅
- ScheduleGenerator.jsx (Schedule tab)
- AvailabilityManager.jsx (My Availability tab - main sections)
- TimeOffManager.jsx (Manage Time-Off tab)
- TimeOffRequest.jsx (Request Time-Off tab - main form)
- EmployeeList.jsx (Employees tab - partial)
- App.jsx (Main container and navigation)
- theme.js utility created
- CSS variables in index.css

---

## Summary of Hardcoded Colors Found

### By File (Excluding Print Functions):

1. **AddEmployee.jsx**: 22 instances - MISSING THEME IMPORT ⚠️
2. **EmployeeList.jsx**: 18 instances  
3. **AvailabilityOverview.jsx**: 8 instances
4. **BaseScheduleManager.jsx**: 13 instances
5. **TimeOffRequest.jsx**: 35+ instances (many repeated patterns)
6. **AvailabilityManager.jsx**: 23 instances
7. **UserManagement.jsx**: ✅ COMPLETE - Already uses theme

### Total: ~119 color replacements needed across 6 files

---

## Common Patterns to Replace

### Input Fields
```javascript
// Replace ALL instances of:
border: '1px solid #ccc'
border: '1px solid #d1d5db'

// With:
border: `1px solid ${theme.inputBorder}`
```

### Secondary Text / Help Text
```javascript
// Replace ALL instances of:
color: '#666'
color: '#6b7280'

// With:
color: theme.textSecondary
```

### Primary Text
```javascript
// Replace:
color: '#374151'
color: '#111'

// With:
color: theme.textPrimary
```

### Button Colors
```javascript
// Green success buttons:
backgroundColor: '#28a745'
backgroundColor: '#10b981'
backgroundColor: '#16a34a'
// → Use: theme.success

// Red danger buttons:
backgroundColor: '#dc3545'
backgroundColor: '#dc2626'
// → Use: theme.danger

// Gray/neutral buttons:
backgroundColor: '#6c757d'
backgroundColor: '#e5e7eb'
// → Use: theme.bgTertiary

// Blue primary buttons:
backgroundColor: '#007bff'
backgroundColor: '#2563eb'
// → Need to add: theme.primary = '#2563eb' to theme.js
```

### Background Colors
```javascript
// Light gray backgrounds:
backgroundColor: '#f3f4f6'
backgroundColor: '#f8fafc'
backgroundColor: '#f5f5f5'
// → Use: theme.bgSecondary

// White/card backgrounds:
backgroundColor: 'white'
// → Use: theme.cardBg or theme.inputBg
```

### Info/Alert Boxes
```javascript
// Blue info:
backgroundColor: '#f0f9ff', border: '#0ea5e9'
backgroundColor: '#dbeafe', border: '#3b82f6'
// → Need to add: theme.infoBg, theme.infoBorder

// Yellow warning (already has dark mode in some places):
backgroundColor: '#854d0e' / '#fffbeb'
// → Use: theme.warningBg, theme.warningText

// Red error (already has dark mode in some places):
backgroundColor: '#991b1b' / '#fef2f2'
// → Use: theme.dangerBg, theme.dangerText

// Green success (already has dark mode in some places):
backgroundColor: '#166534' / '#f0fdf4'
// → Use: theme.successBg, theme.successText
```

---

## Theme Properties to Add

The following properties should be added to `theme.js`:

```javascript
// Add to theme object:
primary: isDarkMode() ? '#3b82f6' : '#007bff',        // Blue for primary buttons
primaryText: isDarkMode() ? '#ffffff' : '#ffffff',
primaryBg: isDarkMode() ? '#1e3a8a' : '#dbeafe',

infoBg: isDarkMode() ? '#075985' : '#f0f9ff',
infoBorder: isDarkMode() ? '#0ea5e9' : '#0ea5e9',
infoText: isDarkMode() ? '#bfdbfe' : '#075985',
```

---

## Remaining Components to Fix

### 1. **AddEmployee.jsx** (Add Employee Form)
**File:** `src/AddEmployee.jsx`

**CRITICAL:** Missing theme import! Add: `import { theme } from './theme';`

**Issues Found:**
- Line 67: `border: '1px solid #ccc'` - Form container border
- Line 78: `border: '1px solid #ccc'` - First Name input
- Line 90: `border: '1px solid #ccc'` - Last Name input
- Line 92: `color: '#666'` - Help text (display name)
- Line 103: `border: '1px solid #ccc'` - Display Name input
- Line 114: `border: '1px solid #ccc'` - Email input
- Line 136: `border: '1px solid #ccc'` - Position select
- Line 153: `border: '1px solid #ccc', backgroundColor: '#f5f5f5'` - Role display (disabled input)
- Line 159: `color: '#666'` - Help text (role)
- Line 166: `color: '#666'` - Label (Minimum hours)
- Line 174: `border: '1px solid #ccc'` - Min hours input
- Line 178: `color: '#666'` - Label (Preferred hours)
- Line 186: `border: '1px solid #ccc'` - Preferred hours input
- Line 190: `color: '#666'` - Label (Maximum hours)
- Line 198: `border: '1px solid #ccc'` - Max hours input
- Line 212: `border: '1px solid #ccc'` - Notes textarea
- Line 222: `backgroundColor: '#28a745'` - Submit button (green)
- Line 239-241: Error/success message colors:
  - Error bg: `'#fee'`, text: `'#c33'`, border: `'#fcc'`
  - Success bg: `'#efe'`, text: `'#363'`, border: `'#cfc'`

**Changes Needed:**
1. Add theme import at top of file
2. All input borders: `theme.inputBorder`
3. All help text/labels (#666): `theme.textSecondary`
4. Disabled role input: `backgroundColor: theme.inputDisabledBg, color: theme.textSecondary`
5. Submit button: `backgroundColor: theme.success, color: 'white'`
6. Error messages: `backgroundColor: theme.dangerBg, color: theme.dangerText, border: theme.dangerBorder`
7. Success messages: `backgroundColor: theme.successBg, color: theme.successText, border: theme.successBorder`

**Estimated instances:** 22 color updates

---

### 2. **EmployeeList.jsx** (Employees Tab)
**File:** `src/EmployeeList.jsx`

**Issues Found:**
- Line 227: `#854d0e` / `#fff3cd` - Edit mode background (already has dark mode check)
- Line 234: `#fde68a` / `#856404` - Edit mode header text
- Line 245: `border: '1px solid #ccc'` - First name input
- Line 256: `border: '1px solid #ccc'` - Last name input
- Line 269: `border: '1px solid #ccc'` - Display name input
- Line 285: `border: '1px solid #ccc'` - Email input
- Line 302: `border: '1px solid #ccc'` - Position select
- Line 313: `border: '1px solid #ccc'` - Min hours input
- Line 329: `border: '1px solid #ccc'` - Preferred hours input
- Line 342: `border: '1px solid #ccc'` - Max hours input
- Line 355: `border: '1px solid #ccc'` - Notes textarea
- Line 368: `border: '1px solid #ccc'` - Active status select
- Line 377: `backgroundColor: '#6c757d', color: 'white'` - Cancel button
- Line 390: `backgroundColor: '#28a745', color: 'white'` - Save button
- Line 413: `backgroundColor: '#007bff', color: 'white'` - Edit button
- Line 427: `backgroundColor: '#dc3545', color: 'white'` - Delete button
- Line 444: `color: '#666'` - Role text in parentheses
- Line 452: `color: #28a745 / #dc3545` - Active/inactive status

**Changes Needed:**
1. All input borders (#ccc): `theme.inputBorder`
2. Edit mode background: Use `theme.warningBg` / `theme.warningText`
3. Cancel button: `theme.bgTertiary`
4. Save button: `theme.success`
5. Edit button: `theme.primary` (consider adding to theme)
6. Delete button: `theme.danger`
7. Role text (#666): `theme.textSecondary`
8. Active/inactive status: `theme.successText` / `theme.dangerText`

**Estimated instances:** 18 color updates

---

### 3. **AvailabilityOverview.jsx** (Team Availability Tab)
**File:** `src/AvailabilityOverview.jsx`

**Issues Found:**
- Lines 21-23: Hardcoded availability colors (duplicated in getStatusColor function)
  - green: `#16a34a` (both light and dark - should differ)
  - yellow: `#f59e0b` (dark) / `#fbbf24` (light)
  - red: `#ef4444` (dark) / `#dc2626` (light)
- Line 99: `textColor = '#000' / '#fff'` - Text color for yellow status

**Changes Needed:**
1. Import `theme` utility
2. Replace status colors with theme equivalents:
   - green: `theme.successText` / `theme.success`
   - yellow: `theme.warningText` / `theme.warning`
   - red: `theme.dangerText` / `theme.danger`
3. Text colors: Use theme-appropriate contrasting colors for each status

**Estimated instances:** 8 color updates

---

### 4. **BaseScheduleManager.jsx** (Base Schedule Tab)
**File:** `src/BaseScheduleManager.jsx`

**Issues Found:**
- Line 327: `backgroundColor: '#10b981', color: 'white'` - Create button
- Line 382: `color: theme.textPrimary` - Already uses theme (keep)
- Line 515: `backgroundColor: '#16a34a', color: 'white'` - Save button
- Line 531: `color: '#374151'` - Employee name text
- Line 534: `color: '#6b7280'` - Time display text
- Line 544: `backgroundColor: '#007bff', color: 'white'` - Edit button
- Line 558: `backgroundColor: '#dc2626', color: 'white'` - Delete button
- Line 583: `backgroundColor: '#dbeafe', border: '1px solid #3b82f6'` - Info box

**Changes Needed:**
1. Create button: `theme.success, color: 'white'`
2. Save button: `theme.success, color: 'white'`
3. Employee name (#374151): `theme.textPrimary`
4. Time display (#6b7280): `theme.textSecondary`
5. Edit button (#007bff): `theme.primary` (or create theme.primary = '#007bff')
6. Delete button (#dc2626): `theme.danger, color: 'white'`
7. Info box: `theme.infoBg, border: theme.infoBorder` (may need to add to theme)

**Estimated instances:** 13 color updates

---

### 5. **TimeOffRequest.jsx** (Request Time-Off Tab)
**File:** `src/TimeOffRequest.jsx`

**Issues Found (50+ matches!):**
- Line 358: `border: '1px solid #d1d5db'` - Input border (Employee select)
- Line 383: `color: #fca5a5 / #dc2626` - Error text with dark mode check
- Line 401: `border: '1px solid #d1d5db'` - Request type select
- Line 425: `border: '1px solid #d1d5db'` - Start date input
- Line 430: `color: '#6b7280'` - Help text
- Line 452: Already uses `theme.bgSecondary` / `theme.inputBg` (keep)
- Line 458: `color: theme.textSecondary` (keep)
- Line 470: `color: theme.textSecondary` (keep)
- Line 486: `border: '1px solid #d1d5db'` - Start time input
- Line 503: `border: '1px solid #d1d5db'` - End time input
- Line 512-513: `backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9'` - Info box (blue)
- Line 536: `border: '1px solid #d1d5db'` - End date input
- Line 561-562: `backgroundColor: '#f8fafc', border: '1px solid #e2e8f0'` - Recurring section
- Line 579: `border: '1px solid #d1d5db'` - Recurrence pattern select
- Line 601: `border: '1px solid #d1d5db'` - Day of week select
- Line 603: `backgroundColor: formData.recurrence_pattern === 'biweekly' ? '#f3f4f6' : 'white'`
- Line 640: `border: '1px solid #d1d5db'` - Until date input
- Line 644: `color: '#6b7280'` - Help text
- Line 651-652: `backgroundColor: '#dbeafe', border: '1px solid #3b82f6'` - Info box
- Line 671: `backgroundColor: loading ? '#9ca3af' : '#10b981', color: 'white'` - Submit button
- Lines 691-697: Success/error message (already has dark mode checks)
- Lines 710-712: Warning banner (already has dark mode checks)
- Line 721: `backgroundColor: theme.cardBg` (keep)
- Lines 728-729: `backgroundColor: '#e5e7eb', border: '1px solid #d1d5db'` - Filter buttons
- Lines 741-742: `backgroundColor: '#e5e7eb', border: '1px solid #d1d5db'` - Filter buttons
- Lines 760-761: `backgroundColor: '#e5e7eb', border: '1px solid #d1d5db'` - Filter buttons
- Line 770: `color: '#6b7280'` - Help text

**Changes Needed:**
1. All input borders (#d1d5db): `theme.inputBorder`
2. All help text (#6b7280): `theme.textSecondary`
3. Info boxes (blue): `theme.infoBg, border: theme.infoBorder`
4. Recurring section bg (#f8fafc): `theme.bgSecondary`
5. Biweekly toggle bg: `theme.bgSecondary : theme.inputBg`
6. Submit button: `backgroundColor: loading ? theme.inputBorder : theme.success`
7. Filter buttons (#e5e7eb): `theme.bgTertiary, border: theme.border`

**Estimated instances:** 35+ color updates (many are repeated patterns)

---

### 6. **AvailabilityManager.jsx** (My Availability Tab)
**File:** `src/AvailabilityManager.jsx`

**Issues Found:**
- Lines 30-32: Hardcoded status option colors
  - green: `#16a34a`
  - yellow: `#f59e0b`
  - red: `#ef4444`
- Line 183: `isDark ? theme.inputBg : '#e5e7eb'` - Default cell background
- Lines 189-191: Dark mode status backgrounds
  - green: `#166534`
  - yellow: `#854d0e`
  - red: `#991b1b`
- Lines 196-199: Light mode status backgrounds
  - green: `#4ade80`
  - yellow: `#fbbf24`
  - red: `#f87171`
  - default: `#e5e7eb`
- Line 249: `color: theme.textSecondary` (keep)
- Line 266: `color: theme.textSecondary` (keep)
- Line 300: `color: theme.textSecondary` (keep)
- Line 330: `color: theme.textSecondary` (keep)
- Line 360: `color: theme.textSecondary` (keep)
- Line 494: `backgroundColor: loading ? theme.inputBorder : '#2563eb'` - Save button
- Line 495: `color: 'white'` - Save button text
- Lines 516-517: Message colors with hardcoded error/success colors
  - Error text: `#ef4444`
  - Success text: `#16a34a`
  - Error border: `#991b1b`
  - Success border: `#16a34a`
- Line 526: `backgroundColor: theme.bgTertiary` (keep)

**Changes Needed:**
1. Status option colors: Consider using theme properties or create constants
2. Default cell bg (#e5e7eb): `theme.bgSecondary`
3. Dark mode status backgrounds: Use theme.successBg/warningBg/dangerBg
4. Light mode status backgrounds: Use theme success/warning/danger variants
5. Save button (#2563eb): `theme.primary` (needs to be added to theme)
6. Message error text: `theme.dangerText`
7. Message success text: `theme.successText`
8. Message borders: `theme.dangerBorder` / `theme.successBorder`

**Estimated instances:** 23 color updates

---

### 7. **UserManagement.jsx** (User Management Tab)
**File:** `src/UserManagement.jsx`

**Good news:** Already mostly uses theme! Only 4 matches found, all already using theme properties:
- Line 253: `color: theme.textSecondary` ✅
- Line 376: `color: theme.textSecondary` ✅
- Line 551: `color: theme.textPrimary` ✅
- Line 619: `color: theme.textSecondary` ✅

**Status:** ✅ **COMPLETE** - No changes needed!

---
- Line 359: `backgroundColor: '#f9fafb'` - Day header
- Line 373: `- Line 217: `backgroundColor: '#f8fafc'` - Container background
- Line 359: `backgroundColor: '#f9fafb'` - Day header
- Line 373: `backgroundColor: editing === entry.id ? '#fff3cd' : 'white'` - Entry cards

**Changes Needed:**
1. Import `theme` utility
2. Container backgrounds: `theme.cardBg`
3. Day headers: `theme.bgSecondary`
4. Entry cards: 
   - Normal: `theme.cardBg`
   - Editing: `isDark ? '#854d0e' : '#fff3cd'` (dark yellow)
5. Text colors: `theme.textPrimary`, `theme.textSecondary`
6. Borders: `theme.border`
7. Input fields: `theme.inputBg`, `theme.inputBorder`
8. Labels: `theme.labelColor`
9. "Add New Entry" section backgrounds
10. Time input fields

**Estimated instances:** 20-25 color updates

---

### 6. **UserManagement.jsx** (User Management Tab)
**File:** `src/UserManagement.jsx`

**Status:** ✅ **COMPLETE** - Already uses theme throughout!

---` - Entry cards

**Changes Needed:**
1. Import `theme` utility
2. Container backgrounds: `theme.cardBg`
3. Day headers: `theme.bgSecondary`
4. Entry cards: 
   - Normal: `theme.cardBg`
   - Editing: `isDark ? '#854d0e' : '#fff3cd'` (dark yellow)
5. Text colors: `theme.textPrimary`, `theme.textSecondary`
6. Borders: `theme.border`
7. Input fields: `theme.inputBg`, `theme.inputBorder`
8. Labels: `theme.labelColor`
9. "Add New Entry" section backgrounds
10. Time input fields

**Estimated instances:** 20-25 color updates

---

### 6. **UserManagement.jsx** (User Management Tab)
**File:** `src/UserManagement.jsx`

**Issues Found:**
- Line 260: `backgroundColor: '#f8f9fa'` - Container background
- Line 297: `backgroundColor: '#f8f9fa'` - Filter section
- Line 450: `backgroundColor: user.is_active ? '#f9f9f9' : '#f5f5f5'` - User cards

**Changes Needed:**
1. Import `theme` utility
2. Container backgrounds: `theme.cardBg`
3. Filter section: `theme.cardBg`
4. User cards:
   - Active: `theme.cardBg`
   - Inactive: `theme.bgSecondary` with reduced opacity
5. Text colors: `theme.textPrimary`, `theme.textSecondary`
6. Borders: `theme.border`
7. Input fields: `theme.inputBg`, `theme.inputBorder`, `theme.textPrimary`
8. Labels: `theme.labelColor`
9. Status badges with dark mode support
10. Role badges with appropriate colors

**Estimated instances:** 15-20 color updates

---

## Implementation Pattern

For each component, follow this pattern:

### 1. Import theme utility
```javascript
import { theme } from './theme';
```

### 2. Replace hardcoded backgrounds
```javascript
// Before:
backgroundColor: '#f9fafb'

// After:
backgroundColor: theme.cardBg
```

### 3. Replace text colors
```javascript
// Before:
color: '#374151'

// After:
color: theme.textPrimary
```

### 4. Replace semantic colors with dark mode support
```javascript
// Before:
backgroundColor: '#f0fdf4'  // Light green success

// After:
backgroundColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#166534' : '#f0fdf4'
```

### 5. Replace input fields
```javascript
// Before:
backgroundColor: 'white',
border: '1px solid #d1d5db',
color: '#111'

// After:
backgroundColor: theme.inputBg,
border: `1px solid ${theme.inputBorder}`,
color: theme.textPrimary
```

---

## Color Reference

### Theme Variables (from theme.js)
- `theme.bgPrimary` - Main background
- `theme.bgSecondary` - Secondary background (lighter/darker than primary)
- `theme.cardBg` - Card backgrounds
- `theme.textPrimary` - Primary text
- `theme.textSecondary` - Secondary/muted text
- `theme.labelColor` - Form labels
- `theme.border` - Border colors
- `theme.inputBg` - Input backgrounds
- `theme.inputBorder` - Input borders

### Semantic Colors (Dark Mode / Light Mode)
- **Success Green:** `#166534` / `#f0fdf4`
- **Error Red:** `#991b1b` / `#fef2f2`
- **Warning Yellow:** `#854d0e` / `#fffbeb`
- **Info Blue:** `#075985` / `#f0f9ff`
- **Editing Yellow:** `#854d0e` / `#fff3cd`

### Status Colors (for shift cards, badges)
- **Staff Green (dark/light):** `#166534` / `#f0fdf4`
- **Manager Blue (dark/light):** `#075985` / `#f0f9ff`
- **Tech Purple (dark/light):** `#581c87` / `#faf5ff`

---

## Testing Checklist

After implementing fixes, test each component in both modes:

### Light Mode
- [ ] All text is readable (dark on light)
- [ ] All backgrounds are light
- [ ] Borders are visible but subtle
- [ ] Form inputs have light backgrounds

### Dark Mode
- [ ] All text is readable (light on dark)
- [ ] All backgrounds are dark
- [ ] No white text on light backgrounds
- [ ] Semantic colors use dark backgrounds with light text
- [ ] Form inputs have dark backgrounds
- [ ] Status badges are readable

---

## Priority Order

1. **AddEmployee.jsx** ⚠️ CRITICAL - Fix "theme is not defined" error
2. **TimeOffRequest.jsx** - 35+ instances (but many are repeated patterns)
3. **AvailabilityManager.jsx** - 23 instances, button colors
4. **EmployeeList.jsx** - 18 instances, form inputs
5. **BaseScheduleManager.jsx** - 13 instances
6. **AvailabilityOverview.jsx** - 8 instances, status colors

---

## Estimated Total Work
- **Components:** 6 remaining (1 complete: UserManagement.jsx)
- **Color updates:** ~119 instances
- **Theme additions needed:** primary, infoBg, infoBorder, infoText
- **Time estimate:** 2-3 hours
- **Testing time:** 45 minutes

---

## Notes
- Use `window.matchMedia('(prefers-color-scheme: dark)').matches` for inline conditional colors
- Keep consistent with existing patterns from completed components
- Test all interactive states (hover, editing, disabled, etc.)
- Ensure all modals and overlays also support dark mode

How can users reset their own password?