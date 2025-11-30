# Email Notification System - Documentation

## Overview
The email notification system allows staff members to contact the manager and enables managers to send emails to individual staff, all staff, or specific groups.

## Features

### 1. Contact Manager (Staff)
- Staff can send messages directly to the manager
- Simple form with subject and message fields
- Automatic reply-to configuration for easy manager responses

### 2. Send to Individual (Manager)
- Send email to a specific staff member by email address
- Custom subject and message
- Manager's email set as reply-to

### 3. Send to All Staff (Manager)
- Broadcast email to all active staff members
- Automatic filtering of inactive staff
- Confirmation prompt to prevent accidental sends
- Reports number of successful/failed sends

### 4. Send to Group (Manager)
- Send emails to staff filtered by:
  - **Position** (e.g., "Manager", "Staff", "Supervisor")
  - **Role** (custom roles from your database)
- Dynamically loads available positions and roles
- Confirmation prompt before sending

### 5. Shift Change Notifications (Automatic)
- Automatically notify staff when shifts are:
  - Added
  - Modified
  - Removed
- Includes shift details (date, time, position)

## Setup Instructions

### Initial Configuration

1. **Set Manager Email**
   Run this once in the Apps Script editor:
   ```javascript
   setupManagerEmail('your-email@example.com');
   ```

2. **Deploy Web App**
   - In Apps Script editor, click "Deploy" → "New deployment"
   - Select type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone" or "Anyone with Google account"
   - Click "Deploy"

3. **Access Email Interface**
   The email interface is available at:
   ```
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?page=email
   ```

### Required Permissions
The app requires the following Gmail permissions:
- Send emails as the authenticated user
- Read user email address

Users will be prompted to authorize these permissions on first use.

## Usage

### For Staff Members

#### Contacting the Manager
1. Navigate to the email interface
2. Click on "Contact Manager" tab
3. Fill in:
   - Subject (required)
   - Message (required)
4. Click "Send Message to Manager"
5. You'll receive a confirmation when sent

### For Managers

#### Sending to Individual Staff
1. Navigate to the email interface
2. Click on "Send to Individual" tab
3. Fill in:
   - Recipient Email (required)
   - Subject (required)
   - Message (required)
4. Click "Send Email"

#### Sending to All Staff
1. Click on "Send to All" tab
2. Fill in:
   - Subject (required)
   - Message (required)
3. Click "Send to All Staff"
4. Confirm the action in the popup
5. View results showing successful and failed sends

#### Sending to a Group
1. Click on "Send to Group" tab
2. Select group type:
   - Position (e.g., all Managers)
   - Role (custom roles)
3. Select specific value from dropdown
4. Fill in subject and message
5. Click "Send to Group"
6. Confirm the action

## API Functions

### User-Facing Functions

#### `sendEmailToManager(subject, message, userEmail)`
Send email from staff to manager.

**Parameters:**
- `subject` (string): Email subject
- `message` (string): Email body
- `userEmail` (string, optional): Sender's email (defaults to current user)

**Returns:** `{ success: boolean, message: string }`

#### `sendEmailToUser(recipientEmail, subject, message, senderName)`
Send email to a single user.

**Parameters:**
- `recipientEmail` (string): Recipient's email address
- `subject` (string): Email subject
- `message` (string): Email body
- `senderName` (string, optional): Name shown as sender

**Returns:** `{ success: boolean, message: string }`

#### `sendEmailToAllUsers(subject, message, senderName)`
Send email to all active staff.

**Parameters:**
- `subject` (string): Email subject
- `message` (string): Email body
- `senderName` (string, optional): Name shown as sender

**Returns:** 
```javascript
{
  success: boolean,
  message: string,
  details: {
    total: number,
    sent: number,
    failed: number,
    failedEmails: string[]
  }
}
```

#### `sendEmailToGroup(groupType, groupValue, subject, message, senderName)`
Send email to a specific group.

**Parameters:**
- `groupType` (string): "position", "role", or "custom"
- `groupValue` (string|array): Value to filter by (or array of emails for custom)
- `subject` (string): Email subject
- `message` (string): Email body
- `senderName` (string, optional): Name shown as sender

**Returns:** Similar to `sendEmailToAllUsers`

#### `sendShiftChangeNotification(userEmail, shiftDetails, changeType)`
Send automatic shift change notification.

**Parameters:**
- `userEmail` (string): Staff member's email
- `shiftDetails` (object): { date, startTime, endTime, position }
- `changeType` (string): "added", "modified", or "removed"

**Returns:** `{ success: boolean }`

### Helper Functions

#### `getAvailablePositions()`
Get list of all unique positions from staff database.

**Returns:** `string[]` - Array of position names

#### `getAvailableRoles()`
Get list of all unique roles from staff database.

**Returns:** `string[]` - Array of role names

#### `setupManagerEmail(email)`
Configure the manager's email address.

**Parameters:**
- `email` (string): Manager's email address

## Database Requirements

The email system reads from the `Staff_Data` sheet with the following columns:
- **Email** (required): Staff member's email address
- **Status** (optional): "Active" or "Inactive" (inactive staff are excluded)
- **Position** (optional): For group filtering by position
- **Role** (optional): For group filtering by role

## Error Handling

The system includes comprehensive error handling:
- Email validation (format checking)
- Empty field validation
- Database connection errors
- Email sending failures
- Partial failure reporting (some emails sent, some failed)

## Security Considerations

1. **Authentication**: Users must be authenticated with Google
2. **Authorization**: Manager functions should be restricted to authorized users
3. **Email Validation**: All email addresses are validated before sending
4. **Reply-To Headers**: Configured to prevent spoofing
5. **Confirmation Prompts**: Required for bulk email operations

## Troubleshooting

### Emails Not Sending
1. Check Gmail quota (100 emails/day for free accounts, 1500 for Google Workspace)
2. Verify email addresses in Staff_Data sheet
3. Check Apps Script execution logs for errors
4. Ensure proper authorization/permissions

### Wrong Manager Email
Run `setupManagerEmail('correct@email.com')` to update

### Staff Not Receiving Emails
1. Verify email address in Staff_Data sheet
2. Check spam/junk folders
3. Verify staff status is "Active"
4. Check execution logs for specific errors

### Group Filtering Not Working
1. Ensure Position/Role columns exist in Staff_Data
2. Check spelling and case sensitivity
3. Verify data is properly populated

## Future Enhancements

Potential improvements:
- Email templates with placeholders
- Scheduled email sending
- Email history/logging
- Rich HTML email formatting
- Attachment support
- SMS integration
- Email preferences per staff member
- Unsubscribe functionality

## Support

For issues or questions:
1. Check execution logs in Apps Script
2. Review error messages in the interface
3. Verify database structure and data
4. Contact system administrator

---
**Last Updated:** 2025-11-30
**Version:** 1.0.0
