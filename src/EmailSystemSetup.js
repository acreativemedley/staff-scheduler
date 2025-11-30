/**
 * Email System Setup and Testing
 * Run these functions to configure and test the email system
 */

/**
 * STEP 1: Configure Manager Email
 * Run this first with your email address
 */
function configureManagerEmail() {
  // Replace with the actual manager's email
  const managerEmail = 'your-email@example.com';
  
  const result = setupManagerEmail(managerEmail);
  console.log('Manager email configured:', result);
  
  // Verify it was saved
  const saved = getManagerEmail();
  console.log('Saved manager email:', saved);
  
  return result;
}

/**
 * STEP 2: Test Email to Manager
 * Tests the staff-to-manager email functionality
 */
function testEmailToManager() {
  const result = sendEmailToManager(
    'Test Message',
    'This is a test message from the email system setup.',
    Session.getActiveUser().getEmail()
  );
  
  console.log('Test email to manager result:', result);
  return result;
}

/**
 * STEP 3: Test Email to Single User
 * Replace email with a test recipient
 */
function testEmailToUser() {
  const testRecipient = 'test-recipient@example.com'; // Replace with actual email
  
  const result = sendEmailToUser(
    testRecipient,
    'Test Email from Scheduling System',
    'This is a test email to verify the email system is working correctly.',
    'Test Manager'
  );
  
  console.log('Test email to user result:', result);
  return result;
}

/**
 * STEP 4: Test Getting Staff Emails
 * Verifies database connection and email retrieval
 */
function testGetStaffEmails() {
  console.log('=== Testing Staff Email Retrieval ===');
  
  const allEmails = getAllStaffEmails();
  console.log(`Found ${allEmails.length} staff emails:`, allEmails);
  
  return {
    count: allEmails.length,
    emails: allEmails
  };
}

/**
 * STEP 5: Test Getting Positions
 * Verifies position-based filtering
 */
function testGetPositions() {
  console.log('=== Testing Position Retrieval ===');
  
  const positions = getAvailablePositions();
  console.log(`Found ${positions.length} positions:`, positions);
  
  return positions;
}

/**
 * STEP 6: Test Getting Roles
 * Verifies role-based filtering
 */
function testGetRoles() {
  console.log('=== Testing Role Retrieval ===');
  
  const roles = getAvailableRoles();
  console.log(`Found ${roles.length} roles:`, roles);
  
  return roles;
}

/**
 * STEP 7: Test Group Email (Position)
 * Test sending to a specific position
 * Replace 'Manager' with an actual position from your database
 */
function testGroupEmailByPosition() {
  const position = 'Manager'; // Replace with actual position
  
  console.log(`Testing group email to position: ${position}`);
  
  // First, check how many staff have this position
  const emails = getStaffEmailsByPosition(position);
  console.log(`Found ${emails.length} staff with position '${position}':`, emails);
  
  if (emails.length === 0) {
    console.log('No staff found with this position. Test skipped.');
    return { success: false, message: 'No recipients found' };
  }
  
  // Uncomment to actually send the test email
  /*
  const result = sendEmailToGroup(
    'position',
    position,
    'Test Group Email',
    'This is a test email to all staff with a specific position.',
    'Test Manager'
  );
  
  console.log('Group email result:', result);
  return result;
  */
  
  return { 
    success: true, 
    message: 'Test preparation complete. Uncomment code to send actual email.',
    recipientCount: emails.length
  };
}

/**
 * STEP 8: Test Shift Change Notification
 * Test the automatic shift notification
 */
function testShiftNotification() {
  const testEmail = 'test-staff@example.com'; // Replace with actual email
  
  const shiftDetails = {
    date: '2025-12-15',
    startTime: '10:00 AM',
    endTime: '6:00 PM',
    position: 'Staff'
  };
  
  const result = sendShiftChangeNotification(testEmail, shiftDetails, 'added');
  
  console.log('Shift notification result:', result);
  return result;
}

/**
 * RUN ALL TESTS
 * Runs all tests in sequence (except actual email sends)
 */
function runAllTests() {
  console.log('================================');
  console.log('STARTING EMAIL SYSTEM TESTS');
  console.log('================================\n');
  
  // Test 1: Manager Email
  console.log('TEST 1: Manager Email Configuration');
  const managerEmail = getManagerEmail();
  console.log(`Current manager email: ${managerEmail}\n`);
  
  // Test 2: Staff Emails
  console.log('TEST 2: Staff Email Retrieval');
  const staffTest = testGetStaffEmails();
  console.log(`Status: ${staffTest.count > 0 ? 'PASS' : 'FAIL'}\n`);
  
  // Test 3: Positions
  console.log('TEST 3: Position Retrieval');
  const positionsTest = testGetPositions();
  console.log(`Status: ${positionsTest.length > 0 ? 'PASS' : 'FAIL'}\n`);
  
  // Test 4: Roles
  console.log('TEST 4: Role Retrieval');
  const rolesTest = testGetRoles();
  console.log(`Status: ${rolesTest.length > 0 ? 'PASS' : 'FAIL'}\n`);
  
  console.log('================================');
  console.log('TEST SUMMARY');
  console.log('================================');
  console.log(`Manager Email: ${managerEmail}`);
  console.log(`Staff Emails Found: ${staffTest.count}`);
  console.log(`Positions Found: ${positionsTest.length}`);
  console.log(`Roles Found: ${rolesTest.length}`);
  console.log('================================\n');
  
  console.log('⚠️  Email sending tests skipped to prevent spam.');
  console.log('Run individual test functions to send actual emails.');
  
  return {
    managerEmail: managerEmail,
    staffCount: staffTest.count,
    positionsCount: positionsTest.length,
    rolesCount: rolesTest.length
  };
}

/**
 * QUICK SETUP
 * Run this once to do initial setup
 */
function quickSetup() {
  console.log('Starting Quick Setup...\n');
  
  // Step 1: Prompt for manager email
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Email System Setup',
    'Enter the manager\'s email address:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const email = response.getResponseText();
    
    if (email) {
      setupManagerEmail(email);
      console.log(`✅ Manager email set to: ${email}`);
      
      // Run tests
      const results = runAllTests();
      
      console.log('\n✅ Quick setup complete!');
      console.log('Next steps:');
      console.log('1. Deploy as web app');
      console.log('2. Access via: YOUR_DEPLOYMENT_URL?page=email');
      console.log('3. Test by sending an email');
      
      return { success: true, results: results };
    }
  }
  
  console.log('❌ Setup cancelled');
  return { success: false };
}

/**
 * VIEW CURRENT CONFIGURATION
 * Display current email system configuration
 */
function viewConfiguration() {
  console.log('================================');
  console.log('EMAIL SYSTEM CONFIGURATION');
  console.log('================================\n');
  
  const managerEmail = getManagerEmail();
  const staffEmails = getAllStaffEmails();
  const positions = getAvailablePositions();
  const roles = getAvailableRoles();
  
  console.log('Manager Email:', managerEmail);
  console.log('Total Active Staff:', staffEmails.length);
  console.log('Available Positions:', positions.join(', '));
  console.log('Available Roles:', roles.join(', '));
  
  console.log('\n================================');
  
  return {
    managerEmail: managerEmail,
    staffCount: staffEmails.length,
    positions: positions,
    roles: roles
  };
}
