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