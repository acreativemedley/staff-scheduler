/**
 * Frontend Base Schedule Creator Backend Functions
 * Simple, clean functions to support the web interface
 */

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

/**
 * Get the current base schedule (for editing/viewing)
 */
function getCurrentBaseSchedule() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const baseSheet = spreadsheet.getSheetByName('Base_Weekly_Assignments');
    
    if (!baseSheet) {
      return { exists: false };
    }
    
    const data = baseSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { exists: true, empty: true };
    }
    
    // Convert to structured format
    const schedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    
    const headers = data[0];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const day = row[0].toString().toLowerCase();
      
      if (schedule[day]) {
        schedule[day].push({
          staffId: row[1],
          displayName: row[2],
          role: row[3],
          startTime: row[4],
          endTime: row[5],
          hours: row[6],
          position: row[7]
        });
      }
    }
    
    return { exists: true, schedule: schedule };
    
  } catch (error) {
    console.error('Error getting current base schedule:', error);
    return { exists: false, error: error.message };
  }
}