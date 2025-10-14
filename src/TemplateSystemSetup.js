/**
 * Schedule Template System Setup
 * Creates Google Sheets-based scheduling templates with business-specific requirements
 */

function createScheduleTemplateSystem() {
  console.log('🏗️  Creating Schedule Template System...');
  
  try {
    const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
    const database = SpreadsheetApp.openById(DATABASE_ID);
    
    // Update Schedule_Templates sheet with proper structure
    const templatesSheet = database.getSheetByName('Schedule_Templates');
    if (!templatesSheet) {
      throw new Error('Schedule_Templates sheet not found');
    }
    
    // Create template structure headers
    const templateHeaders = [
      'Template_ID', 'Template_Name', 'Week_Starting', 
      'Monday_Full', 'Monday_Partial', 'Monday_Manager',
      'Tuesday_Full', 'Tuesday_Partial', 'Tuesday_Manager',
      'Wednesday_Full', 'Wednesday_Partial', 'Wednesday_Manager',
      'Thursday_Full', 'Thursday_Partial', 'Thursday_Manager',
      'Friday_Full', 'Friday_Partial', 'Friday_Manager',
      'Saturday_Full', 'Saturday_Partial', 'Saturday_Manager',
      'Sunday_Full', 'Sunday_Partial', 'Sunday_Manager',
      'Created_Date', 'Status', 'Notes'
    ];
    
    // Clear and set headers
    templatesSheet.clear();
    templatesSheet.getRange(1, 1, 1, templateHeaders.length).setValues([templateHeaders]);
    
    // Format headers
    const headerRange = templatesSheet.getRange(1, 1, 1, templateHeaders.length);
    headerRange.setBackground('#4285F4')
             .setFontColor('white')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
    
    // Create staff availability management system
    createStaffAvailabilitySystem(database);
    
    // Create sample template based on business requirements
    createDefaultTemplate(templatesSheet);
    
    console.log('✅ Schedule Template System created successfully');
    
  } catch (error) {
    console.error('❌ Error creating schedule template system:', error);
    throw error;
  }
}

function createStaffAvailabilitySystem(database) {
  console.log('📅 Creating Staff Availability Management System...');
  
  // Create or update Staff Availability sheet
  let availabilitySheet = database.getSheetByName('Staff_Availability');
  if (!availabilitySheet) {
    availabilitySheet = database.insertSheet('Staff_Availability');
  } else {
    availabilitySheet.clear();
  }
  
  // Availability system headers
  const availabilityHeaders = [
    'Staff_ID', 'Full_Name', 'Display_Name', 'Role',
    'Monday_Full_Available', 'Monday_Partial_Available', 
    'Tuesday_Full_Available', 'Tuesday_Partial_Available',
    'Wednesday_Full_Available', 'Wednesday_Partial_Available',
    'Thursday_Full_Available', 'Thursday_Partial_Available', 
    'Friday_Full_Available', 'Friday_Partial_Available',
    'Saturday_Full_Available', 'Saturday_Partial_Available',
    'Sunday_Full_Available', 'Sunday_Partial_Available',
    'General_Notes', 'Last_Updated'
  ];
  
  availabilitySheet.getRange(1, 1, 1, availabilityHeaders.length)
                  .setValues([availabilityHeaders]);
  
  // Format headers
  const headerRange = availabilitySheet.getRange(1, 1, 1, availabilityHeaders.length);
  headerRange.setBackground('#34A853')
             .setFontColor('white')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
  
  // Auto-populate from Staff_Data
  populateStaffAvailability(database, availabilitySheet);
  
  // Add data validation for availability columns
  setupAvailabilityValidation(availabilitySheet);
  
  console.log('✅ Staff Availability System created');
}

function populateStaffAvailability(database, availabilitySheet) {
  const staffSheet = database.getSheetByName('Staff_Data');
  if (!staffSheet) return;
  
  const staffData = staffSheet.getDataRange().getValues();
  const staffHeaders = staffData[0];
  
  // Find column indices
  const fullNameCol = staffHeaders.indexOf('Full_Name');
  const displayNameCol = staffHeaders.indexOf('Display_Name');
  const roleCol = staffHeaders.indexOf('Role');
  
  if (fullNameCol === -1 || displayNameCol === -1) return;
  
  // Populate staff availability with default GREEN status
  const availabilityData = [];
  for (let i = 1; i < staffData.length; i++) {
    const staff = staffData[i];
    if (!staff[fullNameCol]) continue;
    
    const row = [
      i, // Staff_ID (row number)
      staff[fullNameCol], // Full_Name
      staff[displayNameCol] || staff[fullNameCol], // Display_Name
      staff[roleCol] || 'Staff', // Role
      'GREEN', 'GREEN', // Monday
      'GREEN', 'GREEN', // Tuesday
      'GREEN', 'GREEN', // Wednesday
      'GREEN', 'GREEN', // Thursday
      'GREEN', 'GREEN', // Friday
      'GREEN', 'GREEN', // Saturday
      'GREEN', 'GREEN', // Sunday (Full and Partial)
      '', // General_Notes
      new Date() // Last_Updated
    ];
    
    availabilityData.push(row);
  }
  
  if (availabilityData.length > 0) {
    availabilitySheet.getRange(2, 1, availabilityData.length, availabilityData[0].length)
                    .setValues(availabilityData);
  }
}

function setupAvailabilityValidation(sheet) {
  const availabilityOptions = ['GREEN', 'YELLOW', 'RED'];
  const rule = SpreadsheetApp.newDataValidation()
                            .requireValueInList(availabilityOptions, true)
                            .setAllowInvalid(false)
                            .build();
  
  // Apply validation to availability columns (columns 5-16)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const validationRange = sheet.getRange(2, 5, lastRow - 1, 12);
    validationRange.setDataValidation(rule);
    
    // Add conditional formatting
    setupAvailabilityFormatting(sheet, validationRange);
  }
}

function setupAvailabilityFormatting(sheet, range) {
  // GREEN formatting
  const greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('GREEN')
    .setBackground('#00FF00')
    .setFontColor('#000000')
    .setRanges([range])
    .build();
  
  // YELLOW formatting
  const yellowRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('YELLOW')
    .setBackground('#FFFF00')
    .setFontColor('#000000')
    .setRanges([range])
    .build();
  
  // RED formatting
  const redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('RED')
    .setBackground('#FF0000')
    .setFontColor('#FFFFFF')
    .setRanges([range])
    .build();
  
  const rules = sheet.getConditionalFormatRules();
  rules.push(greenRule, yellowRule, redRule);
  sheet.setConditionalFormatRules(rules);
}

function createDefaultTemplate(templatesSheet) {
  console.log('📋 Creating default schedule template...');
  
  // Based on business requirements:
  // Mon-Fri: 1 manager + 4 staff (10-6 M-Thu, 10-5 Fri)
  // Saturday: 1 manager + 4 staff (10-4)
  // Sunday: 3 staff (10-3)
  
  const defaultTemplate = [
    'TEMPLATE_001', // Template_ID
    'Standard Weekly Template', // Template_Name
    new Date(), // Week_Starting (will be updated when used)
    4, 0, 1, // Monday: 4 Full, 0 Partial, 1 Manager
    4, 0, 1, // Tuesday: 4 Full, 0 Partial, 1 Manager
    4, 0, 1, // Wednesday: 4 Full, 0 Partial, 1 Manager
    4, 0, 1, // Thursday: 4 Full, 0 Partial, 1 Manager
    4, 0, 1, // Friday: 4 Full, 0 Partial, 1 Manager
    4, 0, 1, // Saturday: 4 Full, 0 Partial, 1 Manager
    3, 0, 0, // Sunday: 3 Full, 0 Partial, 0 Manager
    new Date(), // Created_Date
    'ACTIVE', // Status
    'Default template based on business requirements' // Notes
  ];
  
  templatesSheet.getRange(2, 1, 1, defaultTemplate.length).setValues([defaultTemplate]);
  
  console.log('✅ Default template created');
}

function getBusinessHours() {
  // Return business hours for each day
  return {
    'Monday': { start: '10:00', end: '18:00', type: 'Full' },
    'Tuesday': { start: '10:00', end: '18:00', type: 'Full' },
    'Wednesday': { start: '10:00', end: '18:00', type: 'Full' },
    'Thursday': { start: '10:00', end: '18:00', type: 'Full' },
    'Friday': { start: '10:00', end: '17:00', type: 'Full' },
    'Saturday': { start: '10:00', end: '16:00', type: 'Full' },
    'Sunday': { start: '10:00', end: '15:00', type: 'Full' }
  };
}

function getStaffingRequirements() {
  // Return staffing requirements for each day
  return {
    'Monday': { managers: 1, staff: 4, total: 5 },
    'Tuesday': { managers: 1, staff: 4, total: 5 },
    'Wednesday': { managers: 1, staff: 4, total: 5 },
    'Thursday': { managers: 1, staff: 4, total: 5 },
    'Friday': { managers: 1, staff: 4, total: 5 },
    'Saturday': { managers: 1, staff: 4, total: 5 },
    'Sunday': { managers: 0, staff: 3, total: 3 }
  };
}

function createScheduleFromTemplate(templateId, weekStarting) {
  console.log(`📅 Creating schedule from template ${templateId} for week ${weekStarting}...`);
  
  const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
  const database = SpreadsheetApp.openById(DATABASE_ID);
  
  const templatesSheet = database.getSheetByName('Schedule_Templates');
  const schedulesSheet = database.getSheetByName('Schedules');
  
  // Find template
  const templates = templatesSheet.getDataRange().getValues();
  const templateIndex = templates.findIndex(row => row[0] === templateId);
  
  if (templateIndex === -1) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  const template = templates[templateIndex];
  
  // Create schedule entry
  const scheduleId = `SCH_${Date.now()}`;
  const scheduleRow = [
    scheduleId,
    template[1], // Template_Name
    weekStarting,
    '', '', '', // Monday slots (to be filled by assignment process)
    '', '', '', // Tuesday slots
    '', '', '', // Wednesday slots
    '', '', '', // Thursday slots
    '', '', '', // Friday slots
    '', '', '', // Saturday slots
    '', '', '', // Sunday slots
    new Date(), // Created_Date
    'DRAFT', // Status
    `Created from template ${templateId}` // Notes
  ];
  
  // Add to schedules sheet
  const lastRow = schedulesSheet.getLastRow();
  schedulesSheet.getRange(lastRow + 1, 1, 1, scheduleRow.length).setValues([scheduleRow]);
  
  console.log(`✅ Schedule ${scheduleId} created from template`);
  return scheduleId;
}

/**
 * Gets staff availability for scheduling
 */
function getStaffAvailabilityForDate(date) {
  const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
  const database = SpreadsheetApp.openById(DATABASE_ID);
  const availabilitySheet = database.getSheetByName('Staff_Availability');
  
  if (!availabilitySheet) {
    throw new Error('Staff_Availability sheet not found');
  }
  
  const data = availabilitySheet.getDataRange().getValues();
  const headers = data[0];
  
  // Determine day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[date.getDay()];
  
  // Find relevant columns for the day
  const fullAvailCol = headers.indexOf(`${dayOfWeek}_Full_Available`);
  const partialAvailCol = headers.indexOf(`${dayOfWeek}_Partial_Available`);
  
  const availability = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    availability.push({
      staffId: row[0],
      fullName: row[1],
      displayName: row[2],
      role: row[3],
      fullAvailable: row[fullAvailCol],
      partialAvailable: row[partialAvailCol]
    });
  }
  
  return availability;
}

// Main execution function
function setupScheduleTemplateSystem() {
  try {
    createScheduleTemplateSystem();
    console.log('🎉 Schedule Template System setup complete!');
    console.log('📋 You can now:');
    console.log('   1. Edit staff availability in the Staff_Availability sheet');
    console.log('   2. Create schedules from templates using createScheduleFromTemplate()');
    console.log('   3. Modify templates in the Schedule_Templates sheet');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}