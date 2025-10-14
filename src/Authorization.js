/**
 * Authorization helper function
 * Run this first to authorize the required permissions
 */
function authorizePermissions() {
  console.log('🔐 Checking permissions...');
  
  try {
    // Test spreadsheet permissions
    const testSpreadsheet = SpreadsheetApp.create('Permission Test - DELETE ME');
    console.log('✅ Spreadsheet permission granted');
    
    // Test drive permissions
    const file = DriveApp.getFileById(testSpreadsheet.getId());
    console.log('✅ Drive permission granted');
    
    // Clean up test file
    DriveApp.getFileById(testSpreadsheet.getId()).setTrashed(true);
    console.log('🗑️ Test file cleaned up');
    
    console.log('🎉 All permissions authorized! You can now run createSchedulingDatabase()');
    
  } catch (error) {
    console.error('❌ Permission error:', error);
    console.log('📝 Please authorize the requested permissions and try again');
    throw error;
  }
}