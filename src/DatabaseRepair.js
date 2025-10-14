/**
 * Database Repair Script
 * Repairs the existing corrupted database by clearing bad data and restoring proper structure
 * Keeps the same spreadsheet ID so all existing code continues to work
 */

function repairDatabase() {
  console.log('🔧 Starting Database Repair...');
  
  try {
    // Get the existing spreadsheet (don't create new one)
    const scriptProperties = PropertiesService.getScriptProperties();
    let spreadsheetId = scriptProperties.getProperty('data_spreadsheet_id');
    
    if (!spreadsheetId) {
      throw new Error('No existing spreadsheet ID found. Cannot repair.');
    }
    
    console.log(`📋 Repairing existing spreadsheet: ${spreadsheetId}`);
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // Step 1: Clear all existing sheets (but keep the spreadsheet)
    clearAllSheets(spreadsheet);
    
    // Step 2: Recreate clean structure based on your design
    createCleanStructure(spreadsheet);
    
    console.log('✅ Database repair completed successfully!');
    console.log(`📋 Spreadsheet ID remains: ${spreadsheetId}`);
    
    return {
      success: true,
      spreadsheetId: spreadsheetId,
      url: spreadsheet.getUrl()
    };
    
  } catch (error) {
    console.error('❌ Database repair failed:', error);
    throw error;
  }
}

/**
 * Clear all sheets except keep one to avoid deleting the spreadsheet
 */
function clearAllSheets(spreadsheet) {
  console.log('🧹 Clearing corrupted sheets...');
  
  const sheets = spreadsheet.getSheets();
  
  // Delete all existing sheets except the first one
  for (let i = sheets.length - 1; i > 0; i--) {
    spreadsheet.deleteSheet(sheets[i]);
  }
  
  // Clear the remaining sheet and rename it as temp
  const remainingSheet = sheets[0];
  remainingSheet.clear();
  remainingSheet.setName('TEMP_SHEET');
  
  console.log('🧹 All corrupted data cleared');
}

/**
 * Create clean database structure based on your updated design
 */
function createCleanStructure(spreadsheet) {
  console.log('🏗️ Creating clean database structure...');
  
  // Create Sheet 1: Staff_Directory
  createStaffDirectorySheet(spreadsheet);
  
  // Create Sheet 2: Staff_Availability  
  createStaffAvailabilitySheet(spreadsheet);
  
  // Create Sheet 3: Time_Off_Requests
  createTimeOffRequestsSheet(spreadsheet);
  
  // Create Sheet 4: Base_Weekly_Assignments
  createBaseWeeklyAssignmentsSheet(spreadsheet);
  
  // Create Sheet 5: Schedule_Templates
  createScheduleTemplatesSheet(spreadsheet);
  
  // Create Sheet 6: User_Access (you noted this was missing)
  createUserAccessSheet(spreadsheet);
  
  // Delete the temp sheet
  const tempSheet = spreadsheet.getSheetByName('TEMP_SHEET');
  if (tempSheet) {
    spreadsheet.deleteSheet(tempSheet);
  }
  
  console.log('🏗️ Clean structure created');
}

/**
 * Sheet 1: Staff_Directory (Essential)
 * Based on your edits: ID1/ID2, Staff_name, Display_Name, Role, Status, Email
 */
function createStaffDirectorySheet(spreadsheet) {
  console.log('📝 Creating Staff_Directory sheet...');
  
  const sheet = spreadsheet.insertSheet('Staff_Directory');
  
  // Headers based on your design
  const headers = [
    'Staff_ID',      // ID1, ID2, etc
    'Staff_Name',    // Full name (you added this)
    'Display_Name',  // How they appear on schedules
    'Role',          // Teacher, Floor Staff, Manager, Owner
    'Status',        // Active, Inactive
    'Email'          // For notifications
  ];
  
  // Set headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // Format headers
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Set column widths
  sheet.setColumnWidth(1, 100); // Staff_ID
  sheet.setColumnWidth(2, 150); // Staff_Name
  sheet.setColumnWidth(3, 150); // Display_Name
  sheet.setColumnWidth(4, 120); // Role
  sheet.setColumnWidth(5, 100); // Status
  sheet.setColumnWidth(6, 200); // Email
  
  sheet.setFrozenRows(1);
}

/**
 * Sheet 2: Staff_Availability (Essential)
 * Based on your edits: Staff_ID, Display_name, Day, Availability, Start_Time, End_Time, Min_Hours, Max_Hours, Notes
 */
function createStaffAvailabilitySheet(spreadsheet) {
  console.log('📅 Creating Staff_Availability sheet...');
  
  const sheet = spreadsheet.insertSheet('Staff_Availability');
  
  // Headers based on your design
  const headers = [
    'Staff_ID',          // Links to Staff_Directory
    'Display_Name',      // So you can see whose availability you're editing
    'Day',              // Monday, Tuesday, Wednesday, etc
    'Availability',      // GREEN, YELLOW, RED
    'Start_Time',        // Minimum start time (e.g., Miranda after 10:30 AM)
    'End_Time',          // Maximum end time
    'Min_Hours_Week',    // Minimum hours per week
    'Max_Hours_Week',    // Maximum hours per week
    'Notes'             // Optional reason
  ];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // Format headers
  headerRange.setBackground('#34A853');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Set column widths
  sheet.setColumnWidth(1, 100); // Staff_ID
  sheet.setColumnWidth(2, 150); // Display_Name
  sheet.setColumnWidth(3, 120); // Day
  sheet.setColumnWidth(4, 120); // Availability
  sheet.setColumnWidth(5, 100); // Start_Time
  sheet.setColumnWidth(6, 100); // End_Time
  sheet.setColumnWidth(7, 120); // Min_Hours_Week
  sheet.setColumnWidth(8, 120); // Max_Hours_Week
  sheet.setColumnWidth(9, 200); // Notes
  
  sheet.setFrozenRows(1);
}

/**
 * Sheet 3: Time_Off_Requests (Essential)
 * Based on your edits: Always approved, notify if <28 days, partial day support
 */
function createTimeOffRequestsSheet(spreadsheet) {
  console.log('🏖️ Creating Time_Off_Requests sheet...');
  
  const sheet = spreadsheet.insertSheet('Time_Off_Requests');
  
  // Headers based on your design
  const headers = [
    'Request_ID',        // Simple ID
    'Staff_ID',          // Who's requesting
    'Start_Date',        // First day off
    'End_Date',          // Last day off
    'Partial_Day',       // Full Day or Partial Day
    'Start_Time',        // For partial days
    'End_Time',          // For partial days
    'Submitted_Date',    // When they asked
    'Email_Required',    // If less than 28 days, needs email notification
    'Notes'             // Optional
  ];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // Format headers
  headerRange.setBackground('#EA4335');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // Request_ID
  sheet.setColumnWidth(2, 100); // Staff_ID
  sheet.setColumnWidth(3, 120); // Start_Date
  sheet.setColumnWidth(4, 120); // End_Date
  sheet.setColumnWidth(5, 120); // Partial_Day
  sheet.setColumnWidth(6, 100); // Start_Time
  sheet.setColumnWidth(7, 100); // End_Time
  sheet.setColumnWidth(8, 120); // Submitted_Date
  sheet.setColumnWidth(9, 120); // Email_Required
  sheet.setColumnWidth(10, 200); // Notes
  
  sheet.setFrozenRows(1);
}

/**
 * Sheet 4: Base_Weekly_Assignments (New - Essential)
 * Your typical weekly schedule pattern
 */
function createBaseWeeklyAssignmentsSheet(spreadsheet) {
  console.log('🗓️ Creating Base_Weekly_Assignments sheet...');
  
  const sheet = spreadsheet.insertSheet('Base_Weekly_Assignments');
  
  const headers = [
    'Day_of_Week',       // Monday, Tuesday, etc.
    'Staff_ID',          // Who normally works
    'Display_Name',      // For easy reading
    'Role',             // Manager or Staff
    'Start_Time',        // When they start
    'End_Time'          // When they finish
  ];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // Format headers
  headerRange.setBackground('#9C27B0');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // Day_of_Week
  sheet.setColumnWidth(2, 100); // Staff_ID
  sheet.setColumnWidth(3, 150); // Display_Name
  sheet.setColumnWidth(4, 100); // Role
  sheet.setColumnWidth(5, 100); // Start_Time
  sheet.setColumnWidth(6, 100); // End_Time
  
  sheet.setFrozenRows(1);
}

/**
 * Sheet 5: Schedule_Templates (Keep - for system logic)
 * System templates for schedule generation
 */
function createScheduleTemplatesSheet(spreadsheet) {
  console.log('📋 Creating Schedule_Templates sheet...');
  
  const sheet = spreadsheet.insertSheet('Schedule_Templates');
  
  const headers = [
    'Template_ID',       // TEMPLATE_001, etc.
    'Day',              // Monday through Sunday
    'Required_Staff',    // How many staff needed
    'Required_Managers', // How many managers needed
    'Business_Hours_Start', // Store opening
    'Business_Hours_End'    // Store closing
  ];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // Format headers
  headerRange.setBackground('#FF9800');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Add the working template data
  const templateData = [
    ['TEMPLATE_001', 'Monday', 4, 1, '10:00', '18:00'],
    ['TEMPLATE_001', 'Tuesday', 4, 1, '10:00', '18:00'],
    ['TEMPLATE_001', 'Wednesday', 4, 1, '10:00', '18:00'],
    ['TEMPLATE_001', 'Thursday', 4, 1, '10:00', '18:00'],
    ['TEMPLATE_001', 'Friday', 4, 1, '10:00', '17:00'],
    ['TEMPLATE_001', 'Saturday', 4, 1, '10:00', '16:00'],
    ['TEMPLATE_001', 'Sunday', 3, 0, '10:00', '15:00']
  ];
  
  sheet.getRange(2, 1, templateData.length, headers.length).setValues(templateData);
  
  sheet.setFrozenRows(1);
}

/**
 * Sheet 6: User_Access (Missing from previous version)
 * Handle user permissions
 */
function createUserAccessSheet(spreadsheet) {
  console.log('👤 Creating User_Access sheet...');
  
  const sheet = spreadsheet.insertSheet('User_Access');
  
  const headers = [
    'User_Email',        // User's email
    'Role',             // Admin, Manager, Staff
    'Status',           // Active, Inactive
    'Added_Date',       // When they were added
    'Notes'            // Additional info
  ];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // Format headers
  headerRange.setBackground('#607D8B');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
}

// Helper function to run the repair
function runDatabaseRepair() {
  try {
    const result = repairDatabase();
    console.log('✅ SUCCESS!');
    console.log('Database URL:', result.url);
    console.log('Spreadsheet ID:', result.spreadsheetId);
    return result;
  } catch (error) {
    console.error('❌ REPAIR FAILED:', error);
    throw error;
  }
}