/**
 * Base Schedule Import System
 * Allows importing existing schedules and creating templates from them
 */

function importExistingBaseSchedule() {
  console.log('📥 Starting Base Schedule Import...');
  
  const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
  const database = SpreadsheetApp.openById(DATABASE_ID);
  
  // Create a worksheet for the user to input their base schedule
  createBaseScheduleInputSheet(database);
  
  console.log('✅ Base Schedule Import sheet created!');
  console.log('📋 Next steps:');
  console.log('   1. Go to the "Base_Schedule_Input" sheet');
  console.log('   2. Enter your current schedule pattern');
  console.log('   3. Run convertBaseScheduleToTemplate() to create templates');
}

function createBaseScheduleInputSheet(database) {
  let inputSheet = database.getSheetByName('Base_Schedule_Input');
  if (!inputSheet) {
    inputSheet = database.insertSheet('Base_Schedule_Input');
  } else {
    inputSheet.clear();
  }
  
  // Create user-friendly input format
  const inputData = [
    ['📅 YOUR EXISTING BASE SCHEDULE', '', '', '', '', '', ''],
    ['Enter your current schedule pattern below:', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['⏰ BUSINESS HOURS (Already configured)', '', '', '', '', '', ''],
    ['Day', 'Open Time', 'Close Time', 'Manager Needed?', 'Full-Time Staff', 'Part-Time Staff', 'Notes'],
    ['Monday', '10:00 AM', '6:00 PM', 'YES', '4', '0', 'Standard day'],
    ['Tuesday', '10:00 AM', '6:00 PM', 'YES', '4', '0', 'Standard day'],
    ['Wednesday', '10:00 AM', '6:00 PM', 'YES', '4', '0', 'Standard day'],
    ['Thursday', '10:00 AM', '6:00 PM', 'YES', '4', '0', 'Standard day'],
    ['Friday', '10:00 AM', '5:00 PM', 'YES', '4', '0', 'Early close'],
    ['Saturday', '10:00 AM', '4:00 PM', 'YES', '4', '0', 'Weekend'],
    ['Sunday', '10:00 AM', '3:00 PM', 'NO', '3', '0', 'Light staffing'],
    ['', '', '', '', '', '', ''],
    ['👥 YOUR TYPICAL WEEKLY ASSIGNMENTS', '', '', '', '', '', ''],
    ['Edit the sections below with your actual staff assignments:', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['🗓️ MONDAY SCHEDULE', '', '', '', '', '', ''],
    ['Position', 'Staff Member', 'Shift Type', 'Start Time', 'End Time', 'Role', 'Notes'],
    ['Manager', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Manager', 'Opening manager'],
    ['Staff 1', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['Staff 2', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['Staff 3', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Teacher', ''],
    ['Staff 4', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['', '', '', '', '', '', ''],
    ['🗓️ TUESDAY SCHEDULE', '', '', '', '', '', ''],
    ['Position', 'Staff Member', 'Shift Type', 'Start Time', 'End Time', 'Role', 'Notes'],
    ['Manager', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Manager', 'Opening manager'],
    ['Staff 1', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['Staff 2', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['Staff 3', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Teacher', ''],
    ['Staff 4', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['', '', '', '', '', '', ''],
    ['🗓️ WEDNESDAY SCHEDULE', '', '', '', '', '', ''],
    ['Position', 'Staff Member', 'Shift Type', 'Start Time', 'End Time', 'Role', 'Notes'],
    ['Manager', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Manager', 'Opening manager'],
    ['Staff 1', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['Staff 2', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['Staff 3', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Teacher', ''],
    ['Staff 4', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['', '', '', '', '', '', ''],
    ['🗓️ THURSDAY SCHEDULE', '', '', '', '', '', ''],
    ['Position', 'Staff Member', 'Shift Type', 'Start Time', 'End Time', 'Role', 'Notes'],
    ['Manager', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Manager', 'Opening manager'],
    ['Staff 1', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['Staff 2', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['Staff 3', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Teacher', ''],
    ['Staff 4', '[Enter Name]', 'Full', '10:00 AM', '6:00 PM', 'Floor Staff', ''],
    ['', '', '', '', '', '', ''],
    ['🗓️ FRIDAY SCHEDULE', '', '', '', '', '', ''],
    ['Position', 'Staff Member', 'Shift Type', 'Start Time', 'End Time', 'Role', 'Notes'],
    ['Manager', '[Enter Name]', 'Full', '10:00 AM', '5:00 PM', 'Manager', 'Opening manager'],
    ['Staff 1', '[Enter Name]', 'Full', '10:00 AM', '5:00 PM', 'Floor Staff', ''],
    ['Staff 2', '[Enter Name]', 'Full', '10:00 AM', '5:00 PM', 'Floor Staff', ''],
    ['Staff 3', '[Enter Name]', 'Full', '10:00 AM', '5:00 PM', 'Teacher', ''],
    ['Staff 4', '[Enter Name]', 'Full', '10:00 AM', '5:00 PM', 'Floor Staff', ''],
    ['', '', '', '', '', '', ''],
    ['🗓️ SATURDAY SCHEDULE', '', '', '', '', '', ''],
    ['Position', 'Staff Member', 'Shift Type', 'Start Time', 'End Time', 'Role', 'Notes'],
    ['Manager', '[Enter Name]', 'Full', '10:00 AM', '4:00 PM', 'Manager', 'Weekend manager'],
    ['Staff 1', '[Enter Name]', 'Full', '10:00 AM', '4:00 PM', 'Floor Staff', ''],
    ['Staff 2', '[Enter Name]', 'Full', '10:00 AM', '4:00 PM', 'Floor Staff', ''],
    ['Staff 3', '[Enter Name]', 'Full', '10:00 AM', '4:00 PM', 'Teacher', ''],
    ['Staff 4', '[Enter Name]', 'Full', '10:00 AM', '4:00 PM', 'Floor Staff', ''],
    ['', '', '', '', '', '', ''],
    ['🗓️ SUNDAY SCHEDULE', '', '', '', '', '', ''],
    ['Position', 'Staff Member', 'Shift Type', 'Start Time', 'End Time', 'Role', 'Notes'],
    ['Staff 1', '[Enter Name]', 'Full', '10:00 AM', '3:00 PM', 'Floor Staff', 'Sunday lead'],
    ['Staff 2', '[Enter Name]', 'Full', '10:00 AM', '3:00 PM', 'Floor Staff', ''],
    ['Staff 3', '[Enter Name]', 'Full', '10:00 AM', '3:00 PM', 'Teacher', ''],
    ['', '', '', '', '', '', ''],
    ['📋 INSTRUCTIONS:', '', '', '', '', '', ''],
    ['1. Replace [Enter Name] with actual staff names', '', '', '', '', '', ''],
    ['2. Adjust shift times if needed', '', '', '', '', '', ''],
    ['3. Update roles as appropriate', '', '', '', '', '', ''],
    ['4. Run convertBaseScheduleToTemplate() when done', '', '', '', '', '', '']
  ];
  
  // Set the data
  inputSheet.getRange(1, 1, inputData.length, 7).setValues(inputData);
  
  // Format the sheet
  formatBaseScheduleInputSheet(inputSheet);
}

function formatBaseScheduleInputSheet(sheet) {
  // Title formatting
  const titleRange = sheet.getRange(1, 1, 1, 7);
  titleRange.merge()
           .setBackground('#1155CC')
           .setFontColor('white')
           .setFontSize(16)
           .setFontWeight('bold')
           .setHorizontalAlignment('center');
  
  // Section headers (Business Hours, Weekly Assignments, etc.)
  const sectionRanges = [
    sheet.getRange(4, 1, 1, 7), // Business Hours
    sheet.getRange(14, 1, 1, 7), // Weekly Assignments
    sheet.getRange(17, 1, 1, 7), // Monday
    sheet.getRange(24, 1, 1, 7), // Tuesday
    sheet.getRange(31, 1, 1, 7), // Wednesday
    sheet.getRange(38, 1, 1, 7), // Thursday
    sheet.getRange(45, 1, 1, 7), // Friday
    sheet.getRange(52, 1, 1, 7), // Saturday
    sheet.getRange(59, 1, 1, 7), // Sunday
    sheet.getRange(65, 1, 1, 7)  // Instructions
  ];
  
  sectionRanges.forEach(range => {
    range.merge()
         .setBackground('#34A853')
         .setFontColor('white')
         .setFontWeight('bold')
         .setHorizontalAlignment('center');
  });
  
  // Table headers formatting
  const headerRanges = [
    sheet.getRange(5, 1, 1, 7), // Business hours header
    sheet.getRange(18, 1, 1, 7), // Monday header
    sheet.getRange(25, 1, 1, 7), // Tuesday header
    sheet.getRange(32, 1, 1, 7), // Wednesday header
    sheet.getRange(39, 1, 1, 7), // Thursday header
    sheet.getRange(46, 1, 1, 7), // Friday header
    sheet.getRange(53, 1, 1, 7), // Saturday header
    sheet.getRange(60, 1, 1, 7)  // Sunday header
  ];
  
  headerRanges.forEach(range => {
    range.setBackground('#F0F0F0')
         .setFontWeight('bold')
         .setHorizontalAlignment('center');
  });
}

function convertBaseScheduleToTemplate() {
  console.log('🔄 Converting your base schedule to system template...');
  
  const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
  const database = SpreadsheetApp.openById(DATABASE_ID);
  
  try {
    // Read the base schedule input
    const inputSheet = database.getSheetByName('Base_Schedule_Input');
    if (!inputSheet) {
      throw new Error('Base_Schedule_Input sheet not found. Run importExistingBaseSchedule() first.');
    }
    
    // Parse the schedule data
    const scheduleData = parseBaseScheduleData(inputSheet);
    
    // Create a personalized template
    createPersonalizedTemplate(database, scheduleData);
    
    // Update staff availability based on the schedule
    updateStaffAvailabilityFromSchedule(database, scheduleData);
    
    console.log('✅ Base schedule successfully converted!');
    console.log('📋 What was created:');
    console.log('   ✅ Personal template "YOUR_BASE_SCHEDULE"');
    console.log('   ✅ Staff availability updated based on your assignments');
    console.log('   ✅ Ready to generate weekly schedules');
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Review the "YOUR_BASE_SCHEDULE" template');
    console.log('   2. Check Staff_Availability sheet for accuracy');
    console.log('   3. Use createWeeklyScheduleFromBase("2025-09-29") to generate schedules');
    
    return true;
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    return false;
  }
}

function parseBaseScheduleData(inputSheet) {
  const data = inputSheet.getDataRange().getValues();
  const schedule = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  };
  
  // Find the start rows for each day's schedule
  const dayStarts = {
    Monday: findRowWithText(data, '🗓️ MONDAY SCHEDULE') + 1,
    Tuesday: findRowWithText(data, '🗓️ TUESDAY SCHEDULE') + 1,
    Wednesday: findRowWithText(data, '🗓️ WEDNESDAY SCHEDULE') + 1,
    Thursday: findRowWithText(data, '🗓️ THURSDAY SCHEDULE') + 1,
    Friday: findRowWithText(data, '🗓️ FRIDAY SCHEDULE') + 1,
    Saturday: findRowWithText(data, '🗓️ SATURDAY SCHEDULE') + 1,
    Sunday: findRowWithText(data, '🗓️ SUNDAY SCHEDULE') + 1
  };
  
  // Parse each day
  Object.keys(dayStarts).forEach(day => {
    const startRow = dayStarts[day];
    if (startRow > 0) {
      // Read assignments until empty row
      for (let i = startRow; i < data.length && data[i][0] !== ''; i++) {
        const row = data[i];
        if (row[1] && row[1] !== '[Enter Name]') {
          schedule[day].push({
            position: row[0],
            staffMember: row[1],
            shiftType: row[2],
            startTime: row[3],
            endTime: row[4],
            role: row[5],
            notes: row[6]
          });
        }
      }
    }
  });
  
  return schedule;
}

function findRowWithText(data, searchText) {
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().includes(searchText)) {
      return i;
    }
  }
  return -1;
}

function createPersonalizedTemplate(database, scheduleData) {
  const templatesSheet = database.getSheetByName('Schedule_Templates');
  if (!templatesSheet) {
    throw new Error('Schedule_Templates sheet not found');
  }
  
  // Count staff for each day
  const templateRow = [
    'YOUR_BASE_SCHEDULE',
    'Your Personal Base Schedule',
    new Date(),
    scheduleData.Monday.length, 0, countManagers(scheduleData.Monday), // Monday
    scheduleData.Tuesday.length, 0, countManagers(scheduleData.Tuesday), // Tuesday
    scheduleData.Wednesday.length, 0, countManagers(scheduleData.Wednesday), // Wednesday
    scheduleData.Thursday.length, 0, countManagers(scheduleData.Thursday), // Thursday
    scheduleData.Friday.length, 0, countManagers(scheduleData.Friday), // Friday
    scheduleData.Saturday.length, 0, countManagers(scheduleData.Saturday), // Saturday
    scheduleData.Sunday.length, 0, countManagers(scheduleData.Sunday), // Sunday
    new Date(),
    'ACTIVE',
    'Imported from your existing base schedule'
  ];
  
  // Add to templates (find empty row or append)
  const lastRow = templatesSheet.getLastRow();
  templatesSheet.getRange(lastRow + 1, 1, 1, templateRow.length).setValues([templateRow]);
  
  console.log('📋 Personal template created with your staff assignments');
}

function countManagers(daySchedule) {
  return daySchedule.filter(assignment => assignment.role === 'Manager').length;
}

function updateStaffAvailabilityFromSchedule(database, scheduleData) {
  const availabilitySheet = database.getSheetByName('Staff_Availability');
  if (!availabilitySheet) {
    console.log('⚠️  Staff_Availability sheet not found, skipping availability update');
    return;
  }
  
  // Get all unique staff members from the schedule
  const allStaff = new Set();
  Object.values(scheduleData).forEach(daySchedule => {
    daySchedule.forEach(assignment => {
      allStaff.add(assignment.staffMember);
    });
  });
  
  console.log(`📋 Found ${allStaff.size} unique staff members in your schedule`);
  
  // Update availability based on their assignments
  // This sets GREEN for days they're normally scheduled
  // You can manually adjust to YELLOW/RED as needed
  
  const staffList = Array.from(allStaff);
  const availabilityData = [];
  
  staffList.forEach((staffMember, index) => {
    const staffId = index + 1;
    const role = getStaffRole(staffMember, scheduleData);
    
    const availability = [
      staffId,
      staffMember,
      staffMember, // Display name same as full name initially
      role,
      isScheduledOnDay(staffMember, scheduleData.Monday) ? 'GREEN' : 'YELLOW',
      'GREEN', // Monday partial
      isScheduledOnDay(staffMember, scheduleData.Tuesday) ? 'GREEN' : 'YELLOW',
      'GREEN', // Tuesday partial
      isScheduledOnDay(staffMember, scheduleData.Wednesday) ? 'GREEN' : 'YELLOW',
      'GREEN', // Wednesday partial
      isScheduledOnDay(staffMember, scheduleData.Thursday) ? 'GREEN' : 'YELLOW',
      'GREEN', // Thursday partial
      isScheduledOnDay(staffMember, scheduleData.Friday) ? 'GREEN' : 'YELLOW',
      'GREEN', // Friday partial
      isScheduledOnDay(staffMember, scheduleData.Saturday) ? 'GREEN' : 'YELLOW',
      'GREEN', // Saturday partial
      isScheduledOnDay(staffMember, scheduleData.Sunday) ? 'GREEN' : 'YELLOW',
      'GREEN', // Sunday partial
      'Imported from base schedule',
      new Date()
    ];
    
    availabilityData.push(availability);
  });
  
  if (availabilityData.length > 0) {
    // Clear existing data (except headers)
    if (availabilitySheet.getLastRow() > 1) {
      availabilitySheet.getRange(2, 1, availabilitySheet.getLastRow() - 1, 20).clear();
    }
    
    // Add new availability data
    availabilitySheet.getRange(2, 1, availabilityData.length, availabilityData[0].length)
                    .setValues(availabilityData);
    
    console.log('✅ Staff availability updated based on your schedule');
  }
}

function getStaffRole(staffMember, scheduleData) {
  // Find the role from any day they're scheduled
  for (const day of Object.values(scheduleData)) {
    const assignment = day.find(a => a.staffMember === staffMember);
    if (assignment && assignment.role) {
      return assignment.role;
    }
  }
  return 'Staff'; // Default role
}

function isScheduledOnDay(staffMember, daySchedule) {
  return daySchedule.some(assignment => assignment.staffMember === staffMember);
}

function createWeeklyScheduleFromBase(weekStarting) {
  console.log(`📅 Creating weekly schedule from your base for week ${weekStarting}...`);
  
  try {
    // Use the personalized template
    const result = createAdvancedSchedule(weekStarting, 'YOUR_BASE_SCHEDULE');
    
    if (result.success) {
      console.log(`✅ Weekly schedule created: ${result.scheduleId}`);
      if (result.conflicts.length > 0) {
        console.log(`⚠️  ${result.conflicts.length} conflicts detected`);
        console.log('📋 Check Schedule_Conflicts sheet for details');
        console.log('🔧 You can manually adjust assignments as needed');
      } else {
        console.log('🎉 No conflicts! Schedule ready to use');
      }
    } else {
      console.log(`❌ Schedule creation failed: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error creating weekly schedule:', error);
    return { success: false, error: error.message };
  }
}

console.log('📥 Base Schedule Importer loaded!');
console.log('📋 Available commands:');
console.log('   importExistingBaseSchedule() - Create input sheet');
console.log('   convertBaseScheduleToTemplate() - Convert to template');
console.log('   createWeeklyScheduleFromBase("2025-09-29") - Generate weekly schedules');