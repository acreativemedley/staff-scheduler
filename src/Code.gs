/**
 * Staff Scheduling Application - Main Entry Point
 * Created: September 24, 2025
 */

function doGet(e) {
  // Main entry point for web app with routing
  const page = e.parameter.page || 'staff';
  
  if (page === 'staff') {
    return HtmlService.createHtmlOutputFromFile('StaffDirectory')
      .setTitle('Staff Directory - Madison Scheduling')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  if (page === 'base-schedule') {
    return HtmlService.createHtmlOutputFromFile('BaseScheduleCreator')
      .setTitle('Create Base Schedule - Staff Scheduling')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Default to staff directory
  return HtmlService.createHtmlOutputFromFile('StaffDirectory')
    .setTitle('Staff Directory - Madison Scheduling')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  // Helper function to include HTML/CSS/JS files
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function onInstall() {
  // Run setup when app is first installed
  Logger.log('Staff Scheduling App installed');
  initializeApp();
}

function initializeApp() {
  // Initialize application settings and data structures
  Logger.log('Initializing Staff Scheduling Application...');
  
  // Create initial data structures in Properties Service
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Set default configuration
  scriptProperties.setProperties({
    'app_version': '1.0.0',
    'app_initialized': new Date().toISOString(),
    'default_timezone': Session.getScriptTimeZone()
  });
  
  Logger.log('App initialization complete');
}

// Test function to verify setup
function testSetup() {
  Logger.log('Testing Staff Scheduling App setup...');
  const properties = PropertiesService.getScriptProperties().getProperties();
  Logger.log('Current properties:', properties);
  return 'Setup test complete - check logs';
}

// =============================================
// SIMPLE FRONTEND FUNCTIONS
// =============================================

/**
 * Get staff directory for simple frontend display
 * Works with existing Staff_Data sheet structure
 */
function getStaffDirectory() {
  try {
    console.log('🔍 Loading staff directory...');
    
    // Use the documented spreadsheet ID
    const STAFF_DB_ID = '1qnB2yCNtKMHwCclaVeZqoxwalkNou5doShfeEg10pRw';
    const spreadsheet = SpreadsheetApp.openById(STAFF_DB_ID);
    const staffSheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!staffSheet) {
      throw new Error('Staff_Data sheet not found');
    }
    
    const data = staffSheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log('No staff data found');
      return [];
    }
    
    const headers = data[0];
    const staff = [];
    
    // Find column indices - flexible to handle whatever columns exist
    const nameCol = headers.findIndex(h => h.toString().toLowerCase().includes('name') && !h.toString().toLowerCase().includes('display'));
    const displayCol = headers.findIndex(h => h.toString().toLowerCase().includes('display'));
    const positionCol = headers.findIndex(h => h.toString().toLowerCase().includes('position'));
    const statusCol = headers.findIndex(h => h.toString().toLowerCase().includes('status'));
    
    console.log(`Found columns - Name: ${nameCol}, Display: ${displayCol}, Position: ${positionCol}, Status: ${statusCol}`);
    
    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[nameCol] && !row[displayCol]) continue;
      
      // Skip inactive staff
      if (statusCol >= 0 && row[statusCol] && row[statusCol].toString().toLowerCase() === 'inactive') {
        continue;
      }
      
      const staffMember = {
        name: row[nameCol] ? row[nameCol].toString() : '',
        displayName: row[displayCol] ? row[displayCol].toString() : (row[nameCol] ? row[nameCol].toString() : ''),
        position: row[positionCol] ? row[positionCol].toString() : 'Staff'
      };
      
      staff.push(staffMember);
    }
    
    console.log(`✅ Loaded ${staff.length} active staff members`);
    return staff;
    
  } catch (error) {
    console.error('❌ Error loading staff directory:', error);
    throw new Error('Failed to load staff directory: ' + error.message);
  }
}

// =============================================
// BASE SCHEDULE MANAGEMENT FUNCTIONS
// =============================================

/**
 * Get staff data formatted for the frontend scheduling interface
 */
function getStaffForScheduling() {
  try {
    const staffSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Staff_Directory');
    if (!staffSheet) {
      throw new Error('Staff_Directory sheet not found');
    }
    
    const data = staffSheet.getDataRange().getValues();
    const headers = data[0];
    const staff = [];
    
    // Find column indices
    const idCol = headers.indexOf('Staff_ID');
    const displayCol = headers.indexOf('Display_Name');
    const roleCol = headers.indexOf('Role');
    const statusCol = headers.indexOf('Status');
    
    if (idCol === -1 || displayCol === -1 || roleCol === -1) {
      throw new Error('Required columns not found in Staff_Directory');
    }
    
    // Process staff data (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Only include active staff
      if (statusCol !== -1 && row[statusCol] && row[statusCol].toString().toLowerCase() === 'inactive') {
        continue;
      }
      
      if (row[idCol] && row[displayCol]) {
        staff.push({
          id: row[idCol].toString(),
          displayName: row[displayCol].toString(),
          role: row[roleCol] ? row[roleCol].toString() : 'Staff'
        });
      }
    }
    
    // Sort by role (Managers first) then by name
    staff.sort((a, b) => {
      if (a.role === 'Manager' && b.role !== 'Manager') return -1;
      if (b.role === 'Manager' && a.role !== 'Manager') return 1;
      return a.displayName.localeCompare(b.displayName);
    });
    
    console.log(`Loaded ${staff.length} active staff members for scheduling`);
    return staff;
    
  } catch (error) {
    console.error('Error loading staff for scheduling:', error);
    throw new Error('Failed to load staff data: ' + error.message);
  }
}

/**
 * Save base schedule data from the frontend
 */
function saveBaseSchedule(scheduleData) {
  try {
    console.log('Saving base schedule with data:', scheduleData);
    
    // Create or get the Base_Weekly_Assignments sheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let baseSheet = spreadsheet.getSheetByName('Base_Weekly_Assignments');
    
    if (!baseSheet) {
      baseSheet = createBaseWeeklyAssignmentsSheet();
    } else {
      // Clear existing data (keep headers)
      const lastRow = baseSheet.getLastRow();
      if (lastRow > 1) {
        baseSheet.getRange(2, 1, lastRow - 1, baseSheet.getLastColumn()).clear();
      }
    }
    
    // Parse the schedule data and save to sheet
    const assignments = parseScheduleDataForSheet(scheduleData);
    
    if (assignments.length > 0) {
      // Add all assignments to the sheet
      const range = baseSheet.getRange(2, 1, assignments.length, 8);
      range.setValues(assignments);
      
      console.log(`Saved ${assignments.length} base schedule assignments`);
    }
    
    // Log the successful creation
    console.log('Base schedule saved successfully');
    return { success: true, message: 'Base schedule saved successfully' };
    
  } catch (error) {
    console.error('Error saving base schedule:', error);
    throw new Error('Failed to save base schedule: ' + error.message);
  }
}

/**
 * Create the Base_Weekly_Assignments sheet structure
 */
function createBaseWeeklyAssignmentsSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.insertSheet('Base_Weekly_Assignments');
  
  // Set up headers
  const headers = [
    'Day_of_Week',
    'Staff_ID',
    'Display_Name',
    'Role',
    'Start_Time',
    'End_Time',
    'Hours',
    'Position'
  ];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // Format the header row
  headerRange.setBackground('#4285F4');
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
  sheet.setColumnWidth(7, 80);  // Hours
  sheet.setColumnWidth(8, 120); // Position
  
  // Freeze the header row
  sheet.setFrozenRows(1);
  
  console.log('Created Base_Weekly_Assignments sheet');
  return sheet;
}

/**
 * Parse the frontend schedule data into sheet format
 */
function parseScheduleDataForSheet(scheduleData) {
  const assignments = [];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Get staff lookup for display names
  const staffLookup = getStaffLookup();
  
  days.forEach((day, dayIndex) => {
    const dayName = dayNames[dayIndex];
    
    // Process manager assignment
    const managerKey = day + '-manager';
    if (scheduleData[managerKey]) {
      const staffId = scheduleData[managerKey];
      const startTime = scheduleData[managerKey + '-start'] || '10:00';
      const endTime = scheduleData[managerKey + '-end'] || '18:00';
      
      const staff = staffLookup[staffId];
      if (staff) {
        assignments.push([
          dayName,
          staffId,
          staff.displayName,
          'Manager',
          startTime,
          endTime,
          calculateHours(startTime, endTime),
          'Manager'
        ]);
      }
    }
    
    // Process staff assignments
    Object.keys(scheduleData).forEach(key => {
      if (key.startsWith(day + '-staff-') && !key.includes('-start') && !key.includes('-end')) {
        const staffId = scheduleData[key];
        const startTime = scheduleData[key + '-start'] || '10:00';
        const endTime = scheduleData[key + '-end'] || '18:00';
        
        const staff = staffLookup[staffId];
        if (staff) {
          const position = key.replace(day + '-', '').replace('-', ' ');
          assignments.push([
            dayName,
            staffId,
            staff.displayName,
            'Staff',
            startTime,
            endTime,
            calculateHours(startTime, endTime),
            position
          ]);
        }
      }
    });
  });
  
  return assignments;
}

/**
 * Get staff lookup table for display names
 */
function getStaffLookup() {
  const staffData = getStaffForScheduling();
  const lookup = {};
  
  staffData.forEach(staff => {
    lookup[staff.id] = {
      displayName: staff.displayName,
      role: staff.role
    };
  });
  
  return lookup;
}

/**
 * Calculate hours between two time strings
 */
function calculateHours(startTime, endTime) {
  const start = new Date('2000-01-01 ' + startTime + ':00');
  const end = new Date('2000-01-01 ' + endTime + ':00');
  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.max(0, diffHours);
}

// =============================================
// DATABASE REPAIR FUNCTIONS
// =============================================

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
    clearAllSheetsForRepair(spreadsheet);
    
    // Step 2: Recreate clean structure based on your design
    createCleanStructureForRepair(spreadsheet);
    
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

function clearAllSheetsForRepair(spreadsheet) {
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

function createCleanStructureForRepair(spreadsheet) {
  console.log('🏗️ Creating clean database structure...');
  
  // Create all the sheets based on your design
  repairCreateStaffDirectory(spreadsheet);
  repairCreateStaffAvailability(spreadsheet);
  repairCreateTimeOffRequests(spreadsheet);
  repairCreateBaseWeeklyAssignments(spreadsheet);
  repairCreateScheduleTemplates(spreadsheet);
  repairCreateUserAccess(spreadsheet);
  
  // Delete the temp sheet
  const tempSheet = spreadsheet.getSheetByName('TEMP_SHEET');
  if (tempSheet) {
    spreadsheet.deleteSheet(tempSheet);
  }
  
  console.log('🏗️ Clean structure created');
}

function repairCreateStaffDirectory(spreadsheet) {
  const sheet = spreadsheet.insertSheet('Staff_Directory');
  
  const headers = ['Staff_ID', 'Staff_Name', 'Display_Name', 'Role', 'Status', 'Email'];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 100);
  sheet.setColumnWidth(6, 200);
  sheet.setFrozenRows(1);
}

function repairCreateStaffAvailability(spreadsheet) {
  const sheet = spreadsheet.insertSheet('Staff_Availability');
  
  const headers = ['Staff_ID', 'Display_Name', 'Day', 'Availability', 'Start_Time', 'End_Time', 'Min_Hours_Week', 'Max_Hours_Week', 'Notes'];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#34A853');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
}

function repairCreateTimeOffRequests(spreadsheet) {
  const sheet = spreadsheet.insertSheet('Time_Off_Requests');
  
  const headers = ['Request_ID', 'Staff_ID', 'Start_Date', 'End_Date', 'Partial_Day', 'Start_Time', 'End_Time', 'Submitted_Date', 'Email_Required', 'Notes'];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#EA4335');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
}

function repairCreateBaseWeeklyAssignments(spreadsheet) {
  const sheet = spreadsheet.insertSheet('Base_Weekly_Assignments');
  
  const headers = ['Day_of_Week', 'Staff_ID', 'Display_Name', 'Role', 'Start_Time', 'End_Time'];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#9C27B0');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
}

function repairCreateScheduleTemplates(spreadsheet) {
  const sheet = spreadsheet.insertSheet('Schedule_Templates');
  
  const headers = ['Template_ID', 'Day', 'Required_Staff', 'Required_Managers', 'Business_Hours_Start', 'Business_Hours_End'];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
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

function repairCreateUserAccess(spreadsheet) {
  const sheet = spreadsheet.insertSheet('User_Access');
  
  const headers = ['User_Email', 'Role', 'Status', 'Added_Date', 'Notes'];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#607D8B');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
}

/**
 * Get staff directory for frontend display
 */
function getStaffDirectory() {
  try {
    const SPREADSHEET_ID = '1qnB2yCNtKMHwCclaVeZqoxwalkNou5doShfeEg10pRw';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    Logger.log('Opening Staff_Data sheet...');
    const sheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!sheet) {
      throw new Error('Staff_Data sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      Logger.log('No staff data found (only headers or empty)');
      return [];
    }
    
    const headers = data[0];
    Logger.log('Headers found:', headers);
    
    // Find column indices dynamically
    const nameCol = headers.findIndex(h => h.toLowerCase().includes('name') && !h.toLowerCase().includes('display'));
    const displayNameCol = headers.findIndex(h => h.toLowerCase().includes('display') && h.toLowerCase().includes('name'));
    const positionCol = headers.findIndex(h => h.toLowerCase().includes('position') || h.toLowerCase().includes('role') || h.toLowerCase().includes('title'));
    
    Logger.log(`Column indices - Name: ${nameCol}, DisplayName: ${displayNameCol}, Position: ${positionCol}`);
    
    const staff = [];
    
    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[nameCol] && !row[displayNameCol]) {
        continue;
      }
      
      const person = {
        name: nameCol >= 0 ? row[nameCol] : '',
        displayName: displayNameCol >= 0 ? row[displayNameCol] : '',
        position: positionCol >= 0 ? row[positionCol] : ''
      };
      
      // Use display name if available, otherwise use regular name
      if (!person.displayName && person.name) {
        person.displayName = person.name;
      }
      
      staff.push(person);
    }
    
    Logger.log(`Found ${staff.length} staff members`);
    return staff;
    
  } catch (error) {
    Logger.log('Error in getStaffDirectory:', error.toString());
    throw new Error('Failed to load staff directory: ' + error.message);
  }
}