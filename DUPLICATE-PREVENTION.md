# Duplicate Time-Off Request Prevention

## Problem
The system was allowing employees to submit duplicate time-off requests for the same dates, which could cause:
- Confusion about which request is active
- Double-counting in reports
- Schedule conflicts appearing multiple times
- Difficulty managing/deleting requests

## Solution Implemented

### 1. Time-Off Request Form (`TimeOffRequest.jsx`)
Added intelligent duplicate detection with three levels of checking:

#### Level 1: Exact Duplicate Detection (BLOCKS submission)
- Checks for requests with identical start_date AND end_date
- Excludes recurring pattern parents (parent_request_id is null)
- **Example**: Submitting "Dec 24" when "Dec 24" already exists → BLOCKED

#### Level 2: Single-Day Duplicate Detection (BLOCKS submission)  
- For single-day requests only (start_date = end_date)
- Blocks if exact same day already has time-off
- Ignores recurring pattern parents to avoid false positives
- **Example**: Submitting "Dec 24" when "Dec 24" exists from recurring pattern → BLOCKED

#### Level 3: Multi-Day Overlap Detection (WARNS but ALLOWS)
- For multi-day requests (start_date ≠ end_date)
- Shows confirmation dialog listing overlapping days
- User can choose to continue or cancel
- **Example**: Lisa requests "Dec 21-27" (full week) and has recurring Saturday "Dec 25" → Shows warning with list of overlapping days → User confirms → ALLOWED

**User Experience:**
- **Exact duplicates**: Alert blocks submission, shows existing request details
- **Single-day duplicates**: Alert blocks submission, directs to Time-Off Manager
- **Multi-day overlaps**: Confirmation dialog lists overlapping dates, asks user to confirm
  - Dialog shows: "This request includes X day(s) that already have time-off: [dates]"
  - User can click OK to continue or Cancel to abort
  - Helpful message: "This might be expected (e.g., recurring Saturdays within a vacation week)"

### 2. Occurrence Creation (`TimeOffManager.jsx`)
Added duplicate prevention when manually creating recurring occurrences:

**Check Logic:**
- Before creating a new occurrence, checks if employee already has time-off on that specific date
- Queries: `employee_id = X AND start_date = occurrence_date`

**User Experience:**
- If duplicate found: Shows alert with date and existing reason
- Returns null (doesn't create the duplicate)
- Message guides user to check existing requests

## Files Modified
1. `src/TimeOffRequest.jsx` - Lines 163-260 (smart duplicate checking with three levels)
2. `src/TimeOffManager.jsx` - Lines 257-278 (duplicate checking in createOccurrence)
3. `src/ScheduleGenerator.jsx` - Lines 154-169 (cache-busting for fresh data)

## Testing Scenarios

### Test 1: Exact Duplicate - Single Day (Should BLOCK)
1. Submit time-off for "2025-12-24" (Christmas Eve)
2. Try to submit another request for "2025-12-24"
3. **Expected**: ❌ Alert blocks submission: "Duplicate Request Detected"

### Test 2: Exact Duplicate - Multi-Day Range (Should BLOCK)
1. Submit time-off for "2025-12-23" through "2025-12-26"
2. Try to submit identical request: "2025-12-23" through "2025-12-26"
3. **Expected**: ❌ Alert blocks submission: "identical time-off request"

### Test 3: Multi-Day Request with Recurring Overlap (Should WARN + ALLOW)
1. Lisa has recurring Saturday time-off (e.g., every other Saturday including Dec 25)
2. Lisa submits vacation: "2025-12-21" through "2025-12-27" (full week)
3. **Expected**: ℹ️ Confirmation dialog shows:
   - "This request includes 1 day(s) that already have time-off: 2025-12-25"
   - "This might be expected (e.g., recurring Saturdays within a vacation week)"
   - User clicks OK → Request is ALLOWED ✅
4. Result: Lisa has time-off for entire week, including the Saturday that was already in recurring pattern

### Test 4: Single Day Already in Recurring Pattern (Should BLOCK)
1. Lisa has recurring Saturday time-off including "2025-12-25"
2. Try to submit single-day request for just "2025-12-25"
3. **Expected**: ❌ Alert blocks: "already has time-off on 2025-12-25"

### Test 5: Different Employees - Same Date (Should ALLOW)
1. Submit time-off for Employee A on "2025-12-24"
2. Submit time-off for Employee B on "2025-12-24"
3. **Expected**: ✅ Both succeed (different employees can have same day off)

## Edge Cases Handled
- ✅ If duplicate check query fails (network/database issue), allows submission (fails open)
- ✅ Excludes recurring pattern parents from duplicate checks (only checks actual instances)
- ✅ Multi-day requests with overlapping recurring days → WARNS but ALLOWS (e.g., week-long vacation including recurring Saturday)
- ✅ Single-day requests matching existing days → BLOCKS completely
- ✅ Exact duplicate ranges → BLOCKS with detailed error
- ✅ Provides helpful, context-aware error messages
- ✅ Differentiates between single-day and multi-day requests
- ✅ Allows same dates for different employees
- ✅ Shows list of specific overlapping dates (up to 5) in confirmation dialog

## Real-World Example: Lisa's Week Off

**Scenario**: Lisa has every other Saturday off (recurring pattern). She wants to take a full week vacation Dec 21-27, which includes one of her recurring Saturdays (Dec 25).

**Old Behavior** (❌ Too strict):
- System blocks entire week-long request
- Error: "Duplicate detected"
- Lisa frustrated - has to manually work around the Saturday

**New Behavior** (✅ Smart):
1. System detects overlap: Saturday Dec 25 already has time-off
2. Shows confirmation: "This request includes 1 day(s) that already have time-off: 2025-12-25. This might be expected (e.g., recurring Saturdays within a vacation week). Do you want to continue?"
3. Lisa clicks OK
4. Request submitted successfully
5. Schedule shows Lisa off entire week Dec 21-27
6. No duplicate entries - the week-long request covers the recurring Saturday

**Result**: Lisa gets her full week off without hassle! 🎉

## Known Limitations
1. **Partial Day Requests**: Currently checks date-level duplicates. Two partial day requests on same day (different hours) will be flagged as duplicate. This is intentional to keep schedule management simple.
2. **Race Conditions**: If two requests are submitted simultaneously (unlikely), both might pass the duplicate check. Database should handle via constraints if needed.
3. **Performance**: For employees with 100+ time-off requests, duplicate check queries up to 20 overlapping requests for performance.
4. **Overlapping Multi-Day Ranges**: If submitting "Dec 20-30" when "Dec 24-26" already exists, system will warn about the 3 overlapping days but allow submission. Both ranges will exist in database. This is by design to allow flexibility.

## Future Enhancements
- [ ] Add database-level unique constraint with smart conflict resolution
- [ ] In Time-Off Manager, show visual indicators when dates overlap with other requests
- [ ] Add "Merge overlapping requests" feature to consolidate ranges
- [ ] Consider auto-deleting covered recurring instances when broader range is submitted
- [ ] Add similar warning check in edit/update flows
- [ ] Allow multiple partial-day requests on same day with different time ranges

## Related Issues Fixed
- Deletion of single recurring occurrences now working correctly
- ScheduleGenerator now fetches fresh data (added `.order()` to prevent caching)
- Time-off requests no longer filtered by approval status
