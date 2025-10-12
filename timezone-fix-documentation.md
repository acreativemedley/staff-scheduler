# Time Zone Fix - Schedule Default Hours

## Problem
When adding an employee to the weekly schedule, the default shift times were appearing one hour earlier than the configured store hours (e.g., 9:00 AM instead of 10:00 AM).

## Root Cause
PostgreSQL `TIME` type values from Supabase were potentially being returned with timezone context that caused misinterpretation when used directly in the application. This is a common issue when:

1. Database timezone differs from client timezone
2. TIME values are transmitted through REST API (PostgREST) with timezone information
3. JavaScript interprets time strings with implicit timezone assumptions

## Solution

### 1. Created Time Utility Module (`timeUtils.js`)
Added robust time extraction utilities to handle various time formats:

- **`extractTimeOnly(timeValue)`** - Extracts HH:MM format from various inputs:
  - Plain time strings: "10:00", "10:00:00"
  - Time with timezone: "10:00:00-05:00", "10:00:00+00:00"
  - ISO timestamps: "2024-01-01T10:00:00Z"
  - Date objects

- **`normalizeTime(timeValue, defaultValue)`** - Ensures consistent HH:MM format with fallback

### 2. Updated Schedule Generator
Modified two key functions in `ScheduleGenerator.jsx`:

**`generateDayShifts(template, date)`**
- Now normalizes `template.store_open_time` and `template.store_close_time` before using them
- Ensures auto-generated shifts use correct store hours

**`handleEmployeeSelection(selectedEmployee)`**
- Normalizes template times before assigning to new manual shifts
- Fixes the issue when managers manually add employees to schedule

### 3. Added Diagnostic Logging
Added console logging (🕒 emoji prefix) to track:
- Raw time values from database
- Data types of time values
- Normalized/extracted time values
- Helps diagnose future timezone issues

## Files Modified

1. **`src/timeUtils.js`** - New file with time normalization utilities
2. **`src/ScheduleGenerator.jsx`** - Updated to use normalizeTime function
3. **`check-timezone.sql`** - SQL diagnostic queries for Supabase

## Testing

To verify the fix:

1. Navigate to the Weekly Schedule view
2. Click "+ Add Employee" on any day
3. Select an employee from the modal
4. Check the console logs (F12) for 🕒 emoji messages showing:
   - Raw time values from template
   - Normalized time values
5. Verify the shift displays with correct store hours (e.g., 10:00 AM - 6:00 PM)

## Console Log Example (Expected Output)

```
🕒 Adding employee - Day of week: 1
🕒 Template found: {day_of_week: 1, store_open_time: "10:00:00", ...}
🕒 Raw store_open_time: 10:00:00 Type: string
🕒 Raw store_close_time: 18:00:00 Type: string
🕒 Normalized start time: 10:00
🕒 Normalized end time: 18:00
```

## Database Timezone Configuration

If issues persist, check your Supabase database timezone setting:

```sql
-- Run in Supabase SQL Editor
SHOW timezone;

-- View current template times
SELECT day_of_week, store_open_time, store_close_time
FROM schedule_templates
ORDER BY day_of_week;
```

## Prevention

Going forward:
- Always use `normalizeTime()` when retrieving TIME values from database
- Avoid using `new Date()` constructor on TIME strings without timezone awareness
- Use the timeUtils module for any time-related parsing
- Keep diagnostic logging during development to catch timezone issues early

## Related Issues

This fix also ensures consistency for:
- Base schedule generation
- Manual shift additions
- Template-based scheduling
- Any future features using schedule templates

## Alternative Solutions Considered

1. **Change database column type to TEXT** - Rejected because TIME type provides better validation
2. **Always store times in UTC** - Not applicable for TIME type which has no date component
3. **Client-side timezone detection** - Too complex and unreliable
4. **Server-side timezone normalization** - Would require API changes; client-side fix is simpler

## References

- PostgreSQL TIME type documentation: https://www.postgresql.org/docs/current/datatype-datetime.html
- Supabase PostgREST timezone behavior: https://postgrest.org/en/stable/references/api/tables_views.html
- JavaScript Date timezone pitfalls: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format
