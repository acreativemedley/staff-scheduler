/**
 * Bulk Staff Import System
 * Allows importing multiple staff members at once with availability and hours
 */

function createBulkStaffImport() {
  console.log('👥 Creating Bulk Staff Import System...');
  
  const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
  const database = SpreadsheetApp.openById(DATABASE_ID);
  
  try {
    // Create the bulk import worksheet
    createBulkStaffInputSheet(database);
    
    console.log('✅ Bulk Staff Import sheet created!');
    console.log('📋 Next steps:');
    console.log('   1. Go to the "Bulk_Staff_Import" sheet');
    console.log('   2. Fill in your staff information');
    console.log('   3. Run processBulkStaffImport() to add them all');
    
  } catch (error) {
    console.error('❌ Error creating bulk staff import:', error);
    console.log('🔄 Trying simplified version...');
    createSimpleBulkStaffImport(database);
  }
}

function createSimpleBulkStaffImport(database) {
  console.log('📋 Creating simplified bulk staff import...');
  
  let importSheet = database.getSheetByName('Bulk_Staff_Import');
  if (!importSheet) {
    importSheet = database.insertSheet('Bulk_Staff_Import');
  } else {
    importSheet.clear();
  }
  
  // Simplified data structure
  const simpleData = [
    ['BULK STAFF IMPORT - SIMPLIFIED VERSION'],
    ['Full Name', 'Display Name', 'Role', 'Min Hours', 'Max Hours', 'Notes'],
    ['[Enter staff name]', '[Display name]', 'Floor Staff', '20', '40', 'Notes here'],
    ['[Enter staff name]', '[Display name]', 'Floor Staff', '20', '40', 'Notes here'],
    ['[Enter staff name]', '[Display name]', 'Floor Staff', '20', '40', 'Notes here'],
    ['[Enter staff name]', '[Display name]', 'Floor Staff', '20', '40', 'Notes here'],
    ['[Enter staff name]', '[Display name]', 'Floor Staff', '20', '40', 'Notes here'],
    [''],
    ['INSTRUCTIONS:'],
    ['1. Replace [Enter staff name] with actual names'],
    ['2. Set display names (what shows on schedules)'],
    ['3. Choose role: Manager, Teacher, Floor Staff, Owner'],
    ['4. Set minimum and maximum hours per week'],
    ['5. Run processSimpleBulkStaffImport() when ready']
  ];
  
  importSheet.getRange(1, 1, simpleData.length, 6).setValues(simpleData);
  
  // Basic formatting only
  importSheet.getRange(1, 1, 1, 6).setBackground('#4285F4').setFontColor('white');
  importSheet.getRange(2, 1, 1, 6).setBackground('#F0F0F0').setFontWeight('bold');
  
  console.log('✅ Simplified bulk import created!');
}

function createBulkStaffInputSheet(database) {
  let importSheet = database.getSheetByName('Bulk_Staff_Import');
  if (!importSheet) {
    importSheet = database.insertSheet('Bulk_Staff_Import');
  } else {
    importSheet.clear();
  }
  
  // Create user-friendly bulk input format
  const importData = [
    ['👥 BULK STAFF IMPORT', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Add multiple staff members at once with their availability and hour preferences', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['📋 STAFF INFORMATION', '', '', 'AVAILABILITY (GREEN/YELLOW/RED)', '', '', '', '', '', '', '', '', '', '', '💼 HOUR PREFERENCES', '', '', '', '', ''],
    ['Full Name', 'Display Name', 'Role', 'Mon Full', 'Mon Part', 'Tue Full', 'Tue Part', 'Wed Full', 'Wed Part', 'Thu Full', 'Thu Part', 'Fri Full', 'Fri Part', 'Sat Full', 'Sat Part', 'Sun Full', 'Sun Part', 'Min Hours/Week', 'Max Hours/Week', 'Notes'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['EXAMPLE ENTRIES (Delete these rows and add your staff):', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['John Smith', 'John', 'Manager', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'RED', 'RED', 'RED', 'GREEN', '35', '40', 'Prefers weekdays'],
    ['Jane Doe', 'Jane', 'Teacher', 'GREEN', 'YELLOW', 'GREEN', 'YELLOW', 'GREEN', 'YELLOW', 'GREEN', 'YELLOW', 'YELLOW', 'RED', 'GREEN', 'GREEN', 'GREEN', 'YELLOW', '20', '30', 'Good with weekend shifts'],
    ['Mike Johnson', 'Mike', 'Floor Staff', 'YELLOW', 'GREEN', 'YELLOW', 'GREEN', 'YELLOW', 'GREEN', 'YELLOW', 'GREEN', 'YELLOW', 'GREEN', 'GREEN', 'GREEN', 'RED', 'RED', '15', '25', 'Part-time student'],
    ['Sarah Wilson', 'Sarah', 'Floor Staff', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'RED', 'RED', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'YELLOW', 'YELLOW', 'GREEN', 'GREEN', '25', '35', 'Not available Wednesdays'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['ADD YOUR STAFF BELOW:', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['[Staff Name 1]', '[Display Name]', '[Role]', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', '20', '40', ''],
    ['[Staff Name 2]', '[Display Name]', '[Role]', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', '20', '40', ''],
    ['[Staff Name 3]', '[Display Name]', '[Role]', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', '20', '40', ''],
    ['[Staff Name 4]', '[Display Name]', '[Role]', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', '20', '40', ''],
    ['[Staff Name 5]', '[Display Name]', '[Role]', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', '20', '40', ''],
    ['[Staff Name 6]', '[Display Name]', '[Role]', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', '20', '40', ''],
    ['[Staff Name 7]', '[Display Name]', '[Role]', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', '20', '40', ''],
    ['[Staff Name 8]', '[Display Name]', '[Role]', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', '20', '40', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['📋 INSTRUCTIONS:', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['1. Replace [Staff Name X] with actual names', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['2. Set Display Name (what shows on schedules)', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['3. Choose Role: Manager, Teacher, Floor Staff, or Owner', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['4. Set availability: GREEN (prefer), YELLOW (okay), RED (not available)', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['5. Set minimum and maximum hours per week', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['6. Add any notes about preferences or restrictions', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['7. Run processBulkStaffImport() when ready', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
  ];
  
  // Set the data
  importSheet.getRange(1, 1, importData.length, 20).setValues(importData);
  
  // Format the sheet
  formatBulkStaffImportSheet(importSheet);
  
  // Add data validation for availability columns
  setupBulkImportValidation(importSheet);
}

function formatBulkStaffImportSheet(sheet) {
  try {
    // Clear any existing merges first
    sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
    
    // Title formatting
    const titleRange = sheet.getRange(1, 1, 1, 20);
    titleRange.merge()
             .setBackground('#1155CC')
             .setFontColor('white')
             .setFontSize(16)
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
    
    // Section headers - format without merging first
    const sectionRanges = [
      { range: sheet.getRange(4, 1, 1, 3), color: '#34A853' },   // Staff Information
      { range: sheet.getRange(4, 4, 1, 14), color: '#FF9900' },  // Availability
      { range: sheet.getRange(4, 15, 1, 5), color: '#9C27B0' },  // Hour Preferences
      { range: sheet.getRange(7, 1, 1, 20), color: '#EA4335' },  // Example entries
      { range: sheet.getRange(13, 1, 1, 20), color: '#1155CC' }, // Add your staff
      { range: sheet.getRange(23, 1, 1, 20), color: '#34A853' }  // Instructions
    ];
    
    sectionRanges.forEach(section => {
      section.range.merge()
                   .setBackground(section.color)
                   .setFontColor('white')
                   .setFontWeight('bold')
                   .setHorizontalAlignment('center');
    });
    
    // Main headers
    const headerRange = sheet.getRange(5, 1, 1, 20);
    headerRange.setBackground('#F0F0F0')
               .setFontWeight('bold')
               .setHorizontalAlignment('center')
               .setWrap(true);
    
    // Example data formatting
    const exampleRange = sheet.getRange(8, 1, 4, 20);
    exampleRange.setBackground('#E8F5E8')
                .setFontStyle('italic');
    
    // Input data formatting
    const inputRange = sheet.getRange(14, 1, 8, 20);
    inputRange.setBackground('#F8F9FF');
    
    // Freeze header rows
    sheet.setFrozenRows(5);
    
  } catch (error) {
    console.error('Formatting error (non-critical):', error.message);
    // Continue without advanced formatting if there are issues
    console.log('📋 Sheet created successfully (basic formatting applied)');
  }
}

function setupBulkImportValidation(sheet) {
  // Availability validation (columns D through Q)
  const availabilityOptions = ['GREEN', 'YELLOW', 'RED'];
  const availabilityRule = SpreadsheetApp.newDataValidation()
                                        .requireValueInList(availabilityOptions, true)
                                        .setAllowInvalid(false)
                                        .build();
  
  // Apply to availability columns (D4:Q50 to cover all possible entries)
  const availabilityRange = sheet.getRange(8, 4, 43, 14); // From row 8 to row 50, columns D-Q
  availabilityRange.setDataValidation(availabilityRule);
  
  // Role validation (column C)
  const roleOptions = ['Manager', 'Teacher', 'Floor Staff', 'Owner'];
  const roleRule = SpreadsheetApp.newDataValidation()
                                .requireValueInList(roleOptions, true)
                                .setAllowInvalid(false)
                                .build();
  
  const roleRange = sheet.getRange(8, 3, 43, 1); // Column C from row 8 to 50
  roleRange.setDataValidation(roleRule);
  
  // Add conditional formatting for availability
  setupBulkAvailabilityFormatting(sheet);
}

function setupBulkAvailabilityFormatting(sheet) {
  const availabilityRange = sheet.getRange(8, 4, 43, 14);
  
  // GREEN formatting
  const greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('GREEN')
    .setBackground('#00FF00')
    .setFontColor('#000000')
    .setRanges([availabilityRange])
    .build();
  
  // YELLOW formatting
  const yellowRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('YELLOW')
    .setBackground('#FFFF00')
    .setFontColor('#000000')
    .setRanges([availabilityRange])
    .build();
  
  // RED formatting
  const redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('RED')
    .setBackground('#FF0000')
    .setFontColor('#FFFFFF')
    .setRanges([availabilityRange])
    .build();
  
  const rules = sheet.getConditionalFormatRules();
  rules.push(greenRule, yellowRule, redRule);
  sheet.setConditionalFormatRules(rules);
}

function processBulkStaffImport() {
  console.log('🚀 Processing Bulk Staff Import...');
  
  const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
  const database = SpreadsheetApp.openById(DATABASE_ID);
  
  try {
    // Get import data
    const importSheet = database.getSheetByName('Bulk_Staff_Import');
    if (!importSheet) {
      throw new Error('Bulk_Staff_Import sheet not found. Run createBulkStaffImport() first.');
    }
    
    // Parse staff data
    const staffData = parseBulkStaffData(importSheet);
    
    if (staffData.length === 0) {
      console.log('⚠️  No valid staff data found to import');
      return false;
    }
    
    // Add to Staff_Data sheet
    const staffResults = addBulkStaffData(database, staffData);
    
    // Add to Staff_Availability sheet
    const availabilityResults = addBulkAvailabilityData(database, staffData);
    
    console.log('✅ Bulk staff import completed!');
    console.log(`📋 Results:`);
    console.log(`   ✅ ${staffResults.added} staff members added to Staff_Data`);
    console.log(`   ✅ ${availabilityResults.added} availability records created`);
    console.log(`   ⚠️  ${staffResults.skipped} duplicates skipped`);
    
    if (staffResults.errors.length > 0) {
      console.log(`   ❌ ${staffResults.errors.length} errors:`);
      staffResults.errors.forEach(error => console.log(`      - ${error}`));
    }
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Review Staff_Data sheet for accuracy');
    console.log('   2. Check Staff_Availability sheet');
    console.log('   3. Test with createWeeklyScheduleFromBase()');
    
    return true;
    
  } catch (error) {
    console.error('❌ Bulk import failed:', error);
    return false;
  }
}

function parseBulkStaffData(importSheet) {
  const data = importSheet.getDataRange().getValues();
  const staffData = [];
  
  // Start from row 8 (after headers and examples), look for actual staff data
  for (let i = 13; i < data.length; i++) { // Row 14 in sheet = index 13
    const row = data[i];
    
    // Check if this row has valid staff data
    if (row[0] && 
        row[0] !== '' && 
        !row[0].toString().startsWith('[') && 
        !row[0].toString().includes('INSTRUCTIONS') &&
        row[0] !== 'ADD YOUR STAFF BELOW:') {
      
      const staffMember = {
        fullName: row[0],
        displayName: row[1] || row[0],
        role: row[2] || 'Floor Staff',
        availability: {
          Monday: { full: row[3] || 'GREEN', partial: row[4] || 'GREEN' },
          Tuesday: { full: row[5] || 'GREEN', partial: row[6] || 'GREEN' },
          Wednesday: { full: row[7] || 'GREEN', partial: row[8] || 'GREEN' },
          Thursday: { full: row[9] || 'GREEN', partial: row[10] || 'GREEN' },
          Friday: { full: row[11] || 'GREEN', partial: row[12] || 'GREEN' },
          Saturday: { full: row[13] || 'GREEN', partial: row[14] || 'GREEN' },
          Sunday: { full: row[15] || 'GREEN', partial: row[16] || 'GREEN' }
        },
        minHours: row[17] || 20,
        maxHours: row[18] || 40,
        notes: row[19] || ''
      };
      
      staffData.push(staffMember);
    }
  }
  
  console.log(`📋 Found ${staffData.length} staff members to import`);
  return staffData;
}

function addBulkStaffData(database, staffData) {
  const staffSheet = database.getSheetByName('Staff_Data');
  if (!staffSheet) {
    throw new Error('Staff_Data sheet not found');
  }
  
  const results = {
    added: 0,
    skipped: 0,
    errors: []
  };
  
  // Get existing staff to check for duplicates
  const existingData = staffSheet.getDataRange().getValues();
  const existingNames = existingData.slice(1).map(row => row[1]); // Full_Name column
  
  const staffToAdd = [];
  
  staffData.forEach(staff => {
    try {
      // Check for duplicates
      if (existingNames.includes(staff.fullName)) {
        results.skipped++;
        return;
      }
      
      // Create staff data row
      const staffRow = [
        staffToAdd.length + existingData.length, // Staff_ID
        staff.fullName,
        staff.displayName,
        staff.role,
        '', // Email (empty for now)
        '', // Phone (empty for now)
        new Date(), // Hire_Date
        'ACTIVE', // Status
        staff.minHours,
        staff.maxHours,
        staff.notes,
        new Date() // Last_Updated
      ];
      
      staffToAdd.push(staffRow);
      results.added++;
      
    } catch (error) {
      results.errors.push(`Error processing ${staff.fullName}: ${error.message}`);
    }
  });
  
  // Add staff data to sheet
  if (staffToAdd.length > 0) {
    const startRow = staffSheet.getLastRow() + 1;
    staffSheet.getRange(startRow, 1, staffToAdd.length, staffToAdd[0].length)
              .setValues(staffToAdd);
  }
  
  return results;
}

function addBulkAvailabilityData(database, staffData) {
  const availabilitySheet = database.getSheetByName('Staff_Availability');
  if (!availabilitySheet) {
    throw new Error('Staff_Availability sheet not found');
  }
  
  const results = {
    added: 0,
    errors: []
  };
  
  // Get current staff data to match IDs
  const staffSheet = database.getSheetByName('Staff_Data');
  const staffSheetData = staffSheet.getDataRange().getValues();
  
  const availabilityData = [];
  
  staffData.forEach(staff => {
    try {
      // Find the staff ID from Staff_Data sheet
      const staffRowIndex = staffSheetData.findIndex(row => row[1] === staff.fullName);
      if (staffRowIndex === -1) {
        results.errors.push(`Could not find staff ID for ${staff.fullName}`);
        return;
      }
      
      const staffId = staffSheetData[staffRowIndex][0];
      
      const availabilityRow = [
        staffId,
        staff.fullName,
        staff.displayName,
        staff.role,
        staff.availability.Monday.full,
        staff.availability.Monday.partial,
        staff.availability.Tuesday.full,
        staff.availability.Tuesday.partial,
        staff.availability.Wednesday.full,
        staff.availability.Wednesday.partial,
        staff.availability.Thursday.full,
        staff.availability.Thursday.partial,
        staff.availability.Friday.full,
        staff.availability.Friday.partial,
        staff.availability.Saturday.full,
        staff.availability.Saturday.partial,
        staff.availability.Sunday.full,
        staff.availability.Sunday.partial,
        `Bulk imported - ${staff.notes}`,
        new Date()
      ];
      
      availabilityData.push(availabilityRow);
      results.added++;
      
    } catch (error) {
      results.errors.push(`Error processing availability for ${staff.fullName}: ${error.message}`);
    }
  });
  
  // Add availability data
  if (availabilityData.length > 0) {
    const startRow = availabilitySheet.getLastRow() + 1;
    availabilitySheet.getRange(startRow, 1, availabilityData.length, availabilityData[0].length)
                    .setValues(availabilityData);
  }
  
  return results;
}

// Convenience function to create a simple CSV-style import
function createSimpleStaffCSV() {
  console.log('📝 Creating simple CSV template for staff import...');
  
  const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
  const database = SpreadsheetApp.openById(DATABASE_ID);
  
  let csvSheet = database.getSheetByName('Simple_Staff_CSV');
  if (!csvSheet) {
    csvSheet = database.insertSheet('Simple_Staff_CSV');
  } else {
    csvSheet.clear();
  }
  
  const csvData = [
    ['SIMPLE STAFF IMPORT (Copy/paste from Excel or CSV)', '', '', '', ''],
    ['Full Name', 'Display Name', 'Role', 'Min Hours', 'Max Hours'],
    ['John Smith', 'John', 'Manager', '35', '40'],
    ['Jane Doe', 'Jane', 'Teacher', '20', '30'],
    ['Mike Johnson', 'Mike', 'Floor Staff', '15', '25'],
    ['[Add your staff here...]', '', '', '', '']
  ];
  
  csvSheet.getRange(1, 1, csvData.length, 5).setValues(csvData);
  
  // Format with error handling
  try {
    // Clear any existing merges
    csvSheet.getRange(1, 1, csvSheet.getMaxRows(), csvSheet.getMaxColumns()).breakApart();
    
    // Title formatting
    csvSheet.getRange(1, 1, 1, 5).merge()
            .setBackground('#1155CC')
            .setFontColor('white')
            .setFontWeight('bold')
            .setHorizontalAlignment('center');
    
    // Header formatting
    csvSheet.getRange(2, 1, 1, 5)
            .setBackground('#F0F0F0')
            .setFontWeight('bold');
            
  } catch (error) {
    console.error('CSV formatting error (non-critical):', error.message);
  }
  
  console.log('✅ Simple CSV template created!');
  console.log('📋 Use processSimpleStaffCSV() after filling it out');
}

function processSimpleStaffCSV() {
  console.log('📋 Processing simple staff CSV...');
  
  const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
  const database = SpreadsheetApp.openById(DATABASE_ID);
  
  const csvSheet = database.getSheetByName('Simple_Staff_CSV');
  if (!csvSheet) {
    throw new Error('Simple_Staff_CSV sheet not found');
  }
  
  const data = csvSheet.getDataRange().getValues();
  const staffData = [];
  
  // Process from row 3 onwards (after headers)
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (row[0] && !row[0].toString().startsWith('[')) {
      staffData.push({
        fullName: row[0],
        displayName: row[1] || row[0],
        role: row[2] || 'Floor Staff',
        availability: createDefaultAvailability(),
        minHours: row[3] || 20,
        maxHours: row[4] || 40,
        notes: 'Imported via simple CSV'
      });
    }
  }
  
  if (staffData.length === 0) {
    console.log('⚠️  No staff data to process');
    return false;
  }
  
  // Use the same processing functions
  const staffResults = addBulkStaffData(database, staffData);
  const availabilityResults = addBulkAvailabilityData(database, staffData);
  
  console.log(`✅ Simple import completed: ${staffResults.added} staff added`);
  return true;
}

function createDefaultAvailability() {
  return {
    Monday: { full: 'GREEN', partial: 'GREEN' },
    Tuesday: { full: 'GREEN', partial: 'GREEN' },
    Wednesday: { full: 'GREEN', partial: 'GREEN' },
    Thursday: { full: 'GREEN', partial: 'GREEN' },
    Friday: { full: 'GREEN', partial: 'GREEN' },
    Saturday: { full: 'GREEN', partial: 'GREEN' },
    Sunday: { full: 'YELLOW', partial: 'GREEN' }
  };
}

function processSimpleBulkStaffImport() {
  console.log('� Processing simplified bulk staff import...');
  
  const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
  const database = SpreadsheetApp.openById(DATABASE_ID);
  
  try {
    const importSheet = database.getSheetByName('Bulk_Staff_Import');
    if (!importSheet) {
      throw new Error('Bulk_Staff_Import sheet not found');
    }
    
    const data = importSheet.getDataRange().getValues();
    const staffData = [];
    
    // Process from row 3 onwards (after headers)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (row[0] && 
          row[0] !== '' && 
          !row[0].toString().startsWith('[') && 
          !row[0].toString().includes('INSTRUCTIONS')) {
        
        staffData.push({
          fullName: row[0],
          displayName: row[1] || row[0],
          role: row[2] || 'Floor Staff',
          availability: createDefaultAvailability(),
          minHours: row[3] || 20,
          maxHours: row[4] || 40,
          notes: row[5] || 'Added via bulk import'
        });
      }
    }
    
    if (staffData.length === 0) {
      console.log('⚠️  No staff data to process');
      return false;
    }
    
    // Use the same processing functions
    const staffResults = addBulkStaffData(database, staffData);
    const availabilityResults = addBulkAvailabilityData(database, staffData);
    
    console.log(`✅ Simplified bulk import completed!`);
    console.log(`   ✅ ${staffResults.added} staff added`);
    console.log(`   ⚠️  ${staffResults.skipped} duplicates skipped`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Simplified bulk import failed:', error);
    return false;
  }
}

console.log('�👥 Bulk Staff Import System loaded!');
console.log('📋 Available commands:');
console.log('   createBulkStaffImport() - Create detailed import sheet');
console.log('   processBulkStaffImport() - Process the detailed import');
console.log('   processSimpleBulkStaffImport() - Process simplified import');
console.log('   createSimpleStaffCSV() - Create simple CSV-style import');
console.log('   processSimpleStaffCSV() - Process the simple import');