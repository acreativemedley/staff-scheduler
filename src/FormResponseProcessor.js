/**
 * Form Response Processing
 * Handles responses from Google Forms and processes them into the database
 * Integrates with TimeOffProcessor for auto-approval logic
 */

// Get database ID to avoid duplicate declarations
function getFormsDatabaseId() {
  return '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
}

/**
 * Set up triggers for form responses
 * This should be run once after creating the forms
 */
function setupFormResponseTriggers() {
  try {
    const spreadsheet = SpreadsheetApp.openById(getFormsDatabaseId());
    const configSheet = spreadsheet.getSheetByName('Config');
    
    if (!configSheet) {
      throw new Error('Config sheet not found. Create forms first.');
    }
    
    // Get form IDs from config
    const data = configSheet.getDataRange().getValues();
    let timeOffFormId = null;
    let staffRegistrationFormId = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'Time_Off_Form_ID') {
        timeOffFormId = data[i][1];
      } else if (data[i][0] === 'Staff_Registration_Form_ID') {
        staffRegistrationFormId = data[i][1];
      }
    }
    
    // Set up onFormSubmit triggers (event-driven, not time-based)
    if (timeOffFormId) {
      ScriptApp.newTrigger('onTimeOffFormSubmit')
        .forForm(timeOffFormId)
        .onFormSubmit()
        .create();
      console.log('Time-off form onSubmit trigger created');
    }
    
    if (staffRegistrationFormId) {
      ScriptApp.newTrigger('onStaffRegistrationFormSubmit')
        .forForm(staffRegistrationFormId)
        .onFormSubmit()  
        .create();
      console.log('Staff registration form onSubmit trigger created');
    }
    
    console.log('All form response triggers set up successfully');
  } catch (error) {
    console.error('Error setting up form triggers:', error);
    throw error;
  }
}

/**
 * Process time-off form submissions
 * Called by onFormSubmit trigger when new time-off requests are submitted
 */
function onTimeOffFormSubmit(event) {
  try {
    console.log('Processing time-off form submission...');
    
    if (event && event.response) {
      // Process the specific response that was just submitted
      processFormSubmitResponse(event.response, 'time-off');
    } else {
      // Fallback: process any unprocessed requests (for manual execution)
      const unprocessedRequests = getUnprocessedTimeOffRequests();
      for (const request of unprocessedRequests) {
        processTimeOffRequest(request, true); // Mark as processed since processing from response sheets
      }
    }
    
    console.log('Time-off form submission processed successfully');
  } catch (error) {
    console.error('Error processing time-off form submission:', error);
  }
}

/**
 * Process staff registration form submissions
 * Called by onFormSubmit trigger when new staff registrations are submitted
 */
function onStaffRegistrationFormSubmit(event) {
  try {
    console.log('Processing staff registration form submission...');
    
    if (event && event.response) {
      // Process the specific response that was just submitted
      processFormSubmitResponse(event.response, 'staff-registration');
    } else {
      // Fallback: process any unprocessed registrations (for manual execution)
      const unprocessedRegistrations = getUnprocessedStaffRegistrations();
      for (const registration of unprocessedRegistrations) {
        processStaffRegistration(registration);
      }
    }
    
    console.log('Staff registration form submission processed successfully');
  } catch (error) {
    console.error('Error processing staff registration form submission:', error);
  }
}

/**
 * Validate that end time comes after start time
 */
function validateTimeOrder(startTime, endTime) {
  try {
    // Convert time strings to Date objects for comparison
    const today = new Date();
    const startDateTime = new Date(today.toDateString() + ' ' + startTime);
    const endDateTime = new Date(today.toDateString() + ' ' + endTime);
    
    // Handle case where end time is next day (e.g., night shift)
    if (endDateTime < startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
    
    return endDateTime > startDateTime;
  } catch (error) {
    console.error('Error validating time order:', error);
    return true; // Allow submission if validation fails
  }
}

/**
 * Process a form response directly from the onFormSubmit event
 */
function processFormSubmitResponse(formResponse, formType) {
  try {
    console.log(`Processing ${formType} form response...`);
    
    const responseValues = formResponse.getItemResponses();
    const timestamp = formResponse.getTimestamp();
    const email = formResponse.getRespondentEmail();
    
    console.log(`Response has ${responseValues.length} fields`);
    
    if (formType === 'time-off') {
      // Extract time-off request data from form response
      // Form fields after removing request type: Staff Member, Start Date, End Date, Is Partial Day, Start Time, End Time, Notes
      const request = {
        timestamp: timestamp,
        email: email,
        staffName: responseValues[0]?.getResponse() || '',
        startDate: responseValues[1]?.getResponse() || '',
        endDate: responseValues[2]?.getResponse() || '',
        isPartialDay: responseValues[3]?.getResponse() || '',
        startTime: responseValues[4]?.getResponse() || '',
        endTime: responseValues[5]?.getResponse() || '',
        notes: responseValues[6]?.getResponse() || ''
      };
      
      console.log(`Time-off request details:`, JSON.stringify(request, null, 2));
      
      // Validate time if partial day
      if (request.isPartialDay === 'Yes - Partial day(s)' && request.startTime && request.endTime) {
        if (!validateTimeOrder(request.startTime, request.endTime)) {
          console.error(`Invalid time order for ${request.staffName}: ${request.startTime} to ${request.endTime}`);
          // Instead of throwing error, mark as invalid and don't process to main database
          // This prevents the form from being processed but doesn't crash the system
          return;
        }
      }
      
      processTimeOffRequest(request, false); // Direct processing, don't mark as processed
      
    } else if (formType === 'staff-registration') {
      // Extract staff registration data from form response
      const registration = {
        timestamp: timestamp,
        email: email,
        fullName: responseValues[0]?.getResponse() || '',
        displayName: responseValues[1]?.getResponse() || '',
        workEmail: responseValues[2]?.getResponse() || '',
        phoneNumber: responseValues[3]?.getResponse() || '',
        role: responseValues[4]?.getResponse() || '',
        startDate: responseValues[5]?.getResponse() || '',
        minHours: responseValues[6]?.getResponse() || '',
        maxHours: responseValues[7]?.getResponse() || '',
        status: responseValues[8]?.getResponse() || ''
      };
      
      processStaffRegistrationDirect(registration);
    }
    
  } catch (error) {
    console.error('Error processing form submit response:', error);
  }
}

/**
 * Process time-off request directly from form data
 */
/**
 * Process a time-off request (unified function)
 * @param {Object} request - The request data
 * @param {boolean} markAsProcessed - Whether to mark the response as processed in the source sheet
 */
function processTimeOffRequest(request, markAsProcessed = false) {
  try {
    console.log(`Processing time-off request from ${request.staffName}`);
    
    const spreadsheet = SpreadsheetApp.openById(getFormsDatabaseId());
    const timeOffSheet = spreadsheet.getSheetByName('Time_Off_Requests');
    const staffSheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!timeOffSheet) {
      throw new Error('Time_Off_Requests sheet not found');
    }
    
    if (!staffSheet) {
      throw new Error('Staff_Data sheet not found');
    }
    
    // Validate time if partial day
    if (request.isPartialDay === 'Yes - Partial day(s)' && request.startTime && request.endTime) {
      if (!validateTimeOrder(request.startTime, request.endTime)) {
        console.error(`Invalid time order for ${request.staffName}: ${request.startTime} to ${request.endTime}`);
        if (markAsProcessed && request.responseSheet && request.rowIndex) {
          markResponseAsProcessed(request.responseSheet, request.rowIndex);
        }
        return; // Skip processing this request
      }
    }
    
    // Get Staff_ID from Staff_Data sheet using display name
    let staffId = null;
    const staffData = staffSheet.getDataRange().getValues();
    for (let i = 1; i < staffData.length; i++) {
      if (staffData[i][2] === request.staffName) { // Column C = Display_Name
        staffId = staffData[i][0]; // Column A = Staff_ID
        break;
      }
    }
    
    if (!staffId) {
      console.error(`Staff ID not found for: ${request.staffName}`);
      staffId = request.staffName; // Fallback to display name
    }
    
    // Calculate days until request starts
    const today = new Date();
    const startDate = new Date(request.startDate);
    const daysUntilRequest = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    
    // All requests are auto-approved, but short notice requests need notification
    const isShortNotice = daysUntilRequest < 28; // Less than 4 weeks
    const approvalStatus = 'Approved'; // All requests auto-approved
    
    // Generate request ID
    const requestId = `TO${Date.now()}`;
    
    // Map to database structure: Request_ID, Staff_ID, Start_Date, End_Date, Notes, Type, Status, Submitted_Date, Approved_By, Auto_Approved, Requires_Notification, Start and End for Partial Day, Staff_Name
    const timeOffData = [
      requestId, // Request_ID
      staffId, // Staff_ID
      request.startDate, // Start_Date
      request.endDate, // End_Date
      request.notes || '', // Notes
      request.isPartialDay === 'Yes - Partial day(s)' ? 'Partial Day' : 'Full Day', // Type
      approvalStatus, // Status - Always approved
      new Date(), // Submitted_Date
      'System', // Approved_By - Always system since all auto-approved
      'Yes', // Auto_Approved - Always yes
      isShortNotice ? 'Yes' : 'No', // Requires_Notification - Only for short notice requests
      `${request.startTime ? 'Start: ' + request.startTime : ''}${request.endTime ? ' End: ' + request.endTime : ''}`.trim(), // Start and End for Partial Day (time info)
      request.staffName // Staff_Name (display name)
    ];
    
    // Add to Time_Off_Requests sheet
    timeOffSheet.appendRow(timeOffData);
    
    // Send notification for short notice requests (for information purposes)
    if (isShortNotice) {
      sendShortNoticeNotification(request, daysUntilRequest);
    }
    
    // Mark as processed in the form response sheet if requested
    if (markAsProcessed && request.responseSheet && request.rowIndex) {
      markResponseAsProcessed(request.responseSheet, request.rowIndex);
    }
    
    console.log(`Time-off request processed: ${requestId} - ${approvalStatus}`);
  } catch (error) {
    console.error('Error processing time-off request:', error);
  }
}

/**
 * Process staff registration directly from form data
 */
function processStaffRegistrationDirect(registration) {
  try {
    console.log(`Processing staff registration for ${registration.displayName}`);
    
    const spreadsheet = SpreadsheetApp.openById(getFormsDatabaseId());
    const staffSheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!staffSheet) {
      throw new Error('Staff_Data sheet not found');
    }
    
    // Generate staff ID
    const staffId = `STAFF${Date.now()}`;
    
    // Prepare data for Staff_Data sheet
    const staffData = [
      staffId, // Staff_ID
      registration.fullName, // Full_Name
      registration.displayName, // Display_Name
      registration.workEmail, // Email
      registration.phoneNumber, // Phone
      registration.role, // Position
      '', // Skills (empty for now)
      registration.status, // Status
      new Date(), // Created Date
      new Date(registration.startDate), // Hire Date
      '', // Emergency Contact (empty for now)
      parseInt(registration.minHours) || 0, // Min Hours
      parseInt(registration.maxHours) || 40, // Max Hours
      '' // Notes (empty for now)
    ];
    
    // Add to Staff_Data sheet
    staffSheet.appendRow(staffData);
    
    // Create default availability for new staff (all days "If Needed")
    createDefaultAvailability(registration.displayName);
    
    // Update the staff dropdown in Time-Off Request form
    try {
      updateStaffDropdown();
      console.log('Staff dropdown updated with new employee');
    } catch (error) {
      console.error('Failed to update staff dropdown:', error);
    }
    
    console.log(`Staff registration processed: ${staffId} for ${registration.displayName} (${registration.fullName})`);
  } catch (error) {
    console.error('Error processing staff registration directly:', error);
  }
}
function getUnprocessedTimeOffRequests() {
  try {
    const spreadsheet = SpreadsheetApp.openById(getFormsDatabaseId());
    
    // Find the form response sheet (Google Forms creates these automatically)
    const sheets = spreadsheet.getSheets();
    const timeOffResponseSheet = sheets.find(sheet => 
      sheet.getName().includes('Time-Off Request Form') || 
      sheet.getName().includes('Form Responses')
    );
    
    if (!timeOffResponseSheet) {
      console.log('No time-off form response sheet found');
      return [];
    }
    
    const data = timeOffResponseSheet.getDataRange().getValues();
    const headers = data[0];
    const responses = data.slice(1);
    
    // Filter for unprocessed responses (those without a 'Processed' column marked as 'Yes')
    const processedColIndex = headers.indexOf('Processed');
    
    const unprocessedRequests = responses
      .filter((row, index) => {
        // If there's no Processed column, all are unprocessed
        if (processedColIndex === -1) return true;
        // If Processed column exists, check if it's not marked as 'Yes'
        return row[processedColIndex] !== 'Yes';
      })
      .map((row, index) => {
        // Updated mapping for new form structure: Staff Member, Start Date, End Date, Is Partial Day, Start Time, End Time, Notes
        return {
          rowIndex: index + 2, // +2 because we removed header and arrays are 0-indexed
          timestamp: row[0],
          email: row[1],
          staffName: row[2], // Staff Member
          startDate: row[3], // Start Date  
          endDate: row[4], // End Date
          isPartialDay: row[5], // Is Partial Day
          startTime: row[6], // Start Time
          endTime: row[7], // End Time
          notes: row[8], // Notes (was reason)
          responseSheet: timeOffResponseSheet
        };
      });
    
    return unprocessedRequests;
  } catch (error) {
    console.error('Error getting unprocessed time-off requests:', error);
    return [];
  }
}

/**
 * Get unprocessed staff registrations from form responses
 */
function getUnprocessedStaffRegistrations() {
  try {
    const spreadsheet = SpreadsheetApp.openById(getFormsDatabaseId());
    
    // Find the staff registration form response sheet
    const sheets = spreadsheet.getSheets();
    const staffResponseSheet = sheets.find(sheet => 
      sheet.getName().includes('New Staff Registration Form') || 
      sheet.getName().includes('Staff Registration')
    );
    
    if (!staffResponseSheet) {
      console.log('No staff registration form response sheet found');
      return [];
    }
    
    const data = staffResponseSheet.getDataRange().getValues();
    const headers = data[0];
    const responses = data.slice(1);
    
    // Filter for unprocessed responses
    const processedColIndex = headers.indexOf('Processed');
    
    const unprocessedRegistrations = responses
      .filter((row, index) => {
        if (processedColIndex === -1) return true;
        return row[processedColIndex] !== 'Yes';
      })
      .map((row, index) => {
        return {
          rowIndex: index + 2,
          timestamp: row[0],
          email: row[1],
          fullName: row[2],
          displayName: row[3],
          workEmail: row[4],
          phoneNumber: row[5],
          role: row[6],
          startDate: row[7],
          minHours: row[8],
          maxHours: row[9],
          status: row[10],
          responseSheet: staffResponseSheet
        };
      });
    
    return unprocessedRegistrations;
  } catch (error) {
    console.error('Error getting unprocessed staff registrations:', error);
    return [];
  }
}

/**
 * Process a single staff registration
 */
function processStaffRegistration(registration) {
  try {
    console.log(`Processing staff registration for ${registration.fullName}`);
    
    const spreadsheet = SpreadsheetApp.openById(getFormsDatabaseId());
    const staffSheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!staffSheet) {
      throw new Error('Staff_Data sheet not found');
    }
    
    // Generate staff ID
    const staffId = `STAFF${Date.now()}`;
    
    // Prepare data for Staff_Data sheet
    const staffData = [
      staffId, // Staff_ID (moved to first position to match new structure)
      registration.fullName, // Full_Name
      registration.displayName, // Display_Name
      registration.workEmail, // Email
      registration.phoneNumber, // Phone
      registration.role, // Position
      '', // Skills (empty for now)
      registration.status, // Status
      new Date(), // Created Date
      new Date(registration.startDate), // Hire Date
      '', // Emergency Contact (empty for now)
      parseInt(registration.minHours) || 0, // Min Hours
      parseInt(registration.maxHours) || 40, // Max Hours
      '' // Notes (empty for now)
    ];
    
    // Add to Staff_Data sheet
    staffSheet.appendRow(staffData);
    
    // Create default availability for new staff (all days "If Needed")
    createDefaultAvailability(registration.displayName);
    
    // Update the staff dropdown in Time-Off Request form
    try {
      updateStaffDropdown();
      console.log('Staff dropdown updated with new employee');
    } catch (error) {
      console.error('Failed to update staff dropdown:', error);
    }
    
    // Mark as processed in the form response sheet
    markResponseAsProcessed(registration.responseSheet, registration.rowIndex);
    
    console.log(`Staff registration processed: ${staffId} for ${registration.displayName} (${registration.fullName})`);
  } catch (error) {
    console.error('Error processing staff registration:', error);
  }
}

/**
 * Create default availability for new staff member
 */
function createDefaultAvailability(staffName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(getFormsDatabaseId());
    const availabilitySheet = spreadsheet.getSheetByName('Availability');
    
    if (!availabilitySheet) {
      console.error('Availability sheet not found');
      return;
    }
    
    // Create default availability entries (all days "If Needed")
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (const day of days) {
      const availabilityData = [
        staffName,
        day,
        'If Needed',
        '', // Start Time - empty for "If Needed"
        '', // End Time - empty for "If Needed"
        new Date(), // Last Updated
        'System' // Updated By
      ];
      
      availabilitySheet.appendRow(availabilityData);
    }
    
    console.log(`Default availability created for ${staffName}`);
  } catch (error) {
    console.error('Error creating default availability:', error);
  }
}

/**
 * Send notification email for short notice time-off requests
 */
function sendShortNoticeNotification(request, daysUntilRequest) {
  try {
    // Get manager/admin emails from Staff_Data
    const spreadsheet = SpreadsheetApp.openById(getFormsDatabaseId());
    const staffSheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!staffSheet) {
      console.error('Staff_Data sheet not found for notification');
      return;
    }
    
    // Get admin/manager emails
    const data = staffSheet.getDataRange().getValues();
    const adminEmails = [];
    
    for (let i = 1; i < data.length; i++) {
      const role = data[i][3]; // Role column
      const email = data[i][1]; // Email column
      
      if ((role === 'Admin' || role === 'Manager') && email) {
        adminEmails.push(email);
      }
    }
    
    if (adminEmails.length === 0) {
      console.log('No admin/manager emails found for notification');
      return;
    }
    
    // Send notification email
    const subject = `Short Notice Time-Off Request: ${request.staffName}`;
    const body = `
A time-off request requires approval:

Staff Member: ${request.staffName}
Request Type: ${request.requestType}
Start Date: ${request.startDate}
End Date: ${request.endDate}
Partial Day: ${request.isPartialDay}
Days Until Request: ${daysUntilRequest}
Reason: ${request.reason || 'None provided'}

This request requires manual approval as it was submitted with less than 4 weeks notice.

Please review and approve/deny this request in the scheduling system.
`;
    
    for (const email of adminEmails) {
      GmailApp.sendEmail(email, subject, body);
    }
    
    console.log(`Short notice notification sent to ${adminEmails.length} admin(s)`);
  } catch (error) {
    console.error('Error sending short notice notification:', error);
  }
}

/**
 * Mark a form response as processed
 */
function markResponseAsProcessed(responseSheet, rowIndex) {
  try {
    const headers = responseSheet.getRange(1, 1, 1, responseSheet.getLastColumn()).getValues()[0];
    let processedColIndex = headers.indexOf('Processed');
    
    // If Processed column doesn't exist, add it
    if (processedColIndex === -1) {
      processedColIndex = headers.length;
      responseSheet.getRange(1, processedColIndex + 1).setValue('Processed');
    }
    
    // Mark as processed
    responseSheet.getRange(rowIndex, processedColIndex + 1).setValue('Yes');
    
    console.log(`Marked row ${rowIndex} as processed in ${responseSheet.getName()}`);
  } catch (error) {
    console.error('Error marking response as processed:', error);
  }
}

/**
 * Manual function to process all unprocessed responses
 * Useful for testing or catching up on missed responses
 */
function processAllUnprocessedResponses() {
  console.log('Processing all unprocessed responses...');
  
  onTimeOffFormSubmit();
  onStaffRegistrationFormSubmit();
  
  console.log('All unprocessed responses have been processed');
}
