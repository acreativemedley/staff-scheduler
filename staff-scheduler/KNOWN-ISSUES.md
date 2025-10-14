# Known Issues & Future Features

## Active Issues

### 🔴 CRITICAL: Row Level Security (RLS) Blocking Schedule Templates
**Status:** Blocked - Needs Further Investigation  
**Priority:** High  
**Date Identified:** October 7, 2025  
**Last Updated:** October 7, 2025

#### Problem Description
Users cannot save or read schedule templates due to Row Level Security (RLS) policy violations in Supabase. This causes employee shifts to default to hardcoded fallback times (09:00-17:00) instead of using configured store hours from templates.

#### Symptoms
1. **Primary Error:** 
   ```
   Error saving templates: new row violates row-level security policy for table 'schedule_templates'
   ```

2. **Secondary Behavior:**
   - Employee shifts default to incorrect times (e.g., 9-5 instead of 10-4 for Saturday)
   - Console logs show empty templates array: `🕒 Available templates: []`
   - Template fetch returns 0 results even though 7 templates exist in database
   - Browser console shows: `🕒 Template found: undefined`

3. **Example Test Case:**
   - Saturday (day_of_week: 6) should use 10:00-16:00 from template
   - Instead uses fallback defaults: 09:00-17:00
   - Database query confirms template exists with correct hours

#### Technical Details
- **Affected Table:** `schedule_templates` in Supabase PostgreSQL
- **Affected Files:**
  - `src/ScheduleGenerator.jsx` - Cannot fetch templates via `fetchScheduleTemplates()`
  - `src/BaseScheduleManager.jsx` - Cannot save templates (assumed)
  - Database: RLS policies preventing SELECT/INSERT operations

- **Database State:**
  - 7 templates confirmed to exist (days 0-6) via direct SQL query
  - Template data is correct (e.g., Saturday: 10:00:00 to 16:00:00)
  - RLS is enabled on `schedule_templates` table
  - Policies appear to be blocking authenticated users

#### Attempted Solutions
1. ✅ **Created timeUtils.js** - Timezone-safe time parsing (precautionary, not the root cause)
2. ✅ **Added diagnostic logging** - Confirmed issue is RLS, not timezone conversion
3. ❌ **Created fix-schedule-templates-rls.sql** - Attempted to repair policies:
   - Dropped 6 potentially conflicting policies
   - Created 4 new permissive policies for authenticated users:
     * `"Enable read access for authenticated users"` - SELECT with USING (true)
     * `"Enable insert for authenticated users"` - INSERT with CHECK (true)
     * `"Enable update for authenticated users"` - UPDATE with USING/CHECK (true)
     * `"Enable delete for authenticated users"` - DELETE with USING (true)
   - **Result:** Executed successfully, but RLS errors persist
4. ❌ **Browser refresh** - No change in behavior after policy update

#### Why Standard Fix Didn't Work
The typical RLS fix (permissive policies with `USING (true)`) did not resolve the issue. Possible reasons:
- Additional RLS policies exist at schema or database level
- Supabase authentication token may not have proper role
- Policy evaluation order or conflicts
- Cached policy state in Supabase
- User profile configuration issue in `user_profiles` table
- Missing policy on related tables that cascade restrictions

#### Workaround (Current State)
Application uses hardcoded fallback defaults in `ScheduleGenerator.jsx`:
- Default start: `'09:00'`
- Default end: `'17:00'`

These defaults are applied via `normalizeTime()` when templates are undefined/empty.

#### Files Created During Investigation
- `staff-scheduler/timeUtils.js` - Time parsing utilities (can be kept for future use)
- `staff-scheduler/fix-schedule-templates-rls.sql` - RLS policy repair script
- `staff-scheduler/verify-and-insert-templates.sql` - Template verification (unused)
- `staff-scheduler/check-timezone.sql` - Timezone diagnostics (ruled out as cause)

#### Code Changes Made
**Modified: `src/ScheduleGenerator.jsx`**
- Line 4: Added import for `timeUtils`
- Lines 102-125: Enhanced `fetchScheduleTemplates()` with 🕒 diagnostic logging
- Lines 710-750: Updated `generateDayShifts()` to use `normalizeTime()`
- Lines 844-870: Enhanced `handleEmployeeSelection()` with extensive logging

**Note:** Diagnostic logging (🕒 prefix) is still in place for future debugging.

#### Next Steps for Future Investigation
1. **Authentication Deep Dive:**
   - Verify user's authentication token and role in Supabase
   - Check `user_profiles` table for user record and permissions
   - Examine JWT claims to ensure `authenticated` role is present
   - Test with service role key to isolate RLS vs. authentication issue

2. **Policy Inspection:**
   - Query all policies across all tables: `SELECT * FROM pg_policies;`
   - Check for schema-level or database-level restrictions
   - Verify policy evaluation order and inheritance
   - Look for policies on `public` schema that might override table policies

3. **Supabase Console Review:**
   - Check RLS toggle status in Supabase dashboard
   - Review policy editor in UI vs. SQL-created policies
   - Check for any "Enable RLS" warnings or notifications
   - Verify policies show as "Active" in dashboard

4. **Alternative Approaches:**
   - Consider service role bypass for admin users
   - Implement server-side function with SECURITY DEFINER
   - Use Supabase stored procedures to encapsulate template access
   - Create view with security definer to bypass RLS
   - Investigate using `auth.uid()` in policy conditions

5. **Testing Strategy:**
   - Create test table with identical structure and policies
   - Test INSERT/SELECT with minimal policy (`USING (auth.role() = 'authenticated')`)
   - Enable query logging in Supabase to see policy evaluation
   - Check Supabase logs for detailed RLS rejection reasons

#### Related Documentation
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL RLS Policies: https://www.postgresql.org/docs/current/sql-createpolicy.html
- Project file: `staff-scheduler/user-access-control-guide.md`
- Project file: `staff-scheduler/user-access-control.sql`

#### Impact Assessment
- **User Experience:** High - Incorrect shift times require manual correction
- **Data Integrity:** Low - Fallback defaults prevent null values
- **Business Logic:** High - Store hours configuration effectively disabled
- **Workaround Available:** Yes - Manual time entry per shift
- **Blocker for Release:** Potentially - Depends on store hour variation requirements

#### Decision
Deferred for future investigation due to:
- Time investment vs. workaround viability
- Need for deeper Supabase RLS/authentication expertise
- Possibility of complex permission model interactions
- Existing fallback mechanism prevents critical failure

---

## Future Features

### Schedule Template Management UI
**Priority:** Medium  
**Related to:** RLS issue above

Once RLS is resolved, consider building a dedicated UI for:
- Editing store hours per day of week
- Preview of how hours affect employee shift defaults
- Template validation and testing
- Bulk update capabilities

---

## Resolved Issues

*(None yet)*

---

## Notes
- Always check this file before debugging similar RLS or template-related issues
- Diagnostic logging with 🕒 emoji is still active in codebase
- Database contains correct template data; problem is access layer only

______________________________________________________________________________________________________________________________

TIME OFF REQUESTS
⚠️ Short Notice: This request is -665767 days in advance. For better schedule planning, we recommend 4+ weeks notice. 