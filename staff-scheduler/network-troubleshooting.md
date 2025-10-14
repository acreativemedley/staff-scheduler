# Network Connectivity Troubleshooting

The error `net::ERR_NAME_NOT_RESOLVED` means your computer cannot find the Supabase server. Here's how to fix it:

## Step 1: Test Network Connection

Open PowerShell (as Administrator if possible) and run these commands:

```powershell
# Test basic internet connectivity
ping google.com

# Test DNS resolution for your Supabase URL
nslookup sawgzphbmpwesfeurighd.supabase.co

# Test if you can reach Supabase
curl -I https://sawgzphbmpwesfeurighd.supabase.co
```

## Step 2: Common Fixes

### Option A: Flush DNS Cache
```powershell
ipconfig /flushdns
```

### Option B: Try Different DNS Servers
1. Go to Network Settings → Change Adapter Options
2. Right-click your network connection → Properties
3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
4. Choose "Use the following DNS server addresses":
   - Preferred: 8.8.8.8 (Google)
   - Alternate: 8.8.4.4 (Google)
5. Click OK and restart your browser

### Option C: Check Firewall/Antivirus
- Temporarily disable Windows Firewall
- Temporarily disable antivirus real-time protection
- Try accessing the app again

### Option D: Try a Different Network
- Try using your phone's hotspot
- Or try a different WiFi network
- This will help determine if it's your specific network blocking Supabase

## Step 3: Alternative - Use a Different Supabase Project

If the network issue persists, you can create a new Supabase project:

1. Go to supabase.com
2. Create a new project 
3. Update your .env file with the new credentials
4. Run the database setup SQL in the new project

## Step 4: Test in Different Browsers

Try opening the app in:
- Microsoft Edge
- Firefox
- Chrome Incognito mode

Sometimes browser extensions or cache can cause issues.

Let me know what the PowerShell commands show!

---

## Google Calendar Integration - CORS Proxy Issues

### Problem: Calendar Events Not Showing / 408 Timeout Errors

**Symptoms:**
- Weekly schedule shows mock events instead of real Google Calendar events
- Console shows `408 Request Timeout` errors
- Message: `Proxy request failed with status 408`

**Root Cause:**
The CORS proxy service (used to bypass browser security restrictions when fetching public calendar data) may be slow, down, or timing out.

### Solution: Multiple CORS Proxy Fallback System

The app now implements a fallback chain of CORS proxy services:

1. **corsproxy.io** (Primary - fastest)
2. **api.allorigins.win** (Backup)
3. **cors-anywhere.herokuapp.com** (Last resort)

**Implementation Details:**
```javascript
const proxies = [
  { name: 'corsproxy.io', url: `https://corsproxy.io/?${encodeURIComponent(icalUrl)}`, direct: true },
  { name: 'api.allorigins.win', url: `https://api.allorigins.win/get?url=${encodeURIComponent(icalUrl)}`, direct: false },
  { name: 'cors-anywhere (backup)', url: `https://cors-anywhere.herokuapp.com/${icalUrl}`, direct: true }
];
```

**Features:**
- 10-second timeout per proxy attempt
- Automatic fallback if one proxy fails
- Detailed console logging for debugging
- No mock data fallback (shows empty calendar if all fail)

### How to Verify It's Working

1. Open browser DevTools Console (F12)
2. Navigate to Weekly Schedules
3. Look for console messages:
   - `🔍 CALENDAR FETCH: Trying [proxy-name]...`
   - `✅ CALENDAR FETCH: Successfully loaded events using [proxy-name]`
4. If all proxies fail:
   - `❌ CALENDAR FETCH ERROR: All methods failed`
   - Check calendar settings below

### Google Calendar Checklist

If proxies work but no events show:

1. **Calendar Must Be Public:**
   - Go to Google Calendar settings
   - Click on your calendar → "Access permissions"
   - Check "Make available to public"

2. **Verify Calendar ID:**
   - In calendar settings, scroll to "Integrate calendar"
   - Copy the "Calendar ID"
   - Should look like: `fc4e0d1faabf03c4e7f0934b1087b4b244bda5f8d76bc3ae7f278e02e21d82eb@group.calendar.google.com`
   - Verify it matches `GOOGLE_CALENDAR_ID` in `ScheduleGenerator.jsx`

3. **Check Date Range:**
   - Calendar events must be within the week you're viewing
   - Events are filtered by date range

4. **Test iCal Feed Directly:**
   ```
   https://calendar.google.com/calendar/ical/[YOUR_CALENDAR_ID]/public/basic.ics
   ```
   - Open this URL in browser
   - Should download a `.ics` file with calendar data
   - If you get 404/403, calendar isn't public

### Alternative CORS Proxies

If the default proxies don't work, you can add more to the fallback chain:

```javascript
// Other reliable CORS proxies to try:
{ name: 'corsproxy.org', url: `https://corsproxy.org/?${encodeURIComponent(icalUrl)}`, direct: true }
{ name: 'thingproxy', url: `https://thingproxy.freeboard.io/fetch/${icalUrl}`, direct: true }
```

Add these to the `proxies` array in the `fetchGoogleCalendarEvents` function.

### Debugging Console Messages

**Good Messages:**
```
🔍 CALENDAR FETCH: Trying corsproxy.io...
🔍 CALENDAR FETCH: corsproxy.io response status: 200 OK
🔍 CALENDAR FETCH: Parsed iCal events: {...}
✅ CALENDAR FETCH: Successfully loaded events using corsproxy.io
```

**Problem Messages:**
```
⚠️ CALENDAR FETCH: corsproxy.io failed: timeout
⚠️ CALENDAR FETCH: api.allorigins.win failed: 408 Request Timeout
❌ CALENDAR FETCH ERROR: All methods failed to fetch calendar events
```

### Quick Fix Checklist

1. ✅ Calendar is set to public in Google Calendar settings
2. ✅ Calendar ID is correct in the code
3. ✅ iCal URL works when opened directly in browser
4. ✅ At least one CORS proxy is responding (check console)
5. ✅ Events exist in the calendar for the week you're viewing
6. ✅ Internet connection is stable

### When to Use This Documentation

- Calendar events aren't showing on weekly schedule
- See timeout errors in console
- Need to add more proxy fallbacks
- Debugging calendar integration issues
- Setting up calendar integration on new deployment
