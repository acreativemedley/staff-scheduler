/**
 * Email Notification System
 * Provides functionality for:
 * - Users to email manager
 * - Manager to email individual users
 * - Manager to email all users
 * - Manager to email specific groups
 */

// Get manager email from properties or config
function getManagerEmail() {
  const scriptProperties = PropertiesService.getScriptProperties();
  let managerEmail = scriptProperties.getProperty('manager_email');
  
  if (!managerEmail) {
    // Default fallback - you should set this via setupManagerEmail()
    managerEmail = Session.getActiveUser().getEmail();
  }
  
  return managerEmail;
}

/**
 * Setup manager email (run this once to configure)
 */
function setupManagerEmail(email) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('manager_email', email);
  console.log('Manager email set to:', email);
  return { success: true, message: 'Manager email configured' };
}

/**
 * Send email from user to manager
 * Called from frontend when user wants to contact manager
 */
function sendEmailToManager(subject, message, userEmail) {
  try {
    // Validate inputs
    if (!subject || !message) {
      return { success: false, error: 'Subject and message are required' };
    }
    
    const managerEmail = getManagerEmail();
    const fromUser = userEmail || Session.getActiveUser().getEmail();
    
    // Construct email
    const emailSubject = `[Staff Message] ${subject}`;
    const emailBody = `
You have received a message from a staff member:

From: ${fromUser}
Subject: ${subject}

Message:
${message}

---
This message was sent via the Staff Scheduling Application.
Reply directly to this email to respond to the staff member.
    `.trim();
    
    // Send email
    GmailApp.sendEmail(managerEmail, emailSubject, emailBody, {
      replyTo: fromUser,
      name: 'Staff Scheduling System'
    });
    
    console.log(`Email sent to manager from ${fromUser}`);
    return { 
      success: true, 
      message: 'Your message has been sent to the manager' 
    };
    
  } catch (error) {
    console.error('Error sending email to manager:', error);
    return { 
      success: false, 
      error: 'Failed to send email: ' + error.message 
    };
  }
}

/**
 * Send email to a single user
 * Called from admin interface
 */
function sendEmailToUser(recipientEmail, subject, message, senderName) {
  try {
    // Validate inputs
    if (!recipientEmail || !subject || !message) {
      return { 
        success: false, 
        error: 'Recipient email, subject, and message are required' 
      };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return { success: false, error: 'Invalid email address' };
    }
    
    const managerEmail = getManagerEmail();
    const sender = senderName || 'Manager';
    
    // Construct email
    const emailBody = `
${message}

---
This message was sent by ${sender} via the Staff Scheduling Application.
If you have questions, please reply to this email.
    `.trim();
    
    // Send email
    GmailApp.sendEmail(recipientEmail, subject, emailBody, {
      replyTo: managerEmail,
      name: sender
    });
    
    console.log(`Email sent to ${recipientEmail}`);
    return { 
      success: true, 
      message: `Email sent successfully to ${recipientEmail}` 
    };
    
  } catch (error) {
    console.error('Error sending email to user:', error);
    return { 
      success: false, 
      error: 'Failed to send email: ' + error.message 
    };
  }
}

/**
 * Send email to all users
 * Called from admin interface
 */
function sendEmailToAllUsers(subject, message, senderName) {
  try {
    // Validate inputs
    if (!subject || !message) {
      return { 
        success: false, 
        error: 'Subject and message are required' 
      };
    }
    
    // Get all active staff emails
    const staffEmails = getAllStaffEmails();
    
    if (staffEmails.length === 0) {
      return { 
        success: false, 
        error: 'No staff members found with email addresses' 
      };
    }
    
    const managerEmail = getManagerEmail();
    const sender = senderName || 'Manager';
    let successCount = 0;
    let failedEmails = [];
    
    // Construct email body
    const emailBody = `
${message}

---
This message was sent by ${sender} via the Staff Scheduling Application.
If you have questions, please reply to this email.
    `.trim();
    
    // Send to each staff member
    staffEmails.forEach(email => {
      try {
        GmailApp.sendEmail(email, subject, emailBody, {
          replyTo: managerEmail,
          name: sender
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        failedEmails.push(email);
      }
    });
    
    console.log(`Email sent to ${successCount} staff members`);
    
    return { 
      success: true, 
      message: `Email sent to ${successCount} of ${staffEmails.length} staff members`,
      details: {
        total: staffEmails.length,
        sent: successCount,
        failed: failedEmails.length,
        failedEmails: failedEmails
      }
    };
    
  } catch (error) {
    console.error('Error sending email to all users:', error);
    return { 
      success: false, 
      error: 'Failed to send emails: ' + error.message 
    };
  }
}

/**
 * Send email to a specific group of users
 * Group types: 'position', 'role', 'custom'
 */
function sendEmailToGroup(groupType, groupValue, subject, message, senderName) {
  try {
    // Validate inputs
    if (!subject || !message) {
      return { 
        success: false, 
        error: 'Subject and message are required' 
      };
    }
    
    // Get staff emails based on group type
    let staffEmails = [];
    
    if (groupType === 'position') {
      staffEmails = getStaffEmailsByPosition(groupValue);
    } else if (groupType === 'role') {
      staffEmails = getStaffEmailsByRole(groupValue);
    } else if (groupType === 'custom' && Array.isArray(groupValue)) {
      // Custom list of emails
      staffEmails = groupValue.filter(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      });
    } else {
      return { 
        success: false, 
        error: 'Invalid group type or value' 
      };
    }
    
    if (staffEmails.length === 0) {
      return { 
        success: false, 
        error: `No staff members found for ${groupType}: ${groupValue}` 
      };
    }
    
    const managerEmail = getManagerEmail();
    const sender = senderName || 'Manager';
    let successCount = 0;
    let failedEmails = [];
    
    // Construct email body
    const emailBody = `
${message}

---
This message was sent by ${sender} via the Staff Scheduling Application.
If you have questions, please reply to this email.
    `.trim();
    
    // Send to each staff member in the group
    staffEmails.forEach(email => {
      try {
        GmailApp.sendEmail(email, subject, emailBody, {
          replyTo: managerEmail,
          name: sender
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        failedEmails.push(email);
      }
    });
    
    console.log(`Email sent to ${successCount} staff members in group ${groupType}:${groupValue}`);
    
    return { 
      success: true, 
      message: `Email sent to ${successCount} of ${staffEmails.length} staff members`,
      details: {
        groupType: groupType,
        groupValue: groupValue,
        total: staffEmails.length,
        sent: successCount,
        failed: failedEmails.length,
        failedEmails: failedEmails
      }
    };
    
  } catch (error) {
    console.error('Error sending email to group:', error);
    return { 
      success: false, 
      error: 'Failed to send emails: ' + error.message 
    };
  }
}

/**
 * Get all staff emails from database
 */
function getAllStaffEmails() {
  try {
    const STAFF_DB_ID = '1qnB2yCNtKMHwCclaVeZqoxwalkNou5doShfeEg10pRw';
    const spreadsheet = SpreadsheetApp.openById(STAFF_DB_ID);
    const staffSheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!staffSheet) {
      console.error('Staff_Data sheet not found');
      return [];
    }
    
    const data = staffSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const emailCol = headers.findIndex(h => h.toString().toLowerCase().includes('email'));
    const statusCol = headers.findIndex(h => h.toString().toLowerCase().includes('status'));
    
    if (emailCol === -1) {
      console.error('Email column not found in Staff_Data sheet');
      return [];
    }
    
    const emails = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const email = row[emailCol];
      const status = statusCol >= 0 ? row[statusCol] : 'Active';
      
      // Only include active staff with valid emails
      if (email && 
          emailRegex.test(email.toString()) && 
          status.toString().toLowerCase() !== 'inactive') {
        emails.push(email.toString());
      }
    }
    
    return emails;
    
  } catch (error) {
    console.error('Error getting staff emails:', error);
    return [];
  }
}

/**
 * Get staff emails by position
 */
function getStaffEmailsByPosition(position) {
  try {
    const STAFF_DB_ID = '1qnB2yCNtKMHwCclaVeZqoxwalkNou5doShfeEg10pRw';
    const spreadsheet = SpreadsheetApp.openById(STAFF_DB_ID);
    const staffSheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!staffSheet) {
      return [];
    }
    
    const data = staffSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const emailCol = headers.findIndex(h => h.toString().toLowerCase().includes('email'));
    const positionCol = headers.findIndex(h => h.toString().toLowerCase().includes('position') || 
                                              h.toString().toLowerCase().includes('title'));
    const statusCol = headers.findIndex(h => h.toString().toLowerCase().includes('status'));
    
    if (emailCol === -1 || positionCol === -1) {
      return [];
    }
    
    const emails = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const email = row[emailCol];
      const staffPosition = row[positionCol];
      const status = statusCol >= 0 ? row[statusCol] : 'Active';
      
      if (email && 
          emailRegex.test(email.toString()) && 
          staffPosition && 
          staffPosition.toString().toLowerCase() === position.toLowerCase() &&
          status.toString().toLowerCase() !== 'inactive') {
        emails.push(email.toString());
      }
    }
    
    return emails;
    
  } catch (error) {
    console.error('Error getting staff emails by position:', error);
    return [];
  }
}

/**
 * Get staff emails by role
 */
function getStaffEmailsByRole(role) {
  try {
    const STAFF_DB_ID = '1qnB2yCNtKMHwCclaVeZqoxwalkNou5doShfeEg10pRw';
    const spreadsheet = SpreadsheetApp.openById(STAFF_DB_ID);
    const staffSheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!staffSheet) {
      return [];
    }
    
    const data = staffSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const emailCol = headers.findIndex(h => h.toString().toLowerCase().includes('email'));
    const roleCol = headers.findIndex(h => h.toString().toLowerCase().includes('role'));
    const statusCol = headers.findIndex(h => h.toString().toLowerCase().includes('status'));
    
    if (emailCol === -1 || roleCol === -1) {
      return [];
    }
    
    const emails = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const email = row[emailCol];
      const staffRole = row[roleCol];
      const status = statusCol >= 0 ? row[statusCol] : 'Active';
      
      if (email && 
          emailRegex.test(email.toString()) && 
          staffRole && 
          staffRole.toString().toLowerCase() === role.toLowerCase() &&
          status.toString().toLowerCase() !== 'inactive') {
        emails.push(email.toString());
      }
    }
    
    return emails;
    
  } catch (error) {
    console.error('Error getting staff emails by role:', error);
    return [];
  }
}

/**
 * Get available positions for group selection
 */
function getAvailablePositions() {
  try {
    const STAFF_DB_ID = '1qnB2yCNtKMHwCclaVeZqoxwalkNou5doShfeEg10pRw';
    const spreadsheet = SpreadsheetApp.openById(STAFF_DB_ID);
    const staffSheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!staffSheet) {
      return [];
    }
    
    const data = staffSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const positionCol = headers.findIndex(h => h.toString().toLowerCase().includes('position') || 
                                              h.toString().toLowerCase().includes('title'));
    
    if (positionCol === -1) {
      return [];
    }
    
    const positions = new Set();
    
    for (let i = 1; i < data.length; i++) {
      const position = data[i][positionCol];
      if (position && position.toString().trim() !== '') {
        positions.add(position.toString());
      }
    }
    
    return Array.from(positions).sort();
    
  } catch (error) {
    console.error('Error getting available positions:', error);
    return [];
  }
}

/**
 * Get available roles for group selection
 */
function getAvailableRoles() {
  try {
    const STAFF_DB_ID = '1qnB2yCNtKMHwCclaVeZqoxwalkNou5doShfeEg10pRw';
    const spreadsheet = SpreadsheetApp.openById(STAFF_DB_ID);
    const staffSheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!staffSheet) {
      return [];
    }
    
    const data = staffSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const roleCol = headers.findIndex(h => h.toString().toLowerCase().includes('role'));
    
    if (roleCol === -1) {
      return [];
    }
    
    const roles = new Set();
    
    for (let i = 1; i < data.length; i++) {
      const role = data[i][roleCol];
      if (role && role.toString().trim() !== '') {
        roles.add(role.toString());
      }
    }
    
    return Array.from(roles).sort();
    
  } catch (error) {
    console.error('Error getting available roles:', error);
    return [];
  }
}

/**
 * Send shift change notification to user
 * Called when a user's shift is modified
 */
function sendShiftChangeNotification(userEmail, shiftDetails, changeType) {
  try {
    const managerEmail = getManagerEmail();
    let subject, message;
    
    if (changeType === 'added') {
      subject = 'New Shift Added to Your Schedule';
      message = `
A new shift has been added to your schedule:

Date: ${shiftDetails.date}
Time: ${shiftDetails.startTime} - ${shiftDetails.endTime}
Position: ${shiftDetails.position || 'Staff'}

If you have any questions or concerns about this shift, please contact your manager.
      `.trim();
    } else if (changeType === 'modified') {
      subject = 'Your Shift Has Been Modified';
      message = `
One of your shifts has been modified:

Date: ${shiftDetails.date}
New Time: ${shiftDetails.startTime} - ${shiftDetails.endTime}
Position: ${shiftDetails.position || 'Staff'}

If you have any questions or concerns about this change, please contact your manager.
      `.trim();
    } else if (changeType === 'removed') {
      subject = 'Shift Removed from Your Schedule';
      message = `
A shift has been removed from your schedule:

Date: ${shiftDetails.date}
Original Time: ${shiftDetails.startTime} - ${shiftDetails.endTime}

If you have any questions or concerns about this change, please contact your manager.
      `.trim();
    }
    
    GmailApp.sendEmail(userEmail, subject, message, {
      replyTo: managerEmail,
      name: 'Staff Scheduling System'
    });
    
    console.log(`Shift ${changeType} notification sent to ${userEmail}`);
    return { success: true };
    
  } catch (error) {
    console.error('Error sending shift notification:', error);
    return { success: false, error: error.message };
  }
}
