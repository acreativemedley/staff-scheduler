# Email System - Integration Guide

## Quick Start

### 1. Files Added
The email system consists of these new files:
- `src/EmailNotifications.js` - Core email functionality
- `src/EmailInterface.html` - Web interface for sending/receiving emails
- `src/EmailSystemSetup.js` - Setup and testing utilities
- `EMAIL-SYSTEM-README.md` - Complete documentation

### 2. Initial Setup (One-Time)

Open Google Apps Script editor and run:

```javascript
// Configure manager email
configureManagerEmail()
// Edit the email in the function first!

// Then run all tests to verify
runAllTests()
```

### 3. Deploy Web App

1. In Apps Script editor: **Deploy** → **New deployment**
2. Type: **Web app**
3. Description: "Email System v1.0"
4. Execute as: **Me**
5. Who has access: **Anyone with Google account** (or more restricted)
6. Click **Deploy**
7. Copy the deployment URL

### 4. Access Email Interface

Navigate to: `YOUR_DEPLOYMENT_URL?page=email`

## Adding Email Link to Existing Pages

### Option 1: Add to Navigation Menu

If you have a navigation menu, add this link:

```html
<a href="?page=email">📧 Email</a>
```

### Option 2: Add Email Button to Staff Directory

Edit `StaffDirectory.html` and add:

```html
<div style="text-align: center; margin: 20px;">
  <a href="?page=email" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
    📧 Email Communications
  </a>
</div>
```

### Option 3: Add to Base Schedule Page

Edit `BaseScheduleCreator.html` and add:

```html
<button onclick="window.location.href='?page=email'" style="margin: 10px;">
  📧 Email Staff
</button>
```

## Integration with Schedule Changes

To automatically notify staff when their shifts change, add this to your schedule update function:

```javascript
function updateStaffShift(staffEmail, shiftDetails, changeType) {
  // Your existing shift update code here
  
  // Send notification
  sendShiftChangeNotification(staffEmail, shiftDetails, changeType);
  
  // changeType can be: 'added', 'modified', or 'removed'
}
```

Example usage:

```javascript
// When adding a shift
const shiftDetails = {
  date: '2025-12-15',
  startTime: '10:00 AM',
  endTime: '6:00 PM',
  position: 'Staff'
};
sendShiftChangeNotification('staff@example.com', shiftDetails, 'added');

// When modifying a shift
sendShiftChangeNotification('staff@example.com', shiftDetails, 'modified');

// When removing a shift
sendShiftChangeNotification('staff@example.com', shiftDetails, 'removed');
```

## Permission Requirements

Staff will need to authorize these permissions on first use:
- Send email as the authenticated user
- Read user's email address

This is standard for Gmail API usage.

## Gmail Sending Limits

Be aware of Gmail quotas:
- **Free Gmail accounts**: 100 emails/day
- **Google Workspace**: 1,500 emails/day

The system includes error handling for quota issues.

## Customization

### Change Email Styling

Edit the CSS in `EmailInterface.html` to match your app's theme.

### Customize Email Templates

Edit the email body text in `EmailNotifications.js`:
- `sendEmailToManager()` - Line ~45
- `sendEmailToUser()` - Line ~115
- `sendEmailToAllUsers()` - Line ~165
- `sendEmailToGroup()` - Line ~245
- `sendShiftChangeNotification()` - Line ~595

### Add New Group Types

To add custom group filtering:

1. Add new group type option in `EmailInterface.html`:
```html
<option value="custom-type">By Custom Type</option>
```

2. Add filter function in `EmailNotifications.js`:
```javascript
function getStaffEmailsByCustomType(customValue) {
  // Your filtering logic here
  return emails;
}
```

3. Update `sendEmailToGroup()` to handle new type:
```javascript
else if (groupType === 'custom-type') {
  staffEmails = getStaffEmailsByCustomType(groupValue);
}
```

## Testing Checklist

Before going live:

- [ ] Manager email configured (`configureManagerEmail()`)
- [ ] Test email to manager works (`testEmailToManager()`)
- [ ] Test email to user works (`testEmailToUser()`)
- [ ] Staff database has valid email addresses
- [ ] Position/Role filtering works (`testGetPositions()`, `testGetRoles()`)
- [ ] Web app deployed and accessible
- [ ] Permissions authorized by test users
- [ ] Email notifications appear correctly formatted
- [ ] Reply-to headers work correctly

## Troubleshooting Integration

### Email interface shows "Function not found"
Make sure `EmailNotifications.js` is uploaded to your Apps Script project.

### Can't access ?page=email
Verify the routing code was added to `Code.gs` (done automatically).

### Staff emails not found
Check that `Staff_Data` sheet has an "Email" column with valid addresses.

### Emails going to spam
- Use professional, clear subject lines
- Keep message content clean and formatted
- Ensure manager email is verified in Gmail

## Advanced: Create Email Navigation Page

Create a central navigation page with all app features:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Staff Scheduling - Home</title>
  <style>
    body { font-family: Arial; padding: 20px; background: #f5f5f5; }
    .nav-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
    .nav-card { background: white; padding: 30px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .nav-card a { color: #667eea; text-decoration: none; font-size: 18px; font-weight: bold; }
    .nav-card p { margin-top: 10px; color: #666; }
  </style>
</head>
<body>
  <h1>Staff Scheduling System</h1>
  <div class="nav-grid">
    <div class="nav-card">
      <a href="?page=staff">👥 Staff Directory</a>
      <p>View and manage staff</p>
    </div>
    <div class="nav-card">
      <a href="?page=base-schedule">📅 Base Schedule</a>
      <p>Create weekly schedules</p>
    </div>
    <div class="nav-card">
      <a href="?page=email">📧 Email Communications</a>
      <p>Send emails to staff</p>
    </div>
  </div>
</body>
</html>
```

Save as `Home.html` and update `Code.gs`:

```javascript
if (page === 'home' || !page) {
  return HtmlService.createHtmlOutputFromFile('Home')
    .setTitle('Staff Scheduling System');
}
```

## Support

For issues or questions:
1. Check `EMAIL-SYSTEM-README.md` for detailed documentation
2. Review Apps Script execution logs
3. Run `viewConfiguration()` to see current setup

---
**Ready to use!** Access via: `YOUR_DEPLOYMENT_URL?page=email`
