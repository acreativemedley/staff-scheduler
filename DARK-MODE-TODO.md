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

## Remaining Components to Fix

### 1. **EmployeeList.jsx** (Employees Tab)
**File:** `src/EmployeeList.jsx`

**Issues Found:**
- Line 239: `backgroundColor: editingEmployee === employee.id ? '#fff3cd' : '#f9f9f9'`
  - Need: `backgroundColor: editingEmployee === employee.id ? (isDark ? '#854d0e' : '#fff3cd') : theme.cardBg`
- Employee card borders need `theme.border`
- Text colors need `theme.textPrimary` and `theme.textSecondary`
- Input fields need `theme.inputBg`, `theme.inputBorder`, `theme.textPrimary`
- Edit mode header color needs adjustment for dark mode

**Estimated instances:** 10-15 color updates

---

### 2. **AvailabilityOverview.jsx** (Team Availability Tab)
**File:** `src/AvailabilityOverview.jsx`

**Issues Found:**
- Line 172: `backgroundColor: 'white'` - Table background
- Line 180: `backgroundColor: '#f3f4f6'` - Table header
- Line 212: `backgroundColor: '#f9fafb'` - Row backgrounds
- Line 259: `backgroundColor: '#f9fafb'` - Summary card
- Line 289: `backgroundColor: '#f3f4f6'` - Info boxes

**Changes Needed:**
1. Import `theme` utility
2. Table background: `theme.cardBg`
3. Table headers: `theme.bgSecondary`
4. Row alternating colors: `theme.cardBg` and `theme.bgSecondary`
5. Text colors: `theme.textPrimary`, `theme.textSecondary`
6. Borders: `theme.border`
7. Summary cards: `theme.cardBg`

**Estimated instances:** 15-20 color updates

---

### 3. **AvailabilityManager.jsx** (My Availability Tab - Additional Sections)
**File:** `src/AvailabilityManager.jsx`

**Remaining Issues:**
- Line 515: Message backgrounds need dark mode variants
  - Success: `#166534` (dark) vs `#f0fdf4` (light)
  - Error: `#991b1b` (dark) vs `#fef2f2` (light)
- Line 526: Info box `backgroundColor: '#f3f4f6'` → `theme.bgSecondary`
- Message text colors need adjustment for dark mode

**Changes Needed:**
1. Success/error message backgrounds with dark mode support
2. Info box at bottom: use `theme.bgSecondary`
3. Message text: use appropriate contrast colors

**Estimated instances:** 3-5 color updates

---

### 4. **TimeOffRequest.jsx** (Request Time-Off Tab - Quick Actions)
**File:** `src/TimeOffRequest.jsx`

**Remaining Issues:**
- Line 357: `color: '#6b7280'` - Help text
- Line 384: `color: '#6b7280'` - Info text
- Line 438: `backgroundColor: '#f0f9ff'` - Info box (blue)
- Line 487: `backgroundColor: '#f8fafc'` - Recurring pattern info
- Line 529: `backgroundColor: formData.recurrence_pattern === 'biweekly' ? '#f3f4f6' : 'white'`
- Line 570: `color: '#6b7280'` - Help text
- Line 692: `color: '#6b7280'` - Italic text

**Changes Needed:**
1. All help/info text: `theme.textSecondary`
2. Info boxes: `theme.cardBg` or themed backgrounds
3. Recurring pattern selector background
4. Labels: `theme.labelColor`

**Estimated instances:** 8-10 color updates

---

### 5. **BaseScheduleManager.jsx** (Base Schedule Tab)
**File:** `src/BaseScheduleManager.jsx`

**Issues Found:**
- Line 217: `backgroundColor: '#f8fafc'` - Container background
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

1. **AvailabilityOverview.jsx** (Team Availability) - Most visible, table-heavy
2. **BaseScheduleManager.jsx** (Base Schedule) - Critical for setup
3. **UserManagement.jsx** (User Management) - Admin functionality
4. **EmployeeList.jsx** (Employees) - Complete remaining fixes
5. **TimeOffRequest.jsx** (Request Time-Off) - Polish quick actions
6. **AvailabilityManager.jsx** (My Availability) - Final touches

---

## Estimated Total Work
- **Components:** 6 remaining
- **Color updates:** ~80-100 instances
- **Time estimate:** 1-2 hours
- **Testing time:** 30 minutes

---

## Notes
- Use `window.matchMedia('(prefers-color-scheme: dark)').matches` for inline conditional colors
- Keep consistent with existing patterns from completed components
- Test all interactive states (hover, editing, disabled, etc.)
- Ensure all modals and overlays also support dark mode
