/**
 * Staff Scheduling Backend Functions
 * Extracted and converted from TypeScript for Google Sites integration
 */

/**
 * Get current authenticated user information
 */
function getCurrentUser() {
  try {
    const user = Session.getActiveUser();
    const email = user.getEmail();
    
    if (!email) {
      throw new Error('No authenticated user found');
    }
    
    return {
      email: email,
      role: getUserRole(email),
      authenticated: true
    };
  } catch (error) {
    const errorMessage = error.toString();
    console.log('Auth error: ' + errorMessage);
    return {
      email: '',
      role: 'staff',
      authenticated: false,
      error: errorMessage
    };
  }
}

/**
 * Get user role based on email
 */
function getUserRole(email) {
  // For now, check against User_Access sheet in our database
  try {
    const userAccessSheet = getSheetByName('User_Access');
    if (!userAccessSheet) return 'staff';
    
    const data = userAccessSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) { // Email column
        const role = data[i][1]; // Role column
        return role.toLowerCase();
      }
    }
    
    return 'staff'; // Default role
  } catch (error) {
    console.log('Error getting user role:', error);
    return 'staff';
  }
}

/**
 * Helper function to get a sheet by name from our database spreadsheet
 */
function getSheetByName(sheetName) {
  try {
    // This will need to be updated with the actual spreadsheet ID once created
    const scriptProperties = PropertiesService.getScriptProperties();
    const spreadsheetId = scriptProperties.getProperty('database_spreadsheet_id');
    
    if (!spreadsheetId) {
      console.log('No database spreadsheet ID found');
      return null;
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    return spreadsheet.getSheetByName(sheetName);
  } catch (error) {
    console.log('Error accessing sheet:', error);
    return null;
  }
}

/**
 * Add a new staff member
 */
function addStaff(staffData) {
  try {
    // Validate required fields
    if (!staffData.name || !staffData.email) {
      return { success: false, error: 'Name and email are required' };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(staffData.email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    
    // Get staff sheet
    const staffSheet = getSheetByName('Staff_Data');
    if (!staffSheet) {
      return { success: false, error: 'Staff sheet not found' };
    }
    
    // Check if staff already exists
    const data = staffSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === staffData.email) { // Email column
        return { success: false, error: 'Staff member with this email already exists' };
      }
    }
    
    // Add new staff member
    const nextId = data.length; // Simple ID assignment
    const newRow = [
      nextId,
      staffData.name,
      staffData.email,
      staffData.phone || '',
      staffData.position || 'Staff',
      staffData.skills || '',
      'Active',
      new Date(),
      staffData.hire_date || new Date(),
      staffData.emergency_contact || '',
      staffData.notes || ''
    ];
    
    staffSheet.appendRow(newRow);
    
    return { 
      success: true, 
      message: 'Staff member added successfully',
      data: { ...staffData, id: nextId }
    };
    
  } catch (error) {
    console.log('Error adding staff:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Get all staff members
 */
function getAllStaff() {
  try {
    const staffSheet = getSheetByName('Staff_Data');
    if (!staffSheet) {
      return { success: false, error: 'Staff sheet not found' };
    }
    
    const data = staffSheet.getDataRange().getValues();
    const headers = data[0];
    const staffList = [];
    
    for (let i = 1; i < data.length; i++) {
      const staff = {};
      headers.forEach((header, index) => {
        staff[header.toLowerCase().replace(' ', '_')] = data[i][index];
      });
      staffList.push(staff);
    }
    
    return { success: true, data: staffList };
    
  } catch (error) {
    console.log('Error getting staff:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Store the database spreadsheet ID after creation
 */
function setDatabaseSpreadsheetId(spreadsheetId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('database_spreadsheet_id', spreadsheetId);
  console.log('Database spreadsheet ID saved:', spreadsheetId);
}

/**
 * Get the stored database spreadsheet ID
 */
function getDatabaseSpreadsheetId() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty('database_spreadsheet_id');
}

/**
 * Initialize the backend after database creation
 */
function initializeBackend(spreadsheetId) {
  setDatabaseSpreadsheetId(spreadsheetId);
  console.log('Backend initialized with database:', spreadsheetId);
  return { success: true, message: 'Backend initialized successfully' };
}