# Debugging Time-Off Deletion Issues

## The Problem
You're trying to delete a single occurrence from a recurring time-off pattern (44 occurrences), but after deletion:
1. The occurrence still shows up in the Time-Off Manager list
2. The occurrence still shows as a conflict in the Schedule

## Changes Made

I've added comprehensive logging to both `TimeOffManager.jsx` and `ScheduleGenerator.jsx` to help diagnose the issue.

## How to Debug

### Step 1: Open Browser Console
1. Open your app in the browser
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Clear the console (click the 🚫 icon)

### Step 2: Navigate to Time-Off Manager
Watch for these console messages:
- `TimeOffManager: Fetching requests...`
- `TimeOffManager: Parent [id] has X instances`
- List of all instance IDs with dates

### Step 3: Try to Delete an Occurrence
1. Find the recurring request
2. Click "Show All 44" to expand all instances
3. Find the date you want to delete
4. Click the "×" button next to that date
5. Confirm the deletion

### Step 4: Watch Console Logs
You should see:
```
Attempting to delete occurrence with ID: [uuid]
Delete result - data: [...]  error: null
Successfully deleted occurrence, refreshing list...
TimeOffManager: Fetching requests...
TimeOffManager: Fetching at timestamp: [number]
TimeOffManager: Total requests fetched: X
TimeOffManager: Parent [id] has Y instances  (should be one less)
Dispatched timeOffUpdated event
ScheduleGenerator: timeOffUpdated event received, refetching time-off requests
ScheduleGenerator: Fetching time-off requests...
ScheduleGenerator: Fetched X approved time-off requests
```

## Things to Check

### Check 1: Is the DELETE successful?
Look for the line: `Delete result - data: [...] error: null`
- If error is NOT null, there's a database permission issue
- If data is empty array, the row might not exist

### Check 2: Is the refresh happening?
Look for: `Successfully deleted occurrence, refreshing list...`
- This should trigger a new fetch
- You should see `TimeOffManager: Fetching at timestamp:`

### Check 3: Is the count decreasing?
Compare the instance count before and after:
- Before: `TimeOffManager: Parent [id] has 44 instances`
- After: `TimeOffManager: Parent [id] has 43 instances`

### Check 4: Is the ScheduleGenerator updating?
Look for: `ScheduleGenerator: timeOffUpdated event received`
- This should trigger the schedule to refresh
- You should see `ScheduleGenerator: Fetched X approved time-off requests`

## Manual Database Check

If the UI isn't updating but the logs show success, check the database directly:

### Using Supabase Dashboard:
1. Go to your Supabase project
2. Click on "Table Editor" in the sidebar
3. Select the `time_off_requests` table
4. Look for the recurring request's instances
5. Filter by `parent_request_id = [your recurring request ID]`
6. Count the rows - should be 43 after deleting one

### Using SQL Editor:
```sql
-- Find your recurring request
SELECT id, employee_id, recurrence_pattern, recurrence_start_date, recurrence_end_date
FROM time_off_requests
WHERE is_recurring = true AND parent_request_id IS NULL
ORDER BY submitted_at DESC
LIMIT 5;

-- Count instances for a specific parent (replace with your parent ID)
SELECT COUNT(*) as instance_count
FROM time_off_requests
WHERE parent_request_id = 'your-parent-uuid-here';

-- See all instances with their dates
SELECT id, start_date, end_date, status
FROM time_off_requests
WHERE parent_request_id = 'your-parent-uuid-here'
ORDER BY start_date;
```

## Common Issues and Solutions

### Issue 1: Browser Cache
**Solution:** Hard refresh the page
- Windows: Ctrl + Shift + R
- Mac: Cmd + Shift + R

### Issue 2: Multiple Tabs Open
**Solution:** Close all tabs with the app and open a fresh one
- Multiple tabs might have stale data
- Events might not propagate between tabs

### Issue 3: Status Not 'approved'
**Solution:** Check if the instance has status='approved'
```sql
SELECT id, start_date, status
FROM time_off_requests
WHERE parent_request_id = 'your-parent-uuid-here'
AND status != 'approved';
```
- ScheduleGenerator only shows approved requests
- If an instance has a different status, it won't show as a conflict

### Issue 4: Database RLS Policies
**Solution:** Verify you have delete permission
```sql
-- Check your current user role
SELECT current_user, session_user;

-- Test delete permission (won't actually delete)
EXPLAIN DELETE FROM time_off_requests WHERE id = 'test-id';
```

## Next Steps

After running through these debug steps, report back with:
1. What the console logs show
2. Whether the database count decreased
3. Any error messages you see

This will help identify exactly where the issue is occurring.
