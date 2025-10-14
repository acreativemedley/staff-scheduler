/**
 * Complete Schedule Template System Deployment
 * Run this to set up the entire schedule template system
 */

function deployScheduleTemplateSystem() {
  console.log('🚀 Deploying Complete Schedule Template System...');
  console.log('============================================');
  
  try {
    // Step 1: Set up the template system structure
    console.log('\n📋 Step 1: Setting up template system structure...');
    createScheduleTemplateSystem();
    
    // Step 2: Create management interface
    console.log('\n🎯 Step 2: Creating management interface...');
    createScheduleManagementInterface();
    
    // Step 3: Test with sample data
    console.log('\n🧪 Step 3: Testing system with sample data...');
    testScheduleSystem();
    
    console.log('\n✅ ===== DEPLOYMENT COMPLETE! =====');
    console.log('🎉 Schedule Template System is now ready to use!');
    console.log('\n📋 What was created:');
    console.log('   ✅ Schedule_Templates sheet with default template');
    console.log('   ✅ Staff_Availability sheet with GREEN/YELLOW/RED system');
    console.log('   ✅ Schedule_Dashboard for management');
    console.log('   ✅ Schedule_Conflicts tracking');
    console.log('   ✅ Advanced scheduling functions');
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Review Staff_Availability sheet and adjust as needed');
    console.log('   2. Create schedules using: createAdvancedSchedule("2024-01-08")');
    console.log('   3. Check Schedule_Dashboard for system status');
    console.log('   4. Review any conflicts in Schedule_Conflicts sheet');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Deployment failed at step:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

function testScheduleSystem() {
  console.log('🧪 Testing schedule system functionality...');
  
  try {
    const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
    const database = SpreadsheetApp.openById(DATABASE_ID);
    
    // Test 1: Verify template exists
    console.log('   Testing template system...');
    const templatesSheet = database.getSheetByName('Schedule_Templates');
    const templateData = templatesSheet.getDataRange().getValues();
    
    if (templateData.length < 2) {
      throw new Error('No templates found');
    }
    console.log('   ✅ Templates verified');
    
    // Test 2: Verify staff availability
    console.log('   Testing staff availability system...');
    const availabilitySheet = database.getSheetByName('Staff_Availability');
    const availabilityData = availabilitySheet.getDataRange().getValues();
    
    if (availabilityData.length < 2) {
      console.log('   ⚠️  No staff availability data found - this is normal if no staff exist yet');
    } else {
      console.log(`   ✅ Staff availability verified (${availabilityData.length - 1} staff members)`);
    }
    
    // Test 3: Verify business hours function
    console.log('   Testing business hours configuration...');
    const businessHours = getBusinessHours();
    const expectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    expectedDays.forEach(day => {
      if (!businessHours[day]) {
        throw new Error(`Business hours not configured for ${day}`);
      }
    });
    console.log('   ✅ Business hours configuration verified');
    
    // Test 4: Verify staffing requirements
    console.log('   Testing staffing requirements...');
    const staffingReqs = getStaffingRequirements();
    
    expectedDays.forEach(day => {
      if (!staffingReqs[day]) {
        throw new Error(`Staffing requirements not configured for ${day}`);
      }
    });
    console.log('   ✅ Staffing requirements verified');
    
    console.log('✅ All system tests passed!');
    
  } catch (error) {
    console.error('❌ System test failed:', error.message);
    throw error;
  }
}

function createSampleSchedule() {
  console.log('📅 Creating sample schedule for testing...');
  
  try {
    // Get next Monday as sample date
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
    
    const weekStarting = nextMonday.toISOString().split('T')[0];
    
    console.log(`   Creating schedule for week starting: ${weekStarting}`);
    
    const result = createAdvancedSchedule(weekStarting, 'TEMPLATE_001');
    
    if (result.success) {
      console.log(`   ✅ Sample schedule created: ${result.scheduleId}`);
      if (result.conflicts.length > 0) {
        console.log(`   ⚠️  ${result.conflicts.length} conflicts detected (check Schedule_Conflicts sheet)`);
      }
    } else {
      console.log(`   ❌ Sample schedule creation failed: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Sample schedule creation failed:', error);
    return { success: false, error: error.message };
  }
}

function getSystemStatus() {
  console.log('📊 Getting system status...');
  
  try {
    const DATABASE_ID = '11PzmQVJ_Q1LsGbji_Es52jHTqJVlH_Gff2H6T7x65Zk';
    const database = SpreadsheetApp.openById(DATABASE_ID);
    
    const status = {
      database: 'Connected',
      templates: 0,
      staff: 0,
      schedules: 0,
      conflicts: 0,
      lastUpdated: new Date()
    };
    
    // Count templates
    const templatesSheet = database.getSheetByName('Schedule_Templates');
    if (templatesSheet) {
      status.templates = Math.max(0, templatesSheet.getLastRow() - 1);
    }
    
    // Count staff
    const staffSheet = database.getSheetByName('Staff_Data');
    if (staffSheet) {
      status.staff = Math.max(0, staffSheet.getLastRow() - 1);
    }
    
    // Count schedules
    const schedulesSheet = database.getSheetByName('Schedules');
    if (schedulesSheet) {
      status.schedules = Math.max(0, schedulesSheet.getLastRow() - 1);
    }
    
    // Count conflicts
    const conflictsSheet = database.getSheetByName('Schedule_Conflicts');
    if (conflictsSheet) {
      status.conflicts = Math.max(0, conflictsSheet.getLastRow() - 1);
    }
    
    console.log('📋 System Status:');
    console.log(`   Database: ${status.database}`);
    console.log(`   Templates: ${status.templates}`);
    console.log(`   Staff Members: ${status.staff}`);
    console.log(`   Schedules: ${status.schedules}`);
    console.log(`   Conflicts: ${status.conflicts}`);
    console.log(`   Last Updated: ${status.lastUpdated}`);
    
    return status;
    
  } catch (error) {
    console.error('❌ Error getting system status:', error);
    return { database: 'Error', error: error.message };
  }
}

// Quick deployment function
function quickDeploy() {
  return deployScheduleTemplateSystem();
}

// Manual testing functions
function runTests() {
  return testScheduleSystem();
}

function createTestSchedule() {
  return createSampleSchedule();
}

function checkStatus() {
  return getSystemStatus();
}

console.log('🚀 Schedule Template System Deployment Script Loaded');
console.log('📋 Available commands:');
console.log('   deployScheduleTemplateSystem() - Full deployment');
console.log('   quickDeploy() - Same as above (shorter name)');
console.log('   runTests() - Test system functionality');
console.log('   createTestSchedule() - Create sample schedule');
console.log('   checkStatus() - Get system status');
console.log('   getSystemStatus() - Detailed status report');