/**
 * Google Forms Setup Script
 * Creates the necessary forms for the scheduling system
 * Database ID: 1qnB2yCNtKMHwCclaVeZqoxwalkNou5doShfeEg10pRw
 */

// Get database ID to avoid duplicate declarations
function getDatabaseId() {
  return '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
}

/**
 * Main function to create all forms
 */
function createAllForms() {
  try {
    console.log('Creating Google Forms for scheduling system...');
    
    const timeOffForm = createTimeOffRequestForm();
    const staffRegistrationForm = createStaffRegistrationForm();
    
    // Store form IDs in the database for reference
    storeFormIds(timeOffForm.getId(), staffRegistrationForm.getId());
    
    console.log('All forms created successfully!');
    console.log('Time-Off Form:', timeOffForm.getPublishedUrl());
    console.log('Staff Registration Form:', staffRegistrationForm.getPublishedUrl());
    
    return {
      timeOffFormId: timeOffForm.getId(),
      timeOffFormUrl: timeOffForm.getPublishedUrl(),
      staffRegistrationFormId: staffRegistrationForm.getId(),
      staffRegistrationFormUrl: staffRegistrationForm.getPublishedUrl()
    };
  } catch (error) {
    console.error('Error creating forms:', error);
    throw error;
  }
}

/**
 * Creates the Time-Off Request Form
 */
function createTimeOffRequestForm() {
  const form = FormApp.create('Time-Off Request Form');
  
  // Set form description
  form.setDescription('Submit requests for time off. Requests made more than 4 weeks in advance will be automatically approved. Shorter notice requests require manager approval and will generate email notifications.');
  
  // Configure form settings
  form.setCollectEmail(true);
  form.setAllowResponseEdits(false);
  form.setAcceptingResponses(true);
  
  // Get staff list from database for dropdown
  const staffNames = getStaffNamesFromDatabase();
  
  // Staff Name (dropdown)
  const staffNameItem = form.addListItem();
  staffNameItem.setTitle('Staff Member');
  staffNameItem.setRequired(true);
  staffNameItem.setChoiceValues(staffNames);
  staffNameItem.setHelpText('Select your name from the list');
  
  // Start Date
  const startDateItem = form.addDateItem();
  startDateItem.setTitle('Start Date');
  startDateItem.setRequired(true);
  startDateItem.setHelpText('First day you will be off');
  
  // End Date
  const endDateItem = form.addDateItem();
  endDateItem.setTitle('End Date');
  endDateItem.setRequired(true);
  endDateItem.setHelpText('Last day you will be off (same as start date for single day)');
  
  // Is Partial Day? (Yes/No)
  const partialDayItem = form.addMultipleChoiceItem();
  partialDayItem.setTitle('Is this a partial day request?');
  partialDayItem.setRequired(true);
  partialDayItem.setChoices([
    partialDayItem.createChoice('No - Full day(s) off'),
    partialDayItem.createChoice('Yes - Partial day(s)')
  ]);
  
  // Start Time (conditional on partial day)
  const startTimeItem = form.addTimeItem();
  startTimeItem.setTitle('Start Time (if partial day)');
  startTimeItem.setRequired(false);
  startTimeItem.setHelpText('Time you need to leave or start being off (leave blank for full days)');
  
  // End Time (conditional on partial day)  
  const endTimeItem = form.addTimeItem();
  endTimeItem.setTitle('End Time (if partial day)');
  endTimeItem.setRequired(false);
  endTimeItem.setHelpText('Time you will return or stop being off (leave blank for full days). Must be after start time.');
  
  // Notes (renamed from Reason)
  const notesItem = form.addParagraphTextItem();
  notesItem.setTitle('Notes');
  notesItem.setRequired(false);
  notesItem.setHelpText('Optional: Provide additional details about your request');
  
  // Link form to spreadsheet
  const spreadsheet = SpreadsheetApp.openById(getDatabaseId());
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  
  // Set the specific sheet for responses
  linkFormToSheet(form, 'Time_Off_Requests');
  
  return form;
}

/**
 * Creates the Staff Registration Form (for new staff setup)
 */
function createStaffRegistrationForm() {
  const form = FormApp.create('New Staff Registration Form');
  
  // Set form description
  form.setDescription('Complete this form when setting up a new staff member. This will create their profile in the scheduling system.');
  
  // Configure form settings
  form.setCollectEmail(true);
  form.setAllowResponseEdits(false);
  form.setAcceptingResponses(true);
  
  // Full Name
  const nameItem = form.addTextItem();
  nameItem.setTitle('Full Name');
  nameItem.setRequired(true);
  nameItem.setHelpText('Enter the staff member\'s full legal name');
  
  // Display Name (what they go by)
  const displayNameItem = form.addTextItem();
  displayNameItem.setTitle('Display Name (Goes By)');
  displayNameItem.setRequired(true);
  displayNameItem.setHelpText('Enter the name that should appear on schedules (e.g., "Liz" instead of "Elizabeth")');
  
  // Email Address
  const emailItem = form.addTextItem();
  emailItem.setTitle('Work Email Address');
  emailItem.setRequired(true);
  emailItem.setHelpText('Enter the staff member\'s work email address');
  
  // Phone Number
  const phoneItem = form.addTextItem();
  phoneItem.setTitle('Phone Number');
  phoneItem.setRequired(true);
  phoneItem.setHelpText('Enter the staff member\'s phone number');
  
  // Role (dropdown)
  const roleItem = form.addListItem();
  roleItem.setTitle('Role');
  roleItem.setRequired(true);
  roleItem.setChoiceValues(['Admin', 'Manager', 'Staff']);
  roleItem.setHelpText('Select the staff member\'s role in the system');
  
  // Start Date
  const startDateItem = form.addDateItem();
  startDateItem.setTitle('Start Date');
  startDateItem.setRequired(true);
  startDateItem.setHelpText('When does this staff member start?');
  
  // Minimum Hours Per Week
  const minHoursItem = form.addTextItem();
  minHoursItem.setTitle('Minimum Hours Per Week');
  minHoursItem.setRequired(true);
  minHoursItem.setHelpText('Enter minimum hours this staff member should work per week (number only)');
  
  // Maximum Hours Per Week
  const maxHoursItem = form.addTextItem();
  maxHoursItem.setTitle('Maximum Hours Per Week');
  maxHoursItem.setRequired(true);
  maxHoursItem.setHelpText('Enter maximum hours this staff member can work per week (number only)');
  
  // Status (dropdown)
  const statusItem = form.addListItem();
  statusItem.setTitle('Status');
  statusItem.setRequired(true);
  statusItem.setChoiceValues(['Active', 'Inactive', 'On Leave']);
  statusItem.setHelpText('Current employment status');
  
  // Link form to spreadsheet
  const spreadsheet = SpreadsheetApp.openById(getDatabaseId());
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  
  // Set the specific sheet for responses
  linkFormToSheet(form, 'Staff_Data');
  
  return form;
}

/**
 * Update staff dropdown in Time-Off Request form with current staff list
 */
function updateStaffDropdown() {
  try {
    console.log('Updating staff dropdown in Time-Off Request form...');
    
    const spreadsheet = SpreadsheetApp.openById(getDatabaseId());
    const configSheet = spreadsheet.getSheetByName('Config');
    
    if (!configSheet) {
      throw new Error('Config sheet not found');
    }
    
    // Get Time-Off form ID
    const data = configSheet.getDataRange().getValues();
    let timeOffFormId = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'Time_Off_Form_ID') {
        timeOffFormId = data[i][1];
        break;
      }
    }
    
    if (!timeOffFormId) {
      throw new Error('Time-Off form ID not found in Config sheet');
    }
    
    // Open the form and get current staff names
    const form = FormApp.openById(timeOffFormId);
    const staffNames = getStaffNamesFromDatabase();
    
    // Find the staff dropdown question (first question)
    const items = form.getItems();
    const staffDropdown = items.find(item => item.getType() === FormApp.ItemType.LIST);
    
    if (staffDropdown) {
      const listItem = staffDropdown.asListItem();
      listItem.setChoiceValues(staffNames);
      console.log(`Staff dropdown updated with ${staffNames.length} names: ${staffNames.join(', ')}`);
    } else {
      console.error('Staff dropdown not found in Time-Off form');
    }
    
  } catch (error) {
    console.error('Error updating staff dropdown:', error);
    throw error;
  }
}

/**
 * Get staff names from the database for dropdown options
 */
function getStaffNamesFromDatabase() {
  try {
    const spreadsheet = SpreadsheetApp.openById(getDatabaseId());
    const staffSheet = spreadsheet.getSheetByName('Staff_Data');
    
    if (!staffSheet) {
      console.log('Staff_Data sheet not found, using default names');
      return ['John', 'Sarah', 'Mike'];
    }
    
    // Get display names from column C (starting from row 2 to skip header)
    const lastRow = staffSheet.getLastRow();
    if (lastRow < 2) {
      console.log('No staff data found, using default names');
      return ['John', 'Sarah', 'Mike'];
    }
    
    const displayNamesRange = staffSheet.getRange(2, 3, lastRow - 1, 1); // Column C = Display_Name
    const names = displayNamesRange.getValues().flat().filter(name => {
      // Check if name exists, is a string, and has content after trimming
      return name && typeof name === 'string' && name.trim() !== '';
    });
    
    return names.length > 0 ? names : ['John', 'Sarah', 'Mike'];
  } catch (error) {
    console.error('Error getting staff names:', error);
    return ['John', 'Sarah', 'Mike'];
  }
}

/**
 * Link a form to a specific sheet in the database
 */
function linkFormToSheet(form, sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(getDatabaseId());
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (sheet) {
      // Note: Google Forms automatically creates a new sheet for responses
      // We'll handle the data mapping in the backend processing
      console.log(`Form linked to spreadsheet, targeting sheet: ${sheetName}`);
    } else {
      console.error(`Sheet ${sheetName} not found in database`);
    }
  } catch (error) {
    console.error(`Error linking form to sheet ${sheetName}:`, error);
  }
}

/**
 * Store form IDs in the database for reference
 */
function storeFormIds(timeOffFormId, staffRegistrationFormId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(getDatabaseId());
    
    // Create or update a Config sheet to store form IDs
    let configSheet = spreadsheet.getSheetByName('Config');
    if (!configSheet) {
      configSheet = spreadsheet.insertSheet('Config');
      
      // Set up headers
      configSheet.getRange(1, 1, 1, 2).setValues([['Setting', 'Value']]);
      configSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    }
    
    // Store form IDs
    const configData = [
      ['Time_Off_Form_ID', timeOffFormId],
      ['Staff_Registration_Form_ID', staffRegistrationFormId],
      ['Database_Spreadsheet_ID', getDatabaseId()],
      ['Last_Updated', new Date().toISOString()]
    ];
    
    configSheet.getRange(2, 1, configData.length, 2).setValues(configData);
    
    console.log('Form IDs stored in Config sheet');
  } catch (error) {
    console.error('Error storing form IDs:', error);
  }
}

/**
 * Get form URLs for easy access
 */
function getFormUrls() {
  try {
    const spreadsheet = SpreadsheetApp.openById(getDatabaseId());
    const configSheet = spreadsheet.getSheetByName('Config');
    
    if (!configSheet) {
      throw new Error('Config sheet not found. Run createAllForms() first.');
    }
    
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
    
    const urls = {};
    if (timeOffFormId) {
      const timeOffForm = FormApp.openById(timeOffFormId);
      urls.timeOffFormUrl = timeOffForm.getPublishedUrl();
    }
    
    if (staffRegistrationFormId) {
      const staffForm = FormApp.openById(staffRegistrationFormId);
      urls.staffRegistrationFormUrl = staffForm.getPublishedUrl();
    }
    
    return urls;
  } catch (error) {
    console.error('Error getting form URLs:', error);
    throw error;
  }
}