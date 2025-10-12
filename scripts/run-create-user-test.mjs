import { handler } from '../netlify/functions/create-user.js'

// This script calls the serverless handler directly.
// Make sure you set these environment variables first (PowerShell example below):
// $env:SUPABASE_URL = 'https://your-project.supabase.co'
// $env:SUPABASE_SERVICE_ROLE_KEY = 'your_service_role_key'

async function runTest() {
  const testEmail = `local-test+${Date.now()}@example.com`
  const testPassword = 'Test1234!'
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      user_role: 'staff',
      full_name: 'Local Test',
      employee_id: null
    })
  }

  console.log('Calling handler with payload:', JSON.parse(event.body))

  try {
    const response = await handler(event, {})
    console.log('Handler response status:', response.statusCode)
    try {
      const body = JSON.parse(response.body)
      console.log('Response body:', body)
      if (response.statusCode === 200 && body.userId) {
        console.log('\nCreated user id:', body.userId)
        console.log('Cleanup: delete user manually from Supabase Auth or run an admin delete via a secure script.')
      }
    } catch (err) {
      console.log('Raw response body:', response.body)
    }
  } catch (err) {
    console.error('Error invoking handler:', err)
  }
}

runTest()
