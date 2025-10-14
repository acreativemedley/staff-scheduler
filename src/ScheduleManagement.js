/**
 * Schedule Management Interface
 * Provides functions for creating, managing, and assigning schedules
 */

function createScheduleManagementInterface() {
  console.log('🎯 Creating Schedule Management Interface...');
  
  const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
  const database = SpreadsheetApp.openById(DATABASE_ID);
  
  // Create Schedule Management dashboard
  createScheduleDashboard(database);
  
  console.log('✅ Schedule Management Interface created');
}

function createScheduleDashboard(database) {
  let dashboardSheet = database.getSheetByName('Schedule_Dashboard');
  if (!dashboardSheet) {
    dashboardSheet = database.insertSheet('Schedule_Dashboard');
  } else {
    dashboardSheet.clear();
  }
  
  // Dashboard headers and structure
  const dashboardData = [
    ['📅 SCHEDULE MANAGEMENT DASHBOARD', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['Current Week:', '', '', 'Next Week:', '', '', ''],
    ['Schedule Status:', 'DRAFT', '', 'Schedule Status:', 'NOT CREATED', '', ''],
    ['', '', '', '', '', '', ''],
    ['🏪 BUSINESS HOURS', '', '', '📊 STAFFING REQUIREMENTS', '', '', ''],
    ['Day', 'Open', 'Close', 'Day', 'Managers', 'Staff', 'Total'],
    ['Monday', '10:00 AM', '6:00 PM', 'Monday', '1', '4', '5'],
    ['Tuesday', '10:00 AM', '6:00 PM', 'Tuesday', '1', '4', '5'],
    ['Wednesday', '10:00 AM', '6:00 PM', 'Wednesday', '1', '4', '5'],
    ['Thursday', '10:00 AM', '6:00 PM', 'Thursday', '1', '4', '5'],
    ['Friday', '10:00 AM', '5:00 PM', 'Friday', '1', '4', '5'],
    ['Saturday', '10:00 AM', '4:00 PM', 'Saturday', '1', '4', '5'],
    ['Sunday', '10:00 AM', '3:00 PM', 'Sunday', '0', '3', '3'],
    ['', '', '', '', '', '', ''],
    ['🎯 QUICK ACTIONS', '', '', '⚠️ ALERTS & WARNINGS', '', '', ''],
    ['Action', 'Status', 'Last Run', 'Alert Type', 'Count', 'Details', ''],
    ['Create This Week', 'Available', '', 'Staff Unavailable', '0', 'All staff available', ''],
    ['Create Next Week', 'Available', '', 'Time Off Conflicts', '0', 'No conflicts', ''],
    ['Update Availability', 'Available', '', 'Under-staffed Days', '0', 'All days covered', ''],
    ['Review Schedules', 'Available', '', 'Manager Coverage', '0', 'All days covered', '']
  ];
  
  // Set dashboard data
  dashboardSheet.getRange(1, 1, dashboardData.length, 7).setValues(dashboardData);
  
  // Format dashboard
  formatScheduleDashboard(dashboardSheet);
}

function formatScheduleDashboard(sheet) {
  // Main title formatting
  const titleRange = sheet.getRange(1, 1, 1, 7);
  titleRange.merge()
           .setBackground('#1155CC')
           .setFontColor('white')
           .setFontSize(16)
           .setFontWeight('bold')
           .setHorizontalAlignment('center');
  
  // Section headers
  const businessHoursHeader = sheet.getRange(6, 1, 1, 3);
  businessHoursHeader.setBackground('#34A853')
                     .setFontColor('white')
                     .setFontWeight('bold')
                     .setHorizontalAlignment('center');
  
  const staffingHeader = sheet.getRange(6, 4, 1, 3);
  staffingHeader.setBackground('#EA4335')
               .setFontColor('white')
               .setFontWeight('bold')
               .setHorizontalAlignment('center');
  
  const actionsHeader = sheet.getRange(16, 1, 1, 3);
  actionsHeader.setBackground('#FF9900')
              .setFontColor('white')
              .setFontWeight('bold')
              .setHorizontalAlignment('center');
  
  const alertsHeader = sheet.getRange(16, 4, 1, 3);
  alertsHeader.setBackground('#9C27B0')
             .setFontColor('white')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
  
  // Table headers
  const tableHeaders = [
    sheet.getRange(7, 1, 1, 3), // Business hours table
    sheet.getRange(7, 4, 1, 3), // Staffing table
    sheet.getRange(17, 1, 1, 3), // Actions table
    sheet.getRange(17, 4, 1, 3)  // Alerts table
  ];
  
  tableHeaders.forEach(range => {
    range.setBackground('#F0F0F0')
         .setFontWeight('bold')
         .setHorizontalAlignment('center');
  });
}

/**
 * Advanced Schedule Creation with Conflict Detection
 */
function createAdvancedSchedule(weekStarting, templateId = 'TEMPLATE_001') {
  console.log(`🚀 Creating advanced schedule for week ${weekStarting}...`);
  
  const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
  const database = SpreadsheetApp.openById(DATABASE_ID);
  
  try {
    // Get template and requirements
    const template = getScheduleTemplate(database, templateId);
    const businessHours = getBusinessHours();
    const staffingReqs = getStaffingRequirements();
    
    // Get staff availability and time-off requests
    const staffAvailability = getAllStaffAvailability(database);
    const timeOffRequests = getTimeOffForWeek(database, weekStarting);
    
    // Create schedule structure
    const schedule = createScheduleStructure(weekStarting, template);
    
    // Assign staff with conflict detection
    const assignmentResult = assignStaffToSchedule(
      schedule, 
      staffAvailability, 
      timeOffRequests, 
      staffingReqs
    );
    
    // Save schedule to database
    const scheduleId = saveScheduleToDatabase(database, assignmentResult.schedule);
    
    // Generate conflict report
    if (assignmentResult.conflicts.length > 0) {
      generateConflictReport(database, scheduleId, assignmentResult.conflicts);
    }
    
    console.log(`✅ Schedule ${scheduleId} created with ${assignmentResult.conflicts.length} conflicts`);
    
    return {
      scheduleId: scheduleId,
      conflicts: assignmentResult.conflicts,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Error creating advanced schedule:', error);
    return {
      scheduleId: null,
      conflicts: [],
      success: false,
      error: error.message
    };
  }
}

function getScheduleTemplate(database, templateId) {
  const templatesSheet = database.getSheetByName('Schedule_Templates');
  const templates = templatesSheet.getDataRange().getValues();
  
  const templateIndex = templates.findIndex(row => row[0] === templateId);
  if (templateIndex === -1) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  return templates[templateIndex];
}

function getAllStaffAvailability(database) {
  const availabilitySheet = database.getSheetByName('Staff_Availability');
  if (!availabilitySheet) {
    throw new Error('Staff_Availability sheet not found');
  }
  
  const data = availabilitySheet.getDataRange().getValues();
  const headers = data[0];
  const availability = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const staffId = row[0];
    
    availability[staffId] = {
      fullName: row[1],
      displayName: row[2],
      role: row[3],
      availability: {
        Monday: { full: row[4], partial: row[5] },
        Tuesday: { full: row[6], partial: row[7] },
        Wednesday: { full: row[8], partial: row[9] },
        Thursday: { full: row[10], partial: row[11] },
        Friday: { full: row[12], partial: row[13] },
        Saturday: { full: row[14], partial: row[15] },
        Sunday: { full: row[16], partial: row[17] }
      }
    };
  }
  
  return availability;
}

function getTimeOffForWeek(database, weekStarting) {
  const timeOffSheet = database.getSheetByName('Time_Off_Requests');
  if (!timeOffSheet) return [];
  
  const data = timeOffSheet.getDataRange().getValues();
  const timeOffRequests = [];
  
  const weekStart = new Date(weekStarting);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const startDate = new Date(row[3]); // Assuming start date is in column 4
    const endDate = new Date(row[4]);   // Assuming end date is in column 5
    const status = row[5];              // Assuming status is in column 6
    
    // Check if approved time off overlaps with the week
    if (status === 'APPROVED' && 
        ((startDate <= weekEnd && endDate >= weekStart))) {
      timeOffRequests.push({
        staffId: row[1],
        staffName: row[2],
        startDate: startDate,
        endDate: endDate,
        type: row[6] || 'FULL_DAY'
      });
    }
  }
  
  return timeOffRequests;
}

function createScheduleStructure(weekStarting, template) {
  const weekStart = new Date(weekStarting);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const schedule = {
    id: `SCH_${Date.now()}`,
    weekStarting: weekStarting,
    template: template[0],
    days: {}
  };
  
  // Create structure for each day
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dayName = dayNames[date.getDay()];
    
    // Get requirements from template (adjusted for day index)
    const templateOffset = i === 0 ? 18 : (i * 3) + 3; // Sunday is at the end
    const fullStaff = i === 0 ? template[19] : template[templateOffset];
    const partialStaff = i === 0 ? template[20] : template[templateOffset + 1];
    const managers = i === 0 ? template[21] : template[templateOffset + 2];
    
    schedule.days[dayName] = {
      date: date,
      requirements: {
        full: fullStaff || 0,
        partial: partialStaff || 0,
        managers: managers || 0
      },
      assignments: {
        full: [],
        partial: [],
        managers: []
      }
    };
  }
  
  return schedule;
}

function assignStaffToSchedule(schedule, staffAvailability, timeOffRequests, staffingReqs) {
  const conflicts = [];
  const assignedStaff = new Set();
  
  // Process each day
  Object.keys(schedule.days).forEach(dayName => {
    const daySchedule = schedule.days[dayName];
    const dayConflicts = [];
    
    // Get available staff for this day
    const availableStaff = getAvailableStaffForDay(
      staffAvailability, 
      timeOffRequests, 
      daySchedule.date, 
      dayName
    );
    
    // Assign managers first
    const managerAssignments = assignManagers(
      availableStaff, 
      daySchedule.requirements.managers
    );
    daySchedule.assignments.managers = managerAssignments.assigned;
    dayConflicts.push(...managerAssignments.conflicts);
    
    // Assign full-time staff
    const fullAssignments = assignFullTimeStaff(
      availableStaff.filter(s => !managerAssignments.assigned.includes(s.staffId)), 
      daySchedule.requirements.full
    );
    daySchedule.assignments.full = fullAssignments.assigned;
    dayConflicts.push(...fullAssignments.conflicts);
    
    // Assign part-time staff if needed
    if (daySchedule.requirements.partial > 0) {
      const partialAssignments = assignPartialStaff(
        availableStaff.filter(s => 
          !managerAssignments.assigned.includes(s.staffId) &&
          !fullAssignments.assigned.includes(s.staffId)
        ), 
        daySchedule.requirements.partial
      );
      daySchedule.assignments.partial = partialAssignments.assigned;
      dayConflicts.push(...partialAssignments.conflicts);
    }
    
    // Add day-specific conflicts
    if (dayConflicts.length > 0) {
      conflicts.push({
        day: dayName,
        date: daySchedule.date,
        conflicts: dayConflicts
      });
    }
  });
  
  return {
    schedule: schedule,
    conflicts: conflicts
  };
}

function getAvailableStaffForDay(staffAvailability, timeOffRequests, date, dayName) {
  const available = [];
  
  Object.keys(staffAvailability).forEach(staffId => {
    const staff = staffAvailability[staffId];
    
    // Check if staff is on time off
    const isOnTimeOff = timeOffRequests.some(request => 
      request.staffId === staffId && 
      request.startDate <= date && 
      request.endDate >= date
    );
    
    if (!isOnTimeOff) {
      const dayAvailability = staff.availability[dayName];
      
      available.push({
        staffId: staffId,
        fullName: staff.fullName,
        displayName: staff.displayName,
        role: staff.role,
        fullAvailable: dayAvailability.full,
        partialAvailable: dayAvailability.partial
      });
    }
  });
  
  return available;
}

function assignManagers(availableStaff, requiredManagers) {
  const managers = availableStaff.filter(s => s.role === 'Manager' && s.fullAvailable === 'GREEN');
  const assigned = [];
  const conflicts = [];
  
  for (let i = 0; i < requiredManagers && i < managers.length; i++) {
    assigned.push(managers[i].staffId);
  }
  
  if (assigned.length < requiredManagers) {
    conflicts.push({
      type: 'MANAGER_SHORTAGE',
      required: requiredManagers,
      available: assigned.length,
      message: `Need ${requiredManagers} managers, only ${assigned.length} available`
    });
  }
  
  return { assigned, conflicts };
}

function assignFullTimeStaff(availableStaff, requiredStaff) {
  const fullTimeAvailable = availableStaff.filter(s => s.fullAvailable === 'GREEN');
  const assigned = [];
  const conflicts = [];
  
  // Prioritize by role and availability
  const prioritized = fullTimeAvailable.sort((a, b) => {
    const roleOrder = { 'Teacher': 1, 'Floor Staff': 2, 'Staff': 3 };
    return (roleOrder[a.role] || 3) - (roleOrder[b.role] || 3);
  });
  
  for (let i = 0; i < requiredStaff && i < prioritized.length; i++) {
    assigned.push(prioritized[i].staffId);
  }
  
  if (assigned.length < requiredStaff) {
    // Try to fill with YELLOW availability
    const yellowStaff = availableStaff.filter(s => 
      s.fullAvailable === 'YELLOW' && 
      !assigned.includes(s.staffId)
    );
    
    for (let i = 0; i < (requiredStaff - assigned.length) && i < yellowStaff.length; i++) {
      assigned.push(yellowStaff[i].staffId);
      conflicts.push({
        type: 'YELLOW_ASSIGNMENT',
        staffId: yellowStaff[i].staffId,
        staffName: yellowStaff[i].displayName,
        message: `${yellowStaff[i].displayName} assigned but marked as YELLOW availability`
      });
    }
  }
  
  if (assigned.length < requiredStaff) {
    conflicts.push({
      type: 'STAFF_SHORTAGE',
      required: requiredStaff,
      available: assigned.length,
      message: `Need ${requiredStaff} staff, only ${assigned.length} available`
    });
  }
  
  return { assigned, conflicts };
}

function assignPartialStaff(availableStaff, requiredPartial) {
  // Similar logic to assignFullTimeStaff but for partial shifts
  const partialAvailable = availableStaff.filter(s => s.partialAvailable === 'GREEN');
  const assigned = [];
  const conflicts = [];
  
  for (let i = 0; i < requiredPartial && i < partialAvailable.length; i++) {
    assigned.push(partialAvailable[i].staffId);
  }
  
  if (assigned.length < requiredPartial) {
    conflicts.push({
      type: 'PARTIAL_STAFF_SHORTAGE',
      required: requiredPartial,
      available: assigned.length,
      message: `Need ${requiredPartial} partial staff, only ${assigned.length} available`
    });
  }
  
  return { assigned, conflicts };
}

function saveScheduleToDatabase(database, schedule) {
  const schedulesSheet = database.getSheetByName('Schedules');
  if (!schedulesSheet) {
    throw new Error('Schedules sheet not found');
  }
  
  // Create schedule row with all assignments
  const scheduleRow = [
    schedule.id,
    `Week of ${schedule.weekStarting}`,
    schedule.weekStarting,
    // Monday assignments
    schedule.days.Monday.assignments.managers.join(','),
    schedule.days.Monday.assignments.full.join(','),
    schedule.days.Monday.assignments.partial.join(','),
    // Tuesday assignments
    schedule.days.Tuesday.assignments.managers.join(','),
    schedule.days.Tuesday.assignments.full.join(','),
    schedule.days.Tuesday.assignments.partial.join(','),
    // Wednesday assignments
    schedule.days.Wednesday.assignments.managers.join(','),
    schedule.days.Wednesday.assignments.full.join(','),
    schedule.days.Wednesday.assignments.partial.join(','),
    // Thursday assignments
    schedule.days.Thursday.assignments.managers.join(','),
    schedule.days.Thursday.assignments.full.join(','),
    schedule.days.Thursday.assignments.partial.join(','),
    // Friday assignments
    schedule.days.Friday.assignments.managers.join(','),
    schedule.days.Friday.assignments.full.join(','),
    schedule.days.Friday.assignments.partial.join(','),
    // Saturday assignments
    schedule.days.Saturday.assignments.managers.join(','),
    schedule.days.Saturday.assignments.full.join(','),
    schedule.days.Saturday.assignments.partial.join(','),
    // Sunday assignments
    schedule.days.Sunday.assignments.managers.join(','),
    schedule.days.Sunday.assignments.full.join(','),
    schedule.days.Sunday.assignments.partial.join(','),
    new Date(), // Created_Date
    'DRAFT', // Status
    `Auto-generated from template ${schedule.template}` // Notes
  ];
  
  const lastRow = schedulesSheet.getLastRow();
  schedulesSheet.getRange(lastRow + 1, 1, 1, scheduleRow.length).setValues([scheduleRow]);
  
  return schedule.id;
}

function generateConflictReport(database, scheduleId, conflicts) {
  console.log('📋 Generating conflict report...');
  
  let conflictSheet = database.getSheetByName('Schedule_Conflicts');
  if (!conflictSheet) {
    conflictSheet = database.insertSheet('Schedule_Conflicts');
    
    // Add headers
    const headers = [
      'Schedule_ID', 'Day', 'Date', 'Conflict_Type', 
      'Staff_ID', 'Staff_Name', 'Details', 'Severity', 'Created_Date'
    ];
    conflictSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  // Add conflict data
  const conflictData = [];
  conflicts.forEach(dayConflict => {
    dayConflict.conflicts.forEach(conflict => {
      conflictData.push([
        scheduleId,
        dayConflict.day,
        dayConflict.date,
        conflict.type,
        conflict.staffId || '',
        conflict.staffName || '',
        conflict.message,
        getSeverityLevel(conflict.type),
        new Date()
      ]);
    });
  });
  
  if (conflictData.length > 0) {
    const lastRow = conflictSheet.getLastRow();
    conflictSheet.getRange(lastRow + 1, 1, conflictData.length, conflictData[0].length)
                .setValues(conflictData);
  }
  
  console.log(`✅ Conflict report generated: ${conflictData.length} conflicts logged`);
}

function getSeverityLevel(conflictType) {
  switch (conflictType) {
    case 'MANAGER_SHORTAGE':
      return 'HIGH';
    case 'STAFF_SHORTAGE':
      return 'HIGH';
    case 'YELLOW_ASSIGNMENT':
      return 'MEDIUM';
    case 'PARTIAL_STAFF_SHORTAGE':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
}

// Main setup function
function setupScheduleManagement() {
  try {
    createScheduleManagementInterface();
    console.log('🎉 Schedule Management Interface setup complete!');
    console.log('📋 Available functions:');
    console.log('   - createAdvancedSchedule(weekStarting, templateId)');
    console.log('   - getStaffAvailabilityForDate(date)');
    console.log('   - generateConflictReport(database, scheduleId, conflicts)');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}