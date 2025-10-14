/**
 * Google Apps Script - Staff Scheduling Database Setup
 * Creates a comprehensive Google Sheets database for staff scheduling
 * with sample data, validation, and formatting
 */

/**
 * Main function to create the complete scheduling database
 * @returns {Object} Object containing spreadsheet URL and ID
 */
function createSchedulingDatabase() {
  console.log('🚀 Starting Scheduling Database Setup...');
  
  // Create the main spreadsheet with a timestamped name
  const timestamp = new Date().toISOString().split('T')[0];
  const spreadsheet = SpreadsheetApp.create(`Staff Scheduling Database - ${timestamp}`);
  const spreadsheetUrl = spreadsheet.getUrl();
  const spreadsheetId = spreadsheet.getId();
  
  console.log(`📋 Created spreadsheet: ${spreadsheetUrl}`);
  
  try {
    // Create all required sheets with data
    createStaffDataSheet(spreadsheet);
    createAvailabilitySheet(spreadsheet);
    createTimeOffRequestsSheet(spreadsheet);
    createSchedulesSheet(spreadsheet);
    createScheduleTemplatesSheet(spreadsheet);
    createUserAccessSheet(spreadsheet);
    
    // Remove the default 'Sheet1' after creating all sheets
    const defaultSheet = spreadsheet.getSheetByName('Sheet1');
    if (defaultSheet) {
      spreadsheet.deleteSheet(defaultSheet);
    }
    
    // Add data validation and formatting
    addDataValidation(spreadsheet);
    addConditionalFormatting(spreadsheet);
    
    // Store the database ID for backend functions
    setDatabaseSpreadsheetId(spreadsheetId);
    
    console.log('🎉 Database setup complete!');
    console.log(`📋 Spreadsheet URL: ${spreadsheetUrl}`);
    console.log('📝 Next steps: Copy this URL and use it for Google Forms and Sites integration');
    
    // Return the spreadsheet info for further use
    return {
      url: spreadsheetUrl,
      id: spreadsheetId
    };
  } catch (error) {
    console.error('❌ Error during database creation:', error);
    throw error;
  }
}

/**
 * Create Staff Data Sheet with sample data and formatting
 */
function createStaffDataSheet(spreadsheet) {
  console.log('👥 Creating Staff_Data sheet...');
  
  const sheet = spreadsheet.insertSheet('Staff_Data');
  
  // Headers and sample data
  const data = [
    ['Staff_ID', 'Full_Name', 'Display_Name', 'Email', 'Phone', 'Position', 'Skills', 'Status', 'Created_Date', 'Hire_Date', 'Emergency_Contact', 'Min_Hours_Per_Week', 'Max_Hours_Per_Week', 'Notes'],
    [1, 'John Smith', 'John', 'john@example.com', '(555) 123-4567', 'Teacher', 'Math, Science', 'Active', new Date(), new Date('2024-06-01'), 'Jane Smith - (555) 987-6543', 15, 30, 'Lead Math Teacher'],
    [2, 'Sarah Elizabeth Johnson', 'Sarah', 'sarah@example.com', '(555) 234-5678', 'Floor Staff', 'Customer Service', 'Active', new Date(), new Date('2024-08-15'), 'Mike Johnson - (555) 876-5432', 10, 25, 'Part-time evening staff'],
    [3, 'Michael Anthony Wilson', 'Mike', 'mike@example.com', '(555) 345-6789', 'Manager', 'Leadership, Training', 'Active', new Date(), new Date('2023-01-15'), 'Lisa Wilson - (555) 765-4321', 35, 40, 'Assistant Manager']
  ];
  
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, data[0].length);
  headerRange.setBackground('#4285f4')
             .setFontColor('white')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
  
  // Set column widths for readability
  const columnWidths = [80, 150, 120, 200, 120, 120, 200, 100, 120, 120, 200, 100, 100, 250];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  
  // Freeze header row and ID column
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  
  console.log('✅ Staff_Data sheet created');
}

/**
 * Create Availability Sheet
 */
function createAvailabilitySheet(spreadsheet) {
  console.log('📅 Creating Availability sheet...');
  
  const sheet = spreadsheet.insertSheet('Availability');
  
  const data = [
    ['Entry_ID', 'Staff_ID', 'Date', 'Availability_Type', 'Notes', 'Created', 'Recurring_Pattern'],
    [1, 1, new Date('2025-01-20'), 'Available', 'Flexible hours', new Date(), 'None'],
    [2, 1, new Date('2025-01-21'), 'Not Available', 'Personal appointment', new Date(), 'None'],
    [3, 2, new Date('2025-01-20'), 'If Needed', 'Prefer morning shift if needed', new Date(), 'None'],
    [4, 3, new Date('2025-01-22'), 'Available', 'Full day available', new Date(), 'Weekly']
  ];
  
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, data[0].length);
  headerRange.setBackground('#34a853')
             .setFontColor('white')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
  
  // Set column widths
  const columnWidths = [90, 80, 120, 150, 200, 120, 150];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  
  sheet.setFrozenRows(1);
  console.log('✅ Availability sheet created');
}

/**
 * Create Time Off Requests Sheet
 */
function createTimeOffRequestsSheet(spreadsheet) {
  console.log('🏖️ Creating Time_Off_Requests sheet...');
  
  const sheet = spreadsheet.insertSheet('Time_Off_Requests');
  
  const data = [
    ['Request_ID', 'Staff_ID', 'Start_Date', 'End_Date', 'Reason', 'Type', 'Status', 'Submitted_Date', 'Approved_By', 'Auto_Approved', 'Requires_Notification', 'Notes'],
    [1, 1, new Date('2025-03-01'), new Date('2025-03-03'), 'Vacation', 'Planned', 'Auto-Approved', new Date(), 'System', true, false, 'Family trip to Florida'],
    [2, 2, new Date('2025-01-30'), new Date('2025-01-30'), 'Sick Day', 'Emergency', 'Auto-Approved', new Date(), 'System', true, true, 'Doctor appointment - short notice']
  ];
  
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, data[0].length);
  headerRange.setBackground('#ff6d01')
             .setFontColor('white')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
  
  // Set column widths
  const columnWidths = [100, 80, 120, 120, 150, 100, 120, 120, 100, 100, 120, 250];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  
  sheet.setFrozenRows(1);
  console.log('✅ Time_Off_Requests sheet created');
}

/**
 * Create Schedules Sheet
 */
function createSchedulesSheet(spreadsheet) {
  console.log('📋 Creating Schedules sheet...');
  
  const sheet = spreadsheet.insertSheet('Schedules');
  
  const data = [
    ['Schedule_ID', 'Date', 'Staff_ID', 'Position_Needed', 'Start_Time', 'End_Time', 'Location', 'Special_Notes', 'Status', 'Created_By'],
    [1, new Date('2025-01-20'), 1, 'Teacher', '09:00', '17:00', 'Main Classroom', 'Regular teaching day', 'Published', 3],
    [2, new Date('2025-01-20'), 2, 'Floor Staff', '10:00', '18:00', 'Front Desk', 'Customer service coverage', 'Published', 3],
    [3, new Date('2025-01-21'), 3, 'Manager', '08:00', '16:00', 'Office', 'Administrative duties', 'Draft', 3]
  ];
  
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, data[0].length);
  headerRange.setBackground('#9c27b0')
             .setFontColor('white')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
  
  // Set column widths
  const columnWidths = [100, 120, 80, 130, 100, 100, 120, 200, 100, 100];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  
  sheet.setFrozenRows(1);
  console.log('✅ Schedules sheet created');
}

/**
 * Create Schedule Templates Sheet
 */
function createScheduleTemplatesSheet(spreadsheet) {
  console.log('📝 Creating Schedule_Templates sheet...');
  
  const sheet = spreadsheet.insertSheet('Schedule_Templates');
  
  const data = [
    ['Template_ID', 'Template_Name', 'Day_Of_Week', 'Position', 'Start_Time', 'End_Time', 'Required_Count', 'Status', 'Notes'],
    [1, 'Monday-Thursday', 'Monday', 'Staff', '10:00', '18:00', 2, 'Active', 'Regular weekday coverage'],
    [2, 'Monday-Thursday', 'Tuesday', 'Staff', '10:00', '18:00', 2, 'Active', 'Regular weekday coverage'],
    [3, 'Monday-Thursday', 'Wednesday', 'Staff', '10:00', '18:00', 2, 'Active', 'Regular weekday coverage'],
    [4, 'Monday-Thursday', 'Thursday', 'Staff', '10:00', '18:00', 2, 'Active', 'Regular weekday coverage'],
    [5, 'Friday Schedule', 'Friday', 'Staff', '10:00', '17:00', 2, 'Active', 'Friday hours'],
    [6, 'Saturday Schedule', 'Saturday', 'Staff', '10:00', '16:00', 2, 'Active', 'Saturday hours'],
    [7, 'Sunday Schedule', 'Sunday', 'Staff', '10:00', '15:00', 1, 'Active', 'Sunday hours']
  ];
  
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, data[0].length);
  headerRange.setBackground('#795548')
             .setFontColor('white')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
  
  // Set column widths
  const columnWidths = [100, 150, 120, 120, 100, 100, 130, 100, 250];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  
  sheet.setFrozenRows(1);
  console.log('✅ Schedule_Templates sheet created');
}

/**
 * Create User Access Sheet
 */
function createUserAccessSheet(spreadsheet) {
  console.log('👥 Creating User_Access sheet...');
  
  const sheet = spreadsheet.insertSheet('User_Access');
  
  // Get current user email to set as owner
  const currentUser = Session.getActiveUser().getEmail();
  
  const data = [
    ['Email', 'Role', 'Status', 'Last_Login', 'Permissions', 'Created', 'Notes'],
    [currentUser, 'Admin', 'Active', new Date(), 'Full Access', new Date(), 'System Administrator - Created during setup'],
    ['manager@example.com', 'Manager', 'Active', '', 'Schedule Management', new Date(), 'Manager/Owner Level Access'],
    ['john@example.com', 'Staff', 'Active', '', 'View Own Schedule', new Date(), 'Teaching Staff'],
    ['sarah@example.com', 'Staff', 'Active', '', 'View Own Schedule', new Date(), 'Floor Staff']
  ];
  
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, data[0].length);
  headerRange.setBackground('#607d8b')
             .setFontColor('white')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
  
  // Set column widths
  const columnWidths = [200, 100, 100, 120, 150, 120, 250];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  
  sheet.setFrozenRows(1);
  console.log('✅ User_Access sheet created');
}

/**
 * Add data validation rules to all sheets
 */
function addDataValidation(spreadsheet) {
  console.log('📋 Adding data validation rules...');
  
  // Staff Data validations
  const staffSheet = spreadsheet.getSheetByName('Staff_Data');
  if (staffSheet) {
    // Position dropdown
    const positionRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Teacher', 'Floor Staff', 'Manager'])
      .setAllowInvalid(false)
      .setHelpText('Select job position')
      .build();
    staffSheet.getRange('E:E').setDataValidation(positionRule);
    
    // Status dropdown
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Active', 'Inactive', 'On Leave'])
      .setAllowInvalid(false)
      .setHelpText('Select employment status')
      .build();
    staffSheet.getRange('G:G').setDataValidation(statusRule);
  }
  
  // Availability validations
  const availabilitySheet = spreadsheet.getSheetByName('Availability');
  if (availabilitySheet) {
    // Availability type dropdown
    const availabilityRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Available', 'Not Available', 'If Needed'])
      .setAllowInvalid(false)
      .setHelpText('Available = Can work, Not Available = Cannot work, If Needed = Available if extra coverage needed')
      .build();
    availabilitySheet.getRange('D:D').setDataValidation(availabilityRule);
    
    // Recurring pattern dropdown
    const recurringRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['None', 'Daily', 'Weekly', 'Bi-weekly', 'Monthly'])
      .setAllowInvalid(false)
      .setHelpText('Select recurring pattern')
      .build();
    availabilitySheet.getRange('G:G').setDataValidation(recurringRule);
  }
  
  // Time-off request validations
  const timeOffSheet = spreadsheet.getSheetByName('Time_Off_Requests');
  if (timeOffSheet) {
    // Request type dropdown
    const requestTypeRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Planned', 'Emergency'])
      .setAllowInvalid(false)
      .setHelpText('Select request type')
      .build();
    timeOffSheet.getRange('F:F').setDataValidation(requestTypeRule);
    
    // Request status dropdown
    const requestStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Auto-Approved', 'Pending', 'Denied', 'Cancelled'])
      .setAllowInvalid(false)
      .setHelpText('Select request status')
      .build();
    timeOffSheet.getRange('G:G').setDataValidation(requestStatusRule);
  }
  
  // User Access validations
  const userAccessSheet = spreadsheet.getSheetByName('User_Access');
  if (userAccessSheet) {
    // Role dropdown
    const roleRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Admin', 'Manager', 'Staff'])
      .setAllowInvalid(false)
      .setHelpText('Select user role')
      .build();
    userAccessSheet.getRange('B:B').setDataValidation(roleRule);
    
    // User status dropdown
    const userStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Active', 'Inactive', 'Suspended'])
      .setAllowInvalid(false)
      .setHelpText('Select user status')
      .build();
    userAccessSheet.getRange('C:C').setDataValidation(userStatusRule);
  }
  
  console.log('✅ Data validation rules added');
}

/**
 * Add conditional formatting for better visual organization
 */
function addConditionalFormatting(spreadsheet) {
  console.log('🎨 Adding conditional formatting...');
  
  // Staff status formatting
  const staffSheet = spreadsheet.getSheetByName('Staff_Data');
  if (staffSheet) {
    const statusRange = staffSheet.getRange('G:G');
    
    const activeRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Active')
      .setBackground('#d9ead3')
      .setRanges([statusRange])
      .build();
    
    const inactiveRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Inactive')
      .setBackground('#f4cccc')
      .setRanges([statusRange])
      .build();
    
    const onLeaveRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('On Leave')
      .setBackground('#fff2cc')
      .setRanges([statusRange])
      .build();
    
    staffSheet.setConditionalFormatRules([activeRule, inactiveRule, onLeaveRule]);
  }
  
  // Availability formatting
  const availabilitySheet = spreadsheet.getSheetByName('Availability');
  if (availabilitySheet) {
    const availabilityRange = availabilitySheet.getRange('D:D');
    
    const availableRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Available')
      .setBackground('#d9ead3')
      .setRanges([availabilityRange])
      .build();
    
    const notAvailableRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Not Available')
      .setBackground('#f4cccc')
      .setRanges([availabilityRange])
      .build();
    
    const ifNeededRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('If Needed')
      .setBackground('#fff2cc')
      .setRanges([availabilityRange])
      .build();
    
    availabilitySheet.setConditionalFormatRules([availableRule, notAvailableRule, ifNeededRule]);
  }
  
  // Time-off request status formatting
  const timeOffSheet = spreadsheet.getSheetByName('Time_Off_Requests');
  if (timeOffSheet) {
    const statusRange = timeOffSheet.getRange('G:G');
    
    const approvedRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Auto-Approved')
      .setBackground('#d9ead3')
      .setRanges([statusRange])
      .build();
    
    const deniedRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Denied')
      .setBackground('#f4cccc')
      .setRanges([statusRange])
      .build();
    
    const pendingRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Pending')
      .setBackground('#fff2cc')
      .setRanges([statusRange])
      .build();
    
    timeOffSheet.setConditionalFormatRules([approvedRule, deniedRule, pendingRule]);
  }
  
  console.log('✅ Conditional formatting added');
}

/**
 * Store the database spreadsheet ID for backend functions
 */
function setDatabaseSpreadsheetId(spreadsheetId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('database_spreadsheet_id', spreadsheetId);
  console.log('💾 Database ID stored for backend access');
}

/**
 * Test function to create and verify the database
 * Run this function to test the complete database creation process
 */
function testDatabaseCreation() {
  console.log('🧪 Testing database creation...');
  
  try {
    const result = createSchedulingDatabase();
    console.log('✅ Test successful!');
    console.log(`📋 Database URL: ${result.url}`);
    console.log(`🆔 Database ID: ${result.id}`);
    console.log('🎯 Copy this URL - you\'ll need it for the next steps!');
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}