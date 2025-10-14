# Duplicate Detection Logic - Visual Guide

## Decision Tree

```
┌─────────────────────────────────────────────┐
│  User submits time-off request             │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  Query existing overlapping requests        │
│  (same employee, overlapping date range)    │
└─────────────┬───────────────────────────────┘
              │
              ▼
       ┌──────┴──────┐
       │ Any overlap? │
       └──────┬──────┘
              │
      ┌───────┴────────┐
      │                │
     NO               YES
      │                │
      ▼                ▼
   ✅ ALLOW    ┌─────────────────┐
              │ Check type...    │
              └────┬────────┬────┘
                   │        │
          ┌────────┘        └────────┐
          │                          │
    EXACT MATCH              PARTIAL OVERLAP
    (start=start            (some days overlap
     AND end=end)            but not exact)
          │                          │
          ▼                          ▼
    ❌ BLOCK              ┌──────────────┐
    "Duplicate           │ Request type? │
     detected"           └───┬──────┬───┘
                             │      │
                    ┌────────┘      └────────┐
                    │                        │
              SINGLE-DAY              MULTI-DAY
              (start=end)              (start≠end)
                    │                        │
                    ▼                        ▼
              ❌ BLOCK              ⚠️ WARN + CONFIRM
              "Already has         "This includes N days
               time-off on          that already have
               this date"           time-off: [dates].
                                    Continue?"
                                           │
                                    ┌──────┴──────┐
                                    │             │
                                   YES           NO
                                    │             │
                                    ▼             ▼
                                ✅ ALLOW      ❌ CANCEL
```

## Examples

### Example 1: Exact Duplicate (BLOCKED ❌)
```
Existing:  Dec 24 ━━━━━━━━━━━━━━━━ Dec 24
Submitted: Dec 24 ━━━━━━━━━━━━━━━━ Dec 24
Result:    ❌ BLOCKED - "Duplicate Request Detected"
```

### Example 2: Single Day Already Exists (BLOCKED ❌)
```
Existing:  Dec 25 ━━━━━━━━━━━━━━━━ Dec 25 (recurring Saturday)
Submitted: Dec 25 ━━━━━━━━━━━━━━━━ Dec 25
Result:    ❌ BLOCKED - "Already has time-off on 2025-12-25"
```

### Example 3: Week Including Recurring Day (WARNED + ALLOWED ✅)
```
Existing:  Dec 25 ━━━━━━━━━━━━━━━━ Dec 25 (recurring Saturday)
Submitted: Dec 21 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Dec 27 (vacation week)
           └──────────────┼─────────────────┘
                     overlaps here (Dec 25)
Result:    ⚠️ Warning dialog:
           "This request includes 1 day(s) that already have time-off:
            2025-12-25
            
            This might be expected (e.g., recurring Saturdays within
            a vacation week).
            
            Do you want to continue submitting this request?"
           
           User clicks OK → ✅ ALLOWED
```

### Example 4: Overlapping Multi-Day Ranges (WARNED + ALLOWED ✅)
```
Existing:  Dec 24 ━━━━━━━━ Dec 26
Submitted: Dec 20 ━━━━━━━━━━━━━━━━━━━━━━━━ Dec 30
           └──────────┼────┼────┼──────────┘
                overlaps: 24, 25, 26
Result:    ⚠️ Warning: "includes 3 day(s) that already have time-off"
           User confirms → ✅ ALLOWED
```

### Example 5: Different Employees Same Day (ALLOWED ✅)
```
Employee A: Dec 24 ━━━━━━━━━━━━━━━━ Dec 24
Employee B: Dec 24 ━━━━━━━━━━━━━━━━ Dec 24
Result:     ✅ ALLOWED - Different employees can have same days off
```

## Business Rules Summary

| Scenario | Action | Reason |
|----------|--------|--------|
| Exact duplicate (same start & end) | ❌ BLOCK | True duplicate - no valid reason to submit twice |
| Single day already exists | ❌ BLOCK | Likely mistake - one day shouldn't be requested twice |
| Multi-day with overlap | ⚠️ WARN then ✅ ALLOW | Valid use case - vacation week including recurring day |
| Different employees | ✅ ALLOW | Normal - multiple people can have same days off |
| No overlap | ✅ ALLOW | Normal - new time-off request |

## UI Messages

### Blocking Message (Single Day)
```
⚠️ Duplicate Request Detected

This employee already has time-off on 2025-12-25.

Reason: Every other Saturday off

Please check the Time-Off Manager to view existing requests.

[OK]
```

### Blocking Message (Exact Range)
```
⚠️ Duplicate Request Detected

This employee already has an identical time-off request 
for 2025-12-24 through 2025-12-26.

Reason: Christmas Holiday

Please check the Time-Off Manager to view or edit the 
existing request.

[OK]
```

### Warning Message (Multi-Day with Overlap)
```
ℹ️ Overlapping Time-Off Detected

This request includes 1 day(s) that already have time-off:
2025-12-25

This might be expected (e.g., recurring Saturdays within 
a vacation week).

Do you want to continue submitting this request?

[Cancel]  [OK]
```

## Code Location

**File**: `src/TimeOffRequest.jsx`  
**Lines**: 163-260  
**Function**: `submitRequest()`
